# GLTF Avatar Creation Guide for 3WM SONIK

This guide provides specifications and instructions for creating production-ready 3D GLTF models for The Three Wise Men agents (Emar, Ricky, Kingpin).

## Agent Specifications

### Kappachino Emar — The Scientist

- **Color Theme**: Scientist Mint (#2AFFA3)
- **Visual Identity**: Technical, analytical, precise
- **Design Elements**:
  - Geometric shapes (cubes, hexagons)
  - Data visualization elements (graphs, charts)
  - Clean lines, minimalist aesthetic
  - Scientific instruments aesthetic
- **Personality**: Calm, confident, experimental

### Kappachino Ricky — The Sound God

- **Color Theme**: Sound God Gold (#F5A800)
- **Visual Identity**: Bold, musical, instinctive
- **Design Elements**:
  - Musical instrument elements (drums, 808s)
  - Dynamic, energetic shapes
  - Afro-inspired patterns
  - Streetwise aesthetic
- **Personality**: Bold, confident, experimental

### Kingpin — The Vocal Oracle

- **Color Theme**: Vocal Oracle Fire (#FF3C00)
- **Visual Identity**: Charismatic, emotional, commanding
- **Design Elements**:
  - Vocal/mouth elements
  - Crown or regal elements
  - Expressive, dynamic shapes
  - Performance-oriented aesthetic
- **Personality**: Charismatic, commanding, emotional

## Technical Specifications

### File Format

- **Format**: GLTF 2.0 (.glb or .gltf)
- **Embedded**: Animations should be embedded in the file
- **Texture Format**: PNG or JPEG (embedded or external)

### Performance Targets

- **Polygon Count**: <50,000 triangles per agent
- **Texture Size**: <2048x2048 per texture
- **File Size**: <5MB per agent
- **Animation Count**: 5-8 animations per agent

### Required Animations

Each agent must include the following animations:

1. **idle** - Default resting state (looping)
2. **analyzing** - Data analysis/processing state (looping)
3. **processing** - Active work state (looping)
4. **success** - Success/celebration state (one-shot)
5. **error** - Error/shake state (one-shot)

### Optional Animations

- **talking** - For Kingpin (lip-sync ready)
- **gesturing** - For Ricky (expressive gestures)
- **visualizing** - For Emar (data visualization)

## Creation Workflow

### Step 1: Concept Design

1. Sketch character concepts based on agent identity
2. Define color palette using agent-specific colors
3. Plan animation states and transitions

### Step 2: Base Mesh Creation

1. Create base mesh in Blender/Maya
2. Keep polygon count within target limits
3. Ensure clean topology (quads preferred)
4. Add detail where needed for visual identity

### Step 3: Rigging

1. Create armature/skeleton for animation
2. Bind mesh to armature
3. Test weight painting for smooth deformation
4. Ensure bones are named consistently

### Step 4: Animation Creation

1. Create required animations (idle, analyzing, processing, success, error)
2. Set animation loops appropriately
3. Ensure smooth transitions between states
4. Test animation playback at 60fps

### Step 5: Material & Texturing

1. Create PBR materials (albedo, roughness, metallic, normal)
2. Apply agent-specific color themes
3. Add emissive materials for glow effects
4. Optimize texture sizes for web

### Step 6: Export to GLTF

1. Export using GLTF 2.0 format
2. Embed animations and textures
3. Verify file size <5MB
4. Test in Three.js/GLTF viewer

### Step 7: Integration Testing

1. Load model in 3WM SONIK using AgentAvatar component
2. Test all animations play correctly
3. Verify audio-reactive effects work
4. Test fallback geometry on load failure

## File Naming Convention

Place exported models in `public/models/avatars/`:

- `emar.glb` - Emar avatar
- `ricky.glb` - Ricky avatar
- `kingpin.glb` - Kingpin avatar

## Blender Export Settings

### GLTF Export Options

- **Format**: glTF Binary (.glb)
- **Include**: Selected Objects
- **Mesh**: Apply Modifiers, Tangents
- **Extras**: Generate Tangents
- **Animations**: All Actions, Sampling Rate 30
- **Images**: Embed
- **Compression**: Draco Compression (optional)

### Material Settings

- **Use Nodes**: Enabled
- **Backface Culling**: Enabled
- **Alpha Mode**: Opaque or Blend (as needed)

## Testing Checklist

- [ ] Model loads successfully in browser
- [ ] All animations play smoothly at 60fps
- [ ] File size <5MB per agent
- [ ] Polygon count <50,000 triangles
- [ ] Textures load correctly
- [ ] Audio-reactive effects work (scale, rotation, position)
- [ ] State transitions are smooth
- [ ] Fallback geometry appears on load failure
- [ ] Model matches agent visual identity
- [ ] Colors match agent theme

## Tools & Resources

### Recommended Software

- **Blender** (Free, open-source)
- **Maya** (Commercial)
- **3ds Max** (Commercial)
- **Substance Painter** (Texturing)

### GLTF Tools

- **GLTF Validator**: https://github.com/KhronosGroup/glTF-Validator
- **Babylon.js GLTF Viewer**: https://sandbox.babylonjs.com/
- **Three.js GLTF Viewer**: https://gltf-viewer.donmccurdy.com/

### Animation References

- **Mixamo**: Free character animations (https://www.mixamo.com/)
- **Adobe Mixamo**: Auto-rigging and animation

## Common Issues & Solutions

### Model Not Loading

- Check file path in `AVATAR_MODELS` constant
- Verify GLTF format is valid
- Check browser console for errors
- Test model in GLTF viewer first

### Animations Not Playing

- Verify animation names match expected names (idle, analyzing, etc.)
- Check animation loops are set correctly
- Test animation playback in Blender export preview

### Performance Issues

- Reduce polygon count
- Optimize texture sizes
- Enable Draco compression
- Simplify materials

### Visual Issues

- Check normal maps are correctly oriented
- Verify UV mapping is correct
- Test materials in different lighting conditions
- Ensure emissive materials are not too bright

## Next Steps

1. Create concept art for each agent
2. Build base meshes in Blender
3. Rig and animate characters
4. Export to GLTF format
5. Test in 3WM SONIK application
6. Iterate based on feedback

## Support

For issues with GLTF integration:

- Check `src/three/avatars/AgentAvatar.tsx` for loading logic
- Review console logs for error messages
- Test with fallback geometry enabled
- Verify Three.js and @react-three/drei versions
