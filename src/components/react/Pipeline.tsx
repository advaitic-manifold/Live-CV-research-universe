import { useState } from 'react';

// Stages and numbers are from the Cosmic Sentinel paper (RP-4). Figures themselves are in the paper.
const STAGES = [
  ['Observation', 'JWST NIRCam fields jw01947 and jw09257 and the pulsar-wind-nebula field b1509. Poisson–Gaussian noise, heavy Student-t tails (ν from 3.0 to 12.8), spatial autocorrelation r = 0.892, six orders of dynamic range.'],
  ['Variance stabilization', 'Generalized Anscombe transform (a = 6.01×10⁻⁵, b = 0) and biweight standardization (location −0.2383, scale 0.9728). Exact-polygon reprojection conserves flux (ratio 0.9977).'],
  ['Fisher–Rao geometry', 'Gaussian patches on a constant-curvature manifold (K = −1/2) with a closed-form geodesic distance. 59.41% of deviations are variance-driven, 40.59% mean-driven.'],
  ['Optimal transport', 'Sinkhorn divergence (ε = 0.4089) agrees with sliced Wasserstein: Spearman ρ = 0.9642.'],
  ['Continuous flow (CFM)', 'Conditional flow matching loss 1.5028; validation log-likelihood −10.0805 nats against −10.06 for a Gaussian mixture; rank agreement ρ = 0.9831.'],
  ['MPS Born machine', '16-site MPS, χ* = 4: held-out NLL 3.8429 vs 10.9787 nats/patch (65.00% lower). 16-qubit Ising exact diagonalization peaks at Γc = 0.0527, ground-state/intensity rank correlation 0.6155.'],
  ['Surrogate consensus', 'IAAFT phase-randomized nulls (three per image). Consensus Minkowski-functional significance |z| = 19.2, against below 3.0 for any single module.'],
] as const;

export default function Pipeline() {
  const [i, setI] = useState(0);
  return (
    <div>
      <div role="group" aria-label="Pipeline stage" style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
        {STAGES.map(([name], k) => (<button key={name} aria-pressed={k === i} onClick={() => setI(k)}>{k + 1}. {name}</button>))}
      </div>
      <div className="panel" aria-live="polite" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>{STAGES[i][0]}</h2>
        <p>{STAGES[i][1]}</p>
        <p className="mono">Values as reported in the paper. See the paper for the figures.</p>
      </div>
    </div>
  );
}
