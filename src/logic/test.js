import { GameEngine } from './GameEngine.js';

import { LlamadaEnvido } from './EnvidoConstants.js';

import { Respuesta } from './GameConstants.js';

const game = new GameEngine();


//==============================
// EVENTOS
//==============================

game.on('cartasRepartidas', (jugador, rival) => {

  console.log('\n=== CARTAS REPARTIDAS ===');

  console.log(
    'Jugador:',
    jugador.map(c => c.nombre())
  );

  console.log(
    'Rival:',
    rival.map(c => c.nombre())
  );
});

game.on('cartaJugada', (carta, esJugador) => {

  console.log(
    `${esJugador ? 'Jugador' : 'Rival'} jugó:`,
    carta.nombre()
  );
});

game.on('bazaResuelta', (ganador) => {

  console.log(
    'Baza ganada por:',
    ganador
  );
});

game.on('trucoCantado', (nivel, quien) => {

  console.log(
    `${quien} cantó truco`,
    nivel
  );
});

game.on('envidoCantado', (res) => {

  console.log('\n=== ENVIDO ===');

  console.log(res);
});

game.on('envidoResuelto', (res) => {

  console.log('\n=== RESULTADO ENVIDO ===');

  console.log(res);
});

game.on('puntosActualizados', (j, r) => {

  console.log(
    `Puntaje -> Jugador: ${j} | Rival: ${r}`
  );
});

game.on('manoTerminada', (ganador) => {

  console.log(
    '\nMano terminada:',
    ganador
  );
});

game.on('partidaTerminada', (ganador) => {

  console.log(
    '\nPARTIDA TERMINADA:',
    ganador
  );
});


//==============================
// INICIAR MANO
//==============================

game.iniciarMano();


//==============================
// ENVIDO
//==============================

game.cantarEnvido(
  LlamadaEnvido.ENVIDO,
  'jugador'
);

game.cantarEnvido(
  LlamadaEnvido.REAL_ENVIDO,
  'rival'
);

game.responderEnvido(
  Respuesta.QUIERO
);


//==============================
// TRUCO
//==============================

game.cantarTruco('jugador');

game.responderTruco(
  Respuesta.QUIERO
);


//==============================
// JUGAR CARTAS
//==============================

game.jugarCarta(
  game.manoJugador[0],
  true
);

game.jugarCarta(
  game.manoRival[0],
  false
);

game.jugarCarta(
  game.manoJugador[0],
  true
);

game.jugarCarta(
  game.manoRival[0],
  false
);

game.jugarCarta(
  game.manoJugador[0],
  true
);

game.jugarCarta(
  game.manoRival[0],
  false
);