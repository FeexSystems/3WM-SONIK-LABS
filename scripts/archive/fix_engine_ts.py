import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

content = content.replace("this.saturationNode.connect(this.compressor);", "this.saturationNode.connect(this.compressor as AudioNode);")
content = content.replace("this.compressor.connect(this.limiter);", "this.compressor!.connect(this.limiter as AudioNode);")
content = content.replace("this.limiter.connect(this.masterGain);", "this.limiter!.connect(this.masterGain);")

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

