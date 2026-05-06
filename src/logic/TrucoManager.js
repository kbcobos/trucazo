import { LlamadaTruco } from "./TrucoConstants.js";
import { Respuesta } from "./GameConstants.js";

export class TrucoManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.nivel = LlamadaTruco.NINGUNA;
    this.quienCanto = null;
    this.respuesta = Respuesta.PENDIENTE;
  }

  // CANTAR TRUCO
  cantar(quien) {
    const siguiente = this._siguienteNivel();

    if (siguiente === null) {
      return { error: 'No se puede subir más el truco' };
    }

    if (this.quienCanto === quien && this.respuesta === Respuesta.PENDIENTE) {
      return { error: 'No podés subir tu propio canto' };
    }

    this.nivel = siguiente;
    this.quienCanto = quien;
    this.respuesta = Respuesta.PENDIENTE;

    return {
      ok: true,
      nivel: this.nivel,
      quien
    };
  }

  // RESPONDER
  responder(respuesta) {
    this.respuesta = respuesta;

    if (respuesta === Respuesta.QUIERO) {
      return {
        accion: 'continuar',
        puntos: this._puntosQuiero()
      };
    }

    // NO QUIERO
    return {
      accion: 'terminar_mano',
      ganador: this.quienCanto,
      puntos: this._puntosNoQuiero()
    };
  }

  // NIVEL SIGUIENTE
  _siguienteNivel() {
    const mapa = {
      [LlamadaTruco.NINGUNA]: LlamadaTruco.TRUCO,
      [LlamadaTruco.TRUCO]: LlamadaTruco.RETRUCO,
      [LlamadaTruco.RETRUCO]: LlamadaTruco.VALE_CUATRO,
      [LlamadaTruco.VALE_CUATRO]: null
    };

    return mapa[this.nivel];
  }

  // PUNTOS SI ACEPTA
  _puntosQuiero() {
    return {
      [LlamadaTruco.TRUCO]: 2,
      [LlamadaTruco.RETRUCO]: 3,
      [LlamadaTruco.VALE_CUATRO]: 4
    }[this.nivel] ?? 1;
  }

  // PUNTOS SI RECHAZA
  _puntosNoQuiero() {
    return {
      [LlamadaTruco.TRUCO]: 1,
      [LlamadaTruco.RETRUCO]: 2,
      [LlamadaTruco.VALE_CUATRO]: 3
    }[this.nivel] ?? 1;
  }

  // UTIL
  estaPendiente() {
    return this.respuesta === Respuesta.PENDIENTE;
  }
}