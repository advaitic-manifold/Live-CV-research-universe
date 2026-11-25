/**
 * Per-pixel Schwarzschild null-geodesic integrator. Units r_s = 1. Each camera ray lies in a plane; with u = 1/r:
 *   d²u/dφ² + u = (3/2) r_s u²     (leapfrog in φ, up to uSteps steps)
 * Outcomes: u >= 1 -> horizon (black); u <= 0 -> escapes to the starfield along the final direction; crossings of the y=0 plane
 * between r = 3 and 10 add disc emission: T ~ r^-3/4 (1-sqrt(3/r))^1/4, g = sqrt(1-1/r)·sqrt(1-v²)/(1-v·n), I ~ g⁴T⁴.
 * Not implemented: Kerr (spin), polarization, disc opacity/scattering. Cost: O(uSteps) per pixel; fallback = lower res/steps.
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const FRAG = /* glsl */ `
uniform vec2 uRes; uniform float uTime,uR0,uYaw,uPitch; uniform int uSteps;
float hs(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
vec3 ramp(float t){vec3 c=mix(vec3(1.,.25,.05),vec3(1.,.85,.6),smoothstep(0.,1.,t));return mix(c,vec3(.7,.85,1.),smoothstep(1.,2.,t));}
vec3 sky(vec3 d){vec3 p=d*70.,i=floor(p),f=fract(p)-.5;float h=hs(i);
 vec3 o=(vec3(hs(i+1.),hs(i+2.),hs(i+3.))-.5)*.6; float s=step(.97,h)*(1.-smoothstep(0.,.14,length(f-o)));
 vec3 c=mix(vec3(1.,.8,.6),vec3(.7,.8,1.),hs(i+7.)); return c*s*(.6+2.*hs(i+5.))+vec3(.02,.025,.04)*exp(-abs(d.y)*5.);}
void main(){
 vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y;
 vec3 cp=uR0*vec3(cos(uPitch)*sin(uYaw),sin(uPitch),cos(uPitch)*cos(uYaw));
 vec3 f=-normalize(cp),rt=normalize(cross(f,vec3(0,1,0))),up=cross(rt,f),d=normalize(f+.7*(uv.x*rt+uv.y*up));
 vec3 e1=normalize(cp),t=d-e1*dot(d,e1); float tl=length(t); vec3 e2=tl>1e-4?t/tl:rt;
 float cr=dot(d,e1),ct=max(dot(d,e2),1e-4),u=1./uR0,v=-u*cr/ct,ph=0.; vec3 col=vec3(0),pp=cp; int st=0;
 for(int i=0;i<300;i++){ if(i>=uSteps)break; float h=.045;
  float a=-u+1.5*u*u; v+=.5*h*a; u+=h*v; a=-u+1.5*u*u; v+=.5*h*a; ph+=h;
  if(u>=1.){st=1;break;} if(u<=0.){st=2;break;}
  vec3 p=(1./u)*(cos(ph)*e1+sin(ph)*e2);
  if(pp.y*p.y<0.){ vec3 q=mix(pp,p,pp.y/(pp.y-p.y)); float rr=length(q);
   if(rr>3.&&rr<10.){ float T=2.2*pow(rr/3.,-.75)*pow(max(1.-sqrt(3./rr),0.),.25);
    vec3 n=-normalize(p-pp),tg=normalize(cross(vec3(0,1,0),q)); float vv=sqrt(1./(2.*(rr-1.)));
    float g=sqrt(1.-1./rr)*sqrt(1.-vv*vv)/(1.-vv*dot(tg,n));
    float tu=.65+.35*sin(6.*(atan(q.z,q.x)-uTime*2.*pow(rr,-1.5)));
    col+=ramp(g*T)*min(pow(g,4.)*pow(T,4.)*tu*(1.-smoothstep(8.,10.,rr)),6.); } }
  pp=p; }
 if(st==2||(st==0&&u<.4)) col+=sky(cos(ph)*e1+sin(ph)*e2);
 gl_FragColor=vec4(1.-exp(-col*1.2),1.);}`;

export default function RelativisticBH() {
  const cv = useRef<HTMLCanvasElement>(null);
  const S = useRef({ r0: 14, yaw: 0.4, pitch: 0.12, auto: true });
  const [r0, setR0] = useState(14); const [hud, setHud] = useState('');
  useEffect(() => {
    const canvas = cv.current!; let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas }); } catch { setHud('WebGL unavailable'); return; }
    const Q = [{ pr: 0.75, n: 240 }, { pr: 0.55, n: 170 }, { pr: 0.4, n: 120 }, { pr: 0.3, n: 80 }]; let lv = matchMedia('(max-width:800px)').matches ? 2 : 0;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    const U = { uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uR0: { value: 14 }, uYaw: { value: 0 }, uPitch: { value: 0 }, uSteps: { value: 240 } };
    const mat = new THREE.ShaderMaterial({ vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: FRAG, uniforms: U, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; const scene = new THREE.Scene(); scene.add(mesh); const cam = new THREE.Camera();
    const size = () => { const p = canvas.parentElement!; renderer.setPixelRatio(Math.min(devicePixelRatio, 2) * Q[lv].pr); renderer.setSize(p.clientWidth, p.clientHeight, false); renderer.getDrawingBufferSize(U.uRes.value); U.uSteps.value = Q[lv].n; };
    size(); addEventListener('resize', size);
    let drag = false, lx = 0, ly = 0;
    const down = (e: PointerEvent) => { drag = true; S.current.auto = false; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => { if (!drag) return; S.current.yaw -= (e.clientX - lx) * 0.006; S.current.pitch = Math.max(-1.4, Math.min(1.4, S.current.pitch + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY; };
    const up = () => (drag = false);
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
    const clock = new THREE.Clock(); let raf = 0, acc = 0, n = 0, f = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop); const dt = clock.getDelta(); U.uTime.value += dt;
      if (S.current.auto) S.current.yaw += dt * 0.12;
      U.uR0.value = S.current.r0; U.uYaw.value = S.current.yaw; U.uPitch.value = S.current.pitch; renderer.render(scene, cam);
      acc += dt; if (++n === 60) { if (acc / 60 > 0.034 && lv < 3) { lv++; size(); } acc = 0; n = 0; }
      if (++f % 20 === 0) setHud(`r₀ = ${S.current.r0.toFixed(1)} r_s · ${U.uSteps.value} geodesic steps/pixel · ${U.uRes.value.x}×${U.uRes.value.y}px · quality ${['ULTRA', 'HIGH', 'BALANCED', 'LOW'][lv]} · Schwarzschild (non-spinning)`);
    };
    const vis = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : !raf && loop()); document.addEventListener('visibilitychange', vis); loop();
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); document.removeEventListener('visibilitychange', vis); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); geo.dispose(); mat.dispose(); renderer.dispose(); };
  }, []);
  return (<div>
    <div style={{ height: '72vh', border: '1px solid var(--line)' }}><canvas ref={cv} role="img" aria-label="Real-time Schwarzschild black hole ray-traced per pixel; drag to orbit" style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'grab' }} /></div>
    <p className="mono" aria-live="polite">{hud}</p>
    <label className="mono">Camera distance: {r0} r_s <input type="range" min="3" max="40" step="0.5" value={r0} onChange={e => { const v = +e.target.value; S.current.r0 = v; setR0(v); }} style={{ width: '16rem' }} /></label>
  </div>);
}
