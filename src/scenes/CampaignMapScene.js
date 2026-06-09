import Phaser from 'phaser';

const W = 960;
const H = 540;

const PROVINCIAS = [
  { id:'tierra_del_fuego', nombre:'Tierra del Fuego', sub:'', x:320, y:490, jefe:'Mariano Torre', apodo:'El Casi Ángel', desc:'Actor de Casi Ángeles reconvertido en jugador. Principiante con cara de protagonista.', dif:1, aura:80, pts:10, estado:'actual' },
  { id: 'san_juan', nombre: 'San Juan', sub: '', x: 280, y: 180, jefe: 'Dario Barassi', apodo: 'El Comediante', desc: 'Carismático y rápido de mente. Siempre tiene un chiste listo, incluso en las manos más tensas.', dif: 2, aura: 100, pts: 12, estado: 'locked' },
  { id:'la_plata', nombre:'La Plata', sub:'', x:434, y:240, jefe:'René Favaloro', apodo:'El Médico', desc:'Conocido por su compromiso con la salud pública.', dif:2, aura:120, pts:12, estado:'locked' },
  { id:'buenos_aires', nombre:'Buenos Aires', sub:'', x:420, y:220, jefe:'Ricardo Fort', apodo:'El Rey del Chocolate', desc:'Millonario y extravagante. Canta truco con champagne en mano.', dif:3, aura:160, pts:15, estado:'locked' },
  { id:'tucuman', nombre:'Tucumán', sub:'', x:322, y:130, jefe:'Gladys', apodo:'La Bomba Tucumana', desc:'Reina de la movida tropical. Canta "La pollera amarilla" antes de cada mano.', dif:3, aura:340, pts:25, estado:'locked' },
  { id:'cordoba', nombre:'Córdoba', sub:'', x:350, y:180, jefe:'Rodrigo Bueno', apodo:'El Potro', desc:'La cumbia en el alma y el truco en la sangre. Impredecible.', dif:4, aura:260, pts:18, estado:'locked' },
  { id:'mendoza', nombre:'Mendoza', sub:'', x:280, y:240, jefe:'Joaquin Salvador', apodo:'Quino', desc:'Humorista gráfico. Creador de Mafalda.', dif:4, aura:340, pts:20, estado:'locked' },
  { id:'santa_fe', nombre:'Santa Fe', sub:'', x:390, y:200, jefe:'Lionel Messi', apodo:'La Pulga', desc:'No habla. No farolea. No necesita. Precisión quirúrgica.', dif:5, aura:200, pts:15, estado:'locked' },
  { id:'salta', nombre:'Salta', sub:'', x:350, y:100, jefe:'El Chaqueño Palavecino', apodo:'El Cantor del Norte', desc:'Ícono del folklore argentino. Canta "La ley y la trampa" para intimidar a sus rivales.', dif:5, aura:500, pts:30, estado:'locked' },
  { id:'jujuy', nombre:'Jujuy', sub:'', x:320, y:75, jefe:'Alejandra Olivera', apodo:'La Locomotora', desc:'La campeona indiscutida del truco. Nadie sabe cómo juega, pero siempre gana.', dif:5, aura:500, pts:35, estado:'locked' },
];

const ORDEN = ['tierra_del_fuego','la_plata','buenos_aires','santa_fe','cordoba','mendoza', 'san_juan','tucuman','salta','jujuy'];
const ESTADO_COLOR = { completada:0x34a853, actual:0xef9f27, disponible:0x4285f4, locked:0x555555 };

const ESTADO_MARKER = { completada: 'marker_check', actual: 'marker_gaucho', disponible: 'marker_available', locked: 'marker_lock' };

export class CampaignMapScene extends Phaser.Scene {
  constructor() { super('CampaignMap'); }

  init(data) {
    const d = data || {}; 
    this.powerupsActivos   = d.powerupsActivos   ?? [];
    this.aura              = d.aura              ?? 0;
    this.provinciasDesbloq = d.provinciasDesbloq ?? ['tierra_del_fuego', 'la_plata', 'san_juan', 'tucuman'];
    this.provinciasCompletadas = d.provinciasCompletadas ?? [];
    this.provinciaActual   = d.provinciaActual   ?? 'tierra_del_fuego';    
    this.iconoJugador      = d.iconoJugador      ?? 'icono_gaucho';
    this.marcoJugador      = d.marcoJugador      ?? 'marco_basico';
    this.nombreJugador     = d.nombreJugador     ?? 'JUGADOR';
  }
  
  preload() {
    this.load.image('mapa_arg', 'assets/ui/mapa_argentina.png');
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
    this._dibujarProvincias();
    this._crearPanelInfoVacio();
    this._crearBotonVolver();
    if (this._crearBotonTienda) this._crearBotonTienda();
    this._guardarPartida();
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _guardarPartida() {
    const saveData = {
      powerupsActivos:   this.powerupsActivos,
      aura:              this.aura,
      provinciasDesbloq: this.provinciasDesbloq,
      provinciasCompletadas: this.provinciasCompletadas,
      provinciaActual:   this.provinciaActual,
      iconoJugador:      this.iconoJugador,
      marcoJugador:      this.marcoJugador,
      nombreJugador:     this.nombreJugador
    };
    try {
      localStorage.setItem('trucazo_save', JSON.stringify(saveData));
    } catch (e) {
      console.warn('El autoguardado no está disponible en este momento:', e);
    }
  }

  _crearFondo() {
    if (this.textures.exists('mapa_arg')) {
      this.add.rectangle(0, 0, W, H, 0x0d1a2a).setOrigin(0);
      this.add.rectangle(0, 0, 170, H, 0x0a0604, 0.97).setOrigin(0);
      this.add.rectangle(170, 0, 1, H, 0xc09060, 0.25).setOrigin(0);
      this.add.image(170, 0, 'mapa_arg').setOrigin(0, 0).setDisplaySize(380, H);
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

    this.add.rectangle(550, 0, W - 550, H, 0x0a0604, 0.97).setOrigin(0);
    this.add.rectangle(550, 0, 1, H, 0xc09060, 0.25).setOrigin(0);
    
    this.add.text(365, 18, 'RUTA DEL MENTIROSO', {
      fontSize: '14px', color: 'rgb(255, 255, 255)',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 5
    }).setOrigin(0.5);
  }

  _crearHUD() {
    this.add.rectangle(170, 0, 380, 36, 0x000000, 0.55).setOrigin(0);
    
    if (this.textures.exists('icono_aura')) {
      this.add.image(190, 17, 'icono_aura').setDisplaySize(18, 18);
    }

    this._lblAura = this.add.text(200, 17, `${this.aura} AURA`, {
      fontSize: '12px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0, 0.5);

    this.add.text(540, 17, `⚡ ${this.powerupsActivos.length} PWR`, {
      fontSize: '12px', color: '#ff9123', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(1, 0.5);
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
        markerObj = this.add.image(prov.x, prov.y, markerKey).setDisplaySize(40, 40);
      } else {
        const g = this.add.graphics();
        g.fillStyle(estado === 'locked' ? 0x333333 : ESTADO_COLOR[estado], 1);
        g.fillCircle(prov.x, prov.y, 12);
        g.lineStyle(2, 0x1a2a1a, 1);
        g.strokeCircle(prov.x, prov.y, 12);

        const iconos = { completada:'✓', actual:'★', disponible:'●', locked:'🔒' };
        this.add.text(prov.x, prov.y + 1, iconos[estado], {
          fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5);

        markerObj = g;
      }

      const lblX   = prov.x > 290 ? prov.x + 20 : prov.x - 20;
      const anchor = prov.x > 290 ? 0 : 1;
      this.add.text(lblX, prov.y + 1, prov.nombre, {
        fontSize: '12px', fontStyle: 'bold',
        color: estado === 'locked' ? '#4d4c4c' : '#ffffff',
        fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(anchor, 0.8);

      if (prov.sub) {
        const sc = { INICIO:'#34a853', FINAL:'#e24b4a' }[prov.sub] ?? '#888';
        this.add.text(prov.x, prov.y - 26, prov.sub, {
          fontSize: '12px', color: sc, fontStyle: 'bold',
          fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
        }).setOrigin(0.5);
      }
      
      if (estado !== 'locked') {
        const hit = this.add.circle(prov.x, prov.y, 24, 0xffffff, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => this._seleccionarProvincia(prov));

        const baseScaleX = markerObj.scaleX;
        const baseScaleY = markerObj.scaleY;

        hit.on('pointerover', () => {
          this.tweens.add({ targets: markerObj, scaleX: baseScaleX * 2.0, scaleY: baseScaleY * 2.0, duration: 120 });
        });
        
        hit.on('pointerout', () => {
          this.tweens.add({ targets: markerObj, scaleX: baseScaleX, scaleY: baseScaleY, duration: 120 });
        });
      }
    }
  }

  _crearBotonVolver() {
    const btnBg = this.add.rectangle(85, H - 30, 120, 36, 0x1a0e06).setOrigin(0.5);
    btnBg.setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });
    
    const btnLbl = this.add.text(85, H - 30, '← MENÚ', {
      fontSize: '12px', color: '#888888', fontStyle: 'bold', fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x2a1608); btnBg.setStrokeStyle(1, 0xEF9F27); btnLbl.setColor('#EF9F27');
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a0e06); btnBg.setStrokeStyle(1, 0x555555); btnLbl.setColor('#888888');
    });
    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenu', {
          powerupsActivos: this.powerupsActivos, aura: this.aura,
          provinciasDesbloq: this.provinciasDesbloq, provinciaActual: this.provinciaActual,
          iconoJugador: this.iconoJugador, marcoJugador: this.marcoJugador, nombreJugador: this.nombreJugador
        }); 
      });
    });
  }

  _crearBotonTienda() {
    const btnBg = this.add.rectangle(85, H - 75, 120, 36, 0x2a1608).setOrigin(0.5);
    btnBg.setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true });
    
    const btnLbl = this.add.text(85, H - 75, '✦ TIENDA', {
      fontSize: '12px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 1
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0x4a2010); btnBg.setScale(1.02); btnLbl.setScale(1.02); });
    btnBg.on('pointerout', () => { btnBg.setFillStyle(0x2a1608); btnBg.setScale(1); btnLbl.setScale(1); });

    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('AuraShop', {
          powerupsActivos: this.powerupsActivos, aura: this.aura, recompensaAura: 0, 
          provinciasDesbloq: this.provinciasDesbloq, provinciasCompletadas: this.provinciasCompletadas,
          provinciaActual: this.provinciaActual, iconoJugador: this.iconoJugador,
          marcoJugador: this.marcoJugador, nombreJugador: this.nombreJugador
        }); 
      });
    });
  }

  _crearPanelInfoVacio() {
    this._infoHint = this.add.text(755, H / 2, 'Tocá una provincia\npara ver el jefe.', {
      fontSize: '14px', color: '#7a5030', align: 'center', fontFamily: "'Chakra Petch', monospace", lineSpacing: 6
    }).setOrigin(0.5);
  }

  _seleccionarProvincia(prov) {
    this._panelInfo.forEach(o => o.destroy());
    this._panelInfo = [];
    if (this._infoHint) { this._infoHint.destroy(); this._infoHint = null; }

    this._provSeleccionada = prov;
    const estado = this._estadoProvincia(prov.id);
    
    const cx = 755; const px = 565; const pw = 380;
    const mk = (obj) => { this._panelInfo.push(obj); return obj; };

    mk(this.add.text(cx, 40, prov.jefe, {
      fontSize: '18px', color: '#e8c88a', fontStyle: 'bold', fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: pw - 20 }, align: 'center'
    }).setOrigin(0.5));

    mk(this.add.text(cx, 64, `"${prov.apodo}"`, {
      fontSize: '14px', color: '#EF9F27', fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    mk(this.add.rectangle(cx, 82, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    mk(this.add.text(cx, 98, prov.nombre.toUpperCase(), {
      fontSize: '14px', color: '#c09060', letterSpacing: 3, fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    mk(this.add.text(cx, 126, prov.desc, {
      fontSize: '14px', color: '#a08060', align: 'center', fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: pw - 24 }
    }).setOrigin(0.5, 0));

    mk(this.add.rectangle(cx, 225, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    const rows = [
      ['Dificultad', '★'.repeat(prov.dif) + '☆'.repeat(5 - prov.dif), '#EF9F27'],
      ['Recompensa', `${prov.aura} Aura`, '#e8c88a'],
      ['Meta',       `${prov.pts} puntos`, '#e8c88a'],
    ];
    rows.forEach(([label, val, col], i) => {
      const y = 244 + i * 28;
      mk(this.add.text(px + 14, y, label, { fontSize: '14px', color: '#7a5030', fontFamily: "'Chakra Petch', monospace" }));
      mk(this.add.text(W - 14, y, val, { fontSize: '14px', color: col, fontFamily: "'Chakra Petch', monospace" }).setOrigin(1, 0));
    });

    mk(this.add.rectangle(cx, 332, pw - 20, 1, 0xc09060, 0.25).setOrigin(0.5));

    const btnTxt = estado === 'completada' ? '↩ REVANCHA' : '¡JUGAR AHORA!';
    const btnBg  = mk(this.add.rectangle(cx, 382, pw - 24, 52, 0x2a1608).setOrigin(0.5));
    btnBg.setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true });
    mk(this.add.text(cx, 382, btnTxt, {
      fontSize: '15px', color: '#EF9F27', fontStyle: 'bold', fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5));

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x4a2010));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x2a1608));
    btnBg.on('pointerdown',  () => this._iniciarPartida(prov));

    mk(this.add.rectangle(cx, 460, pw - 20, 1, 0xc09060, 0.15).setOrigin(0.5));
    const leyenda = [ { col: 0x34a853, txt: 'Completada' }, { col: 0xef9f27, txt: 'Actual' }, { col: 0x4285f4, txt: 'Disponible' }, { col: 0x555555, txt: 'Bloqueada' } ];
    leyenda.forEach((l, i) => {
      const lx = px + 16 + i * 90;
      const g2 = this.add.graphics();
      g2.fillStyle(l.col, 1); g2.fillCircle(lx, 478, 5); mk(g2);
      mk(this.add.text(lx + 9, 478, l.txt, { fontSize: '12px', color: '#af7243', fontFamily: "'Chakra Petch', monospace" }).setOrigin(0, 0.5));
    });

    this._panelInfo.forEach(o => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 200 }); });
  }

  _iniciarPartida(prov) {
    this.provinciaActual = prov.id;
    this._guardarPartida();

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameBoard', {
        provinciaId: prov.id, jefeNombre: prov.jefe, puntosParaGanar: prov.pts, recompensaAura: prov.aura,
        powerupsActivos: this.powerupsActivos, aura: this.aura,
        provinciasDesbloq: this.provinciasDesbloq, provinciasCompletadas: this.provinciasCompletadas,
        provinciaActual: this.provinciaActual, iconoJugador: this.iconoJugador,
        marcoJugador: this.marcoJugador, nombreJugador: this.nombreJugador
      });
    });
  }

  _estadoProvincia(id) {
    if (id === this.provinciaActual) return 'actual';
    if (!this.provinciasDesbloq.includes(id)) return 'locked';
    if (this.provinciasCompletadas.includes(id)) return 'completada';
    return 'disponible'; 
  }

  update() {}
}
