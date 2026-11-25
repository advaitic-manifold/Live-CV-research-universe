/**
 * Exact Born sampling from a 16-site real MPS (chi = 4). Cores are RANDOM (untrained, N(0,1/sqrt(chi))): this demonstrates the paper's math,
 * p(s) = psi(s)^2 / Z with Z from transfer matrices, and exact sequential sampling. Trained-model numbers are quoted from the paper.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
const X = 4, N = 16, B = [0, 1];
const mul = (a: number[], b: number[]) => { const c = new Array(X * X).fill(0); for (let i = 0; i < X; i++) for (let k = 0; k < X; k++) for (let j = 0; j < X; j++) c[i * X + j] += a[i * X + k] * b[k * X + j]; return c; };
const tr = (a: number[]) => { const c = new Array(X * X); for (let i = 0; i < X; i++) for (let j = 0; j < X; j++) c[j * X + i] = a[i * X + j]; return c; };
const vm = (v: number[], a: number[]) => [0, 1, 2, 3].map(j => v.reduce((s, vi, i) => s + vi * a[i * X + j], 0));
const quad = (u: number[], R: number[]) => u.reduce((s, ui, i) => s + ui * [0, 1, 2, 3].reduce((t, j) => t + R[i * X + j] * u[j], 0), 0);

function build(seed: number) {
  let s = seed >>> 0; const u = () => ((s = (s * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296;
  const g = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(6.283185307 * u());
  const A = Array.from({ length: N }, () => B.map(() => Array.from({ length: X * X }, () => g() / Math.sqrt(X))));
  const l = [1, 0, 0, 0], r0 = [0, 1, 2, 3].map(() => g()), rn = Math.hypot(...r0), rr = r0.map(x => x / rn);
  const R: number[][] = Array(N + 1); R[N] = rr.flatMap(a => rr.map(b => a * b));
  for (let k = N - 1; k >= 0; k--) R[k] = B.reduce((acc, sg) => { const m = mul(mul(A[k][sg], R[k + 1]), tr(A[k][sg])); return acc.map((x, i) => x + m[i]); }, new Array(X * X).fill(0));
  const Z = quad(l, R[0]); let total = 0;
  const dfs = (k: number, v: number[]) => { if (k === N) { const psi = v.reduce((a, vi, i) => a + vi * rr[i], 0); total += (psi * psi) / Z; return; } for (const sg of B) dfs(k + 1, vm(v, A[k][sg])); };
  dfs(0, l); return { A, l, rr, R, Z, total, u };
}

export default function MpsBorn() {
  const [seed, setSeed] = useState(7); const cv = useRef<HTMLCanvasElement>(null);
  const m = useMemo(() => build(seed), [seed]); const [nll, setNll] = useState(0);
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!, cols = 12, rows = 6, ps = 6, gap = 4; c.width = cols * (4 * ps + gap); c.height = rows * (4 * ps + gap);
    ctx.fillStyle = '#02040a'; ctx.fillRect(0, 0, c.width, c.height); let sum = 0;
    for (let q = 0; q < cols * rows; q++) {
      let v = m.l; const bits: number[] = [];
      for (let k = 0; k < N; k++) { const us = B.map(sg => vm(v, m.A[k][sg])), w = us.map(x => quad(x, m.R[k + 1])); const sg = m.u() * (w[0] + w[1]) < w[0] ? 0 : 1; bits.push(sg); v = us[sg]; }
      const psi = v.reduce((a, vi, i) => a + vi * m.rr[i], 0); sum += -Math.log((psi * psi) / m.Z);
      const ox = (q % cols) * (4 * ps + gap), oy = Math.floor(q / cols) * (4 * ps + gap);
      bits.forEach((b, i) => { ctx.fillStyle = b ? '#d9e6ff' : '#0b1220'; ctx.fillRect(ox + (i % 4) * ps, oy + Math.floor(i / 4) * ps, ps - 1, ps - 1); });
    }
    setNll(sum / (cols * rows));
  }, [m]);
  return (<div className="panel">
    <p className="tier demo">LIVE · random untrained MPS (χ = 4, 16 sites)</p>
    <canvas ref={cv} role="img" aria-label="72 binary 4 by 4 patches sampled exactly from a random matrix product state" style={{ width: '100%', maxWidth: 560, imageRendering: 'pixelated' }} />
    <p className="mono">Z (transfer matrices) = {m.Z.toExponential(4)} · exhaustive Σ p(s) over all 65,536 states = <b>{m.total.toFixed(12)}</b> · mean −ln p of the samples = {nll.toFixed(3)} nats</p>
    <button onClick={() => setSeed(s => s + 1)}>Draw a new random MPS</button>
    <p className="mono">For scale, the paper reports for the <i>trained</i> χ* = 4 model a held-out NLL of 3.8429 vs 10.9787 nats/patch for independent pixels. The patches above are samples from a random model, not astronomical data.</p>
  </div>);
}
