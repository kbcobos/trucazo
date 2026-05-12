import { Palo, EstadoJuego, LlamadaTruco, LlamadaEnvido, Respuesta } from './core/Enums.js';
import { Carta } from './core/Carta.js';
import { TrucoManager } from './managers/TrucoManager.js';
import { EnvidoManager } from './managers/EnvidoManager.js';
import { BazaManager } from './managers/BazaManager.js';

export class GameEngine {
  constructor(puntosParaGanar = 15) {
    this.puntosParaGanar = puntosParaGanar;
    this.puntosJugador  = 0;
    this.puntosRival    = 0;

    this.truco   = new TrucoManager();
    this.envido  = new EnvidoManager();
    this.bazas   = new BazaManager();

    this.estado = EstadoJuego.ESPERANDO;
    this.manoJugador = [];
    this.manoRival   = [];
    
    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;
    this.turnoJugador = true;
    
    this.powerupsActivos = [];
    this.auraGanadaMano = 0;
    this._listeners = {};
  }

  on(evento, callback) {
    if (!this._listeners[evento]) this._listeners[evento] = [];
    this._listeners[evento].push(callback);
    return this;
  }

  emit(evento, ...args) {
    (this._listeners[evento] || []).forEach(cb => cb(...args));
  }

  iniciarMano() {
    this.truco.reset();
    this.envido.reset();
    this.bazas.reset();
    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;
    this.auraGanadaMano     = 0;

    const mazo = this._generarMazoMezclado();
    this.manoJugador = mazo.slice(0, 3);
    this.manoRival   = mazo.slice(3, 6);

    this.estado = EstadoJuego.TURNO_JUGADOR;
    this.emit('cartasRepartidas', [...this.manoJugador], [...this.manoRival]);
  }

  _generarMazoMezclado() {
    const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const mazo = [];
    for (const palo of [Palo.ESPADA, Palo.BASTO, Palo.ORO, Palo.COPA]) {
      for (const num of numeros) mazo.push(new Carta(num, palo));
    }
    return mazo.sort(() => Math.random() - 0.5);
  }

  jugarCarta(carta, esJugador) {
    if (esJugador) {
      const idx = this.manoJugador.findIndex(c => c.esIgual(carta));
      if (idx === -1) return;
      this.manoJugador.splice(idx, 1);
      this.cartaJugadaJugador = carta;
      this.turnoJugador = false;
      this.estado = EstadoJuego.TURNO_RIVAL;
    } else {
      const idx = this.manoRival.findIndex(c => c.esIgual(carta));
      if (idx !== -1) this.manoRival.splice(idx, 1);
      this.cartaJugadaRival = carta;
      this.turnoJugador = true;
      this.estado = EstadoJuego.TURNO_JUGADOR;
    }

    this.emit('cartaJugada', carta, esJugador);

    if (this.cartaJugadaJugador && this.cartaJugadaRival) {
      this._resolverBaza();
    }
  }

  jugarCartaPorIndice(indice, esJugador) {
    const mano = esJugador ? this.manoJugador : this.manoRival;
    if (indice >= 0 && indice < mano.length) {
      this.jugarCarta(mano[indice], esJugador);
    }
  }

  _resolverBaza() {
    this.estado = EstadoJuego.RESOLVIENDO_BAZA;
    const ganador = this.bazas.compararCartas(this.cartaJugadaJugador, this.cartaJugadaRival);
    this.bazas.registrarBaza(ganador);

    this.emit('bazaResuelta', ganador);

    if (ganador === 'jugador') this.auraGanadaMano += 10;

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;

    if (this.bazas.cantidadBazas === 3 || this.bazas.hayGanadorAnticipado()) {
      this._resolverMano();
    } else {
      this.turnoJugador = (ganador !== 'rival');
      this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;
    }
  }

  _resolverMano() {
    const ganador = this.bazas.determinarGanadorMano();
    this.estado = EstadoJuego.FIN_MANO;

    // Calcular puntos de truco
    const pts = (this.truco.respuesta === Respuesta.QUIERO) 
                ? this.truco.getPuntosQuiero(this.truco.trucoActual) 
                : 1;

    if (ganador === 'jugador') {
      this.puntosJugador += pts;
      this.emit('auraGanada', this.auraGanadaMano);
    } else {
      this.puntosRival += pts;
    }

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.emit('manoTerminada', ganador);

    this._comprobarFinalPartida();
  }

  cantarTruco(quien) {
    const nivel = this.truco.siguienteNivel();
    if (!nivel) return;
    this.truco.trucoActual = nivel;
    this.truco.quienCanto = quien;
    this.truco.respuesta = Respuesta.PENDIENTE;
    this.estado = EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;
    this.emit('trucoCantado', nivel, quien);
    this.emit('respuestaRequerida', 'truco');
  }

  responderTruco(resp) {
    this.truco.respuesta = resp;
    if (resp === Respuesta.QUIERO) {
      this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;
    } else {
      const pts = this.truco.getPuntosNoQuiero(this.truco.trucoActual);
      if (this.truco.quienCanto === 'jugador') this.puntosJugador += pts;
      else this.puntosRival += pts;
      this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
      this._resolverMano();
    }
  }

  cantarEnvido(nivel, quien) {
    this.envido.envidoActual = nivel;
    this.envido.quienCanto = quien;
    this.estado = EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO;
    this.emit('envidoCantado', nivel, quien);
    this.emit('respuestaRequerida', 'envido');
  }

  responderEnvido(resp) {
    this.envido.respuesta = resp;
    if (resp === Respuesta.QUIERO) {
      const ptsJ = this.envido.calcularPuntosMano(this.manoJugador);
      const ptsR = this.envido.calcularPuntosMano(this.manoRival);
      const ptsJuego = this.envido.getPuntosEnJuego(this.envido.envidoActual, this.puntosParaGanar, this.puntosJugador, this.puntosRival);
      
      if (ptsJ >= ptsR) this.puntosJugador += ptsJuego;
      else this.puntosRival += ptsJuego;
      
      this.emit('envidoResuelto', ptsJ, ptsR);
    } else {
      const ptsNoQuiero = (this.envido.envidoActual === LlamadaEnvido.ENVIDO) ? 1 : 2;
      if (this.envido.quienCanto === 'jugador') this.puntosJugador += ptsNoQuiero;
      else this.puntosRival += ptsNoQuiero;
    }
    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;
  }

  irAlMazo(quien) {
    const pts = (this.truco.respuesta === Respuesta.QUIERO) ? this.truco.getPuntosQuiero(this.truco.trucoActual) : 1;
    if (quien === 'jugador') this.puntosRival += pts;
    else this.puntosJugador += pts;
    
    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this._resolverMano();
  }

  _comprobarFinalPartida() {
    if (this.puntosJugador >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'jugador');
    } else if (this.puntosRival >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'rival');
    }
  }

  puedeCantarTruco(quien) {
    if (![EstadoJuego.TURNO_JUGADOR, EstadoJuego.TURNO_RIVAL].includes(this.estado)) return false;
    if (this.truco.trucoActual === LlamadaTruco.VALE_CUATRO) return false;
    if (this.truco.quienCanto === quien && this.truco.respuesta === Respuesta.PENDIENTE) return false;

    return true;
  }

  puedeCantarEnvido(quien) {
    return this.bazas.cantidadBazas === 0 && 
           this.envido.envidoActual === LlamadaEnvido.NINGUNA &&
           this.estado !== EstadoJuego.RESOLVIENDO_BAZA &&
           this.cartaJugadaJugador === null && 
           this.cartaJugadaRival === null;
  }

  calcularEnvido(mano) { 
    return this.envido.calcularPuntosMano(mano); 
  }
}
