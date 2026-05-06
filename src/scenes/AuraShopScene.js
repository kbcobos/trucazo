import Phaser from 'phaser';

const W = 960;
const H = 540;

const RAREZA_COLOR = { comun: 0xb4b2a9, rara: 0x378add, epica: 0x7f77dd };
const RAREZA_LABEL = { comun: 'COMÚN', rara: '✦ RARA', epica: '✦✦ ÉPICA' };

export class AuraShopScene extends Phaser.Scene {
  constructor() { super('AuraShop'); }

  init(data) {
    this.provinciasDesbloq = data.provinciasDesbloq ?? ['tierra_del_fuego'];
    this.provinciaActual   = data.provinciaActual   ?? 'tierra_del_fuego';
    this.auraDisponible    = (data.aura ?? 0) + (data.recompensaAura ?? 0);
    this.auraDisponible  = (data.aura ?? 0) + (data.recompensaAura ?? 0);
    this.provinciaId     = data.provinciaId    ?? 'tierra_del_fuego';
    this.powerupsActivos = data.powerupsActivos ?? [];
    this.descuento       = this.powerupsActivos.includes('descuento_gaucho') ? 20 : 0;
    this.slotsExtra      = this.powerupsActivos.includes('pulperia_express') ? 1  : 0;
  }

  preload() {
    const powerupsIds = [
      'mazo_enganio', 'grito_quiero', 'ojo_buen_cubero', 'cara_piedra', 
      'el_flor', 'ancho_poderoso', 'mentira_piadosa', 'gaucho_sabio', 
      'falta_envido_loco', 'mano_de_dios', 'pulperia_express', 
      'descuento_gaucho', 'la_pinta', 'el_matador', 'retruco_doble'
    ];
    for (const id of powerupsIds) {
      this.load.image(id, `assets/powerups/${id}.png`); 
    }
  }

  create() {
    this._powerupsComprados = [];
    this._oferta = [];
    this._tarjetas = [];

    this._crearFondo();
    this._crearPanelIzquierdo();
    this._cargarPowerups();
    this._generarOferta();
    this._dibujarOfertas();
    this._crearBotonesPie();

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  _crearFondo() {
    this.add.rectangle(0, 0, W, H, 0x0f0802).setOrigin(0);
    for (let x = 0; x < W; x += 60)
      this.add.rectangle(x, 0, 1, H, 0xffffff, 0.015).setOrigin(0);
    for (let y = 0; y < H; y += 55)
      this.add.rectangle(0, y, W, 1, 0xffffff, 0.015).setOrigin(0);
    this.add.rectangle(220, 0, 1, H, 0xc09060, 0.2).setOrigin(0);
  }

  _crearPanelIzquierdo() {
    const cx = 110;

    this.add.text(cx, 30, 'LA TIENDA', {
      fontSize: '16px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(cx, 52, 'DEL AURA', {
      fontSize: '14px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 3
    }).setOrigin(0.5);

    this.add.text(cx, 72, '✦  ✦  ✦', {
      fontSize: '10px', color: '#7a5030',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.rectangle(cx, 88, 180, 1, 0xc09060, 0.25).setOrigin(0.5);

    this.add.text(cx, 108, 'AURA DISPONIBLE', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 2,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._lblAura = this.add.text(cx, 130, `🪙 ${this.auraDisponible}`, {
      fontSize: '22px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.rectangle(cx, 150, 180, 1, 0xc09060, 0.25).setOrigin(0.5);

    this._dibujarVendedor(cx, 290);

    this.add.text(cx, 430, 'Elegí un\npotenciador\npara tu\npróxima mano.', {
      fontSize: '11px', color: '#a08060', align: 'center',
      fontFamily: "'Chakra Petch', monospace", lineSpacing: 4
    }).setOrigin(0.5);
  }

  _dibujarVendedor(cx, cy) {
    const g = this.add.graphics();
    g.fillStyle(0x3a1a08); g.fillRect(cx - 35, cy - 70, 70, 8);
    g.fillStyle(0x4a2210); g.fillRect(cx - 22, cy - 100, 44, 32);
    g.fillStyle(0xc89060); g.fillCircle(cx, cy - 40, 22);
    g.fillStyle(0x1a0a00); g.fillCircle(cx - 8, cy - 42, 3); g.fillCircle(cx + 8, cy - 42, 3);
    g.fillStyle(0x3a1a08); g.fillRect(cx - 10, cy - 30, 20, 4);
    g.fillStyle(0x8a1a1a); g.fillTriangle(cx - 35, cy - 15, cx + 35, cy - 15, cx, cy + 40);
    g.fillStyle(0x6a1010); g.fillRect(cx - 12, cy - 16, 24, 56);
    g.fillStyle(0x8a1a1a);
    g.fillRect(cx - 45, cy - 10, 14, 8);
    g.fillRect(cx + 31, cy - 10, 14, 8);
    g.fillStyle(0xc89060);
    g.fillCircle(cx - 45, cy - 6, 6); g.fillCircle(cx + 45, cy - 6, 6);
  }

  _cargarPowerups() {
    this._todosPowerups = [
      { id:'mazo_enganio',     nombre:'Mazo Engaño',        desc:'+2 Aura por turno.',                             precio:50,  rareza:'comun', cat:'pasivo' },
      { id:'grito_quiero',     nombre:'Grito de Quiero',    desc:'Ganás el Envido si hay empate.',                 precio:100, rareza:'comun', cat:'envido' },
      { id:'ojo_buen_cubero',  nombre:'Ojo de Buen Cubero', desc:'Ocultás 1 carta al rival.',                      precio:75,  rareza:'comun', cat:'engaño' },
      { id:'cara_piedra',      nombre:'Cara de Piedra',     desc:'Rival pierde -10 Aura si canta Truco.',          precio:90,  rareza:'comun', cat:'engaño' },
      { id:'el_flor',          nombre:'El Flor',            desc:'+5 pts Envido con 3 del mismo palo.',            precio:120, rareza:'rara',  cat:'envido' },
      { id:'ancho_poderoso',   nombre:'Ancho Poderoso',     desc:'Ancho Espada da +1 pto si jugás primero.',       precio:150, rareza:'rara',  cat:'truco'  },
      { id:'mentira_piadosa',  nombre:'Mentira Piadosa',    desc:'Cambiás 1 carta una vez por mano.',              precio:200, rareza:'rara',  cat:'engaño' },
      { id:'gaucho_sabio',     nombre:'Gaucho Sabio',       desc:'Ves 1 carta del rival al inicio.',               precio:250, rareza:'epica', cat:'info'   },
      { id:'falta_envido_loco',nombre:'Falta Envido Loco',  desc:'Si ganás Falta Envido, doble Aura siguiente.',   precio:300, rareza:'epica', cat:'envido' },
      { id:'mano_de_dios',     nombre:'Mano de Dios',       desc:'Una vez por partida: nuevas 3 cartas.',          precio:400, rareza:'epica', cat:'engaño' },
      { id:'pulperia_express', nombre:'Pulpería Express',   desc:'La tienda te ofrece 1 powerup extra.',           precio:80,  rareza:'comun', cat:'tienda' },
      { id:'descuento_gaucho', nombre:'Descuento Gaucho',   desc:'Todos los powerups cuestan -20 Aura.',           precio:110, rareza:'comun', cat:'tienda' },
      { id:'la_pinta',         nombre:'La Pinta',           desc:'Conocés el Envido del rival.',                   precio:220, rareza:'epica', cat:'info'   },
      { id:'el_matador',       nombre:'El Matador',         desc:'El 4 espada vale como un 7 espada.',             precio:175, rareza:'rara',  cat:'truco'  },
      { id:'retruco_doble',    nombre:'Retruco Doble',      desc:'+1 punto extra si aceptás un Retruco.',          precio:130, rareza:'rara',  cat:'truco'  },
    ];
  }

  _generarOferta() {
    const slots = 3 + this.slotsExtra;
    const disponibles = this._todosPowerups.filter(p => !this.powerupsActivos.includes(p.id));
    if (!disponibles.length) { this._oferta = []; return; }

    const epicas  = disponibles.filter(p => p.rareza === 'epica');
    const raras   = disponibles.filter(p => p.rareza === 'rara');
    const oferta  = [];

    if (epicas.length && Math.random() < 0.20)       oferta.push(epicas[Math.floor(Math.random() * epicas.length)]);
    else if (raras.length && Math.random() < 0.50)   oferta.push(raras[Math.floor(Math.random() * raras.length)]);

    const resto = disponibles.filter(p => !oferta.includes(p));
    this._shuffle(resto);
    for (const p of resto) {
      if (oferta.length >= slots) break;
      oferta.push(p);
    }
    this._oferta = oferta.slice(0, slots);
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  _dibujarOfertas() {
    this._tarjetas.forEach(t => { if (t.container) t.container.destroy(); });
    this._tarjetas = [];
    
    if (this._oferta.length === 0) {
      this.add.text(W / 2 + 110, H / 2, '¡Tenés todos los powerups!', {
        fontSize: '16px', color: '#c09060', fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(0.5);
      return;
    }
    
    const slots  = this._oferta.length;
    const cardW  = Math.min(200, (W - 240 - 20) / slots - 12);
    const cardH  = 340;
    const totalW = slots * cardW + (slots - 1) * 12;
    const startX = 230 + ((W - 230) - totalW) / 2;
    const cardY  = (H - cardH) / 2;
    
    this._oferta.forEach((p, i) => {
      const x      = startX + i * (cardW + 12);
      const precio = Math.max(0, p.precio - this.descuento);
      const puedePagar = this.auraDisponible >= precio;
      const yaComprado = this._powerupsComprados.includes(p.id);
      const color  = RAREZA_COLOR[p.rareza] ?? 0xb4b2a9;
      
      const container = this.add.container(x, cardY);
      
      const bg = this.add.rectangle(0, 0, cardW, cardH, 0x120801, 0.96).setOrigin(0);
      bg.setStrokeStyle(yaComprado ? 2 : 1.5, yaComprado ? 0x34a853 : color);
      container.add(bg);

      let ico;
      if (this.textures.exists(p.id)) {
        ico = this.add.image(cardW / 2, 36, p.id).setDisplaySize(48, 48);
        container.add(ico);
      } else {
        const catColor = {truco:0xe24b4a,envido:0x378add,engaño:0x7f77dd,info:0x1d9e75,tienda:0xba7517,pasivo:0x888780};
        ico = this.add.rectangle(cardW / 2, 36, 48, 48, catColor[p.cat] ?? 0x555555).setOrigin(0.5);
        ico.setStrokeStyle(1, color);
        const letra = this.add.text(cardW / 2, 36, p.cat[0].toUpperCase(), {
          fontSize: '18px', color: '#ffffff', fontStyle: 'bold', fontFamily: "'Chakra Petch'"
        }).setOrigin(0.5);
        container.add([ico, letra]);
      }
      
      const lblRareza = this.add.text(cardW / 2, 68, RAREZA_LABEL[p.rareza], {
        fontSize: '9px', color: `#${color.toString(16).padStart(6,'0')}`,
        fontFamily: "'Chakra Petch'", fontStyle: 'bold', letterSpacing: 2
      }).setOrigin(0.5);
      
      const lblNombre = this.add.text(cardW / 2, 86, p.nombre, {
        fontSize: '12px', color: '#e8c88a', fontStyle: 'bold',
        fontFamily: "'Chakra Petch'", wordWrap: { width: cardW - 16 }, align: 'center'
      }).setOrigin(0.5, 0);
      
      const sep = this.add.rectangle(cardW / 2, 118, cardW - 20, 1, 0xc09060, 0.2).setOrigin(0.5);
      
      const lblDesc = this.add.text(cardW / 2, 130, p.desc, {
        fontSize: '11px', color: '#a08060',
        fontFamily: "'Chakra Petch'", wordWrap: { width: cardW - 18 }, align: 'center'
      }).setOrigin(0.5, 0);
      
      const precioColor = puedePagar ? '#EF9F27' : '#555555';
      const precioTxt   = yaComprado ? '✓ COMPRADO' : `${precio} AURA`;
      const lblPrecio   = this.add.text(cardW / 2, cardH - 62, precioTxt, {
        fontSize: '13px', color: precioColor, fontStyle: 'bold', fontFamily: "'Chakra Petch'"
      }).setOrigin(0.5);
      
      container.add([lblRareza, lblNombre, sep, lblDesc, lblPrecio]);

      if (!yaComprado) {
        const btnColor  = puedePagar ? 0x2a1608 : 0x1a1208;
        const btnBorder = puedePagar ? color : 0x333333;
        const btnBg     = this.add.rectangle(cardW / 2, cardH - 28, cardW - 20, 34, btnColor).setOrigin(0.5);
        btnBg.setStrokeStyle(1, btnBorder);
        
        const lblBtn = this.add.text(cardW / 2, cardH - 28, puedePagar ? 'COMPRAR' : 'SIN AURA', {
          fontSize: '11px', color: puedePagar ? `#${color.toString(16).padStart(6,'0')}` : '#555',
          fontFamily: "'Chakra Petch'", fontStyle: 'bold'
        }).setOrigin(0.5);
        
        if (puedePagar) {
          btnBg.setInteractive({ useHandCursor: true });
          btnBg.on('pointerdown', () => this._confirmarCompra(p, precio, container));
        }
        container.add([btnBg, lblBtn]);
      }
      
      if (!puedePagar && !yaComprado) container.setAlpha(0.5);
      
      this._tarjetas.push({ powerup: p, precio, container });
    });
  }

  _confirmarCompra(powerup, precio, _container) {
    const cx = W / 2;
    const cy = H / 2;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setInteractive();
    const panel   = this.add.rectangle(cx, cy, 340, 190, 0x1a0e06).setOrigin(0.5);
    panel.setStrokeStyle(1.5, RAREZA_COLOR[powerup.rareza] ?? 0xc09060);

    const txt = this.add.text(cx, cy - 50,
      `¿Comprás "${powerup.nombre}"\npor ${precio} Aura?`, {
      fontSize: '14px', color: '#e8c88a', align: 'center',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    const btnSiBg  = this.add.rectangle(cx - 70, cy + 45, 110, 38, 0x2a1608).setOrigin(0.5);
    btnSiBg.setStrokeStyle(1, 0xEF9F27);
    const btnSiLbl = this.add.text(cx - 70, cy + 45, 'SÍ, DALE', {
      fontSize: '13px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
    btnSiBg.setInteractive({ useHandCursor: true });

    const btnNoBg  = this.add.rectangle(cx + 70, cy + 45, 110, 38, 0x1a0e06).setOrigin(0.5);
    btnNoBg.setStrokeStyle(1, 0x555555);
    const btnNoLbl = this.add.text(cx + 70, cy + 45, 'NO, GRACIAS', {
      fontSize: '12px', color: '#888', fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
    btnNoBg.setInteractive({ useHandCursor: true });

    const elementos = [overlay, panel, txt, btnSiBg, btnSiLbl, btnNoBg, btnNoLbl];

    btnSiBg.on('pointerdown', () => {
      elementos.forEach(e => e.destroy());
      this._ejecutarCompra(powerup, precio);
    });
    btnNoBg.on('pointerdown', () => elementos.forEach(e => e.destroy()));
  }

  _ejecutarCompra(powerup, precio) {
    this.auraDisponible -= precio;
    this._powerupsComprados.push(powerup.id);
    this.powerupsActivos.push(powerup.id);
    this._lblAura.setText(`🪙 ${this.auraDisponible}`);

    if (powerup.id === 'descuento_gaucho') this.descuento += 20;
    if (powerup.id === 'pulperia_express') { this.slotsExtra += 1; this._generarOferta(); }

    const flash = this.add.text(W / 2, H / 2, `✓ ${powerup.nombre}`, {
      fontSize: '22px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
    this.tweens.add({ targets: flash, alpha: { from: 1, to: 0 }, y: H / 2 - 40, duration: 1200,
      onComplete: () => flash.destroy() });

    this._dibujarOfertas();
  }

  _crearBotonesPie() {
    const finBg = this.add.rectangle(250, H - 28, 160, 34, 0x1a0e06).setOrigin(0.5);
    finBg.setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true });
    this.add.text(250, H - 28, 'FIN DEL TURNO', {
      fontSize: '11px', color: '#888', fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
    finBg.on('pointerdown', () => this._continuar());

    const contBg = this.add.rectangle(W - 120, H - 28, 200, 34, 0x2a1608).setOrigin(0.5);
    contBg.setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true });
    this.add.text(W - 120, H - 28, 'CONTINUAR VIAJE →', {
      fontSize: '12px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
    contBg.on('pointerover',  () => contBg.setFillStyle(0x4a2010));
    contBg.on('pointerout',   () => contBg.setFillStyle(0x2a1608));
    contBg.on('pointerdown',  () => this._continuar());
  }

  _continuar() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CampaignMap', {
        powerupsActivos: this.powerupsActivos,
        aura: this.auraDisponible,
        provinciasDesbloq: this.provinciasDesbloq,
        provinciaActual:   this.provinciaActual
      });
    });
  }

  update() {}
}
