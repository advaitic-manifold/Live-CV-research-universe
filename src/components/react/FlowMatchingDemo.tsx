/**
 * Flow matching, exact case. Base N(0,I) -> target N(m, s²I) in 2-D. The marginal velocity of the straight paths x_t = t x1 + (1-t) x0 is
 * v(x,t) = m + (t s² - (1-t)) / ((1-t)² + t² s²) · (x - t m). Integrated with 24-step RK4; ln p1 = ln p0 - ∫ div v dt (paper Eqs. 2-5).
 * The paper's v_θ is a trained network on 8-D patches; here v is analytic, so the likelihood can be checked exactly.
 */
import { useEffect, useMemo, useRef } from 'react';
const M = [1.9, -0.6], S = 0.45, D = 2, K = 24, NP = 2500, L2P = Math.log(Math.sqrt(2 * Math.PI));
const coef = (t: number) => (t * S * S - (1 - t)) / ((1 - t) ** 2 + t * t * S * S);
const vel = (x: number, y: number, t: number) => { const c = coef(t); return [M[0] + c * (x - t * M[0]), M[1] + c * (y - t * M[1])]; };

export default function FlowMatchingDemo() {
  const cv = useRef<HTMLCanvasElement>(null);
  const data = useMemo(() => {
    let s = 99; const u = () => ((s = (s * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296, g = () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
    const traj = new Float32Array((K + 1) * NP * 2), h = 1 / K; let maxErr = 0;
    for (let p = 0; p < NP; p++) {
      let x = g(), y = g(); const lp0 = -D * L2P - (x * x + y * y) / 2; let ell = 0; traj[p * 2] = x; traj[p * 2 + 1] = y;
      for (let k = 0; k < K; k++) {
        const t = k * h, k1 = vel(x, y, t), k2 = vel(x + 0.5 * h * k1[0], y + 0.5 * h * k1[1], t + h / 2), k3 = vel(x + 0.5 * h * k2[0], y + 0.5 * h * k2[1], t + h / 2), k4 = vel(x + h * k3[0], y + h * k3[1], t + h);
        x += (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
        ell += (h / 6) * D * (coef(t) + 4 * coef(t + h / 2) + coef(t + h)); // ∫ div v dt, div v = D c(t) (Simpson)
        const o = ((k + 1) * NP + p) * 2; traj[o] = x; traj[o + 1] = y;
      }
      const exact = -D * (Math.log(S) + L2P) - ((x - M[0]) ** 2 + (y - M[1]) ** 2) / (2 * S * S);
      maxErr = Math.max(maxErr, Math.abs(lp0 - ell - exact));
    }
    return { traj, maxErr };
  }, []);
  useEffect(() => {
    const c = cv.current!, ctx = c.getContext('2d')!, W = (c.width = 800), H = (c.height = 420); let raf = 0;
    const sx = (x: number) => W / 2 + (x - 0.7) * 150, sy = (y: number) => H / 2 - y * 150;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw); const ph = ((now / 1000) % 10) / 10, kf = ph * K, k0 = Math.floor(kf), f = kf - k0, k1 = Math.min(K, k0 + 1);
      ctx.fillStyle = 'rgba(2,4,10,.35)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
      for (let p = 0; p < NP; p++) { const a = (k0 * NP + p) * 2, b = (k1 * NP + p) * 2; ctx.fillStyle = `hsla(${190 - ph * 150},70%,70%,.55)`; ctx.fillRect(sx(data.traj[a] * (1 - f) + data.traj[b] * f), sy(data.traj[a + 1] * (1 - f) + data.traj[b + 1] * f), 1.6, 1.6); }
      ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#d9b46a66'; for (const r of [1, 2]) { ctx.beginPath(); ctx.ellipse(sx(M[0]), sy(M[1]), r * S * 150, r * S * 150, 0, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.fillStyle = '#8d97ab'; ctx.font = '12px ui-monospace,monospace'; ctx.fillText(`t = ${ph.toFixed(2)} · RK4 step ${Math.min(K, Math.round(kf))}/${K}`, 12, 20);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [data]);
  return (<div className="panel">
    <p className="tier demo">LIVE · exact analytic flow (not the trained network)</p>
    <canvas ref={cv} role="img" aria-label="Particles flowing from a standard Gaussian to a shifted Gaussian along an RK4-integrated flow" style={{ width: '100%', maxWidth: 800 }} />
    <p className="mono">24-step RK4 with exact divergence: max |ln p₁(flow) − ln p₁(exact Gaussian)| over {NP} particles = <b>{data.maxErr.toExponential(2)}</b> nats. This checks the likelihood formula (Eqs. 3–5) in a case where the answer is known.</p>
    <p className="mono">The paper's trained v_θ on 8-D patches reports validation NLL −10.0805 nats (GMM baseline −10.06). Those are the paper's numbers, not computed here.</p>
  </div>);
}
