# Research Universe

Astro + React + Three.js portfolio. Deploy: push to `main`, enable Pages → "GitHub Actions".
```
npm install && npm run dev
```
`SITE`/`BASE` env vars drive Pages paths (the workflow sets them). Edit content in `src/data/site.ts`. Add `public/Manav_Patel_CV.pdf`.

**Status:** not yet compiled in the authoring environment (no network) — run `npm run build` and fix any version drift.
**Rendering:** WebGPU (WGSL, stars + galaxy) when available, else WebGL2 automatically. In WebGPU mode the galaxy is static and the constellation lines are not drawn. No compute shaders yet. WebGPU path is untested on real hardware.
**Not built yet:** Tailwind, GSAP/Lenis, nebula volumetrics, lensing/black-hole transition, FITS viewer, latent-space cloud, 3D model constellation, timeline orbit, observatory mode, terminal, workers.

## Rust/WASM kernel (optional; site falls back to a JS port)
```
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run build:wasm
npm run dev
```
Pages: `/orbits/` (N-body, J2, 1PN, zero-copy buffer), `/relativity/` (Schwarzschild geodesic ray tracer). Kerr, J3-J6, SPICE: not implemented.
