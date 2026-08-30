"""
3WM SONIK — Blender Agent Model Generator
Python script for generating GLTF models for The Three Wise Men agents

IMPORTANT: This script must be run INSIDE Blender, not with standalone Python.
1. Open Blender
2. Go to Scripting workspace
3. Open this file in the text editor
4. Click Run Script (▶) or press Alt+P
"""

import bpy
import math
from pathlib import Path

# Agent configurations
AGENTS = {
    'emar': {
        'name': 'Kappachino Emar',
        'color': (0.165, 1.0, 0.639),  # #2AFFA3 - Scientist Mint
        'base_shape': 'icosahedron',
        'scale': (1.0, 1.0, 1.0),
    },
    'ricky': {
        'name': 'Kappachino Ricky',
        'color': (0.961, 0.659, 0.0),  # #F5A800 - Sound God Gold
        'base_shape': 'cone',
        'scale': (1.0, 1.2, 1.0),
    },
    'kingpin': {
        'name': 'Kingpin',
        'color': (1.0, 0.235, 0.0),  # #FF3C00 - Vocal Oracle Fire
        'base_shape': 'sphere',
        'scale': (1.0, 1.1, 1.0),
    },
}

def clear_scene():
    """Clear all objects from the scene"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def create_material(name, color):
    """Create a PBR material with the given color"""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # Get default nodes
    bsdf = nodes.get('Principled BSDF')
    output = nodes.get('Material Output')
    
    if bsdf and output:
        # Set base color
        bsdf.inputs['Base Color'].default_value = (*color, 1.0)
        bsdf.inputs['Metallic'].default_value = 0.8
        bsdf.inputs['Roughness'].default_value = 0.2
        
        # Try to set emission if available (may not exist in all Blender versions)
        if 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = (*color, 0.5)
        elif 'Emission Strength' in bsdf.inputs:
            # Newer Blender versions separate emission color and strength
            bsdf.inputs['Emission Color'].default_value = (*color, 1.0)
            bsdf.inputs['Emission Strength'].default_value = 0.5
    
    return mat

def create_base_geometry(shape_type, scale):
    """Create base geometry for the agent"""
    if shape_type == 'sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1)
    elif shape_type == 'cone':
        bpy.ops.mesh.primitive_cone_add(radius1=1, radius2=0, depth=1)
    elif shape_type == 'icosahedron':
        bpy.ops.mesh.primitive_ico_sphere_add(radius=1, subdivisions=2)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1)
    
    obj = bpy.context.active_object
    obj.scale = scale
    return obj

def create_agent_geometry(agent_key):
    """Create geometry for a specific agent"""
    config = AGENTS[agent_key]
    
    # Clear scene
    clear_scene()
    
    # Create base geometry
    base_obj = create_base_geometry(config['base_shape'], config['scale'])
    
    # Create material
    mat = create_material(f"{agent_key}_material", config['color'])
    base_obj.data.materials.append(mat)
    
    # Add agent-specific details
    if agent_key == 'emar':
        # Add floating data cubes
        for i in range(3):
            bpy.ops.mesh.primitive_cube_add(size=0.3)
            cube = bpy.context.active_object
            cube.location = (0.6 + i * 0.3, 0.3 - i * 0.1, i * 0.2)
            cube.rotation_euler = (0.5 + i * 0.2, 0.5 - i * 0.1, i * 0.3)
            cube.data.materials.append(mat)
            cube.parent = base_obj
        
        # Add hexagonal ring
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.3, subdivisions=1)
        ring = bpy.context.active_object
        ring.location = (0, -0.4, 0)
        ring.scale = (1.2, 0.3, 1.2)
        ring.data.materials.append(mat)
        ring.parent = base_obj
    
    elif agent_key == 'ricky':
        # Add drum cylinders
        for i in range(2):
            bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.2)
            cyl = bpy.context.active_object
            cyl.location = (0.5 - i * 1.0, 0.4 - i * 0.1, i * 0.2)
            cyl.data.materials.append(mat)
            cyl.parent = base_obj
        
        # Add rhythm torus
        bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.05)
        torus = bpy.context.active_object
        torus.location = (0, 0.5, 0)
        torus.rotation_euler = (math.pi / 2, 0, 0)
        torus.data.materials.append(mat)
        torus.parent = base_obj
        
        # Add energetic spike
        bpy.ops.mesh.primitive_cone_add(radius1=0.15, radius2=0, depth=0.3)
        spike = bpy.context.active_object
        spike.location = (0, 0.8, 0)
        spike.data.materials.append(mat)
        spike.parent = base_obj
    
    elif agent_key == 'kingpin':
        # Add crown cones
        for i, x_offset in enumerate([0, 0.15, -0.15]):
            bpy.ops.mesh.primitive_cone_add(radius1=0.2 - i * 0.05, radius2=0, depth=0.3)
            crown = bpy.context.active_object
            crown.location = (x_offset, 0.6, 0)
            crown.data.materials.append(mat)
            crown.parent = base_obj
        
        # Add vocal rings
        for i in range(2):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.35 - i * 0.1, minor_radius=0.03)
            ring = bpy.context.active_object
            ring.location = (0, 0.1 + i * 0.15, 0)
            ring.rotation_euler = (math.pi / 2, 0, 0)
            ring.data.materials.append(mat)
            ring.parent = base_obj
    
    # Select all objects
    bpy.ops.object.select_all(action='SELECT')
    
    return base_obj

def create_animations():
    """Create basic animations for the agent"""
    # This is a placeholder for animation creation
    # In production, you would create actual animation keyframes here
    pass

def export_gltf(agent_key, output_path):
    """Export the agent as GLTF"""
    # Create geometry
    create_agent_geometry(agent_key)
    
    # Create animations (placeholder)
    create_animations()
    
    # Export settings
    export_path = Path(output_path) / f"{agent_key}.glb"
    
    # Use compatible export parameters for Blender 5.2
    bpy.ops.export_scene.gltf(
        filepath=str(export_path),
        export_format='GLB',
        use_selection=True,
        export_tangents=True,
        export_animations=True,
    )
    
    print(f"Exported {agent_key} to {export_path}")

def main():
    """Main function to generate all agent models"""
    # Set output directory (relative to Blender file location)
    output_dir = Path(__file__).parent.parent.parent / 'public' / 'models' / 'avatars'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate each agent
    for agent_key in AGENTS.keys():
        try:
            export_gltf(agent_key, output_dir)
            print(f"Successfully generated {agent_key}")
        except Exception as e:
            print(f"Error generating {agent_key}: {e}")
    
    print("Agent model generation complete!")

if __name__ == "__main__":
    main()
