#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
rm -rf static/viser-client
mkdir -p static/viser-client
.venv/bin/viser-build-client --output-dir static/viser-client
.venv/bin/python tools/build_all.py
echo "SUCCESS. Run: .venv/bin/python -m http.server 8000"
