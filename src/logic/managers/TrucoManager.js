import { LlamadaTruco, Respuesta } from '../core/Enums.js';

export class TrucoManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.trucoActual = LlamadaTruco.NINGUNA;

    // jugador o rival
    this.quienCanto = null;

    this.respuesta = null;

    // valor actual de la mano
    this.puntosEnJuego = 1;
  }

  siguienteNivel() {
    switch (this.trucoActual) {
      case LlamadaTruco.NINGUNA:
        return LlamadaTruco.TRUCO;

      case LlamadaTruco.TRUCO:
        return LlamadaTruco.RETRUCO;

      case LlamadaTruco.RETRUCO:
        return LlamadaTruco.VALE_CUATRO;

      default:
        return null;
    }
  }

  getPuntosQuiero(nivel) {
    switch (nivel) {
      case LlamadaTruco.TRUCO:
        return 2;

      case LlamadaTruco.RETRUCO:
        return 3;

      case LlamadaTruco.VALE_CUATRO:
        return 4;

      default:
        return 1;
    }
  }

  getPuntosNoQuiero(nivel) {
    switch (nivel) {
      case LlamadaTruco.TRUCO:
        return 1;

      case LlamadaTruco.RETRUCO:
        return 2;

      case LlamadaTruco.VALE_CUATRO:
        return 3;

      default:
        return 1;
    }
  }

  aceptarTruco() {
    this.respuesta = Respuesta.QUIERO;
    this.puntosEnJuego = this.getPuntosQuiero(this.trucoActual);
  }

  rechazarTruco() {
    this.respuesta = Respuesta.NO_QUIERO;
  }
}