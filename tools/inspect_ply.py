from pathlib import Path
import sys
import numpy as np
from plyfile import PlyData
from ply_utils import load_ply

if len(sys.argv) < 2:
    print("Usage: python tools/inspect_ply.py path/to/file.ply")
    raise SystemExit(2)

path = Path(sys.argv[1])
ply = PlyData.read(str(path))
scene = load_ply(path)

print("File:", path)
print("Format:", "ASCII" if ply.text else "binary")
print("Elements:", [(e.name, e.count) for e in ply.elements])
print("Vertex properties:", list(ply["vertex"].data.dtype.names or ()))
print("Points:", scene.points.shape)
print("XYZ min:", scene.points.min(axis=0))
print("XYZ max:", scene.points.max(axis=0))
print("Has RGB:", scene.colors is not None)
print("Edges:", 0 if scene.segments is None else len(scene.segments))
