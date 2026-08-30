import re

with open("src/audio/offlineBounce.ts", "r") as f:
    content = f.read()

content = content.replace("setUint32(length - 8);", "setUint32(36 + len * numOfChan * 2);")
content = content.replace("setUint32(length - pos - 4);", "setUint32(len * numOfChan * 2);")

with open("src/audio/offlineBounce.ts", "w") as f:
    f.write(content)

