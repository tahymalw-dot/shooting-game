// js/weapons.js — ترسانة أسلحة CS2 + نماذج 3D مركبة + مؤثرات الرصاص والصوت
export const WEAPONS = [
  {
    id: 'glock',
    name: 'Glock-18 (1)',
    cool: 0.2,
    reloadTime: 1.0,
    magSize: 20,
    damage: 32,
    headMult: 2.5,
    pellets: 1,
    spread: 0.014,
    recoil: 0.015,
    unlocked: true,
    bodyColor: 0x334155,
    barrelLen: 0.32
  },
  {
    id: 'mp9',
    name: 'MP9 SMG (2)',
    cool: 0.085,
    reloadTime: 1.3,
    magSize: 30,
    damage: 25,
    headMult: 2.1,
    pellets: 1,
    spread: 0.028,
    recoil: 0.018,
    unlocked: true,
    bodyColor: 0x1e293b,
    barrelLen: 0.48
  },
  {
    id: 'ak47',
    name: 'AK-47 Rifle (3)',
    cool: 0.11,
    reloadTime: 1.55,
    magSize: 30,
    damage: 42,
    headMult: 2.6,
    pellets: 1,
    spread: 0.02,
    recoil: 0.032,
    unlocked: false,
    bodyColor: 0x78350f,
    barrelLen: 0.68
  },
  {
    id: 'nova',
    name: 'Nova Shotgun (4)',
    cool: 0.65,
    reloadTime: 1.75,
    magSize: 8,
    damage: 21,
    headMult: 1.8,
    pellets: 8,
    spread: 0.085,
    recoil: 0.055,
    unlocked: false,
    bodyColor: 0x475569,
    barrelLen: 0.66
  },
  {
    id: 'awp',
    name: 'AWP Sniper (5)',
    cool: 1.05,
    reloadTime: 2.0,
    magSize: 5,
    damage: 145,
    headMult: 3.0,
    pellets: 1,
    spread: 0.001,
    recoil: 0.075,
    unlocked: false,
    bodyColor: 0x14532d,
    barrelLen: 0.92
  }
];

let audioCtx = null;
export function playSound(type) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    if (type === 'awp') {
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(32, now + 0.28);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.28);
    } else if (type === 'headshot') {
      o.type = 'sine';
      o.frequency.setValueAtTime(980, now);
      o.frequency.exponentialRampToValueAtTime(1450, now + 0.12);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.14);
    } else if (type === 'reload') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(320, now);
      o.frequency.setValueAtTime(480, now + 0.08);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.16);
    } else if (type === 'buy') {
      o.type = 'sine';
      o.frequency.setValueAtTime(520, now);
      o.frequency.setValueAtTime(780, now + 0.07);
      g.gain.setValueAtTime(0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.16);
    } else if (type === 'hurt') {
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(95, now);
      o.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.18);
    } else {
      o.type = 'square';
      o.frequency.setValueAtTime(175, now);
      o.frequency.exponentialRampToValueAtTime(48, now + 0.11);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(now); o.stop(now + 0.11);
    }
  } catch (e) {}
}

export class WeaponSystem {
  constructor(cam, scene) {
    this.cam = cam;
    this.scene = scene;
    this.currentIdx = 1; // MP9
    this.scoped = false;
    this.particles = [];
    this.decals = [];

    this.ammoState = WEAPONS.map((w) => ({
      mag: w.magSize,
      res: w.magSize * 4,
      reload: 0,
      cool: 0
    }));

    // نموذج السلاح المركب 3D
    this.gunGroup = new THREE.Group();
    this.gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.12, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 })
    );
    this.gunBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.25 })
    );
    this.gunBarrel.rotation.x = Math.PI / 2;
    this.gunBarrel.position.set(0, 0.03, -0.32);

    this.gunMag = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.18, 0.09),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    this.gunMag.position.set(0, -0.11, -0.04);
    this.gunMag.rotation.x = 0.2;

    this.gunGroup.add(this.gunBody, this.gunBarrel, this.gunMag);
    this.gunGroup.position.set(0.26, -0.24, -0.52);
    cam.add(this.gunGroup);

    this.flash = new THREE.PointLight(0xfbbf24, 0, 9);
    this.flash.position.set(0.26, -0.18, -1.05);
    cam.add(this.flash);

    this.ray = new THREE.Raycaster();
    this.syncModel();
  }

  get current() {
    return WEAPONS[this.currentIdx];
  }

  get state() {
    return this.ammoState[this.currentIdx];
  }

  syncModel() {
    const w = this.current;
    this.gunBody.material.color.setHex(w.bodyColor);
    this.gunBarrel.scale.y = w.barrelLen / 0.4;
    this.gunBarrel.position.z = -0.18 - w.barrelLen * 0.45;
    if (w.id !== 'awp' && this.scoped) {
      this.setScope(false);
    }
  }

  setScope(enabled) {
    if (enabled && this.current.id !== 'awp') return;
    this.scoped = enabled;
    this.cam.fov = enabled ? 32 : 75;
    this.cam.updateProjectionMatrix();
    this.gunGroup.visible = !enabled;
    const overlay = document.getElementById('scope-overlay');
    if (overlay) overlay.style.display = enabled ? 'block' : 'none';
  }

  toggleScope() {
    if (this.current.id === 'awp') {
      this.setScope(!this.scoped);
    }
  }

  unlockWeapon(id) {
    const idx = WEAPONS.findIndex((w) => w.id === id);
    if (idx >= 0) {
      WEAPONS[idx].unlocked = true;
      this.ammoState[idx].mag = WEAPONS[idx].magSize;
      this.ammoState[idx].res = WEAPONS[idx].magSize * 4;
      this.selectWeapon(idx);
    }
  }

  selectWeapon(idx) {
    if (idx < 0 || idx >= WEAPONS.length || !WEAPONS[idx].unlocked) return;
    this.setScope(false);
    this.currentIdx = idx;
    this.syncModel();
  }

  cycleWeapon() {
    for (let s = 1; s <= WEAPONS.length; s++) {
      const next = (this.currentIdx + s) % WEAPONS.length;
      if (WEAPONS[next].unlocked) {
        this.selectWeapon(next);
        return;
      }
    }
  }

  refillAll() {
    WEAPONS.forEach((w, i) => {
      if (w.unlocked) {
        this.ammoState[i].mag = w.magSize;
        this.ammoState[i].res = w.magSize * 5;
        this.ammoState[i].reload = 0;
      }
    });
  }

  startReload() {
    const w = this.current;
    const s = this.state;
    if (s.reload <= 0 && s.mag < w.magSize && s.res > 0) {
      this.setScope(false);
      s.reload = w.reloadTime;
      playSound('reload');
    }
  }

  spawnImpact(point, normal, isBlood) {
    // جزيئات شرر أو دم
    const count = isBlood ? 7 : 5;
    const color = isBlood ? 0xdc2626 : 0xfbbf24;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshBasicMaterial({ color })
      );
      p.position.copy(point);
      p.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 3.5,
        (Math.random() - 0.5) * 4
      );
      p.userData.life = 0.35;
      this.scene.add(p);
      this.particles.push(p);
    }

    // ثقب رصاصة على الجدار
    if (!isBlood && normal) {
      const decal = new THREE.Mesh(
        new THREE.CircleGeometry(0.07, 8),
        new THREE.MeshBasicMaterial({ color: 0x111827 })
      );
      decal.position.copy(point).addScaledVector(normal, 0.015);
      decal.lookAt(point.clone().add(normal));
      this.scene.add(decal);
      this.decals.push(decal);
      if (this.decals.length > 45) {
        const old = this.decals.shift();
        this.scene.remove(old);
      }
    }
  }

  update(dt, firing, player, onShoot) {
    this.flash.intensity *= 0.58;
    this.gunGroup.position.z += (-0.52 - this.gunGroup.position.z) * 0.28;
    this.gunGroup.rotation.x += (0 - this.gunGroup.rotation.x) * 0.25;

    // تحديث الجزيئات
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= dt;
      p.userData.vel.y -= 9.8 * dt;
      p.position.addScaledVector(p.userData.vel, dt);
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      }
    }

    this.ammoState.forEach((s, idx) => {
      if (s.cool > 0) s.cool -= dt;
      if (s.reload > 0) {
        s.reload -= dt;
        if (s.reload <= 0) {
          const cap = WEAPONS[idx].magSize;
          const take = Math.min(cap - s.mag, s.res);
          s.mag += take;
          s.res -= take;
        }
      }
    });

    if (firing) {
      const w = this.current;
      const s = this.state;
      if (s.cool <= 0 && s.reload <= 0) {
        if (s.mag <= 0) {
          this.startReload();
          return;
        }
        s.mag--;
        s.cool = w.cool;
        this.flash.intensity = 3.5;
        this.gunGroup.position.z = -0.43;
        this.gunGroup.rotation.x = 0.14;
        player.pitch = Math.min(1.45, player.pitch + w.recoil);
        playSound(w.id === 'awp' ? 'awp' : 'shoot');

        if (onShoot) onShoot(w, this.ray);
      }
    }
  }
}
