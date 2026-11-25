// Single source of truth. Everything below comes from the CV / papers.
// Anything not in them is marked [REAL DATA REQUIRED].
export const person = {
  name: 'Manav Patel',
  tagline: 'Building intelligent systems for scientific discovery.',
  email: 'advaitic.manifold@gmail.com',
  github: 'https://github.com/advaitic-manifold',
  linkedin: 'https://linkedin.com/in/manav-patel-68738a423',
  location: 'Ahmedabad, Gujarat, India',
  demos: ['https://persistent-cosmic-filament.netlify.app/', 'https://prismastro.netlify.app/'],
};

export type Paper = {
  slug: string; title: string; authors: string; status: string; venue: string;
  domain: 'Astronomy + AI' | 'Healthcare AI' | 'Quantum-inspired ML'; summary: string; keywords: string[];
  highlights: { v: string; k: string }[]; limits: string[];
};

// All numbers below are copied from the uploaded papers/CV. Status/venue follow the CV.
export const papers: Paper[] = [
  { slug: 'seer-survival-pipeline', domain: 'Healthcare AI',
    title: 'Bridging Clinical Integrity and Machine Learning: A High-Fidelity Pipeline for Zero-Error Survival Classification on the SEER Dataset',
    authors: 'M. Patel, R. Jadhav, D. Patel', status: 'Accepted', venue: 'CICON 2026 (Paper #226)',
    summary: 'A reproducible six-stage pipeline predicting breast-cancer survival from 4,024 SEER records (15 clinical features). Random Forest, SVM-RBF and Logistic Regression are compared under identical seeded, leakage-free conditions, with SHAP, calibration and a DQN/LP decision-threshold optimizer.',
    keywords: ['SEER', 'reproducibility', 'SHAP', 'calibration', 'class imbalance'],
    highlights: [{ v: '89.94%', k: 'Random Forest test accuracy' }, { v: '90.80 ± 0.72%', k: '5-fold CV accuracy' }, { v: '4,024', k: 'patient records, 15 features' }, { v: '5.5 : 1', k: 'class imbalance' }],
    limits: ['Recall on the deceased class is only 0.47 (RF) — the paper calls this the false-negative problem.', 'No external validation; prospective validation is required before clinical use.', 'Nominal features are label-encoded, which introduces spurious ordering (one-hot encoding is future work).'] },
  { slug: 'astrophotonic-operator-cartography', domain: 'Astronomy + AI',
    title: 'Astrophotonic Operator Cartography via Patch-Resolved Scrambling Dynamics and Free-Spectral Entropy',
    authors: 'M. N. Patel, M. K. Halani, V. Salecha', status: 'Selected', venue: 'ICAIRA 2026, Istanbul',
    summary: 'Each 8×8 patch becomes a normalized symmetric operator, analysed by an out-of-time-order-commutator branch (Lyapunov-type growth) and a free-probability branch (Stieltjes transform, free and von Neumann entropy), then fused into a chaos–entropy map.',
    keywords: ['OTOC', 'free probability', 'spectral entropy', 'scientific visualization'],
    highlights: [{ v: '0.655 vs 0.674', k: 'operator-only F1 vs conventional (below baseline)' }, { v: '0.693', k: 'pooled F1 of the hybrid' }, { v: 'p = 0.078', k: 'exact Wilcoxon — not conclusive' }, { v: '2,100', k: 'patches, 7 scenes' }],
    limits: ['Not a better standalone detector than conventional features; positioned as an auditable supplement.', 'Five scenes are subfields of one frame; two are synthetic controls where the hybrid does worse.', 'Does not measure astronomical quantum chaos; descriptors are finite-matrix summaries.'] },
  { slug: 'continuous-neural-fields-flow-matching', domain: 'Astronomy + AI',
    title: 'Continuous Neural Fields, Flow Matching, and Self-Supervised Representation Learning for High-Dimensional Observational Vision',
    authors: 'M. N. Patel, A. Borana, R. Jadhav, D. Patel', status: 'Submitted', venue: 'AAIML 2027, Nihon University, Tokyo (Mar 29–31, 2027)',
    summary: 'A label-free framework for telescope imagery: conditional flow matching scores patch likelihood (24-step RK4 with exact divergence), SIREN neural fields reconstruct scenes, Noise2Void denoises, a masked transformer flags anomalies, and diffusion maps estimate latent dimension.',
    keywords: ['flow matching', 'SIREN', 'Noise2Void', 'diffusion maps', 'self-supervised'],
    highlights: [{ v: '−10.0805', k: 'validation NLL, nats (GMM baseline −10.06)' }, { v: '40.6 dB', k: 'SIREN PSNR (ReLU MLP 28.2)' }, { v: '94.2%', k: 'Noise2Void suppression (Gaussian 61.8%)' }, { v: 'd ≈ 5.003', k: 'diffusion-map latent dimension' }],
    limits: ['Single-image self-supervised protocol; runs take hours (0.96–2.24 h per field).', 'The likelihood margin over the 6-component GMM is small (−10.08 vs −10.06).', 'Other imaging domains (cryo-EM, SAR) are future work, not evaluated.'] },
  { slug: 'cosmic-sentinel-engine', domain: 'Astronomy + AI',
    title: 'Cosmic Sentinel: A Universal AI-First Multi-Paradigm Framework Fusing Riemannian Geometry, Optimal Transport, and Quantum Tensor Networks for Observational Vision',
    authors: 'M. N. Patel, A. Borana, R. Jadhav, D. Patel', status: 'To be submitted', venue: 'SSVM 2027, Veldhoven (Jun 6–10, 2027)',
    summary: 'Four paradigms in one self-supervised engine: Fisher–Rao information geometry, Sinkhorn optimal transport, continuous normalizing flows and an MPS Born machine. A consensus operator calibrated on IAAFT phase-randomized surrogates keeps only structure several modules agree on.',
    keywords: ['information geometry', 'optimal transport', 'tensor networks', 'surrogate calibration'],
    highlights: [{ v: '65.00%', k: 'lower NLL: 3.8429 vs 10.9787 nats/patch' }, { v: '|z| = 19.2', k: 'consensus significance (< 3.0 single module)' }, { v: 'ρ = 0.9642', k: 'Sinkhorn vs sliced-Wasserstein' }, { v: '0.9977', k: 'flux conservation ratio' }],
    limits: ['Per-image self-supervised training; the four-paradigm run takes hours.', 'MPS bond dimension is fixed at χ* = 4.', 'The d = 5.0030 estimate is an exploratory diagnostic, not proof of a smooth 5-D manifold.'] },
  { slug: 'mps-born-machines', domain: 'Quantum-inspired ML',
    title: 'Matrix Product State Born Machines for Non-Local Feature Extraction in Complex Observational Fields',
    authors: 'M. N. Patel, A. Borana, R. Jadhav, D. Patel', status: 'Submitted', venue: 'AAIML 2027, Nihon University, Tokyo (Mar 29–31, 2027)',
    summary: '4×4 patches become 16-bit strings modelled by a matrix product state with exact transfer-matrix normalization, plus a 16-qubit transverse-field Ising exact diagonalization, IQP fidelity kernels and quantum walks. Everything is simulated; no quantum advantage is claimed.',
    keywords: ['MPS', 'Born machine', 'transverse-field Ising', 'tensor networks'],
    highlights: [{ v: '3.8429', k: 'held-out NLL nats/patch at χ* = 4 (baseline 10.9787)' }, { v: 'Γc = 0.0527', k: 'fidelity-susceptibility peak' }, { v: 'ρ = 0.6155', k: 'magnetization–intensity rank correlation' }, { v: '< 9.30×10⁻⁸', k: 'statevector overlap error' }],
    limits: ['Classical simulation only; the paper makes no claim of quantum advantage.', 'The paper itself flags some reported settings (sweep parameters, software versions) for verification against the source run.', 'The Ising correlation is descriptive and does not establish causation.'] },
];

export const experience = [
  { role: 'Undergraduate Researcher (faculty-supervised)', org: 'Silver Oak University, Ahmedabad', when: '3 months', note: 'Supervised by Prof. Rashmi Jadhav and Prof. Divyang Patel. Independent AI/ML research: methodology, experiments, implementation and manuscript preparation; authored the paper selected for CICON 2026.' },
  { role: 'Conference Paper Reviewer', org: 'AusDM 2026', when: 'Sep 2026', note: 'Evaluated two submissions for methodological soundness, experimental rigour and clarity; delivered by the 8 September 2026 deadline.' },
  { role: 'Data Scientist Intern', org: 'Zolvac Technologies', when: 'Semester 8, 2026', note: '[REAL DATA REQUIRED] — responsibilities and outcomes not yet supplied.' },
];

export const timeline = [
  { when: '2022 – 2026', what: 'B.Tech Information Technology, Silver Oak University (CGPA 9.22/10, no backlogs)' },
  { when: '2026', what: 'CICON 2026 paper accepted; ICAIRA 2026 paper selected' },
  { when: 'Sep 2026', what: 'Reviewer, AusDM 2026' },
  { when: 'Mar 29–31, 2027', what: 'AAIML 2027, Tokyo: two papers submitted' },
  { when: 'Jun 6–10, 2027', what: 'SSVM 2027, Veldhoven: Cosmic Sentinel (to be submitted)' },
];

export const skills: Record<string, string[]> = {
  'Machine learning': ['scikit-learn', 'SHAP', 'calibration', 'Random Forest / SVM / Logistic Regression', 'stratified cross-validation'],
  'Probabilistic & continuous models': ['flow matching (RK4, exact divergence)', 'SIREN', 'Noise2Void', 'masked transformers', 'diffusion maps'],
  'Tensor networks & quantum-inspired': ['MPS Born machines', 'transverse-field Ising ED', 'PennyLane', 'quimb'],
  'Geometry & transport': ['Fisher–Rao geometry', 'Sinkhorn / optimal transport (POT)', 'Minkowski functionals', 'IAAFT surrogates'],
  'Astronomy tooling': ['Astropy', 'Photutils', 'reproject', 'FITS / WCS'],
  'Engineering': ['Python', 'PyTorch', 'NumPy / SciPy', 'JavaScript / React', 'seeded, reproducible pipelines'],
};
