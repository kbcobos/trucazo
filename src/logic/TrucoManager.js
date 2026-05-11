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

  this.cantos = [];

  this.puntosEnJuego = 1;
}

  // CANTAR TRUCO
  cantar(tipo, quien) {

  const puede =
    this.puedeCantar(
      tipo,
      quien
    );

  if (!puede) {

    return {
      error:
        'No se puede cantar eso ahora'
    };
  }

  this.nivel = tipo;

  this.quienCanto = quien;

  this.respuesta =
    Respuesta.PENDIENTE;

  this.cantos.push({
    tipo,
    quien
  });

  this._recalcularPuntos();

  return {

    ok: true,

    nivel: this.nivel,

    quien,

    puntos:
      this.puntosEnJuego,

    cantos:
      [...this.cantos]
  };
}

puedeCantar(tipo, quien) {

  // no se puede subir más
  if (
    this.nivel ===
    LlamadaTruco.VALE_CUATRO
  ) {
    return false;
  }

  // no podés cantar tu propio
  // truco pendiente
  if (
    this.quienCanto === quien &&
    this.estaPendiente()
  ) {
    return false;
  }

  // ========================
  // TRUCO
  // ========================

  if (
    tipo === LlamadaTruco.TRUCO
  ) {

    return (
      this.nivel ===
      LlamadaTruco.NINGUNA
    );
  }

  // ========================
  // RETRUCO
  // ========================

  if (
    tipo === LlamadaTruco.RETRUCO
  ) {

    return (
      this.nivel ===
      LlamadaTruco.TRUCO &&
      this.respuesta ===
        Respuesta.QUIERO
    );
  }

  // ========================
  // VALE CUATRO
  // ========================

  if (
    tipo ===
    LlamadaTruco.VALE_CUATRO
  ) {

    return (
      this.nivel ===
      LlamadaTruco.RETRUCO &&
      this.respuesta ===
        Respuesta.QUIERO
    );
  }

  return false;
}

  // RESPONDER
 responder(respuesta) {

  // no hay nada pendiente
  if (!this.estaPendiente()) {

    return {
      error:
        'No hay un truco pendiente'
    };
  }

  this.respuesta = respuesta;

  // ========================
  // QUIERO
  // ========================

  if (
    respuesta ===
    Respuesta.QUIERO
  ) {

    return {

      accion: 'continuar',

      nivel: this.nivel,

      puntos:
        this.puntosEnJuego
    };
  }

  // ========================
  // NO QUIERO
  // ========================

  return {

    accion: 'terminar_mano',

    ganador:
      this.quienCanto,

    puntos:
      this._puntosNoQuiero(),

    nivel:
      this.nivel
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

  _recalcularPuntos() {

  this.puntosEnJuego = {

    [LlamadaTruco.NINGUNA]: 1,

    [LlamadaTruco.TRUCO]: 2,

    [LlamadaTruco.RETRUCO]: 3,

    [LlamadaTruco.VALE_CUATRO]: 4

  }[this.nivel] ?? 1;
}

  // UTIL
  fueCantado() {
    return this.nivel !== LlamadaTruco.NINGUNA;
  }

  estaPendiente() {
    return this.respuesta === Respuesta.PENDIENTE;
  }

  getEstado() {

  return {

    nivel: this.nivel,

    quienCanto: this.quienCanto,

    respuesta: this.respuesta,

    cantos: [...this.cantos],

    puntosEnJuego: this.puntosEnJuego
  };
}
}