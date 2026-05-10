import { LlamadaEnvido } from './EnvidoConstants.js';
import { Respuesta } from './GameConstants.js';

export class EnvidoManager {

  constructor(puntosParaGanar = 15) {
    this.puntosParaGanar = puntosParaGanar;
    this.reset();
  }

  reset() {

    // cadena de cantos
    this.cantos = [];

    this.quienCanto = null;

    this.respuesta = Respuesta.PENDIENTE;

    this.puntosEnJuego = 0;
  }

  // =====================================
  // CANTAR
  // =====================================

  cantar(tipo, quien) {

  if (!this.puedeCantar(tipo)) {

    return {
      error: 'No se puede cantar eso ahora'
    };
  }

  // guardar canto
  this.cantos.push({
    tipo,
    quien
  });

  this.quienCanto = quien;

  this.respuesta = Respuesta.PENDIENTE;

  this._recalcularPuntos();

  return {

    ok: true,

    cantos: [...this.cantos],

    puntos: this.puntosEnJuego,

    quien
  };
}

  // =====================================
  // RESPONDER
  // =====================================

  responder(
    respuesta,
    manoJugador,
    manoRival
  ) {

    this.respuesta = respuesta;

    // NO QUIERO
    if (respuesta === Respuesta.NO_QUIERO) {

      return {
        accion: 'rechazado',

        ganador: this.quienCanto,

        puntos: this._calcularNoQuiero()
      };
    }

    // QUIERO

    const puntosJugador =
      this.calcularEnvido(manoJugador);

    const puntosRival =
      this.calcularEnvido(manoRival);

    const ganador =
      puntosJugador >= puntosRival
        ? 'jugador'
        : 'rival';

    return {

      accion: 'aceptado',

      ganador,

      puntosJugador,
      puntosRival,

      puntos: this.puntosEnJuego
    };
  }

  puedeCantar(tipo) {

  // =====================================
  // YA RESUELTO
  // =====================================

  if (
    this.fueCantado() &&
    !this.estaPendiente()
  ) {
    return false;
  }

  // =====================================
  // PRIMER CANTO
  // =====================================

  if (this.cantos.length === 0) {

    return [
      LlamadaEnvido.ENVIDO,
      LlamadaEnvido.REAL_ENVIDO,
      LlamadaEnvido.FALTA_ENVIDO
    ].includes(tipo);
  }

  // =====================================
  // ÚLTIMO CANTO
  // =====================================

  const ultimo =
    this.cantos[this.cantos.length - 1];

  // =====================================
  // ENVIDO
  // =====================================

  if (ultimo.tipo === LlamadaEnvido.ENVIDO) {

    // permitido:
    // envido envido
    // real envido
    // falta envido

    return [
      LlamadaEnvido.ENVIDO,
      LlamadaEnvido.REAL_ENVIDO,
      LlamadaEnvido.FALTA_ENVIDO
    ].includes(tipo);
  }

  // =====================================
  // REAL ENVIDO
  // =====================================

  if (
    ultimo.tipo ===
    LlamadaEnvido.REAL_ENVIDO
  ) {

    // solo falta envido
    return (
      tipo ===
      LlamadaEnvido.FALTA_ENVIDO
    );
  }

  // =====================================
  // FALTA ENVIDO
  // =====================================

  if (
    ultimo.tipo ===
    LlamadaEnvido.FALTA_ENVIDO
  ) {

    return false;
  }

  return false;
}

  // =====================================
  // CALCULAR ENVIDO
  // =====================================

  calcularEnvido(mano) {

    const porPalo = {};

    for (const carta of mano) {

      if (!porPalo[carta.palo]) {
        porPalo[carta.palo] = [];
      }

      porPalo[carta.palo]
        .push(carta.valorEnvido);
    }

    let mejor = 0;

    for (const valores of Object.values(porPalo)) {

      valores.sort((a, b) => b - a);

      // mismo palo
      if (valores.length >= 2) {

        const pts =
          valores[0] +
          valores[1] +
          20;

        mejor = Math.max(mejor, pts);
      }

      // carta alta
      else {

        mejor = Math.max(
          mejor,
          valores[0]
        );
      }
    }

    return mejor;
  }

  // =====================================
  // PUNTOS EN JUEGO
  // =====================================

  _recalcularPuntos() {

    let total = 0;

    for (const canto of this.cantos) {

      switch (canto.tipo) {

        case LlamadaEnvido.ENVIDO:
          total += 2;
          break;

        case LlamadaEnvido.REAL_ENVIDO:
          total += 3;
          break;

        case LlamadaEnvido.FALTA_ENVIDO:
          total = 'falta';
          break;
      }
    }

    this.puntosEnJuego = total;
  }

  // =====================================
  // NO QUIERO
  // =====================================

  _calcularNoQuiero() {

    // un solo canto
    if (this.cantos.length === 1) {
      return 1;
    }

    // suma parcial
    let total = 0;

    for (let i = 0; i < this.cantos.length - 1; i++) {

      const tipo = this.cantos[i].tipo;

      switch (tipo) {

        case LlamadaEnvido.ENVIDO:
          total += 2;
          break;

        case LlamadaEnvido.REAL_ENVIDO:
          total += 3;
          break;
      }
    }

    return Math.max(1, total);
  }

  // =====================================
  // FALTA ENVIDO
  // =====================================

  calcularFaltaEnvido(
    puntosJugador,
    puntosRival
  ) {

    return (
      this.puntosParaGanar -
      Math.max(
        puntosJugador,
        puntosRival
      )
    );
  }

  // =====================================
  // UTILS
  // =====================================

  estaPendiente() {
    return this.respuesta === Respuesta.PENDIENTE;
  }

  fueCantado() {
    return this.cantos.length > 0;
  }

  getEstado() {

    return {

      cantos: [...this.cantos],

      quienCanto: this.quienCanto,

      respuesta: this.respuesta,

      puntosEnJuego: this.puntosEnJuego
    };
  }
}