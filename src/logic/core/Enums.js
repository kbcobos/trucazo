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
