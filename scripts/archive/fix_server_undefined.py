import re

with open("server.ts", "r") as f:
    content = f.read()

old_zip = """      const sampleRate = parseInt(req.query.sampleRate as string) || (job as any)?.sampleRate || 48000;
      const bitDepth = parseInt(req.query.bitDepth as string) || (job as any)?.bitDepth || 24;
      // Stems render 34-60s for rapid zip packaging, full master duration for full
      const duration = req.query.duration ? parseInt(req.query.duration as string) : ((job as any)?.durationSec || 60);

      const zip = new JSZip();"""

new_zip = """      const sampleRate = parseInt(req.query.sampleRate as string) || (job as any)?.sampleRate || 48000;
      const bitDepth = parseInt(req.query.bitDepth as string) || (job as any)?.bitDepth || 24;
      // Stems render 34-60s for rapid zip packaging, full master duration for full
      const duration = req.query.duration ? parseInt(req.query.duration as string) : ((job as any)?.durationSec || 60);

      if (!track) {
         res.status(404).end();
         return;
      }

      const zip = new JSZip();"""

content = content.replace(old_zip, new_zip)

with open("server.ts", "w") as f:
    f.write(content)
