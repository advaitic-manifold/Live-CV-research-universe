/** Loads the Rust/WASM kernel if built (zero-copy Float32Array over wasm memory); else a TS port of the same physics. */
export interface Kernel { n: number; kind: string; view(): Float32Array; step(dt: number, sub: number): void; setParams(j2: number, ic2: number): void; energy(): number; }

class JsKernel implements Kernel {
  kind = 'JS fallback (build Rust for WASM)'; p: Float64Array; v: Float64Array; a: Float64Array; out: Float32Array; j2 = 0.0108; ic2 = 0; m = 1e-7;
  constructor(public n: number) {
    let s = 12345; const f = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    this.p = new Float64Array(3 * n); this.v = new Float64Array(3 * n); this.a = new Float64Array(3 * n); this.out = new Float32Array(3 * n);
    for (let i = 0; i < n; i++) {
      const r = 1.6 + f() * 4.4, inc = (f() - 0.5) * 1.2, om = f() * 6.283185307, nu = f() * 6.283185307, vc = Math.sqrt(1 / r);
      const ci = Math.cos(inc), si = Math.sin(inc), co = Math.cos(om), so = Math.sin(om);
      const rot = (x: number, y: number) => [x * co - y * ci * so, x * so + y * ci * co, y * si];
      this.p.set(rot(r * Math.cos(nu), r * Math.sin(nu)), 3 * i); this.v.set(rot(-vc * Math.sin(nu), vc * Math.cos(nu)), 3 * i);
    }
    this.accel(); this.sync();
  }
  view() { return this.out; } setParams(j2: number, ic2: number) { this.j2 = j2; this.ic2 = ic2; }
  energy() { let e = 0; for (let i = 0; i < this.n; i++) { const [x, y, z, a, b, c] = [...this.p.subarray(3 * i, 3 * i + 3), ...this.v.subarray(3 * i, 3 * i + 3)]; e += 0.5 * (a * a + b * b + c * c) - 1 / Math.hypot(x, y, z); } return e / this.n; }
  step(dt: number, sub: number) {
    const h = dt / sub, L = 3 * this.n;
    for (let s = 0; s < sub; s++) { for (let i = 0; i < L; i++) { this.v[i] += 0.5 * h * this.a[i]; this.p[i] += h * this.v[i]; } this.accel(); for (let i = 0; i < L; i++) this.v[i] += 0.5 * h * this.a[i]; }
    this.sync();
  }
  sync() { for (let i = 0; i < this.out.length; i++) this.out[i] = this.p[i]; }
  accel() { // test-particle terms only (point mass + J2 + 1PN); mutual gravity (1e-7 masses) is negligible and omitted in the fallback
    for (let i = 0; i < this.n; i++) {
      const [x, y, z] = [this.p[3 * i], this.p[3 * i + 1], this.p[3 * i + 2]], [vx, vy, vz] = [this.v[3 * i], this.v[3 * i + 1], this.v[3 * i + 2]];
      const r2 = x * x + y * y + z * z, r = Math.sqrt(r2), r3 = r2 * r, zz = (z * z) / r2, kj = (-1.5 * this.j2) / (r2 * r3);
      const v2 = vx * vx + vy * vy + vz * vz, rv = x * vx + y * vy + z * vz, f = this.ic2 / r3, q = 4 / r - v2;
      this.a[3 * i] = -x / r3 + kj * x * (1 - 5 * zz) + f * (q * x + 4 * rv * vx);
      this.a[3 * i + 1] = -y / r3 + kj * y * (1 - 5 * zz) + f * (q * y + 4 * rv * vy);
      this.a[3 * i + 2] = -z / r3 + kj * z * (3 - 5 * zz) + f * (q * z + 4 * rv * vz);
    }
  }
}

// import.meta.glob resolves to {} when the wasm package has not been built, so the site still builds.
const mods = import.meta.glob('../../crates/astro-kernel/pkg/astro_kernel.js');

export async function loadKernel(n: number): Promise<Kernel> {
  const load = Object.values(mods)[0];
  if (load) {
    try {
      const m: any = await load(); const wasm = await m.default(); const k = new m.Kernel(n, 1);
      let view = new Float32Array(wasm.memory.buffer, k.positions_ptr(), 3 * n);
      return {
        n, kind: 'Rust → WASM (zero-copy)',
        view() { if (view.buffer !== wasm.memory.buffer) view = new Float32Array(wasm.memory.buffer, k.positions_ptr(), 3 * n); return view; }, // memory.grow detaches old views
        step: (dt, sub) => k.step(dt, sub), setParams: (a, b) => k.set_params(a, b), energy: () => k.energy(),
      };
    } catch (e) { console.warn('WASM kernel failed, using JS fallback', e); }
  }
  return new JsKernel(n);
}
