from pathlib import Path
import json, numpy as np, viser
from ply_utils import load_ply, list_ply_frames

ROOT=Path(__file__).resolve().parents[1]

def read_cfg(folder):
    p=folder/"scene.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

def read_group_cfg(folder):
    p=folder/"group.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}

def auto_camera(points):
    mn=points.min(0);mx=points.max(0);c=(mn+mx)/2;e=max(float(np.max(mx-mn)),.2)
    pos=c+np.array([1.25,-1.55,1.10],dtype=np.float32)*e
    return tuple(float(x) for x in pos),tuple(float(x) for x in c)

def build_recording(source:Path,out:Path,cfg):
    frames=list_ply_frames(source)
    if not frames:
        if out.exists(): out.unlink()
        return False
    first=load_ply(frames[0]);server=viser.ViserServer()
    server.scene.set_up_direction(cfg.get("up_direction","+z"));server.scene.world_axes.visible=False
    pos,look=auto_camera(first.points);server.initial_camera.position=pos;server.initial_camera.look_at=look;server.initial_camera.up=(0,0,1)
    cloud=server.scene.add_point_cloud("/point_cloud",points=first.points,colors=first.colors,point_size=float(cfg.get("point_size",.008)),point_shape=cfg.get("point_shape","rounded"),precision="float32",point_shading="gradient")
    edge=None
    if first.segments is not None and len(first.segments):
        edge=server.scene.add_line_segments("/edges",points=first.segments,colors=first.segment_colors,line_width=float(cfg.get("edge_line_width",2.0)))
    if cfg.get("show_grid",True):
        mn=first.points.min(0);mx=first.points.max(0);e=max(float(np.max(mx-mn)),.2);c=(mn+mx)/2
        server.scene.add_grid("/grid",width=e*1.35,height=e*1.35,plane="xy",cell_size=max(e/10,.01),section_size=max(e/2,.05),position=(float(c[0]),float(c[1]),float(mn[2])))
    ser=server.get_scene_serializer()
    if len(frames)>1:
        fps=max(float(cfg.get("fps",12)),.1);ser.insert_sleep(1/fps)
        for f in frames[1:]:
            s=load_ply(f);cloud.points=s.points;cloud.colors=s.colors
            if s.segments is not None and len(s.segments):
                if edge is None: edge=server.scene.add_line_segments("/edges",points=s.segments,colors=s.segment_colors,line_width=float(cfg.get("edge_line_width",2.0)))
                else: edge.visible=True;edge.points=s.segments;edge.colors=s.segment_colors
            elif edge is not None: edge.visible=False
            ser.insert_sleep(1/fps)
    out.write_bytes(ser.serialize());server.stop();print("  wrote",out.relative_to(ROOT));return True

def scene_manifest_entry(group_dir: Path, scene: Path, cfg):
    rel = scene.relative_to(ROOT).as_posix()
    camera = cfg.get("camera")
    if camera is None:
        pred_frames = list_ply_frames(scene / "pred")
        gt_frames = list_ply_frames(scene / "gt")
        sample = pred_frames[0] if pred_frames else (gt_frames[0] if gt_frames else None)
        if sample is not None:
            points = load_ply(sample).points
            pos, look_at = auto_camera(points)
            camera = {"position": list(pos), "look_at": list(look_at), "up": [0.0, 0.0, 1.0]}
        else:
            camera = {"position": [1.0, 0.0, 1.0], "look_at": [0.0, 0.0, 0.0], "up": [0.0, 0.0, 1.0]}
    return {
        "id": scene.name,
        "title": cfg.get("title", scene.name.replace("-", " ").title()),
        "preview": f"{rel}/cameras-rgb/cam0.png",
        "images": {
            "rgb0": f"{rel}/cameras-rgb/cam0.png",
            "depth0": f"{rel}/cameras-depth/cam0.png",
            "rgb1": f"{rel}/cameras-rgb/cam1.png",
            "depth1": f"{rel}/cameras-depth/cam1.png",
        },
        "pred_viser": f"{rel}/scene-pred.viser",
        "gt_viser": f"{rel}/scene-gt.viser",
        "camera": camera,
        "pred_frames": len(list_ply_frames(scene / "pred")),
        "gt_frames": len(list_ply_frames(scene / "gt")),
    }

def write_manifest(groups):
    out = ROOT / "data" / "scene-manifest.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"version": 1, "groups": groups}, indent=2), encoding="utf-8")
    print("  wrote", out.relative_to(ROOT))

def main():
    manifest_groups = []
    # Interactive: discover every group that follows interactive/*-scenes/scene-*.
    interactive_root = ROOT / "interactive"
    group_dirs = [p for p in interactive_root.glob("*-scenes") if p.is_dir()]
    group_dirs.sort(key=lambda p: (read_group_cfg(p).get("order", 100), p.name))
    for root in group_dirs:
        group_cfg = read_group_cfg(root)
        scenes = sorted([p for p in root.glob("scene-*") if p.is_dir()])
        if scenes:
            manifest_group = {
                "id": root.name,
                "label": group_cfg.get("label", root.name.replace("-scenes", "").upper()),
                "subtitle": group_cfg.get("subtitle", ""),
                "scenes": [],
            }
            manifest_groups.append(manifest_group)
        for scene in scenes:
            cfg=read_cfg(scene);print("[interactive]",scene.relative_to(ROOT))
            build_recording(scene/"pred",scene/"scene-pred.viser",cfg)
            build_recording(scene/"gt",scene/"scene-gt.viser",cfg)
            manifest_group["scenes"].append(scene_manifest_entry(root, scene, cfg))
    write_manifest(manifest_groups)
    # Dataset comparison.
    for scene in sorted([p for p in (ROOT/"annotations").glob("sample-*") if p.is_dir()]):
        cfg=read_cfg(scene);print("[annotation]",scene.relative_to(ROOT))
        build_recording(scene/"ours",scene/"scene-fs-refined.viser",cfg)
        build_recording(scene/"original",scene/"scene-raw-tri.viser",cfg)

if __name__=="__main__": main()
