import Phaser from 'phaser';

const W = 960;
const H = 540;

const PROVINCIAS = [
  { 
    id:'tierra_del_fuego', nombre:'Tierra del Fuego', sub:'INICIO',
    x:270, y:500, jefe:'Mariano Torre', apodo:'El Casi Ángel',
    desc:'Actor de Casi Ángeles reconvertido en jugador. Principiante con cara de protagonista.',
    dif:1, aura:80, pts:15, estado:'actual' 
  },
  { 
    id:'santa_cruz', nombre:'Santa Cruz', sub:'',
    x:185, y:400, jefe:'Néstor Kirchner', apodo:'El Pingüino',
    desc:'Nunca muestra lo que tiene. Cada canto es una negociación política.',
    dif:2, aura:120, pts:15, estado:'locked' 
  },
  { 
    id:'buenos_aires', nombre:'Buenos Aires', sub:'',
    x:390, y:240, jefe:'Ricardo Fort', apodo:'El Rey del Chocolate',
    desc:'Millonario y extravagante. Canta truco con champagne en mano.',
    dif:3, aura:160, pts:15, estado:'locked' 
  },
  { 
    id:'santa_fe', nombre:'Santa Fe', sub:'',
    x:330, y:200, jefe:'Lionel Messi', apodo:'La Pulga',
    desc:'No habla. No farolea. No necesita. Precisión quirúrgica.',
    dif:4, aura:200, pts:15, estado:'locked' 
  },
  { 
    id:'cordoba', nombre:'Córdoba', sub:'',
    x:280, y:220, jefe:'Rodrigo Bueno', apodo:'El Potro',
    desc:'La cumbia en el alma y el truco en la sangre. Impredecible.',
    dif:5, aura:260, pts:30, estado:'locked' 
  },
  { 
    id:'san_juan', nombre:'San Juan', sub:'',
    x:180, y:190, jefe:'Claudio Tapia', apodo:'Chiqui',
    desc:'Presidente de la AFA. Siempre tiene un reglamento que lo favorece.',
    dif:6, aura:340, pts:30, estado:'locked' 
  },
  { 
    id:'salta', nombre:'Salta', sub:'FINAL',
    x:280, y:100, jefe:'El Chaqueño Palavecino', apodo:'El Cantor del Norte',
    desc:'El jefe final. Canta una chacarera antes de cada mano. 90% de farol.',
    dif:7, aura:500, pts:30, estado:'locked' 
  },
];

const ORDEN = ['tierra_del_fuego','santa_cruz','buenos_aires','santa_fe','cordoba','san_juan','salta'];
const ESTADO_COLOR = { completada:0x34a853, actual:0xef9f27, disponible:0x4285f4, locked:0x555555 };

const ESTADO_MARKER = {
  completada: 'marker_check',
  actual:     'marker_gaucho',
  disponible: 'marker_available',
  locked:     'marker_lock'
};

export class CampaignMapScene extends Phaser.Scene {
  constructor() { super('CampaignMap'); }

  init(data) {
    this.powerupsActivos   = data.powerupsActivos   ?? [];
    this.aura              = data.aura              ?? 0;
    this.provinciasDesbloq = data.provinciasDesbloq ?? ['tierra_del_fuego'];
    this.provinciaActual   = data.provinciaActual   ?? 'tierra_del_fuego';    
    this.iconoJugador      = data.iconoJugador      ?? 'icono_gaucho';
    this.marcoJugador      = data.marcoJugador      ?? 'marco_basico';
  }
  
  preload() {
    this.load.image('mapa_arg', 'assets/ui/mapa_argentina.jpeg');

    this.load.image('marker_gaucho',    'assets/ui/map/marker_gaucho.png');
    this.load.image('marker_check',     'assets/ui/map/marker_check.png');
    this.load.image('marker_available', 'assets/ui/map/marker_available.png');
    this.load.image('marker_lock',      'assets/ui/map/marker_lock.png');

    this.load.image('icono_aura', 'assets/ui/icono_aura.png');
  }

  create() {
    this._provSeleccionada = null;
    this._panelInfo        = [];

    this._crearFondo();
    this._crearHUD();
    this._dibujarRuta();
    this._dibujarProvincias();
    this._crearPanelInfoVacio();
    this._crearBotonVolver();

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _crearFondo() {
    if (this.textures.exists('mapa_arg')) {
      this.add.rectangle(0, 0, W, H, 0x0d1a2a).setOrigin(0);
      this.add.image(0, 0, 'mapa_arg')
      .setOrigin(0, 0)
      .setDisplaySize(580, H);
    } else {
        const g = this.add.graphics();
        g.fillStyle(0x0d1a2a, 1);
        g.fillRect(0, 0, W, H);
        g.fillStyle(0x1e3320, 1);
        g.lineStyle(1, 0x2a4a2a, 1);
        g.beginPath();
      const pts = [
        [255,50],[305,46],[330,65],[345,90],[335,125],
        [355,155],[360,195],[350,230],[365,260],[355,295],
        [348,330],[360,365],[348,400],[340,435],[335,468],
        [318,500],[300,520],[278,525],[255,515],[238,490],
        [242,462],[230,438],[226,408],[238,378],[230,348],
        [242,318],[235,288],[248,255],[238,222],[248,188],
        [238,155],[248,120],[238,88],[248,60],[265,50],
      ];
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
      g.fillPath();
      g.strokePath();
    }

    this.add.rectangle(580, 0, W - 580, H, 0x0a0604, 0.97).setOrigin(0);
    this.add.rectangle(580, 0, 1, H, 0xc09060, 0.25).setOrigin(0);
    this.add.text(290, 18, 'RUTA DEL MENTIROSO', {
      fontSize: '10px', color: 'rgba(255,220,140,0.7)',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 5
    }).setOrigin(0.5);
  }

  _crearHUD() {
    this.add.rectangle(0, 0, 580, 36, 0x000000, 0.55).setOrigin(0);
    
    if (this.textures.exists('icono_aura')) {
      this.add.image(18, 17, 'icono_aura').setDisplaySize(16, 16);
    }

    this._lblAura = this.add.text(32, 17, `${this.aura} AURA`, {
      fontSize: '12px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0, 0.5);

    this.add.text(566, 17, `⚡ ${this.powerupsActivos.length} PWR`, {
      fontSize: '12px', color: '#c09060',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(1, 0.5);
  }

  _dibujarRuta() {
    const g = this.add.graphics();

    g.lineStyle(3, 0x000000, 0.5); 
    for (let i = 0; i < PROVINCIAS.length - 1; i++) {
      this._lineaPunteada(g, PROVINCIAS[i].x, PROVINCIAS[i].y + 2, PROVINCIAS[i+1].x, PROVINCIAS[i+1].y + 2, 8, 5);
    }

    g.lineStyle(2, 0x5c2c06, 1); 
    for (let i = 0; i < PROVINCIAS.length - 1; i++) {
      this._lineaPunteada(g, PROVINCIAS[i].x, PROVINCIAS[i].y, PROVINCIAS[i+1].x, PROVINCIAS[i+1].y, 8, 5);
    }
  }

  _lineaPunteada(g, x1, y1, x2, y2, largo, espacio) {
    const dx = x2-x1, dy = y2-y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const nx = dx/dist, ny = dy/dist;
    let d = 0, draw = true;
    while (d < dist) {
      const seg = Math.min(draw ? largo : espacio, dist - d);
      if (draw) {
        g.beginPath();
        g.moveTo(x1+nx*d, y1+ny*d);
        g.lineTo(x1+nx*(d+seg), y1+ny*(d+seg));
        g.strokePath();
      }
      d += seg; draw = !draw;
    }
  }

  _dibujarProvincias() {
    for (const prov of PROVINCIAS) {
      const estado    = this._estadoProvincia(prov.id);
      const markerKey = ESTADO_MARKER[estado];
      const hayImagen = this.textures.exists(markerKey);

      if (estado === 'actual') {
        const glow = this.add.graphics();
        glow.fillStyle(ESTADO_COLOR[estado], 0.22);
        glow.fillCircle(prov.x, prov.y, 26);
        this.tweens.add({
          targets: glow, alpha: { from: 1, to: 0.4 },
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
      }

      let markerObj;

      if (hayImagen) {
        markerObj = this.add.image(prov.x, prov.y, markerKey)
          .setDisplaySize(38, 38);
      } else {
        const g = this.add.graphics();
        g.fillStyle(estado === 'locked' ? 0x333333 : ESTADO_COLOR[estado], 1);
        g.fillCircle(prov.x, prov.y, 12);
        g.lineStyle(2, 0x1a2a1a, 1);
        g.strokeCircle(prov.x, prov.y, 12);

        const iconos = { completada:'✓', actual:'★', disponible:'●', locked:'🔒' };
        this.add.text(prov.x, prov.y + 1, iconos[estado], {
          fontSize: '10px', color: '#ffffff'
        }).setOrigin(0.5);

        markerObj = g;
      }

      const lblX   = prov.x > 290 ? prov.x + 20 : prov.x - 20;
      const anchor = prov.x > 290 ? 0 : 1;
      this.add.text(lblX, prov.y + 1, prov.nombre, {
        fontSize: '12px',
        color: estado === 'locked' ? '#4d4c4c' : '#ffffff',
        fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(anchor, 0.8);

      if (prov.sub) {
        const sc = { INICIO:'#34a853', FINAL:'#e24b4a' }[prov.sub] ?? '#888';
        this.add.text(prov.x, prov.y - 26, prov.sub, {
          fontSize: '8px', color: sc, fontStyle: 'bold',
          fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
        }).setOrigin(0.5);
      }
      
      if (estado !== 'locked') {
        const hit = this.add.circle(prov.x, prov.y, 24, 0xffffff, 0)
          .setInteractive({ useHandCursor: true });

        hit.on('pointerdown', () => this._seleccionarProvincia(prov));

        const baseScaleX = markerObj.scaleX;
        const baseScaleY = markerObj.scaleY;

        hit.on('pointerover', () => {
          this.tweens.add({ 
            targets: markerObj, 
            scaleX: baseScaleX * 2.0, 
            scaleY: baseScaleY * 2.0, 
            duration: 120 
          });
        });
        
        hit.on('pointerout', () => {
          this.tweens.add({ 
            targets: markerObj, 
            scaleX: baseScaleX, 
            scaleY: baseScaleY, 
            duration: 120 
          });
        });
      }
    }
  }

  _crearBotonVolver() {
    const btnBg = this.add.rectangle(80, H - 30, 120, 36, 0x1a0e06).setOrigin(0.5);
    btnBg.setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });
    
    const btnLbl = this.add.text(80, H - 30, '← MENÚ', {
      fontSize: '12px', color: '#888888', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2a1608);
      btnBg.setStrokeStyle(1, 0xEF9F27);
      btnLbl.setColor('#EF9F27');
    });
    
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a0e06);
      btnBg.setStrokeStyle(1, 0x555555);
      btnLbl.setColor('#888888');
    });

    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu', {
          powerupsActivos:   this.powerupsActivos,
          aura:              this.aura,
          provinciasDesbloq: this.provinciasDesbloq,
          provinciaActual:   this.provinciaActual,
          iconoJugador:      this.iconoJugador,
          marcoJugador:      this.marcoJugador
        }); 
      });
    });
  }

  _crearPanelInfoVacio() {
    this._infoHint = this.add.text(770, H / 2,
      'Tocá una provincia\npara ver el jefe.', {
      fontSize: '13px', color: '#7a5030', align: 'center',
      fontFamily: "'Chakra Petch', monospace", lineSpacing: 6
    }).setOrigin(0.5);
  }

  _seleccionarProvincia(prov) {
    this._panelInfo.forEach(o => o.destroy());
    this._panelInfo = [];
    if (this._infoHint) { this._infoHint.destroy(); this._infoHint = null; }

    this._provSeleccionada = prov;
    const estado = this._estadoProvincia(prov.id);
    const cx     = 770;
    const px     = 592;
    const pw     = W - px - 10;

    const mk = (obj) => { this._panelInfo.push(obj); return obj; };

    mk(this.add.text(cx, 40, prov.jefe, {
      fontSize: '16px', color: '#e8c88a', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: pw - 20 }, align: 'center'
    }).setOrigin(0.5));

    mk(this.add.text(cx, 64, `"${prov.apodo}"`, {
      fontSize: '12px', color: '#EF9F27',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    mk(this.add.rectangle(cx, 82, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    mk(this.add.text(cx, 98, prov.nombre.toUpperCase(), {
      fontSize: '10px', color: '#c09060', letterSpacing: 3,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    mk(this.add.text(cx, 126, prov.desc, {
      fontSize: '11px', color: '#a08060', align: 'center',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: pw - 24 }
    }).setOrigin(0.5, 0));

    mk(this.add.rectangle(cx, 225, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    const rows = [
      ['Dificultad', '★'.repeat(prov.dif) + '☆'.repeat(7 - prov.dif), '#EF9F27'],
      ['Recompensa', `${prov.aura} Aura`, '#e8c88a'],
      ['Meta',       `${prov.pts} puntos`, '#e8c88a'],
    ];
    rows.forEach(([label, val, col], i) => {
      const y = 244 + i * 28;
      mk(this.add.text(px + 14, y, label, {
        fontSize: '11px', color: '#7a5030',
        fontFamily: "'Chakra Petch', monospace"
      }));
      mk(this.add.text(W - 14, y, val, {
        fontSize: '11px', color: col,
        fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(1, 0));
    });

    mk(this.add.rectangle(cx, 332, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    const btnTxt = estado === 'completada' ? '↩ REVANCHA' : '¡JUGAR AHORA!';
    const btnBg  = mk(this.add.rectangle(cx, 382, pw - 24, 52, 0x2a1608).setOrigin(0.5));
    btnBg.setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true });
    mk(this.add.text(cx, 382, btnTxt, {
      fontSize: '15px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x4a2010));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x2a1608));
    btnBg.on('pointerdown',  () => this._iniciarPartida(prov));

    mk(this.add.rectangle(cx, 460, pw - 20, 1, 0xc09060, 0.15).setOrigin(0.5));
    const leyenda = [
      { col: 0x34a853, txt: 'Completada' },
      { col: 0xef9f27, txt: 'Actual'     },
      { col: 0x4285f4, txt: 'Disponible' },
      { col: 0x555555, txt: 'Bloqueada'  },
    ];
    leyenda.forEach((l, i) => {
      const lx = px + 16 + i * 90;
      const g2 = this.add.graphics();
      g2.fillStyle(l.col, 1);
      g2.fillCircle(lx, 478, 5);
      mk(g2);
      mk(this.add.text(lx + 9, 478, l.txt, {
        fontSize: '9px', color: '#7a5030',
        fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(0, 0.5));
    });

    this._panelInfo.forEach(o => {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 200 });
    });
  }

  _iniciarPartida(prov) {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameBoard', {
        provinciaId:       prov.id,
        jefeNombre:        prov.jefe,
        puntosParaGanar:   prov.pts,
        recompensaAura:    prov.aura,
        powerupsActivos:   this.powerupsActivos,
        aura:              this.aura,
        provinciasDesbloq: this.provinciasDesbloq,
        provinciaActual:   this.provinciaActual,
        iconoJugador:      this.iconoJugador,
        marcoJugador:      this.marcoJugador
      });
    });
  }

  _estadoProvincia(id) {
    if (!this.provinciasDesbloq.includes(id)) return 'locked';
    const ia = ORDEN.indexOf(this.provinciaActual);
    const ip = ORDEN.indexOf(id);
    if (ip < ia) return 'completada';
    if (id === this.provinciaActual) return 'actual';
    return 'disponible';
  }

  update() {}
}
