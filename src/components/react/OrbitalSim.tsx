/** N-body view: positions come straight from the kernel's buffer (zero-copy when WASM) into a THREE.BufferAttribute. */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadKernel } from '../../lib/kernel';

export default function OrbitalSim() {
  const host = useRef<HTMLDivElement>(null);
  const par = useRef({ j2: 0.0108, ic2: 0, speed: 1 });
  const [ui, setUi] = useState({ j2: 0.0108, ic2: 0, speed: 1 });
  const [hud, setHud] = useState('loading kernel…');
  const set = (k: 'j2' | 'ic2' | 'speed') => (e: React.ChangeEvent<HTMLInputElement>) => { const v = +e.target.value; par.current[k] = v; setUi(u => ({ ...u, [k]: v })); };

  useEffect(() => {
    const el = host.current!, N = 3000; let dead = false, raf = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(renderer.domElement);
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, 0.01, 200); cam.position.set(9, 6, 9);
    const ctl = new OrbitControls(cam, renderer.domElement); ctl.autoRotate = true; ctl.autoRotateSpeed = 0.5; ctl.enableDamping = true;
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x3b6ea5 })); scene.add(body); // oblateness exaggerated by J2
    const resize = () => { const w = el.clientWidth, h = 560; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    resize(); addEventListener('resize', resize);
    let disposeGeo: (() => void) | null = null;

    loadKernel(N).then(k => {
      if (dead) return;
      const geo = new THREE.BufferGeometry(), attr = new THREE.BufferAttribute(k.view(), 3); attr.setUsage(THREE.DynamicDrawUsage);
      geo.setAttribute('position', attr); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
      const mat = new THREE.PointsMaterial({ size: 0.05, color: 0x9fe8f5, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); disposeGeo = () => { geo.dispose(); mat.dispose(); };
      const e0 = k.energy(); let frames = 0, steps = 0, t0 = performance.now(), sps = 0;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        k.setParams(par.current.j2, par.current.ic2); k.step(0.012 * par.current.speed, 4); steps += 4;
        const v = k.view(); if (attr.array !== v) (attr as any).array = v; attr.needsUpdate = true;
        body.scale.set(1, 1 - 3 * par.current.j2, 1); ctl.update(); renderer.render(scene, cam);
        if (++frames % 20 === 0) { const now = performance.now(); sps = (steps / (now - t0)) * 1000; steps = 0; t0 = now; setHud(`${k.kind} · N=${N} · ${sps.toFixed(0)} steps/s · |ΔE/E₀| = ${Math.abs((k.energy() - e0) / e0).toExponential(2)} (Newtonian specific energy)`); }
      };
      loop();
    });
    return () => { dead = true; cancelAnimationFrame(raf); removeEventListener('resize', resize); ctl.dispose(); disposeGeo?.(); body.geometry.dispose(); (body.material as THREE.Material).dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);

  return (<div>
    <div ref={host} style={{ width: '100%', background: '#02040a', border: '1px solid var(--line)' }} />
    <p className="mono" aria-live="polite">{hud}</p>
    <div className="mono" style={{ display: 'grid', gap: '.6rem', maxWidth: '30rem' }}>
      <label>J2 (oblateness): {ui.j2.toFixed(4)}<input type="range" min="0" max="0.05" step="0.0005" value={ui.j2} onChange={set('j2')} style={{ width: '100%' }} /></label>
      <label>1/c² (1PN strength, μ=1 units): {ui.ic2.toFixed(4)}<input type="range" min="0" max="0.02" step="0.0005" value={ui.ic2} onChange={set('ic2')} style={{ width: '100%' }} /></label>
      <label>Time scale: {ui.speed.toFixed(1)}×<input type="range" min="0.2" max="4" step="0.1" value={ui.speed} onChange={set('speed')} style={{ width: '100%' }} /></label>
    </div></div>);
}
