#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

version="$(sed -n 's:.*<version>\([^<]*\)</version>.*:\1:p' index.xml | head -n 1)"
archive="dist/Signal-v${version}.zip"

mkdir -p dist
rm -f "$archive"
zip -r "$archive" \
  skin.html style.css index.xml LICENSE README.md \
  preview.gif preview256.jpg preview560.jpg preview1600.jpg \
  images

echo "$archive"
