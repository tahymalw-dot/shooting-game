// js/enemies.js — ذكاء اصطناعي متقدم A* Pathfinding + تغطية خلف الصناديق + شريط صحة
import { WORLD_SIZE } from './world.js';
import { playSound } from './weapons.js';

export class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
    this.ray = new THREE.Raycaster();
  }

  clear() {
    this.enemies.forEach((e) => this.scene.remove(e));
    this.enemies.length = 0;
  }

  spawnEnemy(wave) {
    const roll = Math.random();
    let type = 'soldier';
    if (wave >= 2 && roll > 0.72) type = 'rusher';
    else if (wave >= 3 && roll < 0.25) type = 'tank';

    const e = new THREE.Group();
    const scale = type === 'tank' ? 1.25 : type === 'rusher' ? 0.94 : 1.0;
    const vestColor = type === 'tank' ? 0x1e3a8a : type === 'rusher' ? 0x9a3412 : 0x7f1d1d;
    const clothColor = type === 'tank' ? 0x172554 : 0x3f2e21;

    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.74 * scale, 1.02 * scale, 0.42 * scale),
      new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.6 })
    );
    torso.position.y = 1.02 * scale;
    torso.castShadow = true;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24 * scale, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xe2b494 })
    );
    head.position.y = 1.76 * scale;
    head.castShadow = true;

    // خوذة تكتيكية
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.255 * scale, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    helmet.position.y = 1.79 * scale;

    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.2 * scale),
      new THREE.MeshStandardMaterial({ color: clothColor })
    );
    leftArm.position.set(-0.48 * scale, 1.02 * scale, 0);

    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.2 * scale),
      new THREE.MeshStandardMaterial({ color: clothColor })
    );
    rightArm.position.set(0.48 * scale, 1.02 * scale, 0.12 * scale);
    rightArm.rotation.x = -0.6;

    // سلاح العدو
    const enemyGun = new THREE.Mesh(
      new THREE.BoxGeometry(0.08 * scale, 0.1 * scale, 0.48 * scale),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    enemyGun.position.set(0.45 * scale, 1.15 * scale, 0.35 * scale);

    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 * scale, 0.72 * scale, 0.25 * scale),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    leftLeg.position.set(-0.21 * scale, 0.36 * scale, 0);

    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25 * scale, 0.72 * scale, 0.25 * scale),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    rightLeg.position.set(0.21 * scale, 0.36 * scale, 0);

    // شريط صحة فوق رأس العدو
    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide })
    );
    hpBg.position.y = 2.25 * scale;

    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.86, 0.07),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    hpFill.position.set(0, 2.25 * scale, 0.01);

    const hitParts = [torso, head, helmet, leftArm, rightArm, leftLeg, rightLeg];
    hitParts.forEach((p) => {
      p.userData.enemy = e;
      if (p === head || p === helmet) p.userData.isHead = true;
      e.add(p);
    });
    e.add(enemyGun, hpBg, hpFill);

    const maxHp = type === 'tank' ? 160 + wave * 16 : type === 'rusher' ? 55 + wave * 6 : 80 + wave * 9;
    e.type = type;
    e.hp = maxHp;
    e.maxHp = maxHp;
    e.hpFill = hpFill;
    e.hpBg = hpBg;
    e.speed = type === 'rusher' ? 4.6 + wave * 0.14 : type === 'tank' ? 1.85 + wave * 0.06 : 2.65 + wave * 0.1;
    e.dmg = type === 'tank' ? 15 : type === 'rusher' ? 11 : 9;
    e.cd = 0.8 + Math.random();
    e.path = [];
    e.pathTimer = Math.random() * 0.4;
    e.walkPhase = Math.random() * Math.PI * 2;
    e.limbs = { leftArm, rightArm, leftLeg, rightLeg };
    e.parts = hitParts;

    // نقاط ظهور تكتيكية في زوايا وممرات الخريطة بعيداً عن اللاعب
    const spawns = [
      [-48, -36], [48, -36], [-48, 36], [48, 36],
      [0, -48], [0, 48], [-46, 0], [46, 0]
    ];
    const [sx, sz] = spawns[Math.floor(Math.random() * spawns.length)];
    e.position.set(sx + (Math.random() - 0.5) * 4, 0, sz + (Math.random() - 0.5) * 4);

    this.scene.add(e);
    this.enemies.push(e);
  }

  hasLineOfSight(a, b, solid) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    this.ray.set(a, dir.normalize());
    this.ray.far = len;
    return this.ray.intersectObjects(solid).length === 0;
  }

  update(dt, playerPos, world, onPlayerHurt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = playerPos.x - e.position.x;
      const dz = playerPos.z - e.position.z;
      const dist = Math.hypot(dx, dz);

      // تحديث شريط الصحة فوق العدو ليكون مواجهاً للاعب
      const ratio = Math.max(0, e.hp / e.maxHp);
      e.hpFill.scale.x = Math.max(0.001, ratio);
      e.hpFill.position.x = -(1 - ratio) * 0.43;
      e.hpBg.lookAt(playerPos.x, e.hpBg.getWorldPosition(new THREE.Vector3()).y, playerPos.z);
      e.hpFill.lookAt(playerPos.x, e.hpFill.getWorldPosition(new THREE.Vector3()).y, playerPos.z);

      e.rotation.y = Math.atan2(dx, dz);

      // حساب مسار A* دورياً لتفادي الجدران والصناديق
      e.pathTimer -= dt;
      if (e.pathTimer <= 0) {
        e.pathTimer = 0.65 + Math.random() * 0.3;
        e.path = world.findPath(e.position, playerPos);
      }

      const stopDist = e.type === 'rusher' ? 2.4 : 9.5;
      let moving = false;

      if (dist > stopDist) {
        moving = true;
        let target = playerPos;
        if (e.path && e.path.length > 0) {
          target = e.path[0];
          if (Math.hypot(target.x - e.position.x, target.z - e.position.z) < 1.2 && e.path.length > 1) {
            e.path.shift();
            target = e.path[0];
          }
        }

        const tx = target.x - e.position.x;
        const tz = target.z - e.position.z;
        const tl = Math.hypot(tx, tz) || 1;
        e.position.x += (tx / tl) * e.speed * dt;
        e.position.z += (tz / tl) * e.speed * dt;
      }

      // تباعد بين الأعداء (Separation) لمنع تداخلهم
      for (let j = 0; j < this.enemies.length; j++) {
        if (i === j) continue;
        const other = this.enemies[j];
        const sx = e.position.x - other.position.x;
        const sz = e.position.z - other.position.z;
        const sd = Math.hypot(sx, sz);
        if (sd > 0.001 && sd < 1.3) {
          e.position.x += (sx / sd) * 2.2 * dt;
          e.position.z += (sz / sd) * 2.2 * dt;
        }
      }

      world.pushOut(e.position, 0.58);

      // أنيميشن المشي
      if (moving) {
        e.walkPhase += dt * (e.type === 'rusher' ? 13 : 8.5);
        const swing = Math.sin(e.walkPhase) * 0.58;
        e.limbs.leftLeg.rotation.x = swing;
        e.limbs.rightLeg.rotation.x = -swing;
        e.limbs.leftArm.rotation.x = -swing * 0.6;
      } else {
        e.limbs.leftLeg.rotation.x = 0;
        e.limbs.rightLeg.rotation.x = 0;
        e.limbs.leftArm.rotation.x = 0;
      }

      // إطلاق النار عند توفر خط رؤية
      e.cd -= dt;
      if (e.cd <= 0 && dist < 42 && this.hasLineOfSight(e.position.clone().setY(1.55), playerPos, world.solid)) {
        e.cd = e.type === 'rusher' ? 0.8 + Math.random() * 0.35 : 1.15 + Math.random() * 0.55;
        playSound('shoot');
        const hitChance = Math.max(0.2, 0.64 - dist / 68);
        if (Math.random() < hitChance && onPlayerHurt) {
          onPlayerHurt(e.dmg);
        }
      }
    }
  }
}
