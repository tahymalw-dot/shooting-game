// js/ui.js — واجهة CS2، سجل القتل Killfeed، الحفظ في localStorage، وقائمة الشراء
export class UIManager {
  constructor() {
    this.menuEl = document.getElementById('menu');
    this.hudEl = document.getElementById('hud');
    this.shopEl = document.getElementById('shop');
    this.hpEl = document.getElementById('hp');
    this.armorEl = document.getElementById('armor');
    this.amEl = document.getElementById('am');
    this.scTextEl = document.getElementById('sc-text');
    this.moneyTextEl = document.getElementById('money-text');
    this.wepNameEl = document.getElementById('wep-name');
    this.dmgEl = document.getElementById('dmg');
    this.hitEl = document.getElementById('hit');
    this.overEl = document.getElementById('over');
    this.shopPtsEl = document.getElementById('shop-pts');
    this.killfeedEl = document.getElementById('killfeed');
    this.bestWaveEl = document.getElementById('best-wave');
    this.bestScoreEl = document.getElementById('best-score');

    this.loadRecords();
  }

  loadRecords() {
    try {
      const bw = localStorage.getItem('ls_best_wave') || '0';
      const bs = localStorage.getItem('ls_best_score') || '0';
      this.bestWaveEl.textContent = bw;
      this.bestScoreEl.textContent = bs;
    } catch (e) {}
  }

  saveRecords(wave, score) {
    try {
      const bw = Math.max(wave, Number(localStorage.getItem('ls_best_wave') || 0));
      const bs = Math.max(score, Number(localStorage.getItem('ls_best_score') || 0));
      localStorage.setItem('ls_best_wave', String(bw));
      localStorage.setItem('ls_best_score', String(bs));
      this.bestWaveEl.textContent = bw;
      this.bestScoreEl.textContent = bs;
    } catch (e) {}
  }

  addKillFeed(weaponName, enemyType, isHeadshot) {
    const item = document.createElement('div');
    item.className = 'kf-item' + (isHeadshot ? ' kf-hs' : '');
    const label = enemyType === 'tank' ? 'مدرع' : enemyType === 'rusher' ? 'مهاجم سريع' : 'جندي';
    item.textContent = `أنت [${weaponName}] ${isHeadshot ? '🎯 HEADSHOT ' : '🔫 '} ${label}`;
    this.killfeedEl.prepend(item);
    setTimeout(() => {
      if (item.parentNode) item.remove();
    }, 3200);
  }

  setPlaying(playing) {
    this.menuEl.style.display = playing ? 'none' : 'flex';
    this.hudEl.style.display = playing ? 'block' : 'none';
    if (playing) this.shopEl.style.display = 'none';
  }

  setShopOpen(open, money = 0) {
    this.shopPtsEl.textContent = '$' + money;
    this.shopEl.style.display = open ? 'flex' : 'none';
  }

  showDamage() {
    this.dmgEl.style.opacity = 1;
    setTimeout(() => { this.dmgEl.style.opacity = 0; }, 220);
  }

  showHit() {
    this.hitEl.style.opacity = 1;
    setTimeout(() => { this.hitEl.style.opacity = 0; }, 110);
  }

  setGameOver(score, wave) {
    this.saveRecords(wave, score);
    this.overEl.textContent = `انتهت الجولة! النقاط: ${score} · وصلت إلى الموجة: ${wave}`;
  }

  clearGameOver() {
    this.overEl.textContent = '';
  }

  updateHud(hp, armor, weaponName, mag, res, reloading, wave, money, enemyCount) {
    this.hpEl.textContent = '+ ' + Math.ceil(hp);
    this.hpEl.style.color = hp <= 30 ? '#ef4444' : '#f8fafc';
    this.armorEl.textContent = '🛡 ' + Math.ceil(armor);
    this.wepNameEl.textContent = weaponName;
    this.amEl.textContent = (reloading ? 'RELOAD' : mag) + ' / ' + res;
    this.scTextEl.textContent = `موجة ${wave} · أعداء ${enemyCount}`;
    this.moneyTextEl.textContent = '$' + money;
  }
}
