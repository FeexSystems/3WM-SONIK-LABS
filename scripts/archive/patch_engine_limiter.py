import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

# Add limiter property
if "private limiter: DynamicsCompressorNode" not in content:
    content = content.replace(
        "private compressor: DynamicsCompressorNode | null = null;",
        "private compressor: DynamicsCompressorNode | null = null;\n  private limiter: DynamicsCompressorNode | null = null;"
    )

# Create limiter
old_comp = """    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.05;
    this.compressor.release.value = 0.25;"""
new_comp = """    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 3;
    this.compressor.attack.value = 0.05;
    this.compressor.release.value = 0.25;

    // True-Peak Limiter
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -0.1; // Brickwall at -0.1dB
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.001; // Instant attack
    this.limiter.release.value = 0.1;"""
content = content.replace(old_comp, new_comp)

# Connect limiter
old_chain = """    this.saturationNode.connect(this.compressor);
    this.compressor.connect(this.masterGain);"""
new_chain = """    this.saturationNode.connect(this.compressor);
    this.compressor.connect(this.limiter);
    this.limiter.connect(this.masterGain);"""
content = content.replace(old_chain, new_chain)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)
