"""
Companion Blender 4.x Python Asset Generator for WINDOWS AT 3AM.
Can be executed via `blender --background --python scripts/blender-generate.py`
or via the Blender MCP server when an interactive Blender session is open.
"""
import os
import bpy

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "public", "assets", "models"))
os.makedirs(OUT_DIR, exist_ok=True)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def make_pbr_mat(name, rgba, metallic=0.1, roughness=0.6):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
    return mat

def build_courtyard_kit():
    clear_scene()
    mat_sash = make_pbr_mat("WeatheredTimberSash", (0.16, 0.18, 0.22, 1.0), 0.1, 0.65)
    mat_iron = make_pbr_mat("WroughtIronBalcony", (0.09, 0.11, 0.14, 1.0), 0.85, 0.38)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
    frame = bpy.context.active_object
    frame.name = "SashWindowFrame"
    frame.scale = (2.2, 0.24, 2.7)
    frame.data.materials.append(mat_sash)

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.45, -1.35))
    balcony = bpy.context.active_object
    balcony.name = "WroughtIronBalcony"
    balcony.scale = (2.6, 0.95, 0.12)
    balcony.data.materials.append(mat_iron)

    out_path = os.path.join(OUT_DIR, "courtyard_facade_kit.glb")
    bpy.ops.export_scene.gltf(filepath=out_path, export_format="GLB")
    print(f"Exported {out_path}")

if __name__ == "__main__":
    build_courtyard_kit()
