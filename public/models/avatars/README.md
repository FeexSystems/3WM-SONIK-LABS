# 3WM SONIK Agent Avatar Models

This directory contains 3D GLTF models for The Three Wise Men agents.

## Expected Files

- `emar.glb` - Kappachino Emar (The Scientist)
- `ricky.glb` - Kappachino Ricky (The Sound God)
- `kingpin.glb` - Kingpin (The Vocal Oracle)

## Model Specifications

See `docs/GLTF_AVATAR_CREATION_GUIDE.md` for detailed specifications including:
- Agent visual identities and color themes
- Technical requirements (polygon count, file size, etc.)
- Required animations (idle, analyzing, processing, success, error)
- Export settings and workflow

## Current Status

**Procedural Fallback**: The application currently uses procedural geometry as a fallback when GLTF models are not available. This is implemented in `src/three/avatars/AgentGeometry.tsx`.

## Generation

To generate GLTF models:

1. **Using Blender Script**:
   - Open Blender
   - Go to Scripting workspace
   - Open `docs/blender/generate_agents.py`
   - Run the script to generate all agent models

2. **Manual Creation**:
   - Follow the specifications in `docs/GLTF_AVATAR_CREATION_GUIDE.md`
   - Create models in Blender/Maya/3ds Max
   - Export as GLTF 2.0 (.glb format)
   - Place in this directory

## Testing

After adding models, verify:
- [ ] Models load in the application
- [ ] All animations play correctly
- [ ] Audio-reactive effects work
- [ ] File sizes are within limits (<5MB each)

## Fallback System

If models fail to load, the application automatically falls back to procedural geometry that represents each agent's visual identity. This ensures the application remains functional even without GLTF models.
