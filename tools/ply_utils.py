from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import re, numpy as np
from plyfile import PlyData

@dataclass
class PlyScene:
    points: np.ndarray
    colors: np.ndarray
    segments: Optional[np.ndarray]
    segment_colors: Optional[np.ndarray]

def natural_key(path: Path):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r"(\d+)", path.name)]

def _rgb(names):
    for t in [("red","green","blue"),("r","g","b"),("diffuse_red","diffuse_green","diffuse_blue")]:
        if all(x in names for x in t): return t
    return None

def load_ply(path: Path):
    ply=PlyData.read(str(path))
    v=ply["vertex"].data; names=set(v.dtype.names or ())
    points=np.column_stack([v["x"],v["y"],v["z"]]).astype(np.float32)
    rn=_rgb(names)
    if rn:
        colors=np.column_stack([v[n] for n in rn])
        if np.issubdtype(colors.dtype,np.floating) and colors.size and float(np.nanmax(colors))<=1.000001: colors*=255
        colors=np.clip(colors,0,255).astype(np.uint8)
    else: colors=np.full((len(points),3),190,dtype=np.uint8)
    segments=segment_colors=None
    if "edge" in ply:
        e=ply["edge"].data; en=set(e.dtype.names or ()); pair=None
        for a,b in [("vertex1","vertex2"),("vertex_1","vertex_2"),("v1","v2")]:
            if a in en and b in en: pair=np.column_stack([e[a],e[b]]).astype(np.int64);break
        if pair is not None and len(pair):
            valid=(pair[:,0]>=0)&(pair[:,0]<len(points))&(pair[:,1]>=0)&(pair[:,1]<len(points));pair=pair[valid]
            if len(pair):
                segments=points[pair]; ergb=_rgb(en)
                if ergb:
                    ec=np.column_stack([e[n] for n in ergb])[valid]
                    if np.issubdtype(ec.dtype,np.floating) and ec.size and float(np.nanmax(ec))<=1.000001: ec*=255
                    ec=np.clip(ec,0,255).astype(np.uint8);segment_colors=np.repeat(ec[:,None,:],2,axis=1)
                else: segment_colors=colors[pair]
    return PlyScene(points,colors,segments,segment_colors)

def list_ply_frames(folder: Path):
    return sorted([p for p in folder.glob("*.ply") if p.is_file()],key=natural_key)
