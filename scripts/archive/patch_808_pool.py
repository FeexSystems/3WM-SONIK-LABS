import re

with open("src/audio/pluginEngine.ts", "r") as f:
    content = f.read()

voice_class = """
class Voice808 {
  osc: OscillatorNode;
  subOsc: OscillatorNode;
  filter: BiquadFilterNode;
  shaper: WaveShaperNode;
  gain: GainNode;
  active: boolean = false;
  lastTrigTime: number = 0;

  constructor(ctx: BaseAudioContext, dest: AudioNode) {
    this.osc = ctx.createOscillator();
    this.subOsc = ctx.createOscillator();
    this.filter = ctx.createBiquadFilter();
    this.shaper = ctx.createWaveShaper();
    this.gain = ctx.createGain();

    this.osc.connect(this.filter);
    this.subOsc.connect(this.filter);
    this.filter.connect(this.shaper);
    this.shaper.connect(this.gain);
    this.gain.connect(dest);

    this.gain.gain.value = 0;
    this.osc.start(0);
    this.subOsc.start(0);
  }
}
"""

if "class Voice808" not in content:
    content = content.replace("export class Sonik808Synthesizer", voice_class + "\nexport class Sonik808Synthesizer")

# modify init to create voices
old_init = """  public init(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destinationNode = destination;
  }"""
new_init = """  private voices: Voice808[] = [];
  
  public init(ctx: BaseAudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.destinationNode = destination;
    // Pre-allocate 4 polyphonic voices for 808
    this.voices = [];
    for (let i = 0; i < 4; i++) {
      this.voices.push(new Voice808(ctx, destination));
    }
  }"""
content = content.replace(old_init, new_init)

# rewrite trigger808Note
old_trigger = re.search(r"  public trigger808Note\(.*?\n    this\.lastPitch = targetPitch;\n    this\.lastNoteTime = now;\n  \}", content, re.DOTALL)
if old_trigger:
    new_trig = """  public trigger808Note(
    targetPitch: number,
    velocity: number = 110,
    durationSec: number = 1.5,
    params: Partial<Eight08Parameters> = {}, time?: number
  ) {
    if (!this.ctx || !this.destinationNode || this.voices.length === 0) return;
    const now = time !== undefined ? time : this.ctx.currentTime;
    const targetFreq = 440 * Math.pow(2, (targetPitch - 69) / 12);
    const velFactor = Math.max(0.1, velocity / 127);

    const glideTimeSec = (params.glideTime ?? 85) / 1000;
    const punchAttack = params.punchAttack ?? 0.75;
    const decay = params.decay ?? 1.8;
    const sustain = params.sustain ?? 0.45;
    const release = params.release ?? 0.25;
    const drive = params.drive ?? 0.42;
    const subBoost = params.subBoost ?? 3.5;
    const filterCutoff = params.filterCutoff ?? 4500;

    // Check if portamento/glide should take effect
    const isGlide = params.legato && this.lastPitch !== null && now - this.lastNoteTime < 0.6;
    const startFreq = isGlide ? 440 * Math.pow(2, (this.lastPitch! - 69) / 12) : targetFreq * (1 + punchAttack * 1.5);

    // Voice pooling: find oldest or inactive voice
    let voice = this.voices.find(v => !v.active);
    if (!voice) {
      voice = this.voices.reduce((oldest, v) => v.lastTrigTime < oldest.lastTrigTime ? v : oldest, this.voices[0]);
    }
    voice.active = true;
    voice.lastTrigTime = now;

    // Voice Choking: fade out if we are stealing an active voice
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(0, now);
    } catch (e) {}

    const osc = voice.osc;
    const subOsc = voice.subOsc;
    const filter = voice.filter;
    const shaper = voice.shaper;
    const gain = voice.gain;

    // Apply cached saturation curve
    shaper.curve = this.getSaturationCurve(drive) as any;
    shaper.oversample = 'none';

    // Waveform assignment
    osc.type = params.waveform === 'triangle' ? 'triangle' : params.waveform === 'sawtooth' ? 'sawtooth' : 'sine';
    subOsc.type = 'sine';

    // Pitch Envelope & Glide execution
    if (isGlide) {
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + glideTimeSec);
      subOsc.frequency.setValueAtTime(startFreq * 0.5, now);
      subOsc.frequency.exponentialRampToValueAtTime(targetFreq * 0.5, now + glideTimeSec);
    } else {
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.035);
      subOsc.frequency.setValueAtTime(targetFreq * 0.5, now);
    }

    // Filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, now);
    filter.Q.value = params.filterResonance ?? 1.5;

    // ADSR Amplitude Envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.85 * velFactor, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.6 * sustain * velFactor, now + decay * 0.4);
    const stopTime = now + durationSec;
    gain.gain.setValueAtTime(0.6 * sustain * velFactor, stopTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime + release);
    
    // Deactivate voice in future
    setTimeout(() => {
      if (voice && this.ctx && this.ctx.currentTime >= stopTime + release) {
        voice.active = false;
      }
    }, (durationSec + release) * 1000 + 100);

    this.lastPitch = targetPitch;
    this.lastNoteTime = now;
  }"""
    content = content.replace(old_trigger.group(0), new_trig)

with open("src/audio/pluginEngine.ts", "w") as f:
    f.write(content)
