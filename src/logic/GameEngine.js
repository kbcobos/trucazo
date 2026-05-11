import { EstadoJuego } from "./GameConstants.js";
import { Mano } from "./Mano.js";
export class GameEngine {
  constructor(puntosParaGanar = 15) {
    this.puntosParaGanar = puntosParaGanar;
    // Puntaje
    this.puntosJugador = 0;
    this.puntosRival = 0;
    // Extras
    this.powerupsActivos = [];
    // Eventos
    this._listeners = {};
    // Mano actual
    this.mano = 'jugador';
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

    this.manoActual =
      new Mano({
        mano: this.mano,
        puntosJugador: this.puntosJugador,
        puntosRival: this.puntosRival,
        puntosParaGanar: this.puntosParaGanar
      });

      this._registrarEventosMano();

      this.manoActual.iniciar();
      
}

_registrarEventosMano() {

  this.manoActual.on(
    'cartasRepartidas',
    (j, r) => {

      this.emit(
        'cartasRepartidas',
        j,
        r
      );
    }
  );

  this.manoActual.on(
    'manoIniciada',
    (data) => {

      this.emit(
        'manoIniciada',
        data
      );
    }
  );

  this.manoActual.on(
  'cartaJugada',
  (carta, esJugador) => {

    this.emit(
      'cartaJugada',
      carta,
      esJugador
    );
  }
);
this.manoActual.on(
  'bazaResuelta',
  (ganador, puntos) => {

    this.emit(
      'bazaResuelta',
      ganador,
      puntos
    );
  }
);

this.manoActual.on(
  'manoTerminada',
  (data) => {

    const {
      ganador,
      puntos
    } = data;

    this._sumarPuntos(
      ganador,
      puntos
    );

    // alternar mano
    this.mano =
      this.mano === 'jugador'
        ? 'rival'
        : 'jugador';

    this.emit(
      'manoTerminada',
      ganador
    );

    this._comprobarGanadorPartida();
  }
);

this.manoActual.on(
  'trucoCantado',
  (data) => {

    this.emit(
      'trucoCantado',
      data
    );
  }
);

this.manoActual.on(
  'trucoRespondido',
  (data) => {

    this.emit(
      'trucoRespondido',
      data
    );
  }
);

this.manoActual.on(
  'envidoCantado',
  (data) => {

    this.emit(
      'envidoCantado',
      data
    );
  }
);

this.manoActual.on(
  'envidoResuelto',
  (data) => {

    this.emit(
      'envidoResuelto',
      data
    );
  }
);

this.manoActual.on(
  'envidoRechazado',
  (data) => {

    this.emit(
      'envidoRechazado',
      data
    );
  }
);

this.manoActual.on(
  'jugadorFueAlMazo',
  (data) => {

    this.emit(
      'jugadorFueAlMazo',
      data
    );
  }
);

}

jugarCarta(carta, esJugador) {

  if (!this.manoActual) {
    return;
  }

  this.manoActual.jugarCarta(
    carta,
    esJugador
  );
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

cantarTruco(quien) {
  return this.manoActual.cantarTruco(quien);
}

responderTruco(respuesta) {
  return this.manoActual.responderTruco(respuesta);
}

cantarEnvido(tipo, quien) {
  return this.manoActual.cantarEnvido(tipo, quien);
}

responderEnvido(respuesta) {

  if (!this.manoActual) {
    return;
  }

  return this.manoActual.responderEnvido(
    respuesta
  );
}

irAlMazo(quien) {

  if (!this.manoActual) return;

  this.manoActual.irAlMazo(quien);
}

_sumarPuntos(quien, puntos) {

  if (quien === 'jugador') {
    this.puntosJugador += puntos;
  }

  else {
    this.puntosRival += puntos;
  }

  // sincronizar mano actual
  if (this.manoActual) {

    this.manoActual.puntosJugador =
      this.puntosJugador;

    this.manoActual.puntosRival =
      this.puntosRival;
  }

  this.emit(
    'puntosActualizados',
    this.puntosJugador,
    this.puntosRival
  );
}

// =========================
// GETTERS
// =========================

get estado() {

  if (!this.manoActual) {
    return EstadoJuego.ESPERANDO;
  }

  return this.manoActual.estado;
}

get turnoJugador() {
  return this.manoActual?.turnoJugador;
}

get manoJugador() {
  return this.manoActual?.manoJugador ?? [];
}

get manoRival() {
  return this.manoActual?.manoRival ?? [];
}

get bazas() {
  return this.manoActual?.bazas ?? [];
}

get puntosTrucoEnJuego() {
  return this.manoActual?.puntosTrucoEnJuego ?? 1;
}

get truco() {
  return this.manoActual?.trucoManager;
}

get envido() {
  return this.manoActual?.envidoManager;
}
get puedeJugar() {
  return this.estado === EstadoJuego.TURNO_JUGADOR;
}
get terminoPartida() {
  return this.estado === EstadoJuego.FIN_PARTIDA;
}

toJSON() {

  return {

    puntosJugador:
      this.puntosJugador,

    puntosRival:
      this.puntosRival,

    mano:
      this.mano,

    estado:
      this.estado,

    manoActual:
      this.manoActual?.toJSON()
  };
}

}

