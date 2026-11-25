/** Full-bleed black hole behind the archive: reuses the Schwarzschild geodesic shader; the camera falls inward as you scroll. */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FRAG } from './RelativisticBH';

const FINAL = 'gl_FragColor=vec4(1.-exp(-col*1.2),1.);}';
const FRAG2 = FRAG.replace(FINAL, 'vec3 c=1.-exp(-col*1.1); c*=1.-.45*dot(uv*.45,uv*.45); c+=(hs(vec3(gl_FragCoord.xy,uTime*30.))-.5)*.025; gl_FragColor=vec4(c,1.);}');

export default function Gargantua() {
  const cv = useRef<HTMLCanvasElement>(null);
  const [native, setNative] = useState(false); const [hud, setHud] = useState('');
  useEffect(() => {
    const canvas = cv.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas }); } catch { setHud('WebGL unavailable'); return; }
    const Q = [{ pr: 0.7, n: 230 }, { pr: 0.5, n: 160 }, { pr: 0.38, n: 110 }, { pr: 0.28, n: 80 }]; let lv = matchMedia('(max-width:800px)').matches ? 2 : 0;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const U = { uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uR0: { value: 30 }, uYaw: { value: 0 }, uPitch: { value: 0.07 }, uSteps: { value: 230 } };
    const mat = new THREE.ShaderMaterial({ vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FRAG2, uniforms: U, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; const scene = new THREE.Scene(); scene.add(mesh); const cam = new THREE.Camera();
    const size = () => { const d = Math.min(devicePixelRatio, 2); renderer.setPixelRatio(native ? d : d * Q[lv].pr); renderer.setSize(innerWidth, innerHeight, false); renderer.getDrawingBufferSize(U.uRes.value); U.uSteps.value = native ? 260 : Q[lv].n; };
    size(); addEventListener('resize', size);
    let p = 0, tp = 0; const onS = () => { const m = document.documentElement.scrollHeight - innerHeight; tp = m > 0 ? scrollY / m : 0; }; addEventListener('scroll', onS, { passive: true }); onS();
    const clock = new THREE.Clock(); let raf = 0, acc = 0, n = 0, f = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop); const dt = clock.getDelta(); U.uTime.value += dt; p += (tp - p) * 0.04;
      U.uR0.value = 30 - 21 * p; U.uYaw.value = 0.35 + U.uTime.value * 0.02; U.uPitch.value = 0.07 + 0.1 * p; renderer.render(scene, cam);
      acc += dt; if (!native && ++n === 60) { if (acc / 60 > 0.034 && lv < 3) { lv++; size(); } acc = 0; n = 0; }
      if (++f % 30 === 0) setHud(`${U.uRes.value.x}×${U.uRes.value.y}px · ${U.uSteps.value} geodesic steps/px · r₀ ${U.uR0.value.toFixed(1)} r_s`);
    };
    const vis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : !raf && loop()); document.addEventListener('visibilitychange', vis); loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); removeEventListener('scroll', onS); document.removeEventListener('visibilitychange', vis); geo.dispose(); mat.dispose(); renderer.dispose(); };
  }, [native]);
  return (<>
    <canvas ref={cv} aria-hidden="true" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, background: '#000' }} />
    <div className="hud" style={{ pointerEvents: 'auto', zIndex: 6 }}>{hud} · <button onClick={() => setNative(n => !n)} aria-pressed={native} style={{ padding: '.1rem .5rem', fontSize: 11 }}>{native ? 'NATIVE RES (heavy)' : 'AUTO RES'}</button></div>
  </>);
}
