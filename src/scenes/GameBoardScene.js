import Phaser from 'phaser';
import { IAJefe } from '../logic/iaJefe.js';
import { GameEngine } from '../logic/GameEngine.js';
import { EstadoJuego, LlamadaTruco, LlamadaEnvido, Respuesta } from '../logic/core/Enums.js';

const W = 960;
const H = 540;


const IZQ_W  = 175;
const DER_X  = 785;
const DER_W  = 175;
const MESA_X = IZQ_W + (DER_X - IZQ_W) / 2;

const POS_MAZO_IZQ_X = 220;
const POS_MAZO_DER_X = W - 45;
const POS_MAZO_Y     = H / 2 - 70;

const CARD_W  = 100;
const CARD_H  = 140;
const CARD_GAP = 10;

export class GameBoardScene extends Phaser.Scene {
  constructor() { super('GameBoard'); }

  init(data) {
    this.provinciaId     = data.provinciaId;
    this.jefeNombre      = data.jefeNombre;
    this.puntosParaGanar = data.puntosParaGanar ?? 15;
    this.recompensaAura  = data.recompensaAura   ?? 80;
    this.powerupsActivos = data.powerupsActivos  ?? [];
    this.aura            = data.aura             ?? 0;
    this.provinciasDesbloq = data.provinciasDesbloq ?? ['tierra_del_fuego'];
    this.provinciaActual   = data.provinciaActual   ?? 'tierra_del_fuego';
    this.iconoJugador      = data.iconoJugador      ?? 'icono_gaucho';
    this.marcoJugador      = data.marcoJugador      ?? 'marco_basico';
  }

preload() {
  this.load.on('loaderror', (file) => {
    console.error('No se pudo cargar:', file.key, 'en la ruta:', file.src);
  });

  const palos = ['espada', 'basto', 'oro', 'copa'];
  const nums  = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  
  for (const palo of palos) {
    for (const num of nums) {
      const clave = `${palo}_${num}`;
      const ruta = `assets/cards/${palo}_${num}.jpeg`;
      this.load.image(clave, ruta);
    }
  }
  
  this.load.image('carta_reverso', 'assets/cards/reverso.jpeg');
  this.load.image('fondo_mesa', 'assets/ui/fondo_mesa.jpeg');
  
  this.load.image('marco_gaucho', 'assets/ui/banners/marco_gaucho.png');
  this.load.image('marco_pampa', 'assets/ui/banners/marco_pampa.png');
  this.load.image('marco_dorado', 'assets/ui/banners/marco_dorado.png');
  this.load.image('marco_perfecto', 'assets/ui/banners/marco_perfecto.png');
  this.load.image('marco_basico', 'assets/ui/banners/marco_basico.png');
  
  this.load.image('icono_gaucho', 'assets/ui/banners/icono_gaucho.png');
  this.load.image('icono_gaucho_dorado', 'assets/ui/banners/icono_gaucho_dorado.png');
  this.load.image('icono_gaucho_rojo', 'assets/ui/banners/icono_gaucho_rojo.png');
  this.load.image('icono_gaucho_negro', 'assets/ui/banners/icono_gaucho_negro.png');

  this.load.image('jefe_tierra_del_fuego', 'assets/ui/jefes/Mariano_Torre.png');
  this.load.image('jefe_santa_cruz',       'assets/ui/jefes/Nestor_Kirchner.png');
  this.load.image('jefe_buenos_aires',     'assets/ui/jefes/Ricardo_Fort.png');
  this.load.image('jefe_santa_fe',         'assets/ui/jefes/Lionel_Messi.png');
  this.load.image('jefe_cordoba',          'assets/ui/jefes/Rodrigo_Bueno.png');
  this.load.image('jefe_san_juan',         'assets/ui/jefes/Chiqui_Tapia.png');
  this.load.image('jefe_salta',            'assets/ui/jefes/Chaqueño_Palavecino.png');

  this.load.image('mazo_boca_abajo', 'assets/ui/mazo_boca_abajo.png');

  this.load.image('icono_aura', 'assets/ui/icono_aura.png');
}

create() {
    this.logic = new GameEngine(this.puntosParaGanar);
    this.logic.powerupsActivos = this.powerupsActivos;
    this.ia    = new IAJefe();
    this.ia.inicializar(this.provinciaId, this.logic);

    this._nodosCartasJugador = [];
    this._nodosCartasRival   = [];
    this._cartaEnMesaJugador = null;
    this._cartaEnMesaRival   = null;

    this.logic
      .on('cartasRepartidas',   (mJ, mR) => this._onCartasRepartidas(mJ, mR))
      .on('cartaJugada',        (c, esJ)  => this._onCartaJugada(c, esJ))
      .on('bazaResuelta',       (gan)     => this._onBazaResuelta(gan))
      .on('trucoCantado',       (nv, q)   => this._onTrucoCantado(nv, q))
      .on('envidoCantado',      (nv, q)   => this._onEnvidoCantado(nv, q))
      .on('respuestaRequerida', (tipo)    => this._onRespuestaRequerida(tipo))
      .on('puntosActualizados', (pJ, pR)  => this._onPuntosActualizados(pJ, pR))
      .on('manoTerminada',      (gan)     => this._onManoTerminada(gan))
      .on('partidaTerminada',   (gan)     => this._onPartidaTerminada(gan))
      .on('auraGanada',         (amt)     => this._onAuraGanada(amt));

    this._crearFondo();
    this._crearMazoVisual();
    this._crearPanelIzquierdo();
    this._crearPanelDerecho();
    this._crearLabelEstado();
    this._crearLabelFrase();
    this._crearBotonSalir();
    this._dibujarPowerupsActivos();

    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.logic.iniciarMano();
  }

  _actualizarIndicadorMano() {
    const esJugadorMano = this.logic.manoActual === 'jugador';

    this._lblMano.setText(
      esJugadorMano
        ? 'TU MANO'
        : 'SU MANO'
    );

    this._lblMano.setColor(
      esJugadorMano
        ? '#34a853'
        : '#e24b4a'
    );

    if (this._mazoContenedor) {
      const targetX = esJugadorMano ? MESA_X - 190 : MESA_X + 190;
      const targetY = H / 2;
      const angulo = esJugadorMano ? -6 : 6; 

      this.tweens.add({
        targets: this._mazoContenedor,
        x: targetX,
        y: targetY,
        angle: angulo,
        duration: 500,
        ease: 'Back.easeOut'
      });
    }
  }

  _crearFondo() {
    this.add.rectangle(0, 0, W, H, 0x0d1a0d).setOrigin(0);
    
    if (this.textures.exists('fondo_mesa')) {
      this.add.image(W / 2, H / 2, 'fondo_mesa')
      .setDisplaySize(W, H)
      .setDepth(0);
    } else {
      this.add.rectangle(MESA_X, H / 2, DER_X - IZQ_W, H, 0x0d2b0d, 0.85).setOrigin(0.5);
    }
    
    this.add.rectangle(0, 0, IZQ_W, H, 0x080402, 0.88).setOrigin(0);
    this.add.rectangle(DER_X, 0, DER_W, H, 0x080402, 0.88).setOrigin(0);

    this._sprMazoVisual = this.add.sprite(-100, POS_MAZO_Y, 'mazo_boca_abajo')
      .setScale(0.8)
      .setDepth(2);
  }

  _crearMazoVisual() {
    this._mazoContenedor = this.add.container(MESA_X, H / 2).setDepth(2);
    
    if (this.textures.exists('carta_reverso')) {
      for (let i = 0; i < 3; i++) {
        const img = this.add.image(i * 3, -i * 3, 'carta_reverso').setDisplaySize(CARD_W, CARD_H);
        
        if (i < 2) {
          img.setTint(0xcccccc);
        }
        
        this._mazoContenedor.add(img);
      }
    }
  }

  _crearBotonSalir() {
    const btnX = 87;
    const btnY = H - 20;

    const btnBg = this.add.rectangle(btnX, btnY, 75, 26, 0x1a0e06)
      .setOrigin(0.5)
      .setDepth(100)
      .setStrokeStyle(1, 0x555555)
      .setInteractive({ useHandCursor: true });
    
    const btnLbl = this.add.text(btnX, btnY, '✕ SALIR', {
      fontSize: '11px',
      color: '#888888',
      fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5).setDepth(100);

    btnBg.setData('label', btnLbl);

    btnBg.on('pointerover', function() {
      this.setFillStyle(0x3a1a1a);
      this.setStrokeStyle(1, 0xe24b4a);
      this.getData('label').setColor('#e24b4a');
    });
    
    btnBg.on('pointerout', function() {
      this.setFillStyle(0x1a0e06);
      this.setStrokeStyle(1, 0x555555);
      this.getData('label').setColor('#888888');
    });
    
    btnBg.on('pointerdown', () => this._guardarYSalir());
  }

_dibujarPowerupsActivos() {
    if (!this.powerupsActivos || this.powerupsActivos.length === 0) return;

    const cx = 785 + 175 / 2;
    
    this.add.text(cx, 12, 'POWERUPS ACTIVOS', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 1,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    const maxCols = 5;
    const size = 26;
    const gap = 4;
    
    const count = this.powerupsActivos.length;
    const colsInFirstRow = Math.min(count, maxCols);
    const rowWidth = (colsInFirstRow * size) + ((colsInFirstRow - 1) * gap);
    const startX = cx - (rowWidth / 2) + (size / 2);

    this.powerupsActivos.forEach((pId, i) => {
      if (this.textures.exists(pId)) {
        const col = i % maxCols;
        const row = Math.floor(i / maxCols);
        
        let x = startX + (col * (size + gap));
        
        if (row > 0) {
           const itemsInThisRow = Math.min(count - (row * maxCols), maxCols);
           const thisRowWidth = (itemsInThisRow * size) + ((itemsInThisRow - 1) * gap);
           const thisStartX = cx - (thisRowWidth / 2) + (size / 2);
           x = thisStartX + (col * (size + gap));
        }

        const y = 30 + (row * (size + gap));

        const bg = this.add.rectangle(x, y, size, size, 0x1a0e06).setStrokeStyle(1, 0xEF9F27);
        const icono = this.add.image(x, y, pId).setDisplaySize(size - 4, size - 4);
        
        bg.setInteractive();
        bg.on('pointerover', () => bg.setStrokeStyle(1, 0xffffff));
        bg.on('pointerout', () => bg.setStrokeStyle(1, 0xEF9F27));
      }
    });
  }

  _guardarYSalir() {
    const saveData = {
      powerupsActivos:   this.powerupsActivos,
      aura:              this.aura,
      provinciasDesbloq: this.provinciasDesbloq,
      provinciaActual:   this.provinciaActual,
      iconoJugador:      this.iconoJugador,
      marcoJugador:      this.marcoJugador
    };

    try {
      localStorage.setItem('trucazo_save', JSON.stringify(saveData));
    } catch (e) {
      console.warn('No se pudo guardar la partida:', e);
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CampaignMap', saveData);
    });
  }

  _crearPanelIzquierdo() {
    const cx = 175 / 2;

    if (this.textures.exists(`jefe_${this.provinciaId}`)) {
      this.add.image(cx, 70, `jefe_${this.provinciaId}`).setDisplaySize(86, 86);
    }
    if (this.textures.exists('marco_gaucho')) {
      this.add.image(cx, 70, 'marco_gaucho').setDisplaySize(115, 115); 
    }

    this.add.text(cx, 135, this.ia.getNombre(), {
      fontSize: '15px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: 175 - 14 }, align: 'center',
      lineSpacing: -2 
    }).setOrigin(0.5);

    this.add.text(cx, 155, `"${this.ia.getApodo()}"`, {
      fontSize: '12px', color: '#c09060',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: 175 - 14 }, align: 'center'
    }).setOrigin(0.5);

    this.add.rectangle(cx, 170, 175 - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    this._lblPtsRival = this.add.text(cx, 188, 'Rival: 0', {
      fontSize: '13px', color: '#e8c88a', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._lblPtsJugador = this.add.text(cx, 208, 'Vos: 0', {
      fontSize: '13px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._lblMano = this.add.text(cx, 228, '', {
      fontSize: '11px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.rectangle(cx, 244, 175 - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    this.add.text(cx, 258, `Meta: ${this.puntosParaGanar} pts`, {
      fontSize: '12px', color: '#7a5030',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.text(cx, 280, 'BAZAS', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 3,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._bazaIndicadores = [];
    for (let i = 0; i < 3; i++) {
      const ind = this.add.rectangle(cx - 24 + i * 24, 298, 18, 18, 0x333333)
        .setStrokeStyle(1, 0x7a5030);
      this._bazaIndicadores.push(ind);
    }

    this.add.rectangle(cx, 320, 175 - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    this.add.text(cx, 336, 'AURA', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 3,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    if (this.textures.exists('icono_aura')) {
      this.add.image(cx - 18, 356, 'icono_aura').setDisplaySize(20, 20);
    }

    this._lblAura = this.add.text(cx + 2, 356, `${this.aura}`, {
      fontSize: '14px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0, 0.5);

    this.add.rectangle(cx, 378, 175 - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    if (this.textures.exists(this.iconoJugador)) {
      this.add.image(cx, 435, this.iconoJugador).setDisplaySize(60, 60);
    }
    if (this.textures.exists(this.marcoJugador)) {
      this.add.image(cx, 435, this.marcoJugador).setDisplaySize(120, 120);
    }

    this.add.text(cx, 492, 'JUGADOR', {
      fontSize: '14px', color: '#e8c88a', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace", letterSpacing: 2
    }).setOrigin(0.5);
  }

  _crearPanelDerecho() {
    const cx  = 785 + 175 / 2;
    const bW  = 175 - 18;
    const bH  = 34;
    const gap = 6;

    const defs = [
      { id:'truco',      label:'TRUCO',       y: 90  },
      { id:'retruco',    label:'RETRUCO',     y: 90  + bH + gap },
      { id:'valecuatro', label:'VALE CUATRO', y: 90  + (bH + gap) * 2 },
      { id:'envido',     label:'ENVIDO',      y: 235 },
      { id:'real',       label:'REAL ENV',    y: 235 + bH + gap },
      { id:'falta',      label:'FALTA ENV',   y: 235 + (bH + gap) * 2 },
      { id:'quiero',     label:'QUIERO',    y: 380, col:0x1a3a1a, brd:0x34a853 },
      { id:'noquiero',   label:'NO QUIERO', y: 380 + bH + gap, col:0x3a1a1a, brd:0xe24b4a },
      { id:'mazo',       label:'IR AL MAZO',  y: 495, col:0x1a1a1a, brd:0x555555 },
    ];

    this._panelAcciones = {};

    for (const d of defs) {
      const bgCol = d.col ?? 0x150a04;
      const brdCol = d.brd ?? 0x7a5030;

      const bg = this.add.rectangle(cx, d.y + bH / 2, bW, bH, bgCol, 0.94)
        .setStrokeStyle(1, brdCol)
        .setInteractive({ useHandCursor: true });

      const lbl = this.add.text(cx, d.y + bH / 2, d.label, {
        fontSize: '11px', color: '#e8c88a', fontStyle: 'bold',
        fontFamily: "'Chakra Petch', monospace"
      }).setOrigin(0.5);

      bg.on('pointerover',  () => bg.setAlpha(1.4));
      bg.on('pointerout',   () => bg.setAlpha(1.0));
      bg.on('pointerdown',  () => this._onBoton(d.id));

      this._panelAcciones[d.id] = { bg, lbl };
    }

    this.add.text(cx, 75,  'TRUCO',  { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);
    this.add.text(cx, 220, 'ENVIDO', { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);
    this.add.text(cx, 365, 'CANTOS', { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);

    this._actualizarBotones();
  }

  _onBoton(id) {
    switch (id) {
      case 'truco':      this.logic.cantarTruco('jugador'); break;
      case 'retruco':    this.logic.cantarTruco('jugador'); break;
      case 'valecuatro': this.logic.cantarTruco('jugador'); break;
      case 'envido':     this.logic.cantarEnvido(LlamadaEnvido.ENVIDO,       'jugador'); break;
      case 'real':       this.logic.cantarEnvido(LlamadaEnvido.REAL_ENVIDO,  'jugador'); break;
      case 'falta':      this.logic.cantarEnvido(LlamadaEnvido.FALTA_ENVIDO, 'jugador'); break;
      case 'quiero':     this._responderPendiente(Respuesta.QUIERO);    break;
      case 'noquiero':   this._responderPendiente(Respuesta.NO_QUIERO); break;
      case 'mazo':       this.logic.irAlMazo('jugador'); break;
    }
    this._actualizarBotones();
  }

  _respuestaActual = null;
  
  _responderPendiente(resp) {
    if (!this._respuestaActual) {
      return;
    }

    this._mostrarCartelRespuesta(true, resp);

    if (this._respuestaActual === 'truco') {
      this.logic.responderTruco(resp);
    }

    if (this._respuestaActual === 'envido') {
      this.logic.responderEnvido(resp);
    }

    this._respuestaActual = null;

    this._actualizarBotones();

    if (this.logic.estado === EstadoJuego.TURNO_RIVAL) {
      this.time.delayedCall(
        1000,
        () => this._turnoIA()
      );
    }
  }

  _actualizarBotones() {
    const l        = this.logic;
    const esT      = l.estado === EstadoJuego.TURNO_JUGADOR;
    const hayRT = l.truco.quienCanto === 'rival' && l.truco.respuesta === Respuesta.PENDIENTE;
    const hayRE = l.envido.quienCanto === 'rival' && l.envido.respuesta === Respuesta.PENDIENTE;
    const puedeEnv = esT && l.puedeCantarEnvido('jugador');
    const puedeT   = esT && l.puedeCantarTruco('jugador');

    this._setBtn('truco',      puedeT && l.truco.trucoActual === LlamadaTruco.NINGUNA);
    this._setBtn('retruco',    puedeT && l.truco.trucoActual === LlamadaTruco.TRUCO);
    this._setBtn('valecuatro', puedeT && l.truco.trucoActual === LlamadaTruco.RETRUCO);
    this._setBtn('envido',     puedeEnv);
    this._setBtn('real',       puedeEnv);
    this._setBtn('falta',      puedeEnv);
    this._setBtn('quiero',     hayRT || hayRE);
    this._setBtn('noquiero',   hayRT || hayRE);
    this._setBtn('mazo',       esT);
  }

  _setBtn(id, visible) {
    const b = this._panelAcciones[id];
    if (!b) return;
    b.bg.setVisible(visible);
    b.lbl.setVisible(visible);
  }

  _crearLabelEstado() {
    const x = (1536 / 2);
    const y = (864 / 2) - 40;

    this._lblEstado = this.add.text(MESA_X, H / 2 - 10, '', {
      fontSize: '20px',
      color: '#faf618', 
      fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace",
      stroke: '#000000',
      strokeThickness: 5,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#000000',
        blur: 12,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(10);
  }
  
  _crearLabelFrase() {
    this._labelFrase = this.add.text(MESA_X, H / 2 + 40, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'italic bold',
      fontFamily: "'Chakra Petch', monospace",
      backgroundColor: 'rgba(0, 0, 0, 0.6)', 
      padding: { x: 12, y: 6 },
      wordWrap: { width: 360 }, 
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);
  }

  _mostrarFrase(txt) {
    this._labelFrase.setText(txt).setAlpha(1);
    this.tweens.add({ targets: this._labelFrase, alpha: 0, delay: 2500, duration: 700 });
  }

  _dibujarManoJugador(mano) {
    this._nodosCartasJugador.forEach(c => c.destroy());
    this._nodosCartasJugador = [];

    const total  = mano.length;
    if (total === 0) return;

    const startX = MESA_X - ((total - 1) * (CARD_W + CARD_GAP)) / 2;
    const y      = H - 68;

    mano.forEach((carta, i) => {
      const x         = startX + i * (CARD_W + CARD_GAP);
      const container = this.add.container(x, y);
      const key       = carta.clave();

      if (this.textures.exists(key)) {
        const img = this.add.image(0, 0, key).setDisplaySize(CARD_W, CARD_H);
        container.add(img);
      } else {
        const cols = { 0:0xc0392b, 1:0x2c3e50, 2:0xf39c12, 3:0x8e44ad };
        const rect = this.add.rectangle(0, 0, CARD_W, CARD_H, cols[carta.palo] ?? 0x555555)
          .setStrokeStyle(1.5, 0xffffff, 0.5);
        const numLbl = this.add.text(0, -14, String(carta.numero), {
          fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);
        const paloLbl = this.add.text(0, 14, ['E','B','O','C'][carta.palo] ?? '?', {
          fontSize: '13px', color: '#ffffff'
        }).setOrigin(0.5);
        container.add([rect, numLbl, paloLbl]);
      }

      container.setSize(CARD_W, CARD_H);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {

  if (
    this.logic.estado === EstadoJuego.TURNO_JUGADOR &&
    this.logic.turnoJugador
  ) {

    this.tweens.add({
      targets: container,
      y: y - 15,
      duration: 120
    });
  }
});
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, y, duration: 120 });
      });
      container.on('pointerdown', () => {

  if (
    this.logic.estado !== EstadoJuego.TURNO_JUGADOR ||
    !this.logic.turnoJugador
  ) {
    return;
  }

  this.logic.jugarCarta(carta, true);
});

      this._nodosCartasJugador.push(container);
    });
  }

  _dibujarManoRival(cantidad) {
    this._nodosCartasRival.forEach(c => c.destroy());
    this._nodosCartasRival = [];

    if (cantidad === 0) return;

    const startX = MESA_X - ((cantidad - 1) * (CARD_W + CARD_GAP)) / 2;
    const y      = 68;

    for (let i = 0; i < cantidad; i++) {
      const x         = startX + i * (CARD_W + CARD_GAP);
      const container = this.add.container(x, y);

      if (this.textures.exists('carta_reverso')) {
        container.add(this.add.image(0, 0, 'carta_reverso').setDisplaySize(CARD_W, CARD_H));
      } else {
        container.add(
          this.add.rectangle(0, 0, CARD_W, CARD_H, 0x2a1608).setStrokeStyle(1.5, 0x7a5030)
        );
        container.add(
          this.add.text(0, 0, '?', { fontSize: '22px', color: '#7a5030' }).setOrigin(0.5)
        );
      }

      this._nodosCartasRival.push(container);
    }
  }

  _mostrarCartaMesa(carta, esJugador) {
    const x   = esJugador ? MESA_X + 60 : MESA_X - 60;
    const y   = H / 2;
    const key = carta.clave();
    const container = this.add.container(x, y);

    if (this.textures.exists(key)) {
      container.add(this.add.image(0, 0, key).setDisplaySize(CARD_W, CARD_H));
    } else {
      const cols = { 0:0xc0392b, 1:0x2c3e50, 2:0xf39c12, 3:0x8e44ad };
      container.add(this.add.rectangle(0, 0, CARD_W, CARD_H, cols[carta.palo] ?? 0x555555)
        .setStrokeStyle(1.5, 0xffffff, 0.4));
      container.add(this.add.text(0, -14, String(carta.numero), {
        fontSize: '20px', color: '#fff', fontStyle: 'bold'
      }).setOrigin(0.5));
      container.add(this.add.text(0, 14, ['E','B','O','C'][carta.palo], {
        fontSize: '13px', color: '#fff'
      }).setOrigin(0.5));
    }

    if (esJugador) {
      if (this._cartaEnMesaJugador) this._cartaEnMesaJugador.destroy();
      this._cartaEnMesaJugador = container;
    } else {
      if (this._cartaEnMesaRival) this._cartaEnMesaRival.destroy();
      this._cartaEnMesaRival = container;
    }
  }

  _limpiarMesa() {
    if (this._cartaEnMesaJugador) { this._cartaEnMesaJugador.destroy(); this._cartaEnMesaJugador = null; }
    if (this._cartaEnMesaRival)   { this._cartaEnMesaRival.destroy();   this._cartaEnMesaRival   = null; }
  }

  _actualizarBazas() {
    const listaBazas = this.logic.bazas.bazas; 
    
    this._bazaIndicadores.forEach((ind, i) => {
      if (i >= listaBazas.length) { 
        ind.setFillStyle(0x333333); 
        return; 
      }
      const col = { jugador:0x34a853, rival:0xe24b4a, empate:0xEF9F27 }[listaBazas[i].ganador] ?? 0x555555;
      ind.setFillStyle(col);
    });
  }

  _onCartasRepartidas(manoJ, manoR) {
  this._limpiarMesa();

  this._dibujarManoJugador(manoJ);
  this._dibujarManoRival(manoR.length);

  this._actualizarBotones();
  this._actualizarBazas();

  this._actualizarIndicadorMano();

  this._lblEstado.setText(
    this.logic.turnoJugador
      ? 'Tu turno'
      : 'Turno rival'
  );

  if (
  this.logic.estado === EstadoJuego.TURNO_RIVAL
) {
  this.time.delayedCall(
    1000,
    () => this._turnoIA()
  );
}
}

  _onCartaJugada(carta, esJugador) {
    if (esJugador) {
      this._dibujarManoJugador(this.logic.manoJugador);
      this._mostrarCartaMesa(carta, true);
      if (this.logic.estado === EstadoJuego.TURNO_RIVAL)
        this.time.delayedCall(900, () => this._turnoIA());
    } else {
      this._dibujarManoRival(this.logic.manoRival.length);
      this._mostrarCartaMesa(carta, false);
    }
    this._actualizarBotones();
  }

  _onBazaResuelta(ganador) {
    const msgs = { jugador:'Ganaste la baza', rival:'Rival ganó la baza', empate:'= Empate' };
    this._lblEstado.setText(msgs[ganador] ?? '');
    this._actualizarBazas();
    this.time.delayedCall(1200, () => {
      this._limpiarMesa();
      this._lblEstado.setText('');
      if (this.logic.estado === EstadoJuego.TURNO_JUGADOR) {
      this._lblEstado.setText('Tu turno');
    } else if (
      this.logic.estado === EstadoJuego.TURNO_RIVAL
    ) {
      this._lblEstado.setText('Turno rival');
    }
      if (this.logic.estado === EstadoJuego.TURNO_RIVAL) {
        this._turnoIA();
      }
    });
    
  }

  _onTrucoCantado(_nivel, quien) {
    if (quien === 'rival') {
      this._mostrarFrase(this.ia.fraseTruco());
      this._respuestaActual = 'truco';
    }
    this._actualizarBotones();
  }

  _onEnvidoCantado(_nivel, quien) {
    if (quien === 'rival') {
      this._mostrarFrase(this.ia.fraseEnvido());
      this._respuestaActual = 'envido';
    }
    this._actualizarBotones();
  }

  _onRespuestaRequerida(tipo) {
    const quienCanto = tipo === 'truco'
      ? this.logic.truco.quienCanto
      : this.logic.envido.quienCanto;

    if (quienCanto === 'jugador') {
      this.time.delayedCall(1000, () => {
        const resp = tipo === 'truco'
          ? this.ia.responderTruco()
          : this.ia.responderEnvido();

        this._mostrarCartelRespuesta(false, resp);
        
        if (resp === Respuesta.QUIERO) {
          this._mostrarFrase(tipo === 'truco' ? "¡Acepto el reto! Jugá..." : "¡Quiero! Veamos quién tiene más.");
        } else {
          this._mostrarFrase("Paso, no te tengo fe esta vuelta.");
        }

        this.time.delayedCall(1500, () => {
          if (tipo === 'truco')  this.logic.responderTruco(resp);
          if (tipo === 'envido') this.logic.responderEnvido(resp);
          this._actualizarBotones();

          if (this.logic.estado === EstadoJuego.TURNO_JUGADOR) {
            this._lblEstado.setText('Tu turno');
          } else if (this.logic.estado === EstadoJuego.TURNO_RIVAL) {
            this._lblEstado.setText('Turno rival');
            this.time.delayedCall(1000, () => this._turnoIA());
          }
        });
      });
    }
  }

  _onPuntosActualizados(ptsJ, ptsR) {
    this._lblPtsJugador.setText(`Vos: ${ptsJ}`);
    this._lblPtsRival.setText(`Rival: ${ptsR}`);
  }

  _onManoTerminada(ganador) {
    if (this.logic.puntosJugador >= this.puntosParaGanar || 
      this.logic.puntosRival >= this.puntosParaGanar) {
      return; 
    }
    const msg = ganador === 'jugador' ? '¡Ganaste la mano!' : 'Ganó el rival.';
    this._lblEstado.setText(msg);
    this.time.delayedCall(2200, () => this.logic.iniciarMano());
  }
  
  _onPartidaTerminada(ganador) {
    const esJugador = ganador === 'jugador';

    this._mostrarAnuncioFinal(esJugador ? '¡GANASTE!' : '¡PERDISTE!');

    this.time.delayedCall(500, () => {
      this._mostrarFrase(esJugador ? this.ia.fraseDerrota() : this.ia.fraseVictoria());
    });

    if (esJugador) {
      this._onAuraGanada(this.recompensaAura);

      const ORDEN = ['tierra_del_fuego', 'santa_cruz', 'buenos_aires', 'santa_fe', 'cordoba', 'san_juan', 'salta'];
      const indexActual = ORDEN.indexOf(this.provinciaId);
      const siguienteProvincia = ORDEN[indexActual + 1] || this.provinciaId;

      this.time.delayedCall(4000, () => {
        this.scene.start('AuraShop', {
          aura: this.aura,
          recompensaAura: 0,
          provinciaId: this.provinciaId,
          powerupsActivos: this.powerupsActivos,
          provinciasDesbloq: [...this.provinciasDesbloq, siguienteProvincia],
          provinciaActual: siguienteProvincia
        });
      });
    } else {
      this.time.delayedCall(4000, () => {
        this._mostrarMenuRevancha();
      });
    }
  }
  
  _onAuraGanada(cantidad) {
    if (cantidad <= 0) return;

    this.aura += cantidad;
    this._lblAura.setText(this.aura.toString());

    const lbl = this.add.text(IZQ_W / 2, 240, `+${cantidad}`, {
      fontSize: '20px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: lbl, y: 210,
      alpha:   { from: 1, to: 0 },
      duration: 1300,
      onComplete: () => lbl.destroy()
    });
  }

  _turnoIA() {
    if (this.logic.estado !== EstadoJuego.TURNO_RIVAL) return;

    const dec = this.ia.decidirJugada();
    switch (dec.accion) {
      case 'jugar_carta':
        this.logic.jugarCartaPorIndice(dec.indice, false);
        if (this.logic.estado === EstadoJuego.TURNO_RIVAL)
          this.time.delayedCall(1400, () => this._turnoIA());
        break;
      case 'cantar_truco':
        this.logic.cantarTruco('rival');
        break;
      case 'cantar_envido':
        this.logic.cantarEnvido(dec.nivelEnvido, 'rival');
        break;
      case 'ir_al_mazo':
        this.logic.irAlMazo('rival');
        break;
    }
    this._actualizarBotones();
  }
  
  _mostrarAnuncioFinal(texto) {
    const cx = W / 2;
    const cy = H / 2;

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(100)
      .setAlpha(0);

    const mensaje = this.add.text(cx, cy, texto, {
      fontSize: '84px',
      color: texto.includes('GANASTE') ? '#EF9F27' : '#e24b4a',
      fontFamily: "'Press Start 2P', monospace",
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5).setDepth(101).setScale(0.5).setAlpha(0);

    this.tweens.add({ targets: overlay, alpha: 1, duration: 400 });
    
    this.tweens.add({
      targets: mensaje,
      alpha: 1,
      scale: 1.1,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: mensaje,
          scale: 1,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }

  _mostrarMenuRevancha() {
    const cx = W / 2;
    const cy = H / 2;

    this.add.rectangle(0, 0, W, H, 0x000000, 0.85).setOrigin(0).setDepth(200);

    this.add.rectangle(cx, cy, 420, 200, 0x1a0e06)
      .setStrokeStyle(2, 0x7a3030).setDepth(201);

    this.add.text(cx, cy - 40, '¿QUERÉS LA REVANCHA?', {
      fontSize: '22px', color: '#e8c88a', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5).setDepth(201);

    const btnSiBg = this.add.rectangle(cx - 105, cy + 35, 170, 45, 0x2a1200)
      .setStrokeStyle(1.5, 0xEF9F27).setInteractive({ useHandCursor: true }).setDepth(201);
      
    const btnSiTxt = this.add.text(cx - 105, cy + 35, '▶ SÍ, OTRA VEZ', {
      fontSize: '14px', color: '#EF9F27', fontStyle: 'bold', 
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5).setDepth(201);

    btnSiBg.on('pointerover', () => btnSiBg.setFillStyle(0x4a2000));
    btnSiBg.on('pointerout',  () => btnSiBg.setFillStyle(0x2a1200));
    btnSiBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart());
    });

    const btnNoBg = this.add.rectangle(cx + 105, cy + 35, 170, 45, 0x1a0e06)
      .setStrokeStyle(1, 0x555555).setInteractive({ useHandCursor: true }).setDepth(201);
      
    const btnNoTxt = this.add.text(cx + 105, cy + 35, '↩ VOLVER AL MAPA', {
      fontSize: '12px', color: '#888888', fontStyle: 'bold', 
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5).setDepth(201);

    btnNoBg.on('pointerover', () => { 
      btnNoBg.setFillStyle(0x2a1608); btnNoBg.setStrokeStyle(1, 0xEF9F27); btnNoTxt.setColor('#EF9F27'); 
    });
    btnNoBg.on('pointerout', () => { 
      btnNoBg.setFillStyle(0x1a0e06); btnNoBg.setStrokeStyle(1, 0x555555); btnNoTxt.setColor('#888888'); 
    });
    btnNoBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CampaignMap', {
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

  _mostrarCartelRespuesta(esJugador, respuesta) {
    const x = MESA_X;
    const y = esJugador ? H / 2 + 120 : H / 2 - 120;
    const texto = respuesta === Respuesta.QUIERO ? '¡QUIERO!' : '¡NO QUIERO!';
    const color = respuesta === Respuesta.QUIERO ? '#34a853' : '#e24b4a';

    const cartel = this.add.text(x, y, texto, {
      fontSize: '36px',
      color: color,
      fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace",
      stroke: '#000000',
      strokeThickness: 5,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(200).setScale(0);

    this.tweens.add({
      targets: cartel,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: cartel,
          alpha: 0,
          delay: 1200,
          duration: 300,
          onComplete: () => cartel.destroy()
        });
      }
    });
  }

  update() {}
}
