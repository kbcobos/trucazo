import { LlamadaTruco, LlamadaEnvido, Respuesta } from './core/Enums.js';

const PERFILES = {
  tierra_del_fuego: {
    nombre:           'Mariano Torre',
    apodo:            'El Casi Ángel',
    probCantoTruco:   0.30,
    probCantoEnvido:  0.40,
    probRetruco:      0.10,
    probValeCuatro:   0.05,
    probQuieroTruco:  0.75,
    probQuieroEnvido: 0.80,
    probFarol:        0.08,
    estiloCarta:      'defensivo',
    probIrMazo:       0.04,
    fraseTruco:       '¡TRUCO! ...¿Eso se grita, no?',
    fraseEnvido:      'Envido, creo... igual nunca sé mis puntos.',
    fraseVictoria:    '¡Lo hice! ¡Gané como en el episodio 47!',
    fraseDerrota:     'Esto no estaba en el guión... seguimos.',
  },
  santa_cruz: {
    nombre:           'Néstor Kirchner',
    apodo:            'El Pingüino',
    probCantoTruco:   0.50,
    probCantoEnvido:  0.55,
    probRetruco:      0.40,
    probValeCuatro:   0.20,
    probQuieroTruco:  0.50,
    probQuieroEnvido: 0.55,
    probFarol:        0.60,
    estiloCarta:      'calculado',
    probIrMazo:       0.18,
    fraseTruco:       'Truco. Pero esto lo vamos a resolver entre nosotros.',
    fraseEnvido:      'Envido. Los números son una construcción, che.',
    fraseVictoria:    'El modelo funciona. Siempre funcionó.',
    fraseDerrota:     'Esto es una derrota táctica, no estratégica.',
  },
  buenos_aires: {
    nombre:           'Ricardo Fort',
    apodo:            'El Rey del Chocolate',
    probCantoTruco:   0.70,
    probCantoEnvido:  0.60,
    probRetruco:      0.55,
    probValeCuatro:   0.35,
    probQuieroTruco:  0.65,
    probQuieroEnvido: 0.60,
    probFarol:        0.50,
    estiloCarta:      'agresivo',
    probIrMazo:       0.05,
    fraseTruco:       '¡TRUCO, darling! Y que alguien traiga más champagne.',
    fraseEnvido:      'Envido. Mis puntos son tan fabulosos como yo.',
    fraseVictoria:    'Fabulous. Como siempre. Alguien fotografíe esto.',
    fraseDerrota:     'Esto jamás habría pasado en mi yate.',
  },
  santa_fe: {
    nombre:           'Lionel Messi',
    apodo:            'La Pulga',
    probCantoTruco:   0.45,
    probCantoEnvido:  0.50,
    probRetruco:      0.40,
    probValeCuatro:   0.30,
    probQuieroTruco:  0.55,
    probQuieroEnvido: 0.60,
    probFarol:        0.15,
    estiloCarta:      'calculado',
    probIrMazo:       0.10,
    fraseTruco:       'Truco.',
    fraseEnvido:      'Envido.',
    fraseVictoria:    '...',
    fraseDerrota:     'Bien jugado.',
  },
  cordoba: {
    nombre:           'Rodrigo Bueno',
    apodo:            'El Potro',
    probCantoTruco:   0.65,
    probCantoEnvido:  0.65,
    probRetruco:      0.55,
    probValeCuatro:   0.40,
    probQuieroTruco:  0.70,
    probQuieroEnvido: 0.70,
    probFarol:        0.55,
    estiloCarta:      'impredecible',
    probIrMazo:       0.05,
    fraseTruco:       '¡TRUCO, mi amor! ¡A bailar!',
    fraseEnvido:      '¡Envido! ¡Y que suene la cumbia!',
    fraseVictoria:    '¡Qué liiindo que es el truco! ¡Olé, olé!',
    fraseDerrota:     '¡No importa! ¡Esta noche igual festejamos!',
  },
  san_juan: {
    nombre:           'Claudio Tapia',
    apodo:            'Chiqui',
    probCantoTruco:   0.55,
    probCantoEnvido:  0.50,
    probRetruco:      0.50,
    probValeCuatro:   0.35,
    probQuieroTruco:  0.55,
    probQuieroEnvido: 0.50,
    probFarol:        0.70,
    estiloCarta:      'calculado',
    probIrMazo:       0.15,
    fraseTruco:       'Truco. El reglamento me ampara.',
    fraseEnvido:      'Envido. Según el artículo 7 del estatuto.',
    fraseVictoria:    'Como siempre: la AFA, primero.',
    fraseDerrota:     'Esto va a revisión. Pido el VAR.',
  },
  salta: {
    nombre:           'El Chaqueño Palavecino',
    apodo:            'El Cantor del Norte',
    probCantoTruco:   0.75,
    probCantoEnvido:  0.80,
    probRetruco:      0.70,
    probValeCuatro:   0.55,
    probQuieroTruco:  0.65,
    probQuieroEnvido: 0.70,
    probFarol:        0.90,
    estiloCarta:      'impredecible',
    probIrMazo:       0.04,
    fraseTruco:       '¡Truuuco! ♪ Como canta el zorzal en el monte ♪',
    fraseEnvido:      '¡Falta Envido! ¡Todo o nada, como el amor serrano!',
    fraseVictoria:    '♪ Naaadie me ganó nunca, en este suelo salteño ♪',
    fraseDerrota:     'Hoy ganaste vos... pero el norte siempre vuelve.',
  }
};

const PERFIL_DEFAULT = PERFILES.tierra_del_fuego;

export class IAJefe {
  constructor() {
    this._perfil = { ...PERFIL_DEFAULT };
    this._logic  = null;
  }

  inicializar(provinciaId, logic) {
    this._perfil = { ...(PERFILES[provinciaId] ?? PERFIL_DEFAULT) };
    this._logic  = logic;
  }

  getNombre()      { return this._perfil.nombre; }
  getApodo()       { return this._perfil.apodo;  }

  decidirJugada() {
    const logic = this._logic;
    if (!logic) return { accion: 'jugar_carta', indice: 0 };

    if (logic.bazas.cantidadBazas >= 1 && Math.random() < this._perfil.probIrMazo) {
      if (this._primeraBazaPerdida() && this._manoEsDebil()) {
        return { accion: 'ir_al_mazo' };
      }
    }

    if (logic.puedeCantarTruco('rival') && logic.truco.trucoActual === LlamadaTruco.NINGUNA) {
      if (Math.random() < this._probTrucoAjustada()) {
        return { accion: 'cantar_truco' };
      }
    }

    if (logic.puedeCantarEnvido('rival') && logic.bazas.cantidadBazas === 0) {
      if (Math.random() < this._probEnvidoAjustada()) {
        return { accion: 'cantar_envido', nivelEnvido: this._elegirNivelEnvido() };
      }
    }

    return { accion: 'jugar_carta', indice: this._elegirCarta() };
  }

  responderTruco() {
    let prob = this._perfil.probQuieroTruco;
    if (this._manoEsFuerte()) prob = Math.min(prob + 0.20, 1.0);
    else if (this._manoEsDebil()) prob = Math.max(prob - 0.25, 0.05);
    if (this._logic.truco.trucoActual === LlamadaTruco.RETRUCO) prob = Math.max(prob - 0.10, 0.05);
    return Math.random() < prob ? Respuesta.QUIERO : Respuesta.NO_QUIERO;
  }

  responderEnvido() {
    let prob = this._perfil.probQuieroEnvido;
    const pts = this._logic.calcularEnvido(this._logic.manoRival);
    if (pts >= 28) prob = Math.min(prob + 0.25, 1.0);
    else if (pts <= 20) prob = Math.max(prob - 0.30, 0.05);
    if (this._logic.envido.envidoActual === LlamadaEnvido.FALTA_ENVIDO) prob = Math.max(prob - 0.20, 0.05);
    return Math.random() < prob ? Respuesta.QUIERO : Respuesta.NO_QUIERO;
  }

  quiereRetruco() {
    if (this._logic.truco.trucoActual === LlamadaTruco.TRUCO)
      return Math.random() < this._perfil.probRetruco;
    if (this._logic.truco.trucoActual === LlamadaTruco.RETRUCO)
      return Math.random() < this._perfil.probValeCuatro;
    return false;
  }

  _elegirCarta() {
    const mano = this._logic.manoRival;
    if (!mano.length) return 0;
    switch (this._perfil.estiloCarta) {
      case 'agresivo':     return this._indiceMasFuerte(mano);
      case 'defensivo':    return this._indiceMasDebil(mano);
      case 'calculado':
        if (this._logic.bazas.cantidadBazas === 0) return this._indiceMedia(mano);
        if (this._logic.bazas.cantidadBazas === 1) return this._indiceMasFuerte(mano);
        return 0;
      case 'impredecible':
        return Math.random() < this._perfil.probFarol
          ? this._indiceMasDebil(mano)
          : this._indiceMasFuerte(mano);
      default:
        return Math.floor(Math.random() * mano.length);
    }
  }

  _indiceMasFuerte(mano) {
    return mano.reduce((bestIdx, c, i) =>
      c.valorTruco < mano[bestIdx].valorTruco ? i : bestIdx, 0);
  }

  _indiceMasDebil(mano) {
    return mano.reduce((bestIdx, c, i) =>
      c.valorTruco > mano[bestIdx].valorTruco ? i : bestIdx, 0);
  }

  _indiceMedia(mano) {
    const sorted = [...mano].map((c, i) => ({ c, i }))
      .sort((a, b) => a.c.valorTruco - b.c.valorTruco);
    return sorted[Math.floor(sorted.length / 2)].i;
  }

  _manoEsFuerte() {
    return this._logic.manoRival.some(c => c.valorTruco <= 4);
  }
  _manoEsDebil() {
    return this._logic.manoRival.every(c => c.valorTruco >= 11);
  }
  _primeraBazaPerdida() {
    return this._logic.bazas.cantidadBazas > 0 && this._logic.bazas.bazas[0].ganador === 'jugador';
  }

  _probTrucoAjustada() {
    let prob = this._perfil.probCantoTruco;
    if (this._manoEsFuerte()) prob = Math.min(prob + 0.20, 0.95);
    else if (this._manoEsDebil()) {
      if (Math.random() < this._perfil.probFarol) prob = Math.min(prob + 0.15, 0.80);
      else prob = Math.max(prob - 0.25, 0.05);
    }
    return prob;
  }

  _probEnvidoAjustada() {
    let prob = this._perfil.probCantoEnvido;
    const pts = this._logic.calcularEnvido(this._logic.manoRival);
    if (pts >= 30) prob = Math.min(prob + 0.30, 0.98);
    else if (pts >= 25) prob = Math.min(prob + 0.10, 0.90);
    else if (pts <= 18) prob = Math.max(prob - 0.20, 0.05);
    return prob;
  }

  _elegirNivelEnvido() {
    const pts = this._logic.calcularEnvido(this._logic.manoRival);
    if (pts >= 30 && this._perfil.probValeCuatro >= 0.4) return LlamadaEnvido.FALTA_ENVIDO;
    if (pts >= 27) return LlamadaEnvido.REAL_ENVIDO;
    return LlamadaEnvido.ENVIDO;
  }

  fraseTruco()    { return this._perfil.fraseTruco;    }
  fraseEnvido()   { return this._perfil.fraseEnvido;   }
  fraseVictoria() { return this._perfil.fraseVictoria; }
  fraseDerrota()  { return this._perfil.fraseDerrota;  }
}
