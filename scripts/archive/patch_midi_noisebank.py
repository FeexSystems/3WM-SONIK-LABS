import re

with open("src/audio/midiEngine.ts", "r") as f:
    content = f.read()

noise_bank = """
  // Global Noise Bank
  private static noiseBuffers: Map<string, AudioBuffer> = new Map();

  private getNoiseBuffer(sizeSeconds: number, type: 'white' | 'crackle' = 'white'): AudioBuffer {
    if (!this.ctx) throw new Error('No ctx');
    const key = `${sizeSeconds}_${type}`;
    if (MidiSynthesizer.noiseBuffers.has(key)) {
      return MidiSynthesizer.noiseBuffers.get(key)!;
    }
    const bufferSize = Math.floor(this.ctx.sampleRate * sizeSeconds);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() > 0.96 ? (Math.random() * 2 - 1) : 0;
    }
    MidiSynthesizer.noiseBuffers.set(key, buffer);
    return buffer;
  }
"""

if "Global Noise Bank" not in content:
    content = content.replace("private masterGain: GainNode | null = null;", "private masterGain: GainNode | null = null;\n" + noise_bank)

# Replace buffer generations
old_closed_hat = """        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;"""
new_closed_hat = """        const buffer = this.getNoiseBuffer(0.04, 'white');"""
content = content.replace(old_closed_hat, new_closed_hat)

old_open_hat = """        const bufferSize = Math.floor(this.ctx.sampleRate * 0.2);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;"""
new_open_hat = """        const buffer = this.getNoiseBuffer(0.2, 'white');"""
content = content.replace(old_open_hat, new_open_hat)

old_shaker = """        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;"""
new_shaker = """        const buffer = this.getNoiseBuffer(0.04, 'white');"""
content = content.replace(old_shaker, new_shaker)

old_trap_splash = """        const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;"""
new_trap_splash = """        const buffer = this.getNoiseBuffer(0.45, 'white');"""
content = content.replace(old_trap_splash, new_trap_splash)

old_vinyl = """        const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() > 0.96 ? (Math.random() * 2 - 1) : 0;"""
new_vinyl = """        const buffer = this.getNoiseBuffer(0.15, 'crackle');"""
content = content.replace(old_vinyl, new_vinyl)

# There are a couple more, let's catch them with regex.
content = re.sub(
    r"          const bufferSize = Math\.floor\(this\.ctx\.sampleRate \* ([\d\.]+)\);\n          const buffer = this\.ctx\.createBuffer\(1, bufferSize, this\.ctx\.sampleRate\);\n          const data = buffer\.getChannelData\(0\);\n          for \(let i = 0; i < bufferSize; i\+\+\) data\[i\] = Math\.random\(\) \* 2 - 1;",
    r"          const buffer = this.getNoiseBuffer(\1, 'white');",
    content
)

with open("src/audio/midiEngine.ts", "w") as f:
    f.write(content)
