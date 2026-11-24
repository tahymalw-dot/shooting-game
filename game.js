// Legend Shooter v0.1 - Three.js r128 (global build, no bundler). See README.md
const $=id=>document.getElementById(id);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fb8cc);scene.fog=new THREE.Fog(0x9fb8cc,20,90);
const cam=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,200);
const ren=new THREE.WebGLRenderer({antialias:true});ren.setSize(innerWidth,innerHeight);ren.shadowMap.enabled=true;document.body.appendChild(ren.domElement);
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();ren.setSize(innerWidth,innerHeight)});
scene.add(new THREE.HemisphereLight(0xffffff,0x445566,.8));
const sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(30,50,20);sun.castShadow=true;sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;scene.add(sun);
// ---- World ----
const SIZE=60,boxes=[],solid=[];
const floor=new THREE.Mesh(new THREE.PlaneGeometry(SIZE*2,SIZE*2),new THREE.MeshStandardMaterial({color:0x6b6f73}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(SIZE*2,60,0x444444,0x555555);grid.position.y=.01;scene.add(grid);
function addBox(x,z,w,d,h,c){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:c||0x8a7a62}));m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);solid.push(m);boxes.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})}
addBox(0,-SIZE,SIZE*2,2,6,0x555d66);addBox(0,SIZE,SIZE*2,2,6,0x555d66);addBox(-SIZE,0,2,SIZE*2,6,0x555d66);addBox(SIZE,0,2,SIZE*2,6,0x555d66);
for(let i=0;i<26;i++){const a=(Math.random()*2-1)*(SIZE-8),b=(Math.random()*2-1)*(SIZE-8);if(Math.hypot(a,b)<8)continue;addBox(a,b,2+Math.random()*5,2+Math.random()*5,2+Math.random()*3)}
function push(p,r){for(const b of boxes){const cx=Math.max(b.x0,Math.min(p.x,b.x1)),cz=Math.max(b.z0,Math.min(p.z,b.z1));const dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<r){if(d>1e-4){p.x+=dx/d*(r-d);p.z+=dz/d*(r-d)}else p.x+=r}}}
// ---- Portals ----
const portals=[];function mkPortal(x,z,c){const m=new THREE.Mesh(new THREE.TorusGeometry(1.4,.15,12,32),new THREE.MeshBasicMaterial({color:c}));m.position.set(x,1.6,z);scene.add(m);const d=new THREE.Mesh(new THREE.CircleGeometry(1.3,24),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.35,side:2}));m.add(d);portals.push(m)}
mkPortal(-45,-45,0x2fd0ff);mkPortal(45,45,0xff7a1a);let portalCD=0;
// ---- Player / Gun ----
const P={pos:new THREE.Vector3(0,1.7,0),vy:0,hp:100,mag:30,res:120,reload:0,cool:0,ground:true,yaw:0,pitch:0};
const gun=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,.6),new THREE.MeshStandardMaterial({color:0x222222}));gun.position.set(.28,-.25,-.55);cam.add(gun);
const flash=new THREE.PointLight(0xffaa44,0,8);flash.position.set(.28,-.2,-1);cam.add(flash);scene.add(cam);
// ---- Audio ----
let AC;function beep(f,t,v){try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.type='sawtooth';o.frequency.value=f;g.gain.value=v||.1;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+t);o.stop(AC.currentTime+t)}catch(e){}}
// ---- Enemies ----
const enemies=[],ray=new THREE.Raycaster();let wave=0,score=0;
function spawn(){const e=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.8,1.2,.5),new THREE.MeshStandardMaterial({color:0xaa2222}));body.position.y=.9;const head=new THREE.Mesh(new THREE.SphereGeometry(.25,12,12),new THREE.MeshStandardMaterial({color:0xe0b090}));head.position.y=1.75;
body.userData.e=head.userData.e=e;head.userData.head=true;e.add(body,head);e.hp=60+wave*8;e.cd=1+Math.random();e.parts=[body,head];
let x,z;do{x=(Math.random()*2-1)*(SIZE-4);z=(Math.random()*2-1)*(SIZE-4)}while(Math.hypot(x-P.pos.x,z-P.pos.z)<25);e.position.set(x,0,z);scene.add(e);enemies.push(e)}
function los(a,b){const d=b.clone().sub(a),L=d.length();ray.set(a,d.normalize());ray.far=L;return ray.intersectObjects(solid).length===0}
// ---- Input ----
const keys={};let running=false;
addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='KeyR')startReload()});addEventListener('keyup',e=>keys[e.code]=0);
addEventListener('mousemove',e=>{if(!running)return;P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.5,Math.min(1.5,P.pitch-e.movementY*.0022))});
let firing=false;addEventListener('mousedown',e=>{if(running&&e.button===0)firing=true});addEventListener('mouseup',()=>firing=false);
$('play').onclick=()=>{if(P.hp<=0)reset();ren.domElement.requestPointerLock()};
document.addEventListener('pointerlockchange',()=>{running=document.pointerLockElement===ren.domElement;$('menu').style.display=running?'none':'flex';$('hud').style.display=running?'block':'none'});
function reset(){P.hp=100;P.mag=30;P.res=120;P.pos.set(0,1.7,0);enemies.forEach(e=>scene.remove(e));enemies.length=0;wave=0;score=0;$('over').textContent=''}
function startReload(){if(P.reload<=0&&P.mag<30&&P.res>0)P.reload=1.4}
function shoot(){if(P.cool>0||P.reload>0)return;if(P.mag<=0){startReload();return}
P.mag--;P.cool=.1;beep(120,.12,.15);flash.intensity=3;gun.position.z=-.48;
ray.set(cam.position.clone(),cam.getWorldDirection(new THREE.Vector3()));ray.far=200;
const t=[];enemies.forEach(e=>t.push(...e.parts));const h=ray.intersectObjects(t.concat(solid))[0];
if(h&&h.object.userData.e){const e=h.object.userData.e;e.hp-=h.object.userData.head?100:34;$('hit').style.opacity=1;setTimeout(()=>$('hit').style.opacity=0,100);
if(e.hp<=0){scene.remove(e);enemies.splice(enemies.indexOf(e),1);score+=h.object.userData.head?150:100;beep(300,.2,.1)}}}
function hurt(n){P.hp-=n;$('dmg').style.opacity=1;setTimeout(()=>$('dmg').style.opacity=0,250);beep(80,.2,.2);
if(P.hp<=0){P.hp=0;$('over').textContent='انتهت اللعبة! النقاط: '+score+' · الموجة: '+wave;document.exitPointerLock()}}
// ---- Loop ----
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);
if(running){
const sp=(keys.ShiftLeft?10:6.5),f=(keys.KeyW?1:0)-(keys.KeyS?1:0),r=(keys.KeyD?1:0)-(keys.KeyA?1:0);
const s=Math.sin(P.yaw),c=Math.cos(P.yaw);let mx=-s*f+c*r,mz=-c*f-s*r;const l=Math.hypot(mx,mz)||1;
P.pos.x+=mx/l*sp*dt*(f||r?1:0);P.pos.z+=mz/l*sp*dt*(f||r?1:0);push(P.pos,.5);
P.pos.x=Math.max(-SIZE+1,Math.min(SIZE-1,P.pos.x));P.pos.z=Math.max(-SIZE+1,Math.min(SIZE-1,P.pos.z));
if(keys.Space&&P.ground){P.vy=7;P.ground=false}P.vy-=20*dt;P.pos.y+=P.vy*dt;if(P.pos.y<=1.7){P.pos.y=1.7;P.vy=0;P.ground=true}
cam.position.copy(P.pos);cam.rotation.set(P.pitch,P.yaw,0,'YXZ');
P.cool-=dt;flash.intensity*=.6;gun.position.z+=(-.55-gun.position.z)*.3;
if(P.reload>0){P.reload-=dt;if(P.reload<=0){const n=Math.min(30-P.mag,P.res);P.mag+=n;P.res-=n}}
if(firing)shoot();
portalCD-=dt;portals.forEach((p,i)=>{p.rotation.z+=dt*2;if(portalCD<=0&&Math.hypot(p.position.x-P.pos.x,p.position.z-P.pos.z)<1.5){const o=portals[1-i];P.pos.x=o.position.x+(o.position.x>0?-3:3);P.pos.z=o.position.z+(o.position.z>0?-3:3);portalCD=2;beep(600,.3,.1)}});
if(!enemies.length){wave++;for(let i=0;i<2+wave*2;i++)spawn();P.res+=30}
enemies.forEach(e=>{const d=new THREE.Vector3(P.pos.x-e.position.x,0,P.pos.z-e.position.z),L=d.length();e.rotation.y=Math.atan2(d.x,d.z);
if(L>9){d.normalize();e.position.addScaledVector(d,(2.2+wave*.1)*dt);push(e.position,.5)}
e.cd-=dt;if(e.cd<=0&&L<35&&los(e.position.clone().setY(1.5),P.pos)){e.cd=1.1+Math.random();beep(200,.1,.05);if(Math.random()<Math.max(.15,.6-L/60))hurt(8)}});
$('hp').textContent='❤ '+Math.ceil(P.hp);$('am').textContent=(P.reload>0?'RELOAD':P.mag)+' / '+P.res;$('sc').textContent='موجة '+wave+' · نقاط '+score+' · أعداء '+enemies.length}
ren.render(scene,cam)}
loop();
