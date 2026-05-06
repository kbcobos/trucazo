export const Palo = Object.freeze({
  ESPADA: 0,
  BASTO:  1,
  ORO:    2,
  COPA:   3
});

export const EstadoJuego = Object.freeze({
  ESPERANDO:                 'esperando',
  REPARTIENDO:               'repartiendo',
  TURNO_JUGADOR:             'turno_jugador',
  TURNO_RIVAL:               'turno_rival',
  RESOLVIENDO_BAZA:          'resolviendo_baza',
  ESPERANDO_RESPUESTA_TRUCO: 'esperando_respuesta_truco',
  ESPERANDO_RESPUESTA_ENVIDO:'esperando_respuesta_envido',
  FIN_MANO:                  'fin_mano',
  FIN_PARTIDA:               'fin_partida'
});

export const LlamadaTruco = Object.freeze({
  NINGUNA:    0,
  TRUCO:      1,
  RETRUCO:    2,
  VALE_CUATRO:3
});

export const LlamadaEnvido = Object.freeze({
  NINGUNA:      0,
  ENVIDO:       1,
  ENVIDO_ENVIDO:2,
  REAL_ENVIDO:  3,
  FALTA_ENVIDO: 4
});

export const Respuesta = Object.freeze({
  PENDIENTE:  'pendiente',
  QUIERO:     'quiero',
  NO_QUIERO:  'no_quiero'
});

export class Carta {
  constructor(numero, palo) {
    this.numero      = numero;
    this.palo        = palo;
    this.valorTruco  = Carta.calcularValorTruco(numero, palo);
    this.valorEnvido = Carta.calcularValorEnvido(numero);
  }

  static calcularValorTruco(num, palo) {
    if (num === 1) {
      if (palo === Palo.ESPADA) return 1;
      if (palo === Palo.BASTO)  return 2;
      return 7;
    }
    if (num === 7) {
      if (palo === Palo.ESPADA) return 3;
      if (palo === Palo.ORO)    return 4;
      return 11;
    }
    const tabla = { 3:5, 2:6, 12:8, 11:9, 10:10, 6:12, 5:13, 4:14 };
    return tabla[num] ?? 14;
  }

  static calcularValorEnvido(num) {
    return num >= 10 ? 0 : num;
  }

  nombre() {
    const palos = ['Espada', 'Basto', 'Oro', 'Copa'];
    return `${this.numero} de ${palos[this.palo]}`;
  }

  clave() {
    const palos = ['espada', 'basto', 'oro', 'copa'];
    return `${palos[this.palo]}_${this.numero}`;
  }

  esIgual(otra) {
    return this.numero === otra.numero && this.palo === otra.palo;
  }
}

export class TrucoLogic {
  constructor(puntosParaGanar = 15) {
    this.puntosParaGanar = puntosParaGanar;

    this.estado         = EstadoJuego.ESPERANDO;
    this.puntosJugador  = 0;
    this.puntosRival    = 0;

    this.manoJugador = [];
    this.manoRival   = [];
    this.bazas       = [];
    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;

    this.trucoActual    = LlamadaTruco.NINGUNA;
    this.enviDoActual   = LlamadaEnvido.NINGUNA;
    this.quienCantoTruco  = '';
    this.quienCantoEnvido = '';
    this.respuestaTruco   = Respuesta.PENDIENTE;
    this.respuestaEnvido  = Respuesta.PENDIENTE;

    this.puntosTrucoEnJuego  = 1;
    this.puntosEnvidoEnJuego = 0;

    this.turnoJugador = true;

    this.powerupsActivos = [];

    this.auraGanadaMano = 0;

    this._listeners = {};
  }

  on(evento, callback) {
    if (!this._listeners[evento]) this._listeners[evento] = [];
    this._listeners[evento].push(callback);
    return this;
  }

  off(evento, callback) {
    if (!this._listeners[evento]) return;
    this._listeners[evento] = this._listeners[evento].filter(cb => cb !== callback);
  }

  emit(evento, ...args) {
    (this._listeners[evento] || []).forEach(cb => cb(...args));
  }

  _crearMazo() {
    const numeros = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    const mazo = [];
    for (const palo of [Palo.ESPADA, Palo.BASTO, Palo.ORO, Palo.COPA]) {
      for (const num of numeros) {
        mazo.push(new Carta(num, palo));
      }
    }
    return mazo;
  }

  _mezclar(mazo) {
    for (let i = mazo.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
  }

  iniciarMano() {
    this.manoJugador = [];
    this.manoRival   = [];
    this.bazas       = [];
    this.cartaJugadaJugador  = null;
    this.cartaJugadaRival    = null;
    this.trucoActual         = LlamadaTruco.NINGUNA;
    this.enviDoActual        = LlamadaEnvido.NINGUNA;
    this.respuestaTruco      = Respuesta.PENDIENTE;
    this.respuestaEnvido     = Respuesta.PENDIENTE;
    this.quienCantoTruco     = '';
    this.quienCantoEnvido    = '';
    this.puntosTrucoEnJuego  = 1;
    this.puntosEnvidoEnJuego = 0;
    this.auraGanadaMano      = 0;

    const mazo = this._mezclar(this._crearMazo());
    for (let i = 0; i < 3; i++) {
      this.manoJugador.push(mazo[i]);
      this.manoRival.push(mazo[i + 3]);
    }

    this.estado = EstadoJuego.TURNO_JUGADOR;
    this.emit('cartasRepartidas', [...this.manoJugador], [...this.manoRival]);
  }

  jugarCarta(carta, esJugador) {
    if (esJugador) {
      if (!this.turnoJugador) { console.warn('No es turno del jugador'); return; }
      const idx = this.manoJugador.findIndex(c => c.esIgual(carta));
      if (idx === -1) { console.warn('Carta no está en la mano'); return; }
      this.manoJugador.splice(idx, 1);
      this.cartaJugadaJugador = carta;
      this.turnoJugador = false;
      this.estado = EstadoJuego.TURNO_RIVAL;
    } else {
      const idx = this.manoRival.findIndex(c => c.esIgual(carta));
      if (idx !== -1) this.manoRival.splice(idx, 1);
      this.cartaJugadaRival = carta;
      this.turnoJugador = true;
      this.estado = EstadoJuego.TURNO_JUGADOR;
    }

    this.emit('cartaJugada', carta, esJugador);

    if (this.cartaJugadaJugador && this.cartaJugadaRival) {
      this._resolverBaza();
    }
  }

  jugarCartaPorIndice(indice, esJugador) {
    const mano = esJugador ? this.manoJugador : this.manoRival;
    if (indice < 0 || indice >= mano.length) { console.warn('Índice inválido'); return; }
    this.jugarCarta(mano[indice], esJugador);
  }

  _resolverBaza() {
    this.estado = EstadoJuego.RESOLVIENDO_BAZA;
    const ganador = this._compararCartas(this.cartaJugadaJugador, this.cartaJugadaRival);

    this.bazas.push({
      jugador: this.cartaJugadaJugador,
      rival:   this.cartaJugadaRival,
      ganador
    });

    this.emit('bazaResuelta', ganador, this.puntosTrucoEnJuego);

    if (ganador === 'jugador') {
      this.auraGanadaMano += 10;
      if (this.powerupsActivos.includes('mazo_enganio')) this.auraGanadaMano += 2;
    }

    this.cartaJugadaJugador = null;
    this.cartaJugadaRival   = null;

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

  _hayGanadorAnticipado() {
    let wJ = 0, wR = 0;
    for (const b of this.bazas) {
      if (b.ganador === 'jugador') wJ++;
      else if (b.ganador === 'rival') wR++;
    }
    return wJ >= 2 || wR >= 2;
  }

  _resolverMano() {
    const ganador = this._determinarGanadorMano();
    this.estado   = EstadoJuego.FIN_MANO;

    const ptsTruco = this._calcularPuntosTruco(ganador);
    if (ganador === 'jugador') {
      this.puntosJugador += ptsTruco;
      this.emit('auraGanada', this.auraGanadaMano);
    } else if (ganador === 'rival') {
      this.puntosRival += ptsTruco;
    }

    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    this.emit('manoTerminada', ganador);

    if (this.puntosJugador >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'jugador');
    } else if (this.puntosRival >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'rival');
    }
  }

  _determinarGanadorMano() {
    let wJ = 0, wR = 0;
    let primerGanador = '';
    for (let i = 0; i < this.bazas.length; i++) {
      const b = this.bazas[i];
      if (b.ganador === 'jugador') wJ++;
      else if (b.ganador === 'rival') wR++;
      if (i === 0 && b.ganador !== 'empate') primerGanador = b.ganador;
    }
    if (wJ >= 2) return 'jugador';
    if (wR >= 2) return 'rival';
    if (wJ === 1 && primerGanador === 'jugador') return 'jugador';
    if (wR === 1 && primerGanador === 'rival')   return 'rival';
    return 'jugador';
  }

  _calcularPuntosTruco(ganador) {
    if (ganador === 'empate') return 0;
    const tabla = {
      [LlamadaTruco.NINGUNA]:     1,
      [LlamadaTruco.TRUCO]:       2,
      [LlamadaTruco.RETRUCO]:     3,
      [LlamadaTruco.VALE_CUATRO]: 4
    };
    return this.respuestaTruco === Respuesta.QUIERO
      ? (tabla[this.trucoActual] ?? 1)
      : 1;
  }

  cantarTruco(quien) {
    const siguiente = this._siguienteNivelTruco();
    if (siguiente === null) { console.warn('No se puede subir más el truco'); return; }
    if (this.quienCantoTruco === quien && this.respuestaTruco === Respuesta.PENDIENTE) {
      console.warn('No podés subir tu propio canto'); return;
    }
    this.trucoActual    = siguiente;
    this.quienCantoTruco = quien;
    this.respuestaTruco  = Respuesta.PENDIENTE;
    this.estado          = EstadoJuego.ESPERANDO_RESPUESTA_TRUCO;
    this.emit('trucoCantado', this.trucoActual, quien);
    this.emit('respuestaRequerida', 'truco');
  }

  responderTruco(respuesta) {
    this.respuestaTruco = respuesta;
    if (respuesta === Respuesta.QUIERO) {
      this.puntosTrucoEnJuego = this._puntosQuieroTruco(this.trucoActual);
      this.estado = this.turnoJugador
        ? EstadoJuego.TURNO_JUGADOR
        : EstadoJuego.TURNO_RIVAL;
    } else {
      const pts = this._puntosNoQuieroTruco(this.trucoActual);
      if (this.quienCantoTruco === 'jugador') this.puntosJugador += pts;
      else this.puntosRival += pts;
      this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
      this._resolverMano();
    }
  }

  _siguienteNivelTruco() {
    const mapa = {
      [LlamadaTruco.NINGUNA]:     LlamadaTruco.TRUCO,
      [LlamadaTruco.TRUCO]:       LlamadaTruco.RETRUCO,
      [LlamadaTruco.RETRUCO]:     LlamadaTruco.VALE_CUATRO,
      [LlamadaTruco.VALE_CUATRO]: null
    };
    return mapa[this.trucoActual] ?? null;
  }

  _puntosQuieroTruco(nivel) {
    return { [LlamadaTruco.TRUCO]:2, [LlamadaTruco.RETRUCO]:3, [LlamadaTruco.VALE_CUATRO]:4 }[nivel] ?? 1;
  }

  _puntosNoQuieroTruco(nivel) {
    return { [LlamadaTruco.TRUCO]:1, [LlamadaTruco.RETRUCO]:2, [LlamadaTruco.VALE_CUATRO]:3 }[nivel] ?? 1;
  }

  cantarEnvido(nivel, quien) {
    if (this.bazas.length > 0 || this.cartaJugadaJugador || this.cartaJugadaRival) {
      console.warn('El envido solo se canta antes de la primera carta'); return;
    }
    this.enviDoActual    = nivel;
    this.quienCantoEnvido = quien;
    this.respuestaEnvido  = Respuesta.PENDIENTE;
    this.estado           = EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO;
    this.emit('envidoCantado', nivel, quien);
    this.emit('respuestaRequerida', 'envido');
  }

  responderEnvido(respuesta) {
    this.respuestaEnvido = respuesta;
    if (respuesta === Respuesta.QUIERO) {
      const ptsJ = this.calcularEnvido(this.manoJugador);
      const ptsR = this.calcularEnvido(this.manoRival);
      this.puntosEnvidoEnJuego = this._calcularPuntosEnvidoEnJuego(this.enviDoActual);
      if (ptsJ >= ptsR) {
        this.puntosJugador += this.puntosEnvidoEnJuego;
        this.auraGanadaMano += 15;
      } else {
        this.puntosRival += this.puntosEnvidoEnJuego;
      }
      this.emit('envidoResuelto', ptsJ, ptsR);
    } else {
      const pts = this.enviDoActual === LlamadaEnvido.ENVIDO ? 1 : 2;
      if (this.quienCantoEnvido === 'jugador') this.puntosJugador += pts;
      else this.puntosRival += pts;
    }
    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    if (this._comprobarGanadorPartida()) return;
    if (this._comprobarFinal()) return;
    this.estado = this.turnoJugador ? EstadoJuego.TURNO_JUGADOR : EstadoJuego.TURNO_RIVAL;
  }

  _calcularPuntosEnvidoEnJuego(nivel) {
    if (nivel === LlamadaEnvido.FALTA_ENVIDO) {
      return this.puntosParaGanar - Math.min(this.puntosJugador, this.puntosRival);
    }
    return { [LlamadaEnvido.ENVIDO]:2, [LlamadaEnvido.ENVIDO_ENVIDO]:4, [LlamadaEnvido.REAL_ENVIDO]:3 }[nivel] ?? 2;
  }

  calcularEnvido(mano) {
    const porPalo = {};
    for (const carta of mano) {
      if (!porPalo[carta.palo]) porPalo[carta.palo] = [];
      porPalo[carta.palo].push(carta.valorEnvido);
    }
    let mejor = 0;
    for (const vals of Object.values(porPalo)) {
      vals.sort((a, b) => b - a);
      if (vals.length >= 2) {
        const pts = vals[0] + vals[1] + 20;
        if (pts > mejor) mejor = pts;
      } else {
        if (vals[0] > mejor) mejor = vals[0];
      }
    }
    return mejor;
  }

  irAlMazo(quien) {
    const pts = (this.trucoActual !== LlamadaTruco.NINGUNA && this.respuestaTruco === Respuesta.QUIERO)
    ? this.puntosTrucoEnJuego : 1;
    
    if (quien === 'jugador') this.puntosRival += pts;
    else this.puntosJugador += pts;
    
    this.emit('puntosActualizados', this.puntosJugador, this.puntosRival);
    
    if (!this._comprobarGanadorPartida()) {
      this._resolverMano();
    }
  }

  puedeCantarTruco(quien) {
    if (![EstadoJuego.TURNO_JUGADOR, EstadoJuego.TURNO_RIVAL].includes(this.estado)) return false;
    if (this.trucoActual === LlamadaTruco.VALE_CUATRO) return false;
    if (this.quienCantoTruco === quien && this.respuestaTruco === Respuesta.PENDIENTE) return false;
    return true;
  }

  puedeCantarEnvido(quien) {
    if (this.enviDoActual !== LlamadaEnvido.NINGUNA && this.respuestaEnvido !== Respuesta.QUIERO) return false;
    if (this.bazas.length > 0) return false;
    if (this.cartaJugadaJugador || this.cartaJugadaRival) return false;
    return true;
  }

  nombreEstado() {
    const nombres = {
      [EstadoJuego.ESPERANDO]:                 'Esperando',
      [EstadoJuego.TURNO_JUGADOR]:             'Tu turno',
      [EstadoJuego.TURNO_RIVAL]:               'Turno del rival',
      [EstadoJuego.RESOLVIENDO_BAZA]:          'Resolviendo baza',
      [EstadoJuego.ESPERANDO_RESPUESTA_TRUCO]: '¿Querés el truco?',
      [EstadoJuego.ESPERANDO_RESPUESTA_ENVIDO]:'¿Querés el envido?',
      [EstadoJuego.FIN_MANO]:                  'Fin de mano',
      [EstadoJuego.FIN_PARTIDA]:               '¡Partida terminada!'
    };
    return nombres[this.estado] ?? 'Desconocido';
  }

  debug() {
    const p = ['Espada','Basto','Oro','Copa'];
    console.log('=== TRUCAZO DEBUG ===');
    console.log('Estado:', this.nombreEstado());
    console.log('Puntos:', this.puntosJugador, '-', this.puntosRival);
    console.log('Mano jugador:', this.manoJugador.map(c => c.nombre()).join(', '));
    console.log('Mano rival:', this.manoRival.map(c => c.nombre()).join(', '));
    console.log('Bazas:', this.bazas.length);
    console.log('Truco:', this.trucoActual, '| Envido:', this.enviDoActual);
    console.log('Aura mano:', this.auraGanadaMano);
  }
  
  _comprobarGanadorPartida() {
    if (this.puntosJugador >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'jugador');
      return true;
    } else if (this.puntosRival >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'rival');
      return true;
    }
    return false;
  }
  
  _comprobarFinal() {
    if (this.puntosJugador >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'jugador');
      return true;
    } else if (this.puntosRival >= this.puntosParaGanar) {
      this.estado = EstadoJuego.FIN_PARTIDA;
      this.emit('partidaTerminada', 'rival');
      return true;
    }
    return false;
  }
}
