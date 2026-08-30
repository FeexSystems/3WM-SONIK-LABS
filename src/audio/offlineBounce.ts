import { Track, StemTrack, StepSequencerChannel, MidiPattern } from '../types';
import { MidiSynthesizer } from './midiEngine';
import { Sonik808Synthesizer } from './pluginEngine';

export async function smartBounceProject(track: Track): Promise<Blob> {
  // 1. Calculate length
  const bpm = track.bpm || 120;
  const secondsPerBeat = 60 / bpm;
  // Assume a default of 16 steps per loop (4 beats = 1 bar)
  // Let's render 4 bars (64 steps) by default, or use track duration if known
  const loops = 4;
  const durationSec = secondsPerBeat * 4 * loops + 2; // +2 for tail

  const sampleRate = 44100;

  // 2. Create Offline Context
  const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  if (!OfflineCtx) throw new Error('OfflineAudioContext not supported');
  const offlineCtx = new OfflineCtx(2, sampleRate * durationSec, sampleRate);

  // 3. Master Limiter to prevent clipping
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.value = -0.5; // Brickwall at -0.5dB
  limiter.knee.value = 0.0;
  limiter.ratio.value = 20.0;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.1;
  limiter.connect(offlineCtx.destination);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = track.settings?.volume ?? 0.85;
  masterGain.connect(limiter);

  // 4. Initialize Synths
  const midiSynth = new MidiSynthesizer();
  midiSynth.init(offlineCtx, masterGain);

  const sonik808 = new Sonik808Synthesizer();
  sonik808.init(offlineCtx, masterGain);

  const stepTime = 60 / bpm / 4;

  // 5. Schedule patterns
  for (let loop = 0; loop < loops; loop++) {
    const loopStartTime = loop * (stepTime * 16);

    // Step Sequencer (Drums & 808)
    if (track.stepChannels) {
      track.stepChannels.forEach((ch) => {
        if (ch.muted) return;
        ch.steps.forEach((step, idx) => {
          if (step.enabled) {
            const time = loopStartTime + idx * stepTime + step.offset * stepTime;

            if (ch.is808Channel) {
              const pitch = ch.pitch + (step.accent ? 12 : 0); // basic mapping
              sonik808.trigger808Note(pitch, step.velocity, 1.0, {}, time);
            } else {
              midiSynth.playDrumSample(ch.sampleKey, step.velocity, ch.pan, time);
            }
          }
        });
      });
    }

    // MIDI Patterns
    if (track.midiPatterns) {
      track.midiPatterns.forEach((pattern) => {
        if (pattern.isMuted) return;
        pattern.notes.forEach((note) => {
          const time = loopStartTime + note.startStep * stepTime;
          const duration = note.durationSteps * stepTime;
          midiSynth.playNote(note.pitch, note.velocity, duration, pattern.instrumentType, 0, time);
        });
      });
    }
  }

  // 6. Render
  const renderedBuffer = await offlineCtx.startRendering();

  // 7. Convert AudioBuffer to WAV
  const wavBlob = bufferToWav(renderedBuffer, renderedBuffer.length);
  return wavBlob;
}

function bufferToWav(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  let channels = [],
    i,
    sample,
    offset = 0,
    pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + len * numOfChan * 2); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this export)

  setUint32(0x61746164); // "data" - chunk
  setUint32(len * numOfChan * 2); // chunk length

  for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
