export const EstadoJuego = Object.freeze({
  ESPERANDO: 'esperando',
  TURNO_JUGADOR: 'turno_jugador',
  TURNO_RIVAL: 'turno_rival',
  RESOLVIENDO_BAZA: 'resolviendo_baza',
  ESPERANDO_RESPUESTA_TRUCO: 'esperando_respuesta_truco',
  ESPERANDO_RESPUESTA_ENVIDO: 'esperando_respuesta_envido',
  FIN_MANO: 'fin_mano',
  FIN_PARTIDA: 'fin_partida'
});

export const Respuesta = Object.freeze({
  PENDIENTE: 'pendiente',
  QUIERO: 'quiero',
  NO_QUIERO: 'no_quiero'
});