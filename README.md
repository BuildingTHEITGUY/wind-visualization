# Global Wind Visualization | University AI & Weather Research Lab

This repository hosts a static, GPU-accelerated globe with wind-like particle visualization.
It is designed to deploy on GitHub Pages or Hostinger without a backend.

## Features
- Auto-rotating globe focused on the Indian Ocean / UAE
- Deep blue "space" gradient background
- Sidebar overlay (toggleable) with wind legend and timestamp
- Lightweight Three.js shader particles (procedural) – NOAA GFS integration ready

## Deploy
1. Upload these files to the repo root (branch: main).
2. Ensure **Settings → Pages** is set to deploy from `main` root.
3. If using custom domain, keep `CNAME` set to `wind.buildingtheitguy.com`.

## Credits
© University AI & Weather Research Lab – Data visualization demo (NOAA GFS-ready). Earth textures © respective authors. Libraries via unpkg CDN.