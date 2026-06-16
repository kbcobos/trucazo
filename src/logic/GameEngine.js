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
    this.mazo = [];
    this.manoJugador = [];
    this.manoRival   = [];

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;
    this.turnoJugador = true;

    this.manoActual  = 'jugador';
    this.turnoActual = 'jugador';

    this.powerupsActivos = [];
    this.auraGanadaMano  = 0;
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

  // ─── Mano ────────────────────────────────────────────────────────────────

  iniciarMano() {
    this.truco.reset();
    this.envido.reset();
    this.bazas.reset();

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;
    this.auraGanadaMano     = 0;

    this._generarMazoMezclado();

    this.manoJugador = [this.mazo.pop(), this.mazo.pop(), this.mazo.pop()];
    this.manoRival   = [this.mazo.pop(), this.mazo.pop(), this.mazo.pop()];

    this.puntosEnvidoJugador = this.envido.calcularPuntosMano(this.manoJugador, this.powerupsActivos, true);
    this.puntosEnvidoRival   = this.envido.calcularPuntosMano(this.manoRival,   this.powerupsActivos, false);

    this.turnoActual  = this.manoActual;
    this.turnoJugador = this.turnoActual === 'jugador';
    this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;

    this.emit('manoIniciada', this.manoActual);
    this.emit('cartasRepartidas', [...this.manoJugador], [...this.manoRival]);
  }

  _generarMazoMezclado() {
    const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    this.mazo = [];
    for (const palo of [Palo.ESPADA, Palo.BASTO, Palo.ORO, Palo.COPA]) {
      for (const num of numeros) {
        this.mazo.push(new Carta(num, palo));
      }
    }
    for (let i = this.mazo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.mazo[i], this.mazo[j]] = [this.mazo[j], this.mazo[i]];
    }
  }

  // ─── Cartas ──────────────────────────────────────────────────────────────

  jugarCarta(carta, esJugador) {
    const quien = esJugador ? 'jugador' : 'rival';
    if (quien !== this.turnoActual) return false;

    if (esJugador) {
      const idx = this.manoJugador.findIndex(c => c.esIgual(carta));
      if (idx === -1) return false;
      this.manoJugador.splice(idx, 1);
      this.cartaJugadaJugador = carta;
      if (this.powerupsActivos?.includes('mazo_enganio')) {
        this.auraGanadaMano += 2;
        this.emit('auraGanada', 2);
      }
      this.turnoActual = 'rival';
      this.estado = EstadoJuego.TURNO_RIVAL;
    } else {
      const idx = this.manoRival.findIndex(c => c.esIgual(carta));
      if (idx === -1) return false;
      this.manoRival.splice(idx, 1);
      this.cartaJugadaRival = carta;
      this.turnoActual = 'jugador';
      this.estado = EstadoJuego.TURNO_JUGADOR;
    }

    this.turnoJugador = this.turnoActual === 'jugador';
    this.emit('cartaJugada', carta, esJugador);

    if (this.cartaJugadaJugador && this.cartaJugadaRival) {
      this._resolverBaza();
    }
    return true;
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
      return;
    }

    // Ganador de la baza lidera la siguiente; empate → quien tiene la mano
    if (ganador === 'jugador')    this.turnoActual = 'jugador';
    else if (ganador === 'rival') this.turnoActual = 'rival';
    else                          this.turnoActual = this.manoActual;

    this.turnoJugador = this.turnoActual === 'jugador';
    this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;
  }

  _resolverMano() {
    const ganador = this.bazas.determinarGanadorMano(this.manoActual);
    this.estado = EstadoJuego.FIN_MANO;
    const pts = this.truco.puntosEnJuego;

    if (ganador === 'jugador') {
      this.puntosJugador += pts;
      this.emit('auraGanada', this.auraGanadaMano);
    } else {
      this.puntosRival += pts;
    }

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.emit('manoTerminada', ganador);
    this._cambiarMano();
    this._comprobarFinalPartida();
  }

  // ─── Truco ───────────────────────────────────────────────────────────────

  cantarTruco(quien) {
    if (!this.puedeCantarTruco(quien)) return false;

    // Solo guardar la primera vez
  if (this.estado !== EstadoJuego.ESPERANDO_RESPUESTA_TRUCO) {
    this.turnoPendienteTruco = this.turnoActual;
  }

    const nivel = this.truco.siguienteNivel();
    if (!nivel) return false;

    this.truco.trucoActual = nivel;
    this.truco.quienCanto  = quien;
    this.truco.respuesta   = Respuesta.PENDIENTE;

    // Siempre queda esperando respuesta del otro, ya sea canto inicial o subida
    this.estado = EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;
    this.emit('trucoCantado', nivel, quien);
    this.emit('respuestaRequerida', 'truco');
    return true;
  }

  responderTruco(resp) {
    if (resp === Respuesta.QUIERO) {
  this.truco.aceptarTruco();

  this.turnoActual = this.turnoPendienteTruco;
  this.turnoPendienteTruco = null;

  this.turnoJugador = this.turnoActual === 'jugador';

  this.estado = this.turnoJugador
    ? EstadoJuego.TURNO_JUGADOR
    : EstadoJuego.TURNO_RIVAL;

  this.emit('trucoQuerido', this.truco.trucoActual);
  return;
}

    this.truco.rechazarTruco();
    const pts = this.truco.getPuntosNoQuiero(this.truco.trucoActual);

    if (this.truco.quienCanto === 'jugador') this.puntosJugador += pts;
    else                                      this.puntosRival   += pts;

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.emit('manoTerminada', this.truco.quienCanto);
    this.estado = EstadoJuego.FIN_MANO;
    // FIX: faltaba _cambiarMano() al rechazar truco
    this._cambiarMano();
    this._comprobarFinalPartida();
  }

  // ─── Envido ──────────────────────────────────────────────────────────────

  cantarEnvido(nivel, quien) {
    if (!this.puedeCantarEnvido(quien)) return false;

    this.envido.agregarCanto(nivel);
    this.envido.quienCanto = quien;
    this.envido.respuesta  = Respuesta.PENDIENTE;

    // Siempre queda esperando respuesta del otro, ya sea canto inicial o subida
    this.estado = EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO;
    this.emit('envidoCantado', nivel, quien);
    this.emit('respuestaRequerida', 'envido');
    return true;
  }

  responderEnvido(resp) {
    this.envido.respuesta = resp;

    if (resp === Respuesta.QUIERO) {
      this.envido.aceptar();

      const ptsJugador = this.puntosEnvidoJugador;
      const ptsRival   = this.puntosEnvidoRival;
      const hayFalta   = this.envido.cantos.includes(LlamadaEnvido.FALTA_ENVIDO);

      const puntosGanados = hayFalta
        ? this.envido.getPuntosFalta(this.puntosParaGanar, this.puntosJugador, this.puntosRival)
        : this.envido.puntosEnJuego;

      const ganadorEnvido = this.envido.determinarGanador(
        ptsJugador, ptsRival, this.manoActual, this.powerupsActivos
      );

      if (ganadorEnvido === 'jugador') this.puntosJugador += puntosGanados;
      else                             this.puntosRival   += puntosGanados;

      // FIX: se pasan ganador y puntosGanados para que la UI pueda mostrar el resultado completo
      this.emit('envidoResuelto', ptsJugador, ptsRival, ganadorEnvido, puntosGanados);

    } else {
      this.envido.rechazar();
      const pts = this.envido.getPuntosNoQuiero();

      if (this.envido.quienCanto === 'jugador') this.puntosJugador += pts;
      else                                       this.puntosRival   += pts;

      // FIX: el original no emitía envidoResuelto al rechazar; la UI no se actualizaba
      this.emit('envidoResuelto', this.puntosEnvidoJugador, this.puntosEnvidoRival, this.envido.quienCanto, pts);
    }

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);

    // FIX: usaba turnoJugador (stale) en vez de turnoActual
    if (this.truco.respuesta === Respuesta.PENDIENTE) {
  this.estado = EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;
} else {
  this.estado = this.turnoActual === 'jugador'
    ? EstadoJuego.TURNO_JUGADOR
    : EstadoJuego.TURNO_RIVAL;
}

    this.envido.finalizado = true;
    this._comprobarFinalPartida();
  }

  // ─── Mazo ─────────────────────────────────────────────────────────────────

  irAlMazo(quien) {
    const pts = this.truco.puntosEnJuego;
    if (quien === 'jugador') this.puntosRival   += pts;
    else                     this.puntosJugador += pts;

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.estado = EstadoJuego.FIN_MANO;
    this.emit('manoTerminada', quien === 'jugador' ? 'rival' : 'jugador');
    this._cambiarMano();
    this._comprobarFinalPartida();
  }

  // ─── Validaciones ─────────────────────────────────────────────────────────

  puedeCantarTruco(quien) {
    // Ya llegó al máximo o fue rechazado
    if (this.truco.trucoActual === LlamadaTruco.VALE_CUATRO) return false;
    if (this.truco.respuesta   === Respuesta.NO_QUIERO)      return false;

    // FIX NUEVO: si hay truco pendiente de respuesta, solo puede SUBIR quien lo recibió
    // Esto permite responder "con Retruco" al Truco, o "con Vale Cuatro" al Retruco
    if (this.estado === EstadoJuego.ESPERANDO_RESPUESTA_TRUCO) {
      if (this.truco.quienCanto === quien) return false; // el que cantó no puede subirse a sí mismo
      if (!this.truco.siguienteNivel())    return false; // no hay nivel superior
      return true;
    }

    // Turno normal de juego
    if (![EstadoJuego.TURNO_JUGADOR, EstadoJuego.TURNO_RIVAL].includes(this.estado)) return false;
    // Si ya hay un canto pendiente nadie puede cantar de nuevo desde turno normal
    if (this.truco.quienCanto && this.truco.respuesta === Respuesta.PENDIENTE) return false;
    return true;
  }

  puedeCantarEnvido(quien) {
    if (this.envido.finalizado)                                  return false;
    if (this.truco.respuesta === Respuesta.QUIERO)               return false; // truco ya aceptado
    if (this.bazas.cantidadBazas > 0)                            return false; // solo antes de la 1ra baza
    if (this.estado === EstadoJuego.RESOLVIENDO_BAZA)            return false;
    if (this.envido.cantos.includes(LlamadaEnvido.FALTA_ENVIDO)) return false;
    if (quien === 'jugador' && this.cartaJugadaJugador)          return false;
    if (quien === 'rival'   && this.cartaJugadaRival)            return false;

    // FIX NUEVO: si hay envido pendiente, solo puede SUBIR quien lo recibió
    // Esto permite responder "con Real Envido" al Envido, o "con Falta" al Real, etc.
    if (this.estado === EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO) {
      if (this.envido.quienCanto === quien) return false;
      return true;
    }

    // FIX NUEVO: si hay truco PENDIENTE (no aceptado aún), se puede cantar envido igual.
    // Regla del truco argentino: si te cantan truco podés responder con envido
    // antes de aceptar o rechazar, siempre que sea la primera baza.
    // Solo se bloquea si el truco ya fue ACEPTADO (chequeado arriba).

    // Turno normal: el que ya cantó no puede volver a hacerlo
    if (this.envido.quienCanto === quien && this.envido.respuesta === Respuesta.PENDIENTE) {
      return false;
    }

    return true;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  calcularEnvido(mano) {
    return this.envido.calcularPuntosMano(mano);
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

  _cambiarMano() {
    this.manoActual = this.manoActual === 'jugador' ? 'rival' : 'jugador';
    this.emit('manoCambiada', this.manoActual);
  }
}
