import { Carta, Palo } from "./Carta.js";
import { EstadoJuego } from "./GameConstants.js";
import { TrucoManager } from "./TrucoManager.js";
import { EnvidoManager } from "./EnvidoManager.js";
import { Respuesta } from "./GameConstants.js";

export class Mano {

  constructor({
    mano = 'jugador',
    puntosJugador = 0,
    puntosRival = 0,
    puntosParaGanar = 15
  }) {

    this.mano = mano;
    this.auraGanadaMano = 0;
    this.puntosJugador = puntosJugador;
    this.puntosRival = puntosRival;

    this.puntosParaGanar = puntosParaGanar;

    this.trucoManager =
      new TrucoManager();

    this.envidoManager =
      new EnvidoManager(
        puntosParaGanar
      );

    this.estado =
      EstadoJuego.ESPERANDO;

    this.turnoJugador =
      mano === 'jugador';

    this.manoJugador = [];
    this.manoRival = [];

    this.bazas = [];

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival = null;

    this.puntosTrucoEnJuego = 1;

    this._listeners = {};

    this._repartir();
  }

  // =========================
  // EVENTOS
  // =========================

  on(evento, callback) {

    if (!this._listeners[evento]) {
      this._listeners[evento] = [];
    }

    this._listeners[evento].push(callback);
  }

  emit(evento, ...args) {

    (this._listeners[evento] || [])
      .forEach(cb => cb(...args));
  }

  // =========================
// MAZO
// =========================

_crearMazo() {

  const numeros =
    [1,2,3,4,5,6,7,10,11,12];

  const mazo = [];

  for (const palo of [
    Palo.ESPADA,
    Palo.BASTO,
    Palo.ORO,
    Palo.COPA
  ]) {

    for (const num of numeros) {

      mazo.push(
        new Carta(num, palo)
      );
    }
  }

  return mazo;
}

_mezclar(mazo) {

  for (
    let i = mazo.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [mazo[i], mazo[j]] =
      [mazo[j], mazo[i]];
  }

  return mazo;
}

_repartir() {

  const mazo =
    this._mezclar(
      this._crearMazo()
    );

  for (let i = 0; i < 3; i++) {

    this.manoJugador.push(
      mazo[i]
    );

    this.manoRival.push(
      mazo[i + 3]
    );
  }

  this.estado =
    this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;

  this.emit(
    'cartasRepartidas',
    [...this.manoJugador],
    [...this.manoRival]
  );
}

// =========================
// INICIAR
// =========================

iniciar() {

  this.estado =
    this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;

  this.emit(
    'manoIniciada',
    {
      mano: this.mano
    }
  );
}

// =========================
// JUGAR CARTA
// =========================

jugarCarta(carta, esJugador) {

  if (esJugador) {

    if (!this.turnoJugador) {
      return;
    }

    const idx =
      this.manoJugador.findIndex(
        c => c.esIgual(carta)
      );

    if (idx === -1) {
      return;
    }

    this.manoJugador.splice(idx, 1);

    this.cartaJugadaJugador =
      carta;

    this.turnoJugador = false;

    this.estado =
      EstadoJuego.TURNO_RIVAL;
  }

  else {

    const idx =
      this.manoRival.findIndex(
        c => c.esIgual(carta)
      );

    if (idx !== -1) {

      this.manoRival.splice(idx, 1);
    }

    this.cartaJugadaRival =
      carta;

    this.turnoJugador = true;

    this.estado =
      EstadoJuego.TURNO_JUGADOR;
  }

  this.emit(
    'cartaJugada',
    carta,
    esJugador
  );

  if (
    this.cartaJugadaJugador &&
    this.cartaJugadaRival
  ) {
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

  const ganador =
    this._determinarGanadorMano();

  this.estado =
    EstadoJuego.FIN_MANO;

  this.emit(
    'manoTerminada',
    {
      ganador,
      puntos: this.puntosTrucoEnJuego
    }
  );
}

  _hayGanadorAnticipado() {

  const b1 = this.bazas[0];
  const b2 = this.bazas[1];

  // imposible definir antes de 2 bazas
  if (this.bazas.length < 2) {
    return false;
  }

  // =========================
  // ganó dos bazas
  // =========================

  let wJ = 0;
  let wR = 0;

  for (const b of this.bazas) {

    if (b.ganador === 'jugador') {
      wJ++;
    }

    else if (b.ganador === 'rival') {
      wR++;
    }
  }

  if (wJ >= 2 || wR >= 2) {
    return true;
  }

  // =========================
  // primera empate
  // segunda define
  // =========================

  if (
    b1.ganador === 'empate' &&
    b2.ganador !== 'empate'
  ) {
    return true;
  }

  // =========================
  // segunda empate
  // primera define
  // =========================

  if (
    b2.ganador === 'empate' &&
    b1.ganador !== 'empate'
  ) {
    return true;
  }

  return false;
}

_determinarGanadorMano() {

  const b1 = this.bazas[0];
  const b2 = this.bazas[1];
  const b3 = this.bazas[2];

  // =========================
  // 1 sola baza
  // =========================

  if (this.bazas.length === 1) {
    return null;
  }

  // =========================
  // 2 bazas
  // =========================

  if (this.bazas.length === 2) {

    // ganó ambas
    if (
      b1.ganador === b2.ganador &&
      b1.ganador !== 'empate'
    ) {
      return b1.ganador;
    }

    // parda primera
    if (b1.ganador === 'empate') {

      if (b2.ganador !== 'empate') {
        return b2.ganador === 'empate'
              ? this.mano
              : b2.ganador;
      }
    }

    // parda segunda
    if (b2.ganador === 'empate') {

      if (b1.ganador !== 'empate') {
        return b1.ganador;
      }
    }

    return null;
  }

  // =========================
  // 3 bazas
  // =========================

  let wJ = 0;
  let wR = 0;

  for (const b of this.bazas) {

    if (b.ganador === 'jugador') {
      wJ++;
    }

    else if (b.ganador === 'rival') {
      wR++;
    }
  }

  if (wJ > wR) return 'jugador';
  if (wR > wJ) return 'rival';

  // =========================
  // DESEMPATES
  // =========================

  // primera no fue empate
  if (b1.ganador !== 'empate') {
    return b1.ganador;
  }

  // segunda no fue empate
  if (b2.ganador !== 'empate') {
    return b2.ganador;
  }

  // tercera define
  if (b3 && b3.ganador !== 'empate') {
    return b3.ganador;
  }

  // triple empate
  return this.mano;
}

//===============================//

            // TRUCO //

//===============================//
cantarTruco(quien) {
  const res = this.trucoManager.cantar(quien);

  if (res.error) return;

  this.estado = EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;

  this.emit('trucoCantado', res.nivel, quien);
}

responderTruco(respuesta) {
  const res = this.trucoManager.responder(respuesta);

  if (res.accion === 'continuar') {
    this.puntosTrucoEnJuego = res.puntos;

    this.estado = this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;
  }

  if (res.accion === 'terminar_mano') {

  this.estado =
    EstadoJuego.FIN_MANO;

  this.emit(
    'manoTerminada',
    {
      ganador: res.ganador,
      puntos: res.puntos
    }
  );
}
}

puedeCantarTruco(quien) {

  //esperando respuesta
  if (
    this.estado ===
    EstadoJuego.ESPERANDO_RESPUESTA_TRUCO
  ) {
    return false;
  }

  //vale cuatro ya cantado
  if (
    this.trucoManager.nivel === 3
  ) {
    return false;
  }

  //mismo jugador subiendo su propio canto
  if (
    this.trucoManager.quienCanto === quien &&
    this.trucoManager.estaPendiente()
  ) {
    return false;
  }

  if (
  this.estado === EstadoJuego.FIN_MANO ||
  this.estado === EstadoJuego.FIN_PARTIDA
) {
  return false;
}

  return true;
}

//===============================//

            // ENVIDO //

//===============================//

cantarEnvido(tipo, quien) {

  if (!this.puedeCantarEnvido(tipo)) {

    console.warn(
      'No se puede cantar envido'
    );

    return;
  }

  const res =
    this.envidoManager.cantar(
      tipo,
      quien
    );

  if (res.error) {

    console.warn(res.error);

    return;
  }

  this.estado =
    EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO;

  this.emit(
    'envidoCantado',
    res
  );
}

responderEnvido(respuesta) {

  const res =
    this.envidoManager.responder(
      respuesta,
      this.manoJugador,
      this.manoRival
    );

  //NO QUIERO
  if (res.accion === 'rechazado') {

  this.emit(
    'envidoRechazado',
    res
  );

  return res;
}

  //QUIERO
  let puntos = res.puntos;

  // falta envido
  if (puntos === 'falta') {

    puntos =
      this.envidoManager.calcularFaltaEnvido(
        this.puntosJugador,
        this.puntosRival
      );
  }

  res.puntosFinales = puntos;

this.emit(
  'envidoResuelto',
  res
);

this.estado = this.turnoJugador
  ? EstadoJuego.TURNO_JUGADOR
  : EstadoJuego.TURNO_RIVAL;

return res;
}

puedeCantarEnvido(tipo) {

  // ya pasó primera baza
  if (this.bazas.length > 0) {
    return false;
  }

  // truco aceptado
  if (
    this.trucoManager &&
    this.trucoManager.respuesta === Respuesta.QUIERO
  ) {
    return false;
  }

  if (
  this.estado === EstadoJuego.FIN_MANO ||
  this.estado === EstadoJuego.FIN_PARTIDA
) {
  return false;
}

  // reglas internas del envido
  return this.envidoManager.puedeCantar(tipo);
}

toJSON() {

  return {

    estado: this.estado,

    turnoJugador: this.turnoJugador,

    manoJugador: this.manoJugador,

    manoRival: this.manoRival,

    bazas: this.bazas,

    puntosTrucoEnJuego:
      this.puntosTrucoEnJuego,

    truco:
      this.trucoManager.getEstado(),

    envido:
      this.envidoManager.getEstado()
  };
}
}

