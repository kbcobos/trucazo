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
    this.manoJugador = [];
    this.manoRival   = [];
    
    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;
    this.turnoJugador = true;

    this.manoActual = 'jugador';
    this.turnoActual = 'jugador';
    
    this.powerupsActivos = [];
    this.auraGanadaMano = 0;
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

  iniciarMano() {

  this.truco.reset();
  this.envido.reset();
  this.bazas.reset();

  this.cartaJugadaJugador = null;
  this.cartaJugadaRival   = null;

  this.auraGanadaMano = 0;

  const mazo =
    this._generarMazoMezclado();

  this.manoJugador =
    mazo.slice(0, 3);

  this.manoRival =
    mazo.slice(3, 6);

  // el turno inicial lo tiene la mano
  this.turnoActual =
    this.manoActual;

  this.turnoJugador =
    this.turnoActual === 'jugador';

  this.estado =
    this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;

  this.emit(
    'manoIniciada',
    this.manoActual
  );

  this.emit(
    'cartasRepartidas',
    [...this.manoJugador],
    [...this.manoRival]
  );
}
  _generarMazoMezclado() {
    const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const mazo = [];
    for (const palo of [Palo.ESPADA, Palo.BASTO, Palo.ORO, Palo.COPA]) {
      for (const num of numeros) mazo.push(new Carta(num, palo));
    }
    return mazo.sort(() => Math.random() - 0.5);
  }

  jugarCarta(carta, esJugador) {

  const quien =
    esJugador ? 'jugador' : 'rival';

  // validar turno
  if (quien !== this.turnoActual) {
    return false;
  }

  if (esJugador) {

    const idx =
      this.manoJugador.findIndex(
        c => c.esIgual(carta)
      );

    if (idx === -1) {
      return false;
    }

    this.manoJugador.splice(idx, 1);

    this.cartaJugadaJugador = carta;

    this.turnoActual = 'rival';

    this.estado =
      EstadoJuego.TURNO_RIVAL;

  } else {

    const idx =
      this.manoRival.findIndex(
        c => c.esIgual(carta)
      );

    if (idx === -1) {
      return false;
    }

    this.manoRival.splice(idx, 1);

    this.cartaJugadaRival = carta;

    this.turnoActual = 'jugador';

    this.estado =
      EstadoJuego.TURNO_JUGADOR;
  }

  this.turnoJugador =
    this.turnoActual === 'jugador';

  this.emit(
    'cartaJugada',
    carta,
    esJugador
  );

  // resolver baza
  if (
    this.cartaJugadaJugador &&
    this.cartaJugadaRival
  ) {

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

  this.estado =
    EstadoJuego.RESOLVIENDO_BAZA;

  const ganador =
    this.bazas.compararCartas(
      this.cartaJugadaJugador,
      this.cartaJugadaRival
    );

  this.bazas.registrarBaza(ganador);

  this.emit(
    'bazaResuelta',
    ganador
  );

  if (ganador === 'jugador') {
    this.auraGanadaMano += 10;
  }

  this.cartaJugadaJugador = null;
  this.cartaJugadaRival   = null;

  // terminar mano
  if (
    this.bazas.cantidadBazas === 3 ||
    this.bazas.hayGanadorAnticipado()
  ) {

    this._resolverMano();

    return;
  }

  // definir quien sale próxima baza

  if (ganador === 'jugador') {

    this.turnoActual = 'jugador';

  } else if (ganador === 'rival') {

    this.turnoActual = 'rival';

  } else {

    // empate -> sale quien era mano
    this.turnoActual =
      this.manoActual;
  }

  this.turnoJugador =
    this.turnoActual === 'jugador';

  this.estado =
    this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;
}

  _resolverMano() {
  const ganador =
  this.bazas.determinarGanadorMano(
    this.manoActual
  );

  this.estado = EstadoJuego.FIN_MANO;

  const pts = this.truco.puntosEnJuego;

  if (ganador === 'jugador') {
    this.puntosJugador += pts;
    this.emit('auraGanada', this.auraGanadaMano);
  } else {
    this.puntosRival += pts;
  }

  this.emit(
    'puntosActualizados',
    this.puntosJugador,
    this.puntosRival
  );

  this.emit('manoTerminada', ganador);
  this._cambiarMano();
  this._comprobarFinalPartida();
}

  cantarTruco(quien) {

  if (!this.puedeCantarTruco(quien)) {
    return false;
  }

  const nivel = this.truco.siguienteNivel();

  if (!nivel) return false;

  this.truco.trucoActual = nivel;
  this.truco.quienCanto = quien;
  this.truco.respuesta = Respuesta.PENDIENTE;

  this.estado =
    EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;

  this.emit(
    'trucoCantado',
    nivel,
    quien
  );

  this.emit(
    'respuestaRequerida',
    'truco'
  );

  return true;
}

  responderTruco(resp) {
  this.truco.respuesta = resp;

  if (resp === Respuesta.QUIERO) {

    this.truco.aceptarTruco();

    this.estado = this.turnoJugador
      ? EstadoJuego.TURNO_JUGADOR
      : EstadoJuego.TURNO_RIVAL;

    this.emit('trucoQuerido', this.truco.trucoActual);

    return;
  }

  // NO QUIERO

  this.truco.rechazarTruco();

  const pts = this.truco.getPuntosNoQuiero(
    this.truco.trucoActual
  );

  if (this.truco.quienCanto === 'jugador') {
    this.puntosJugador += pts;
  } else {
    this.puntosRival += pts;
  }

  this.emit(
    'puntosActualizados',
    this.puntosJugador,
    this.puntosRival
  );

  this.emit(
    'manoTerminada',
    this.truco.quienCanto
  );

  this.estado = EstadoJuego.FIN_MANO;

  this._comprobarFinalPartida();
}

  cantarEnvido(nivel, quien) {

  if (!this.puedeCantarEnvido(quien)) {
    return false;
  }

  this.envido.agregarCanto(nivel);

  this.envido.quienCanto = quien;

  this.envido.respuesta =
    Respuesta.PENDIENTE;

  this.estado =
    EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO;

  this.emit(
    'envidoCantado',
    nivel,
    quien
  );

  this.emit(
    'respuestaRequerida',
    'envido'
  );

  return true;
}

  responderEnvido(resp) {

  this.envido.respuesta = resp;

  if (resp === Respuesta.QUIERO) {

    this.envido.aceptar();

    const ptsJugador =
      this.envido.calcularPuntosMano(
        this.manoJugador
      );

    const ptsRival =
      this.envido.calcularPuntosMano(
        this.manoRival
      );

    let puntosGanados = 0;

    const hayFalta =
      this.envido.cantos.includes(
        LlamadaEnvido.FALTA_ENVIDO
      );

    if (hayFalta) {

      puntosGanados =
        this.envido.getPuntosFalta(
          this.puntosParaGanar,
          this.puntosJugador,
          this.puntosRival
        );

    } else {

      puntosGanados =
        this.envido.puntosEnJuego;
    }

    if (ptsJugador >= ptsRival) {

      this.puntosJugador += puntosGanados;

    } else {

      this.puntosRival += puntosGanados;
    }

    this.emit(
      'envidoResuelto',
      ptsJugador,
      ptsRival
    );

  } else {

    this.envido.rechazar();

    const pts =
      this.envido.getPuntosNoQuiero();

    if (
      this.envido.quienCanto ===
      'jugador'
    ) {

      this.puntosJugador += pts;

    } else {

      this.puntosRival += pts;
    }
  }

  this.emit(
    'puntosActualizados',
    this.puntosJugador,
    this.puntosRival
  );

  this.estado = this.turnoJugador
    ? EstadoJuego.TURNO_JUGADOR
    : EstadoJuego.TURNO_RIVAL;
  this.envido.finalizado = true;
}
  irAlMazo(quien) {

  const pts = this.truco.puntosEnJuego;

  if (quien === 'jugador') {
    this.puntosRival += pts;
  } else {
    this.puntosJugador += pts;
  }

  this.emit(
    'puntosActualizados',
    this.puntosJugador,
    this.puntosRival
  );

  this.estado = EstadoJuego.FIN_MANO;

  this.emit(
    'manoTerminada',
    quien === 'jugador' ? 'rival' : 'jugador'
  );
  this._cambiarMano();
  this._comprobarFinalPartida();
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

  puedeCantarTruco(quien) {

  if (
    ![
      EstadoJuego.TURNO_JUGADOR,
      EstadoJuego.TURNO_RIVAL
    ].includes(this.estado)
  ) {
    return false;
  }

  // ya está en vale cuatro
  if (
    this.truco.trucoActual ===
    LlamadaTruco.VALE_CUATRO
  ) {
    return false;
  }

  // hay respuesta pendiente
  if (
  this.truco.quienCanto &&
  this.truco.respuesta === Respuesta.PENDIENTE
) {
  return false;
}

  // no puede subir su propio truco
  if (this.truco.quienCanto === quien) {
    return false;
  }

  return true;
}

  puedeCantarEnvido(quien) {
  if (this.envido.finalizado) {
  return false;
}
// si el truco ya fue querido y pasó la primera baza
if (
  this.truco.respuesta === Respuesta.QUIERO 
) {
  return false;
}
  // solo antes de resolver primera baza
  if (this.bazas.cantidadBazas > 0) {
    return false;
  }

  if (
    this.estado ===
    EstadoJuego.RESOLVIENDO_BAZA
  ) {
    return false;
  }

  // no puede volver a cantar el mismo
  if (this.envido.quienCanto === quien &&
      this.envido.respuesta === Respuesta.PENDIENTE) {
    return false;
  }

  // no se puede cantar después de jugar cartas
  // si ambos ya jugaron la baza actual
if (
  this.cartaJugadaJugador &&
  this.cartaJugadaRival
) {
  return false;
}

// si el jugador ya jugó su carta
if (
  quien === 'jugador' &&
  this.cartaJugadaJugador
) {
  return false;
}

// si el rival ya jugó su carta
if (
  quien === 'rival' &&
  this.cartaJugadaRival
) {
  return false;
}

  // si ya hubo falta no sigue
  if (
    this.envido.cantos.includes(
      LlamadaEnvido.FALTA_ENVIDO
    )
  ) {
    return false;
  }

  return true;
}

  calcularEnvido(mano) { 
    return this.envido.calcularPuntosMano(mano); 
  }

  _cambiarMano() {

  this.manoActual =
    this.manoActual === 'jugador'
      ? 'rival'
      : 'jugador';

  this.emit(
    'manoCambiada',
    this.manoActual
  );
}
}
