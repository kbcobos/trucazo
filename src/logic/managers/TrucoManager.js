import { LlamadaTruco, Respuesta } from '../core/Enums.js';

export class TrucoManager {
  constructor() {
    this.trucoActual = LlamadaTruco.NINGUNA;
    this.quienCanto = '';
    this.respuesta = Respuesta.PENDIENTE;
  }

  reset() {
    this.trucoActual = LlamadaTruco.NINGUNA;
    this.quienCanto = '';
    this.respuesta = Respuesta.PENDIENTE;
  }

  siguienteNivel() {
    const mapa = {
      [LlamadaTruco.NINGUNA]:     LlamadaTruco.TRUCO,
      [LlamadaTruco.TRUCO]:       LlamadaTruco.RETRUCO,
      [LlamadaTruco.RETRUCO]:     LlamadaTruco.VALE_CUATRO,
      [LlamadaTruco.VALE_CUATRO]: null
    };
    return mapa[this.trucoActual] ?? null;
  }

  getPuntosQuiero(nivel) {
    return { [LlamadaTruco.TRUCO]:2, [LlamadaTruco.RETRUCO]:3, [LlamadaTruco.VALE_CUATRO]:4 }[nivel] ?? 1;
  }

  getPuntosNoQuiero(nivel) {
    return { [LlamadaTruco.TRUCO]:1, [LlamadaTruco.RETRUCO]:2, [LlamadaTruco.VALE_CUATRO]:3 }[nivel] ?? 1;
  }
}
