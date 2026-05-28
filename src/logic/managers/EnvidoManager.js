import { LlamadaEnvido, Respuesta } from '../core/Enums.js';

export class EnvidoManager {
  constructor() {
    this.reset();
    this.finalizado = false;
  }

  reset() {
    this.cantos = [];
    this.envidoActual = LlamadaEnvido.NINGUNA;
    this.quienCanto = null;
    this.respuesta = Respuesta.PENDIENTE;
    this.puntosEnJuego = 0;
    this.finalizado = false;
  }

  calcularPuntosMano(mano, powerupsActivos = [], esJugador = false) {
    const porPalo = {};
    let maxPaloSize = 0;

    for (const carta of mano) {
      if (!porPalo[carta.palo]) {
        porPalo[carta.palo] = [];
      }
      porPalo[carta.palo].push(carta.valorEnvido);
    }

    let mejor = 0;

    for (const vals of Object.values(porPalo)) {
      if (vals.length > maxPaloSize) {
        maxPaloSize = vals.length;
      }

      vals.sort((a, b) => b - a);

      if (vals.length >= 2) {
        const pts = vals[0] + vals[1] + 20;
        if (pts > mejor) {
          mejor = pts;
        }
      } else {
        if (vals[0] > mejor) {
          mejor = vals[0];
        }
      }
    }

    if (esJugador && powerupsActivos.includes('el_flor') && maxPaloSize === 3) {
      mejor += 5;
    }

    return mejor;
  }

  determinarGanador(ptsJugador, ptsRival, manoActual, powerupsActivos = []) {
    if (ptsJugador > ptsRival) return 'jugador';
    if (ptsRival > ptsJugador) return 'rival';

    if (powerupsActivos.includes('grito_quiero')) {
      return 'jugador';
    }

    return manoActual;
  }

  agregarCanto(canto) {
    this.cantos.push(canto);
    this.envidoActual = canto;
    this._recalcularPuntos();
  }

  _recalcularPuntos() {
    let total = 0;
    for (const canto of this.cantos) {
      switch (canto) {
        case LlamadaEnvido.ENVIDO:
          total += 2;
          break;
        case LlamadaEnvido.REAL_ENVIDO:
          total += 3;
          break;
        case LlamadaEnvido.FALTA_ENVIDO:
          break;
      }
    }
    this.puntosEnJuego = total;
  }

  getPuntosFalta(puntosParaGanar, ptsJugador, ptsRival) {
    return puntosParaGanar - Math.max(ptsJugador, ptsRival);
  }

  getPuntosNoQuiero() {
    let puntos = 0;
    for (const canto of this.cantos) {
      switch (canto) {
        case LlamadaEnvido.ENVIDO:
          puntos += 1;
          break;
        case LlamadaEnvido.REAL_ENVIDO:
          puntos += 1;
          break;
        case LlamadaEnvido.FALTA_ENVIDO:
          break;
      }
    }
    return Math.max(1, puntos);
  }

  aceptar() {
    this.respuesta = Respuesta.QUIERO;
    this.finalizado = true;
  }

  rechazar() {
    this.respuesta = Respuesta.NO_QUIERO;
    this.finalizado = true;
  }
}
