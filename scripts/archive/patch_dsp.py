import re

with open("src/components/dsp/DSPVisualizer.tsx", "r") as f:
    content = f.read()

content = content.replace("import { toneEngine } from '../../audio/ToneEngine';", "import { soundEngine } from '../../audio/engine';")
content = content.replace("const fftData = toneEngine.getFFT();", "const fftData = soundEngine.getAnalyserData();")
content = content.replace("const magnitude = fftData[binIndex]; // Returns decibels usually -100 to 0", "const magnitude = fftData ? (fftData[binIndex] / 255) * 100 - 100 : -100; // Converted from Uint8 to dB")
content = content.replace("const gr = isPlaying ? Math.random() * (settings.compression.ratio || 1) * 5 : 0;", "const gr = isPlaying ? Math.abs(soundEngine.getSidechainGainReduction()) * 10 : 0;")

with open("src/components/dsp/DSPVisualizer.tsx", "w") as f:
    f.write(content)
