// js/mobile.js — تحكم جوال احترافي (عصا حركة + تصويب باللمس + أزرار تكتيكية)
export class MobileControls {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.root = document.getElementById('mobile-controls');
    this.moveZone = document.getElementById('joy-move-zone');
    this.moveKnob = document.getElementById('joy-move-knob');
    this.aimZone = document.getElementById('touch-aim-zone');

    this.moveVec = { x: 0, y: 0 };
    this.moveTouchId = null;
    this.aimTouchId = null;
    this.lastAimX = 0;
    this.lastAimY = 0;

    this.isMobileDevice =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    this.forceMode = 'auto';

    this.bindEvents();
    this.refreshVisibility(false);
  }

  cycleMode() {
    if (this.forceMode === 'auto') this.forceMode = 'on';
    else if (this.forceMode === 'on') this.forceMode = 'off';
    else this.forceMode = 'auto';
    return this.forceMode;
  }

  shouldShow() {
    if (this.forceMode === 'on') return true;
    if (this.forceMode === 'off') return false;
    return Boolean(this.isMobileDevice);
  }

  refreshVisibility(isPlaying) {
    this.root.style.display = isPlaying && this.shouldShow() ? 'block' : 'none';
  }

  bindEvents() {
    this.moveZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.moveTouchId = t.identifier;
      this.updateJoystick(t.clientX, t.clientY);
    }, { passive: false });

    this.moveZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.moveTouchId) {
          this.updateJoystick(t.clientX, t.clientY);
        }
      }
    }, { passive: false });

    const endMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.moveTouchId) {
          this.moveTouchId = null;
          this.moveVec.x = 0;
          this.moveVec.y = 0;
          this.moveKnob.style.transform = 'translate(0px, 0px)';
        }
      }
    };
    this.moveZone.addEventListener('touchend', endMove);
    this.moveZone.addEventListener('touchcancel', endMove);

    this.aimZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      this.aimTouchId = t.identifier;
      this.lastAimX = t.clientX;
      this.lastAimY = t.clientY;
    }, { passive: false });

    this.aimZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this.aimTouchId) {
          const dx = t.clientX - this.lastAimX;
          const dy = t.clientY - this.lastAimY;
          this.lastAimX = t.clientX;
          this.lastAimY = t.clientY;
          if (this.callbacks.onLook) {
            this.callbacks.onLook(dx * 2.1, dy * 2.1);
          }
        }
      }
    }, { passive: false });

    const endAim = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this.aimTouchId) {
          this.aimTouchId = null;
        }
      }
    };
    this.aimZone.addEventListener('touchend', endAim);
    this.aimZone.addEventListener('touchcancel', endAim);

    const fireBtn = document.getElementById('m-fire');
    fireBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      fireBtn.classList.add('active');
      if (this.callbacks.onFireChange) this.callbacks.onFireChange(true);
    }, { passive: false });
    const stopFire = (e) => {
      e.preventDefault();
      fireBtn.classList.remove('active');
      if (this.callbacks.onFireChange) this.callbacks.onFireChange(false);
    };
    fireBtn.addEventListener('touchend', stopFire, { passive: false });
    fireBtn.addEventListener('touchcancel', stopFire, { passive: false });

    document.getElementById('m-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onJump) this.callbacks.onJump();
    }, { passive: false });

    document.getElementById('m-reload').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onReload) this.callbacks.onReload();
    }, { passive: false });

    document.getElementById('m-switch').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.callbacks.onSwitchWeapon) this.callbacks.onSwitchWeapon();
    }, { passive: false });
  }

  updateJoystick(clientX, clientY) {
    const rect = this.moveZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    this.moveKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.moveVec.x = dx / maxR;
    this.moveVec.y = dy / maxR;
  }
}
