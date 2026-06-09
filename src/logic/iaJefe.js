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
  la_plata: {
    nombre:           'René Favaloro',
    apodo:            'El Médico',
    probCantoTruco:   0.40,
    probCantoEnvido:  0.45,
    probRetruco:      0.20,
    probValeCuatro:   0.10,
    probQuieroTruco:  0.60,
    probQuieroEnvido: 0.65,
    probFarol:        0.10,
    estiloCarta:      'calculado',
    probIrMazo:       0.15,
    fraseTruco:       'Truco. Una operación a corazón abierto requiere precisión.',
    fraseEnvido:      'Envido. Veamos cómo están esos latidos.',
    fraseVictoria:    'Un diagnóstico correcto y el tratamiento adecuado. Así se gana.',
    fraseDerrota:     'Hice todo lo humanamente posible. Bien jugado, muchacho.',
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
  mendoza: {
    nombre:           'Joaquín Salvador',
    apodo:            'Quino',
    probCantoTruco:   0.35,
    probCantoEnvido:  0.40,
    probRetruco:      0.15,
    probValeCuatro:   0.05,
    probQuieroTruco:  0.50,
    probQuieroEnvido: 0.60,
    probFarol:        0.20,
    estiloCarta:      'defensivo',
    probIrMazo:       0.10,
    fraseTruco:       'Truco. Y no, no te voy a ofrecer un plato de sopa.',
    fraseEnvido:      'Envido. El mundo está loco, pero mis cartas tienen sentido.',
    fraseVictoria:    'Es curioso, dibujé el triunfo pero se siente mejor en la mesa.',
    fraseDerrota:     'Pucha... como diría Manolito: ¡Los negocios salieron mal!',
  },
  san_juan: {
    nombre:           'Dario Barassi',
    apodo:            'El Comediante',
    probCantoTruco:   0.75,
    probCantoEnvido:  0.70,
    probRetruco:      0.65,
    probValeCuatro:   0.50,
    probQuieroTruco:  0.70,
    probQuieroEnvido: 0.65,
    probFarol:        0.60,
    estiloCarta:      'impredecible',
    probIrMazo:       0.05,
    fraseTruco:       '¡TRUCO! ¡Con el humor se juega mejor!',
    fraseEnvido:      '¡Envido! ¡Ponele onda a la mesa, che!',
    fraseVictoria:    '¡Gané! ¡El comediante siempre tiene la última risa!',
    fraseDerrota:     '¡Ay, me cortaste la música! La próxima te hago reír más.',
  },
  tucuman: {
    nombre:           'Gladys',
    apodo:            'La Bomba Tucumana',
    probCantoTruco:   0.75,
    probCantoEnvido:  0.70,
    probRetruco:      0.65,
    probValeCuatro:   0.50,
    probQuieroTruco:  0.70,
    probQuieroEnvido: 0.65,
    probFarol:        0.60,
    estiloCarta:      'impredecible',
    probIrMazo:       0.05,
    fraseTruco:       '¡TRUCO! ¡Con la pollera amarilla se juega mejor!',
    fraseEnvido:      '¡Envido! ¡Ponele ritmo tropical a la mesa, mi amor!',
    fraseVictoria:    '¡Bomba, bomba, explotó la bomba! ¡Gané!',
    fraseDerrota:     '¡Ay, me cortaste la música! La próxima te bailo.',
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
  },
  jujuy: {
    nombre:           'Alejandra Olivera',
    apodo:            'La Locomotora',
    probCantoTruco:   0.90, 
    probCantoEnvido:  0.85,
    probRetruco:      0.80,
    probValeCuatro:   0.75,
    probQuieroTruco:  0.85,
    probQuieroEnvido: 0.80,
    probFarol:        0.40,
    estiloCarta:      'agresivo',
    probIrMazo:       0.01,
    fraseTruco:       '¡TRUCO! ¡Te voy a noquear en el primer round!',
    fraseEnvido:      '¡Envido! ¡Pegá fuerte o andate del ring!',
    fraseVictoria:    '¡K.O.! ¡No hay rival para la campeona!',
    fraseDerrota:     'Me caigo, pero me levanto antes de que cuenten a diez.',
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

    if (logic.puedeCantarEnvido('rival') && logic.bazas.cantidadBazas === 0) {
      if (Math.random() < this._probEnvidoAjustada()) {
        return { accion: 'cantar_envido', nivelEnvido: this._elegirNivelEnvido() };
      }
    }

    if (logic.puedeCantarTruco('rival')) {
      const nivelTruco = logic.truco.trucoActual;
      
      if (nivelTruco === LlamadaTruco.NINGUNA && Math.random() < this._probTrucoAjustada()) {
        return { accion: 'cantar_truco' };
      } 
      else if (nivelTruco === LlamadaTruco.TRUCO && this.quiereRetruco()) {
        return { accion: 'cantar_truco' };
      } 
      else if (nivelTruco === LlamadaTruco.RETRUCO && this.quiereRetruco()) {
        return { accion: 'cantar_truco' }; 
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
    const pts = this._logic.puntosEnvidoRival;
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
    const pts = this._logic.puntosEnvidoRival;
    if (pts >= 30) prob = Math.min(prob + 0.30, 0.98);
    else if (pts >= 25) prob = Math.min(prob + 0.10, 0.90);
    else if (pts <= 18) prob = Math.max(prob - 0.20, 0.05);
    return prob;
  }

  _elegirNivelEnvido() {
    const pts = this._logic.puntosEnvidoRival;
    if (pts >= 30 && this._perfil.probValeCuatro >= 0.4) return LlamadaEnvido.FALTA_ENVIDO;
    if (pts >= 27) return LlamadaEnvido.REAL_ENVIDO;
    return LlamadaEnvido.ENVIDO;
  }

  fraseTruco()    { return this._perfil.fraseTruco;    }
  fraseEnvido()   { return this._perfil.fraseEnvido;   }
  fraseVictoria() { return this._perfil.fraseVictoria; }
  fraseDerrota()  { return this._perfil.fraseDerrota;  }
}
