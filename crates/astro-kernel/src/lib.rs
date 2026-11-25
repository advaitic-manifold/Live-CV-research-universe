//! N-body kernel. Units: central mass mu = 1, equatorial radius R = 1, symmetry axis = z.
//! Per-body acceleration = point mass + J2 zonal harmonic + 1PN Schwarzschild term + softened mutual gravity.
//! Integrator: velocity Verlet (2nd order; the v-dependent 1PN term makes it semi-implicit). f64 state, f32 render buffer.
//! Zero-copy: JS wraps `positions_ptr()` in a Float32Array over wasm memory.
use wasm_bindgen::prelude::*;

struct Rng(u64);
impl Rng { fn f(&mut self) -> f64 { self.0 ^= self.0 << 13; self.0 ^= self.0 >> 7; self.0 ^= self.0 << 17; (self.0 >> 11) as f64 / (1u64 << 53) as f64 } }

#[wasm_bindgen]
pub struct Kernel { n: usize, p: Vec<f64>, v: Vec<f64>, a: Vec<f64>, m: Vec<f64>, out: Vec<f32>, j2: f64, ic2: f64 }

#[wasm_bindgen]
impl Kernel {
    #[wasm_bindgen(constructor)]
    pub fn new(n: usize, seed: u32) -> Kernel {
        let mut g = Rng(0x9E37_79B9_7F4A_7C15 ^ (seed as u64 + 1));
        let mut k = Kernel { n, p: vec![0.; 3 * n], v: vec![0.; 3 * n], a: vec![0.; 3 * n], m: vec![1e-7; n], out: vec![0.; 3 * n], j2: 0.0108, ic2: 0. };
        for i in 0..n {
            let r = 1.6 + g.f() * 4.4; let inc = (g.f() - 0.5) * 1.2; let om = g.f() * 6.283185307; let nu = g.f() * 6.283185307;
            let vc = (1. / r).sqrt(); let (c, s) = (nu.cos(), nu.sin());
            let (ci, si, co, so) = (inc.cos(), inc.sin(), om.cos(), om.sin());
            let rot = |x: f64, y: f64| { let (yy, zz) = (y * ci, y * si); (x * co - yy * so, x * so + yy * co, zz) };
            let (px, py, pz) = rot(r * c, r * s); let (qx, qy, qz) = rot(-vc * s, vc * c);
            k.p[3 * i..3 * i + 3].copy_from_slice(&[px, py, pz]); k.v[3 * i..3 * i + 3].copy_from_slice(&[qx, qy, qz]);
        }
        k.accel(); k.sync(); k
    }
    pub fn set_params(&mut self, j2: f64, ic2: f64) { self.j2 = j2; self.ic2 = ic2; }
    pub fn positions_ptr(&self) -> *const f32 { self.out.as_ptr() }
    pub fn len(&self) -> usize { self.n }
    /// Mean Newtonian specific energy (0.5 v^2 - 1/r); a drift diagnostic, not conserved when J2/1PN are on.
    pub fn energy(&self) -> f64 {
        (0..self.n).map(|i| { let (x, y, z) = (self.p[3 * i], self.p[3 * i + 1], self.p[3 * i + 2]); let (a, b, c) = (self.v[3 * i], self.v[3 * i + 1], self.v[3 * i + 2]); 0.5 * (a * a + b * b + c * c) - 1. / (x * x + y * y + z * z).sqrt() }).sum::<f64>() / self.n as f64
    }
    pub fn step(&mut self, dt: f64, sub: u32) {
        let h = dt / sub as f64;
        for _ in 0..sub {
            for i in 0..3 * self.n { self.v[i] += 0.5 * h * self.a[i]; self.p[i] += h * self.v[i]; }
            self.accel();
            for i in 0..3 * self.n { self.v[i] += 0.5 * h * self.a[i]; }
        }
        self.sync();
    }
    fn sync(&mut self) { for i in 0..3 * self.n { self.out[i] = self.p[i] as f32; } }
    fn accel(&mut self) {
        let n = self.n;
        for i in 0..n {
            let (x, y, z) = (self.p[3 * i], self.p[3 * i + 1], self.p[3 * i + 2]);
            let (vx, vy, vz) = (self.v[3 * i], self.v[3 * i + 1], self.v[3 * i + 2]);
            let r2 = x * x + y * y + z * z; let r = r2.sqrt(); let r3 = r2 * r; let z2r = z * z / r2;
            let (mut ax, mut ay, mut az) = (-x / r3, -y / r3, -z / r3);
            let kj = -1.5 * self.j2 / (r2 * r3); // J2: -(3/2) J2 mu R^2 / r^5 * [x(1-5z^2/r^2), y(...), z(3-5z^2/r^2)]
            ax += kj * x * (1. - 5. * z2r); ay += kj * y * (1. - 5. * z2r); az += kj * z * (3. - 5. * z2r);
            let (v2, rv) = (vx * vx + vy * vy + vz * vz, x * vx + y * vy + z * vz); // 1PN: mu/(c^2 r^3) [(4mu/r - v^2) r + 4 (r.v) v]
            let f = self.ic2 / r3; let q = 4. / r - v2;
            ax += f * (q * x + 4. * rv * vx); ay += f * (q * y + 4. * rv * vy); az += f * (q * z + 4. * rv * vz);
            for j in 0..n { if j != i {
                let (dx, dy, dz) = (self.p[3 * j] - x, self.p[3 * j + 1] - y, self.p[3 * j + 2] - z);
                let d2 = dx * dx + dy * dy + dz * dz + 1e-4; let w = self.m[j] / (d2 * d2.sqrt());
                ax += w * dx; ay += w * dy; az += w * dz;
            } }
            self.a[3 * i] = ax; self.a[3 * i + 1] = ay; self.a[3 * i + 2] = az;
        }
    }
}
