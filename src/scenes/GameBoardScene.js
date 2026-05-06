import Phaser from 'phaser';
import {
  TrucoLogic, EstadoJuego,
  LlamadaTruco, LlamadaEnvido, Respuesta
} from '../logic/trucoLogic.js';
import { IAJefe } from '../logic/iaJefe.js';

const W = 960;
const H = 540;


const IZQ_W  = 175;
const DER_X  = 785;
const DER_W  = 175;
const MESA_X = IZQ_W + (DER_X - IZQ_W) / 2;

const CARD_W  = 100;
const CARD_H  = 140;
const CARD_GAP = 10;

export class GameBoardScene extends Phaser.Scene {
  constructor() { super('GameBoard'); }

  init(data) {
    this.provinciaId     = data.provinciaId     ?? 'tierra_del_fuego';
    this.jefeNombre      = data.jefeNombre       ?? 'Rival';
    this.puntosParaGanar = data.puntosParaGanar  ?? 15;
    this.recompensaAura  = data.recompensaAura   ?? 80;
    this.powerupsActivos = data.powerupsActivos  ?? [];
    this.aura            = data.aura             ?? 0;
  }

preload() {
  this.load.on('loaderror', (file) => {
    console.error('No se pudo cargar:', file.key, 'en la ruta:', file.src);
  });

  const palos = ['espada', 'basto', 'oro', 'copa'];
  const nums  = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  
  for (const palo of palos) {
    for (const num of nums) {
// Esto se transformará en "espada_1", "basto_5", "oro_12", etc.
      const clave = `${palo}_${num}`;

      // Esto se transformará en la ruta correcta para cada imagen
      const ruta = `assets/cards/${palo}_${num}.jpeg`;
      
      // 3. Cargamos la imagen
      this.load.image("espada_1", "assets/cards/espada_1.jpeg");
      this.load.image("espada_2", "assets/cards/espada_2.jpeg");
      this.load.image("espada_3", "assets/cards/espada_3.jpeg");
      this.load.image("espada_4", "assets/cards/espada_4.jpeg");
      this.load.image("espada_5", "assets/cards/espada_5.jpeg");
      this.load.image("espada_6", "assets/cards/espada_6.jpeg");
      this.load.image("espada_7", "assets/cards/espada_7.jpeg");
      this.load.image("espada_10", "assets/cards/espada_10.jpeg");
      this.load.image("espada_11", "assets/cards/espada_11.jpeg");
      this.load.image("espada_12", "assets/cards/espada_12.jpeg");
      this.load.image("basto_1", "assets/cards/basto_1.jpeg");
      this.load.image("basto_2", "assets/cards/basto_2.jpeg");
      this.load.image("basto_3", "assets/cards/basto_3.jpeg");
      this.load.image("basto_4", "assets/cards/basto_4.jpeg");
      this.load.image("basto_5", "assets/cards/basto_5.jpeg");
      this.load.image("basto_6", "assets/cards/basto_6.jpeg");
      this.load.image("basto_7", "assets/cards/basto_7.jpeg");
      this.load.image("basto_10", "assets/cards/basto_10.jpeg");
      this.load.image("basto_11", "assets/cards/basto_11.jpeg");
      this.load.image("basto_12", "assets/cards/basto_12.jpeg");
      this.load.image("oro_1", "assets/cards/oro_1.jpeg");
      this.load.image("oro_2", "assets/cards/oro_2.jpeg");
      this.load.image("oro_3", "assets/cards/oro_3.jpeg");
      this.load.image("oro_4", "assets/cards/oro_4.jpeg");
      this.load.image("oro_5", "assets/cards/oro_5.jpeg");
      this.load.image("oro_6", "assets/cards/oro_6.jpeg");
      this.load.image("oro_7", "assets/cards/oro_7.jpeg");
      this.load.image("oro_10", "assets/cards/oro_10.jpeg");
      this.load.image("oro_11", "assets/cards/oro_11.jpeg");
      this.load.image("oro_12", "assets/cards/oro_12.jpeg");
      this.load.image("copa_1", "assets/cards/copa_1.jpeg");
      this.load.image("copa_2", "assets/cards/copa_2.jpeg");
      this.load.image("copa_3", "assets/cards/copa_3.jpeg");
      this.load.image("copa_4", "assets/cards/copa_4.jpeg");
      this.load.image("copa_5", "assets/cards/copa_5.jpeg");
      this.load.image("copa_6", "assets/cards/copa_6.jpeg");
      this.load.image("copa_7", "assets/cards/copa_7.jpeg");
      this.load.image("copa_10", "assets/cards/copa_10.jpeg");
      this.load.image("copa_11", "assets/cards/copa_11.jpeg");
      this.load.image("copa_12", "assets/cards/copa_12.jpeg");
    }
  }

  this.load.image('carta_reverso', 'assets/cards/reverso.jpeg');
  this.load.image('fondo_mesa', 'assets/ui/fondo_mesa.jpeg');
}

  create() {
    this.logic = new TrucoLogic(this.puntosParaGanar);
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
    this._crearPanelIzquierdo();
    this._crearPanelDerecho();
    this._crearLabelEstado();
    this._crearLabelFrase();

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Arrancar primera mano
    this.logic.iniciarMano();
  }

  // ────────────────────────────────────────────────────────
  // FONDO
  // ────────────────────────────────────────────────────────

_crearFondo() {
  // 1. Fondo negro base
  this.add.rectangle(0, 0, W, H, 0x0d1a0d).setOrigin(0);

  // 2. Imagen de la mesa
  if (this.textures.exists('fondo_mesa')) {
    this.add.image(W / 2, H / 2, 'fondo_mesa')
      .setDisplaySize(W, H)
      .setDepth(0); // Forzamos que esté al fondo
  } else {
    // Si la imagen falla, dibujamos el verde
    this.add.rectangle(MESA_X, H / 2, DER_X - IZQ_W, H, 0x0d2b0d, 0.85).setOrigin(0.5);
  }

  // 3. Paneles laterales (estos van ARRIBA del fondo, por eso van después)
  this.add.rectangle(0, 0, IZQ_W, H, 0x080402, 0.88).setOrigin(0);
  this.add.rectangle(DER_X, 0, DER_W, H, 0x080402, 0.88).setOrigin(0);
}

  // ────────────────────────────────────────────────────────
  // PANEL IZQUIERDO — Info + puntos
  // ────────────────────────────────────────────────────────

  _crearPanelIzquierdo() {
    const cx = IZQ_W / 2;

    // Nombre del jefe
    this.add.text(cx, 22, this.ia.getNombre(), {
      fontSize: '18px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: IZQ_W - 14 }, align: 'center'
    }).setOrigin(0.5);

    this.add.text(cx, 42, `"${this.ia.getApodo()}"`, {
      fontSize: '14px', color: '#c09060',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.rectangle(cx, 56, IZQ_W - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    // Puntos
    this._lblPtsRival = this.add.text(cx, 74, 'Rival: 0', {
      fontSize: '13px', color: '#e8c88a', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._lblPtsJugador = this.add.text(cx, 94, 'Vos: 0', {
      fontSize: '13px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.text(cx, 112, `Meta: ${this.puntosParaGanar} pts`, {
      fontSize: '12px', color: '#7a5030',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this.add.rectangle(cx, 126, IZQ_W - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    // Bazas
    this.add.text(cx, 144, 'BAZAS', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 3,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._bazaIndicadores = [];
    for (let i = 0; i < 3; i++) {
      const ind = this.add.rectangle(cx - 24 + i * 24, 164, 18, 18, 0x333333)
        .setStrokeStyle(1, 0x7a5030);
      this._bazaIndicadores.push(ind);
    }

    this.add.rectangle(cx, 184, IZQ_W - 18, 1, 0xc09060, 0.2).setOrigin(0.5);

    // Aura
    this.add.text(cx, 200, 'AURA', {
      fontSize: '9px', color: '#7a5030', letterSpacing: 3,
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);

    this._lblAura = this.add.text(cx, 220, `🪙 ${this.aura}`, {
      fontSize: '14px', color: '#EF9F27', fontStyle: 'bold',
      fontFamily: "'Chakra Petch', monospace"
    }).setOrigin(0.5);
  }

  // ────────────────────────────────────────────────────────
  // PANEL DERECHO — Botones de acción
  // ────────────────────────────────────────────────────────

  _crearPanelDerecho() {
    const cx  = DER_X + DER_W / 2;
    const bW  = DER_W - 18;
    const bH  = 36;
    const gap = 7;

    // Definición de botones con sus posiciones Y
    const defs = [
      // ─ Truco ─
      { id:'truco',      label:'TRUCO',       y:50  },
      { id:'retruco',    label:'RETRUCO',     y:50  + bH + gap },
      { id:'valecuatro', label:'VALE CUATRO', y:50  + (bH + gap) * 2 },
      // ─ Envido ─
      { id:'envido', label:'ENVIDO',    y:210 },
      { id:'real',   label:'REAL ENV',  y:210 + bH + gap },
      { id:'falta',  label:'FALTA ENV', y:210 + (bH + gap) * 2 },
      // ─ Respuestas ─
      { id:'quiero',   label:'✓ QUIERO',    y:370, col:0x1a3a1a, brd:0x34a853 },
      { id:'noquiero', label:'✗ NO QUIERO', y:370 + bH + gap, col:0x3a1a1a, brd:0xe24b4a },
      // ─ Mazo ─
      { id:'mazo', label:'IR AL MAZO', y:490, col:0x1a1a1a, brd:0x555555 },
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

    // Títulos de sección
    this.add.text(cx, 32,  'TRUCO',  { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);
    this.add.text(cx, 192, 'ENVIDO', { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);
    this.add.text(cx, 352, 'CANTOS', { fontSize:'9px', color:'#7a5030', letterSpacing:3, fontFamily:"'Chakra Petch', monospace" }).setOrigin(0.5);

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
    if (this._respuestaActual === 'truco')  this.logic.responderTruco(resp);
    if (this._respuestaActual === 'envido') this.logic.responderEnvido(resp);
    this._respuestaActual = null;
    this._actualizarBotones();
    if (this.logic.estado === 'turno_rival') {
      this.time.delayedCall(800, () => this._turnoIA());
    }
  }

  _actualizarBotones() {
    const l        = this.logic;
    const esT      = l.estado === EstadoJuego.TURNO_JUGADOR;
    const hayRT    = l.quienCantoTruco  === 'rival' && l.respuestaTruco  === Respuesta.PENDIENTE;
    const hayRE    = l.quienCantoEnvido === 'rival' && l.respuestaEnvido === Respuesta.PENDIENTE;
    const puedeEnv = esT && l.puedeCantarEnvido('jugador');
    const puedeT   = esT && l.puedeCantarTruco('jugador');

    this._setBtn('truco',      puedeT && l.trucoActual === LlamadaTruco.NINGUNA);
    this._setBtn('retruco',    puedeT && l.trucoActual === LlamadaTruco.TRUCO);
    this._setBtn('valecuatro', puedeT && l.trucoActual === LlamadaTruco.RETRUCO);
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

  // ────────────────────────────────────────────────────────
  // LABELS DE ESTADO Y FRASE
  // ────────────────────────────────────────────────────────

  _crearLabelEstado() {
    // Label de estado centrado en la mesa (centro vertical)
    this._lblEstado = this.add.text(MESA_X, H / 2, '', {
      fontSize: '13px', color: '#a08060',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: 300 }, align: 'center'
    }).setOrigin(0.5).setDepth(5);
  }

  _crearLabelFrase() {
    this._labelFrase = this.add.text(MESA_X, H / 2 + 30, '', {
      fontSize: '12px', color: '#EF9F27', fontStyle: 'italic',
      fontFamily: "'Chakra Petch', monospace",
      wordWrap: { width: 360 }, align: 'center'
    }).setOrigin(0.5).setDepth(5);
  }

  _mostrarFrase(txt) {
    this._labelFrase.setText(txt).setAlpha(1);
    this.tweens.add({ targets: this._labelFrase, alpha: 0, delay: 2500, duration: 700 });
  }

  // ────────────────────────────────────────────────────────
  // DIBUJAR CARTAS EN MANO
  // ────────────────────────────────────────────────────────

  _dibujarManoJugador(mano) {
    // Destruir contenedores anteriores
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
        // Imagen real
        const img = this.add.image(0, 0, key).setDisplaySize(CARD_W, CARD_H);
        container.add(img);
      } else {
        // Placeholder con colores por palo
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

      // Interactividad sobre el container
      container.setSize(CARD_W, CARD_H);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        if (this.logic.estado === EstadoJuego.TURNO_JUGADOR)
          this.tweens.add({ targets: container, y: y - 15, duration: 120 });
      });
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, y, duration: 120 });
      });
      container.on('pointerdown', () => {
        if (this.logic.estado !== EstadoJuego.TURNO_JUGADOR) return;
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

  // ────────────────────────────────────────────────────────
  // CARTAS EN MESA
  // ────────────────────────────────────────────────────────

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

  // ────────────────────────────────────────────────────────
  // INDICADORES DE BAZAS
  // ────────────────────────────────────────────────────────

  _actualizarBazas() {
    const bazas = this.logic.bazas;
    this._bazaIndicadores.forEach((ind, i) => {
      if (i >= bazas.length) { ind.setFillStyle(0x333333); return; }
      const col = { jugador:0x34a853, rival:0xe24b4a, empate:0xEF9F27 }[bazas[i].ganador] ?? 0x555555;
      ind.setFillStyle(col);
    });
  }

  // ────────────────────────────────────────────────────────
  // HANDLERS DE EVENTOS
  // ────────────────────────────────────────────────────────

  _onCartasRepartidas(manoJ, manoR) {
    this._limpiarMesa();
    this._dibujarManoJugador(manoJ);
    this._dibujarManoRival(manoR.length);
    this._actualizarBotones();
    this._actualizarBazas();
    this._lblEstado.setText('Tu turno');
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
    const msgs = { jugador:'✓ Ganaste la baza', rival:'✗ Rival ganó la baza', empate:'= Empate' };
    this._lblEstado.setText(msgs[ganador] ?? '');
    this._actualizarBazas();
    this.time.delayedCall(1200, () => {
      this._limpiarMesa();
      this._lblEstado.setText('');
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
      ? this.logic.quienCantoTruco
      : this.logic.quienCantoEnvido;

    if (quienCanto === 'jugador') {
      this.time.delayedCall(1000, () => {
        const resp = tipo === 'truco'
          ? this.ia.responderTruco()
          : this.ia.responderEnvido();
        if (tipo === 'truco')  this.logic.responderTruco(resp);
        if (tipo === 'envido') this.logic.responderEnvido(resp);
        this._actualizarBotones();
        if (this.logic.estado === EstadoJuego.TURNO_RIVAL) {
          this.time.delayedCall(800, () => this._turnoIA());
        }
      });
    }
  }

  _onPuntosActualizados(ptsJ, ptsR) {
    this._lblPtsJugador.setText(`Vos: ${ptsJ}`);
    this._lblPtsRival.setText(`Rival: ${ptsR}`);
  }

  _onManoTerminada(ganador) {
    const msg = ganador === 'jugador' ? '¡Ganaste la mano!' : 'Ganó el rival.';
    this._lblEstado.setText(msg);
    this.time.delayedCall(2200, () => this.logic.iniciarMano());
  }

  _onPartidaTerminada(ganador) {
    if (ganador === 'jugador') {
      this._mostrarFrase(this.ia.fraseDerrota());
      this.time.delayedCall(2500, () => {
        this.scene.start('AuraShop', {
          aura:            this.aura,
          recompensaAura:  this.recompensaAura,
          provinciaId:     this.provinciaId,
          powerupsActivos: this.powerupsActivos
        });
      });
    } else {
      this._mostrarFrase(this.ia.fraseVictoria());
      this.time.delayedCall(2500, () => {
        this.scene.start('GameBoard', {
          provinciaId:     this.provinciaId,
          jefeNombre:      this.jefeNombre,
          puntosParaGanar: this.puntosParaGanar,
          recompensaAura:  this.recompensaAura,
          powerupsActivos: this.powerupsActivos,
          aura:            this.aura
        });
      });
    }
  }

  _onAuraGanada(cantidad) {
    this.aura += cantidad;
    this._lblAura.setText(`🪙 ${this.aura}`);

    // Animación +Aura flotante
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

  // ────────────────────────────────────────────────────────
  // TURNO IA
  // ────────────────────────────────────────────────────────

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

  update() {}
}
