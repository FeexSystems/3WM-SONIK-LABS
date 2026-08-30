import re

with open("src/audio/engine.ts", "r") as f:
    content = f.read()

old_piano = """            midiSynth.playNote(
              n.pitch,
              n.velocity,
              stepDurSec,
              pattern.instrumentType || 'synth_lead',
              n.pan || 0
            );"""
new_piano = """            midiSynth.playNote(
              n.pitch,
              n.velocity,
              stepDurSec,
              pattern.instrumentType || 'synth_lead',
              n.pan || 0,
              time
            );"""
            
content = content.replace(old_piano, new_piano)

with open("src/audio/engine.ts", "w") as f:
    f.write(content)

