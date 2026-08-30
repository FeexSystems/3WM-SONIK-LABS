# Blender Reference — 3WM SONIK

This directory previously contained a 96 MB `blender_python_reference_5_2.zip` and a
196 MB `KiroCrew-Setup.exe` alongside `.crdownload` partials.

Those binaries are **no longer tracked** — they exceeded GitHub's 100 MB file limit and
made `git add .` produce an unpushable commit. The `.zip` now lives in `.gitignore`
(`*.zip`). History was not rewritten (per P0-12 decision), so clones still carry the
old blob (~96 MB) until the next shallow clone / filter.

## Where to get the Blender reference

- **Official Blender Python API docs (5.2)**: https://docs.blender.org/api/current/
- **Downloadable archive**: https://docs.blender.org/api/current/blender_python_reference_5_2.zip _(canonical URL — update when Blender bumps version)_
- **Alternative**: `pip install fake-bpy-module` for IDE stubs without the archive.

## Regenerating agents

`generate_agents.py` in this directory builds the Three Wise Men agent stubs from the
reference. Run:

```bash
python docs/blender/generate_agents.py
```

Do **not** commit large binaries or installers to this repo. Use a release asset or
external storage and link to it from here.
