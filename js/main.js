// js/main.js — الحلقة الرئيسية للعبة Legend Shooter CS2 Edition
import { createWorld } from './world.js';
import { WeaponSystem, playSound } from './weapons.js';
import { EnemyManager } from './enemies.js';
import { PlayerController } from './player.js';
import { MobileControls } from './mobile.js';
import { UIManager } from './ui.js';

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 240);
const ren = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
ren.setSize(innerWidth, innerHeight);
ren.shadowMap.enabled = true;
document.body.appendChild(ren.domElement);

addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ren.setSize(innerWidth, innerHeight);
});

const world = createWorld(scene);
const player = new PlayerController(cam);
const weapons = new WeaponSystem(cam, scene);
const enemyMgr = new EnemyManager(scene);
const ui = new UIManager();

let playing = false;
let shopOpen = false;
let wave = 0;
let score = 0;
let money = 800;
let firing = false;
let mobileJumpQueued = false;
const keys = {};

const mobile = new MobileControls({
  onLook: (dx, dy) => {
    if (playing && !shopOpen) {
      const sens = weapons.scoped ? 0.0012 : 0.0031;
      player.addLook(dx, dy, sens);
    }
  },
  onFireChange: (active) => {
    if (playing && !shopOpen) firing = active;
  },
  onJump: () => {
    if (playing && !shopOpen) mobileJumpQueued = true;
  },
  onReload: () => {
    if (playing && !shopOpen) weapons.startReload();
  },
  onSwitchWeapon: () => {
    if (playing && !shopOpen) weapons.cycleWeapon();
  }
});

function startSession() {
  if (player.hp <= 0) {
    resetGame();
  }
  playing = true;
  shopOpen = false;
  ui.setPlaying(true);
  mobile.refreshVisibility(true);

  if (!mobile.shouldShow() && ren.domElement.requestPointerLock) {
    try { ren.domElement.requestPointerLock(); } catch (e) {}
  }
}

function exitToMenu() {
  playing = false;
  firing = false;
  weapons.setScope(false);
  ui.setPlaying(false);
  mobile.refreshVisibility(false);
  if (document.pointerLockElement && document.exitPointerLock) {
    try { document.exitPointerLock(); } catch (e) {}
  }
}

function resetGame() {
  player.reset();
  enemyMgr.clear();
  wave = 0;
  score = 0;
  money = 800;
  weapons.refillAll();
  ui.clearGameOver();
}

function handlePlayerHurt(amount) {
  if (!playing || shopOpen) return;
  player.takeDamage(amount);
  ui.showDamage();
  playSound('hurt');
  if (player.hp <= 0) {
    firing = false;
    ui.setGameOver(score, wave);
    exitToMenu();
  }
}

function handleShoot(w, ray) {
  const dir = cam.getWorldDirection(new THREE.Vector3());
  const enemyParts = [];
  enemyMgr.enemies.forEach((e) => enemyParts.push(...e.parts));

  for (let p = 0; p < w.pellets; p++) {
    const shotDir = dir.clone();
    const spread = weapons.scoped ? w.spread * 0.15 : w.spread;
    if (spread > 0) {
      shotDir.x += (Math.random() - 0.5) * spread;
      shotDir.y += (Math.random() - 0.5) * spread;
      shotDir.z += (Math.random() - 0.5) * spread;
      shotDir.normalize();
    }

    ray.set(cam.position.clone(), shotDir);
    ray.far = 230;
    const hit = ray.intersectObjects(enemyParts.concat(world.solid))[0];
    if (!hit) continue;

    if (hit.object.userData.enemy) {
      const e = hit.object.userData.enemy;
      const isHead = Boolean(hit.object.userData.isHead);
      const mult = isHead ? w.headMult : 1.0;
      e.hp -= w.damage * mult;
      ui.showHit();
      weapons.spawnImpact(hit.point, hit.face ? hit.face.normal : null, true);

      if (e.hp <= 0) {
        scene.remove(e);
        const idx = enemyMgr.enemies.indexOf(e);
        if (idx >= 0) enemyMgr.enemies.splice(idx, 1);
        const reward = isHead ? 350 : 250;
        money += reward;
        score += isHead ? 150 : 100;
        ui.addKillFeed(w.name.split(' ')[0], e.type, isHead);
        if (isHead) playSound('headshot');
      }
    } else {
      weapons.spawnImpact(hit.point, hit.face ? hit.face.normal : null, false);
    }
  }
}

// اختصارات الكيبورد والماوس
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (!playing) return;
  if (e.code === 'KeyR') weapons.startReload();
  if (e.code === 'KeyB') openShop();
  if (e.code === 'Digit1') weapons.selectWeapon(0);
  if (e.code === 'Digit2') weapons.selectWeapon(1);
  if (e.code === 'Digit3') weapons.selectWeapon(2);
  if (e.code === 'Digit4') weapons.selectWeapon(3);
  if (e.code === 'Digit5') weapons.selectWeapon(4);
  if (e.code === 'Escape') exitToMenu();
});

addEventListener('keyup', (e) => { keys[e.code] = false; });

addEventListener('mousemove', (e) => {
  if (!playing || shopOpen || mobile.shouldShow()) return;
  if (document.pointerLockElement === ren.domElement) {
    const sens = weapons.scoped ? 0.001 : 0.0022;
    player.addLook(e.movementX, e.movementY, sens);
  }
});

addEventListener('mousedown', (e) => {
  if (!playing || shopOpen || mobile.shouldShow()) return;
  if (e.button === 0 && e.target === ren.domElement) firing = true;
  if (e.button === 2) weapons.toggleScope();
});

addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('mouseup', () => { if (!mobile.shouldShow()) firing = false; });
addEventListener('wheel', () => { if (playing && !shopOpen) weapons.cycleWeapon(); });

document.addEventListener('pointerlockchange', () => {
  if (mobile.shouldShow()) return;
  const locked = document.pointerLockElement === ren.domElement;
  if (!locked && playing && !shopOpen) exitToMenu();
});

function openShop() {
  shopOpen = true;
  firing = false;
  weapons.setScope(false);
  if (document.pointerLockElement && document.exitPointerLock) {
    try { document.exitPointerLock(); } catch (e) {}
  }
  ui.setShopOpen(true, money);
}

// أزرار الواجهة والمتجر
document.getElementById('play').onclick = startSession;
document.getElementById('toggle-mobile-mode').onclick = (e) => {
  const mode = mobile.cycleMode();
  const label = mode === 'auto' ? 'تلقائي' : mode === 'on' ? 'مفعّل دائماً' : 'معطّل';
  e.target.textContent = 'تحكم الجوال: ' + label;
  mobile.refreshVisibility(playing);
};

document.getElementById('btn-menu').onclick = exitToMenu;
document.getElementById('btn-scope').onclick = () => weapons.toggleScope();
document.getElementById('btn-mobile-hud').onclick = () => {
  mobile.cycleMode();
  mobile.refreshVisibility(playing);
};

document.getElementById('btn-shop-open').onclick = openShop;
document.getElementById('close-shop').onclick = () => {
  shopOpen = false;
  ui.setShopOpen(false, money);
  if (!mobile.shouldShow() && ren.domElement.requestPointerLock) {
    try { ren.domElement.requestPointerLock(); } catch (e) {}
  }
};

document.getElementById('buy-ak').onclick = () => {
  if (money >= 1400) {
    money -= 1400;
    weapons.unlockWeapon('ak47');
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};
document.getElementById('buy-shotgun').onclick = () => {
  if (money >= 1100) {
    money -= 1100;
    weapons.unlockWeapon('nova');
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};
document.getElementById('buy-awp').onclick = () => {
  if (money >= 2200) {
    money -= 2200;
    weapons.unlockWeapon('awp');
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};
document.getElementById('buy-armor').onclick = () => {
  if (money >= 650 && player.armor < 100) {
    money -= 650;
    player.armor = 100;
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};
document.getElementById('buy-heal').onclick = () => {
  if (money >= 400 && player.hp < 100) {
    money -= 400;
    player.hp = Math.min(100, player.hp + 50);
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};
document.getElementById('buy-ammo').onclick = () => {
  if (money >= 300) {
    money -= 300;
    weapons.refillAll();
    ui.setShopOpen(true, money);
    playSound('buy');
  }
};

const clock = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (playing && !shopOpen) {
    const keyForward = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    const keyRight = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);

    const forward = Math.abs(mobile.moveVec.y) > 0.05 ? -mobile.moveVec.y : keyForward;
    const right = Math.abs(mobile.moveVec.x) > 0.05 ? mobile.moveVec.x : keyRight;
    const sprint = Boolean(keys.ShiftLeft) || Math.hypot(mobile.moveVec.x, mobile.moveVec.y) > 0.85;
    const jump = Boolean(keys.Space) || mobileJumpQueued;
    mobileJumpQueued = false;

    player.update(dt, { forward, right, sprint, jump }, world.portals, world.pushOut);
    weapons.update(dt, firing, player, handleShoot);

    if (enemyMgr.enemies.length === 0) {
      wave++;
      if (wave > 1) {
        money += 500;
        ui.saveRecords(wave, score);
      }
      const count = 3 + wave * 2;
      for (let i = 0; i < count; i++) {
        enemyMgr.spawnEnemy(wave);
      }
    }

    enemyMgr.update(dt, player.pos, world, handlePlayerHurt);

    const wState = weapons.state;
    ui.updateHud(
      player.hp,
      player.armor,
      weapons.current.name,
      wState.mag,
      wState.res,
      wState.reload > 0,
      wave,
      money,
      enemyMgr.enemies.length
    );
  }

  ren.render(scene, cam);
}

loop();
