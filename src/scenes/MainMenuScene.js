import Phaser from 'phaser';

const W = 960;
const H = 540;

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  preload() {
    this.load.image('fondo_arg', 'assets/ui/fondo_menu.jpeg');
  }

  create() {
    this._crearFondo();
    this._crearLadoIzquierdo();
    this._crearLadoDerecho();
    this.add.text(W - 12, H - 12, 'v0.1.0 — LOS QUE FACTURAN · 2026', {
      fontSize: '9px', color: '#d1d1d1',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
    }).setOrigin(1, 1);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

_crearFondo() {
  // 1. Fondo negro de base (por seguridad)
  this.add.rectangle(0, 0, W, H, 0x1a0e06).setOrigin(0);

  // 2. AGREGAR LA IMAGEN (Esto es lo que te faltaba)
  if (this.textures.exists('fondo_arg')) {
    this.add.image(0, 0, 'fondo_arg')
      .setOrigin(0)
      .setDisplaySize(W, H)
      .setAlpha(0.7); // Le pongo 0.7 para que se vea un poco el efecto de estrellas de abajo
  }

  // 3. Tus líneas horizontales (las mantenemos)
  for (let y = 0; y < H; y += 55)
    this.add.rectangle(0, y, W, 1, 0xffffff, 0.02).setOrigin(0);

  // 4. Tu separador central
  this.add.rectangle(480, 0, 1, H, 0xc09060, 0.15).setOrigin(0.5, 0);

  // 5. El efecto de las estrellas (las mantenemos)
  for (let i = 0; i < 50; i++) {
    const star = this.add.circle(
      Phaser.Math.Between(0, W), Phaser.Math.Between(0, H),
      Phaser.Math.FloatBetween(0.5, 1.5), 0xf5d78e, 0.5
    );
    this.tweens.add({ 
      targets: star, 
      alpha: { from: 0.1, to: 0.8 },
      duration: Phaser.Math.Between(1500, 4000), 
      yoyo: true, 
      repeat: -1,
      delay: Phaser.Math.Between(0, 3000) 
    });
  }
}

  _crearLadoIzquierdo() {
    const cx = 240;

    [
      { dx: -90, rot: -0.35, col: 0xc0392b },
      { dx: -45, rot: -0.15, col: 0x2c3e50 },
      { dx:   0, rot:  0.00, col: 0xf39c12 },
      { dx:  45, rot:  0.15, col: 0x8e44ad },
      { dx:  90, rot:  0.35, col: 0xc0392b },
    ].forEach(c => {
      this.add.rectangle(cx + c.dx, H / 2 + 60, 50, 70, c.col, 0.55)
        .setStrokeStyle(1, 0xffffff, 0.25).setRotation(c.rot);
    });

    const titulo = this.add.text(cx, H / 2 - 70, 'TRUCAZO', {
      fontSize: '54px', color: '#EF9F27',
      fontFamily: "'Press Start 2P', monospace",
      shadow: { offsetX: 5, offsetY: 5, color: '#7a4500', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titulo, scaleX: { from: 1.0, to: 1.03 }, scaleY: { from: 1.0, to: 1.03 },
      duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(cx, H / 2 - 18, 'EL ARTE DEL ENGAÑO', {
      fontSize: '12px', color: '#dadada',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 6
    }).setOrigin(0.5);
  }

  _crearLadoDerecho() {
    const cx = 720;
    const startY = 120;
    const btnW = 330;
    const btnH = 52;
    const gap  = 12;

    const botones = [
      { label: '▶  NUEVA PARTIDA', primary: true,  fn: () => this._nuevaPartida() },
      { label: '↩  CONTINUAR',     primary: false,  fn: () => this._continuar()   },
      { label: '◈  MODOS DE JUEGO',primary: false,  fn: () => this._modos()       },
      { label: '⚙  OPCIONES',      primary: false,  fn: () => {}                  },
      { label: '✕  SALIR',         primary: false, danger: true, fn: () => {}     },
    ];

    botones.forEach((btn, i) => {
      const y = startY + i * (btnH + gap);
      const borderColor = btn.danger ? 0x993333 : btn.primary ? 0xEF9F27 : 0x7a5030;
      const bgColor     = btn.primary ? 0x2a1200 : 0x1a0e06;

      const bg = this.add.rectangle(cx, y + btnH / 2, btnW, btnH, bgColor, 0.92)
        .setStrokeStyle(1, borderColor).setInteractive({ useHandCursor: true });

      this.add.text(cx - btnW / 2 + 18, y + btnH / 2, btn.label, {
        fontSize: '14px',
        color: btn.danger ? '#c07060' : btn.primary ? '#EF9F27' : '#e8c88a',
        fontStyle: btn.primary ? 'bold' : 'normal',
        fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
      }).setOrigin(0, 0.5);

      bg.on('pointerover', () => bg.setFillStyle(btn.primary ? 0x4a2000 : 0x2a1400, 0.9));
      bg.on('pointerout',  () => bg.setFillStyle(bgColor, 0.92));
      bg.on('pointerdown', () => {
        this.tweens.add({ targets: bg, scaleX: 0.97, scaleY: 0.97, duration: 80, yoyo: true });
        btn.fn();
      });

      if (!btn.primary && !btn.danger)
        this.add.text(cx + btnW / 2 - 16, y + btnH / 2, '>', {
          fontSize: '20px', color: '#7a5030',
          fontFamily: "'Chakra Petch', monospace"
        }).setOrigin(0.5);
    });
  }

  _nuevaPartida() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CampaignMap', {
        powerupsActivos: [], aura: 0,
        provinciasDesbloq: ['tierra_del_fuego'],
        provinciaActual: 'tierra_del_fuego'
      });
    });
  }

  _continuar() {
    const saved = localStorage.getItem('trucazo_save');
    if (!saved) { this._mostrarToast('No hay partida guardada.'); return; }
    try {
      const data = JSON.parse(saved);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('CampaignMap', data));
    } catch { this._mostrarToast('Error al cargar.'); }
  }

  _modos() { this._mostrarToast('Campaña disponible. PvP próximamente.'); }

  _mostrarToast(msg) {
    const t = this.add.text(W / 2, H - 28, msg, {
      fontSize: '12px', color: '#EF9F27', fontFamily: "'Chakra Petch', monospace",
      backgroundColor: '#0f0802', padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: { from: 1, to: 0 }, delay: 2500, duration: 600,
      onComplete: () => t.destroy() });
  }

  update() {}
}
