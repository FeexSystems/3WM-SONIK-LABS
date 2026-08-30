import re

with open("src/audio/midiEngine.ts", "r") as f:
    content = f.read()

# To quickly add cleanup to all playDrumSample cases, let's find all osc.stop(...) and source.stop(...)
# Actually, the safest way is to capture the main target/gain and add an onended handler to the source/osc.

# Let's see if we can globally inject cleanup into playDrumSample
# We can just look for source.start(now) / osc.start(now) and add cleanup.
# We'll just replace the entire playDrumSample function with a more optimized version.

