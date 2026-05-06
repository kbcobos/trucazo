import { Carta, Palo } from "./Carta.js";
import { EstadoJuego } from "./GameConstants.js";
import { TrucoManager } from "./TrucoManager.js";

export class GameEngine {
  constructor(puntosParaGanar = 15) {
    this.puntosParaGanar = puntosParaGanar;
    this.trucoManager = new TrucoManager();

    // Estado global
    this.estado = EstadoJuego.ESPERANDO;

    // Puntaje
    this.puntosJugador = 0;
    this.puntosRival = 0;

    // Mano actual
    this.manoJugador = [];
    this.manoRival = [];
    this.bazas = [];

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival = null;

    // Turnos
    this.turnoJugador = true;

    // Puntos en juego
    this.puntosTrucoEnJuego = 1;
    this.puntosEnvidoEnJuego = 0;

    // Extras
    this.powerupsActivos = [];
    this.auraGanadaMano = 0;

    // Eventos
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
    
    _crearMazo() {
        const numeros = [1,2,3,4,5,6,7,10,11,12];
        const mazo = [];

        for (const palo of [Palo.ESPADA, Palo.BASTO, Palo.ORO, Palo.COPA]) {
        for (const num of numeros) {
            mazo.push(new Carta(num, palo));
        }
        }

        return mazo;
    }

    _mezclar(mazo) {
        for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
        }
        return mazo;
    }

    iniciarMano() {
    this.manoJugador = [];
    this.manoRival = [];
    this.bazas = [];
    this.truco.reset();
    this.cartaJugadaJugador = null;
    this.cartaJugadaRival = null;

    this.puntosTrucoEnJuego = 1;
    this.puntosEnvidoEnJuego = 0;
    this.auraGanadaMano = 0;

    const mazo = this._mezclar(this._crearMazo());

    for (let i = 0; i < 3; i++) {
      this.manoJugador.push(mazo[i]);
      this.manoRival.push(mazo[i + 3]);
    }

    this.estado = EstadoJuego.TURNO_JUGADOR;

    this.emit('cartasRepartidas', [...this.manoJugador], [...this.manoRival]);
  }

    jugarCarta(carta, esJugador) {
    if (esJugador) {
      if (!this.turnoJugador) return;

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

    _resolverBaza() {
    this.estado = EstadoJuego.RESOLVIENDO_BAZA;

    const ganador = this._compararCartas(
      this.cartaJugadaJugador,
      this.cartaJugadaRival
    );

    this.bazas.push({
      jugador: this.cartaJugadaJugador,
      rival: this.cartaJugadaRival,
      ganador
    });

    this.emit('bazaResuelta', ganador, this.puntosTrucoEnJuego);

    if (ganador === 'jugador') {
      this.auraGanadaMano += 10;
    }

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival = null;

    if (this.bazas.length === 3 || this._hayGanadorAnticipado()) {
      this._resolverMano();
    } else {
      this.turnoJugador = ganador !== 'rival';

      this.estado = this.turnoJugador
        ? EstadoJuego.TURNO_JUGADOR
        : EstadoJuego.TURNO_RIVAL;
    }
  }

    _compararCartas(cJ, cR) {
    if (cJ.valorTruco < cR.valorTruco) return 'jugador';
    if (cJ.valorTruco > cR.valorTruco) return 'rival';
    return 'empate';
  }

    _resolverMano() {
    const ganador = this._determinarGanadorMano();

    this.estado = EstadoJuego.FIN_MANO;

    const puntos = this.puntosTrucoEnJuego;

    if (ganador === 'jugador') {
      this.puntosJugador += puntos;
      this.emit('auraGanada', this.auraGanadaMano);
    } else {
      this.puntosRival += puntos;
    }

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.emit('manoTerminada', ganador);

    this._comprobarGanadorPartida();
  }

  _hayGanadorAnticipado() {
  let wJ = 0, wR = 0;

  for (const b of this.bazas) {
    if (b.ganador === 'jugador') wJ++;
    else if (b.ganador === 'rival') wR++;
  }

  return wJ >= 2 || wR >= 2;
}

_determinarGanadorMano() {
  let wJ = 0, wR = 0;
  let primerGanador = '';

  for (let i = 0; i < this.bazas.length; i++) {
    const b = this.bazas[i];

    if (b.ganador === 'jugador') wJ++;
    else if (b.ganador === 'rival') wR++;

    if (i === 0 && b.ganador !== 'empate') {
      primerGanador = b.ganador;
    }
  }

  if (wJ >= 2) return 'jugador';
  if (wR >= 2) return 'rival';

  if (wJ === 1 && primerGanador === 'jugador') return 'jugador';
  if (wR === 1 && primerGanador === 'rival') return 'rival';

  return 'jugador';
}

_comprobarGanadorPartida() {
  if (this.puntosJugador >= this.puntosParaGanar) {
    this.estado = EstadoJuego.FIN_PARTIDA;
    this.emit('partidaTerminada', 'jugador');
    return true;
  }

  if (this.puntosRival >= this.puntosParaGanar) {
    this.estado = EstadoJuego.FIN_PARTIDA;
    this.emit('partidaTerminada', 'rival');
    return true;
  }

  return false;
}

}

