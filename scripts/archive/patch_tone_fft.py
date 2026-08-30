import re

with open("src/audio/ToneEngine.ts", "r") as f:
    content = f.read()

# Add analyser
if "private analyser: Tone.Analyser | null = null;" not in content:
    content = content.replace("private masterEQ: Tone.EQ3 | null = null;", "private masterEQ: Tone.EQ3 | null = null;\n  private analyser: Tone.Analyser | null = null;")
    
    init_old = "this.masterEQ = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).toDestination();"
    init_new = """this.analyser = new Tone.Analyser('fft', 256);
    this.masterEQ = new Tone.EQ3({ low: 0, mid: 0, high: 0 }).connect(this.analyser).toDestination();"""
    content = content.replace(init_old, init_new)
    
    fft_func = """
  public getFFT(): Float32Array {
    if (this.analyser && this.isInitialized) {
      return this.analyser.getValue() as Float32Array;
    }
    return new Float32Array(256).fill(-100);
  }
"""
    content = content.replace("public play() {", fft_func + "\n  public play() {")

with open("src/audio/ToneEngine.ts", "w") as f:
    f.write(content)
