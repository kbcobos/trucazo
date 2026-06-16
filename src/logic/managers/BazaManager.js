export class BazaManager {

  constructor() {
    this.reset();
  }

  reset() {
    this.bazas = [];
  }

  compararCartas(cJ, cR) {
    if (cJ.valorTruco < cR.valorTruco) return 'jugador';
    if (cJ.valorTruco > cR.valorTruco) return 'rival';
    return 'empate';
  }

  registrarBaza(ganador) {
    this.bazas.push({ ganador });
  }

  hayGanadorAnticipado() {
    return this.determinarGanadorParcial() !== null;
  }

  determinarGanadorParcial() {
    const b1 = this.bazas[0]?.ganador;
    const b2 = this.bazas[1]?.ganador;

    if (!b1) return null;

    if (b1 === 'jugador' && b2 === 'jugador') return 'jugador';
    if (b1 === 'rival'   && b2 === 'rival')   return 'rival';

    if ((b1 === 'jugador' || b1 === 'rival') && b2 === 'empate') return b1;
    if (b1 === 'empate' && (b2 === 'jugador' || b2 === 'rival')) return b2;

    return null;
  }

  determinarGanadorMano(manoActual) {
    const parcial = this.determinarGanadorParcial();
    if (parcial) return parcial;

    const b1 = this.bazas[0]?.ganador;
    const b2 = this.bazas[1]?.ganador;
    const b3 = this.bazas[2]?.ganador;

    if (b3 === 'jugador') return 'jugador';
    if (b3 === 'rival')   return 'rival';

    // tercera parda: gana quien ganó la primera
    if (b1 === 'jugador' || b1 === 'rival') return b1;

    // primera parda: gana quien ganó la segunda
    if (b2 === 'jugador' || b2 === 'rival') return b2;

    // FIX: era this.manoActual (undefined) con doble ";". Usar el parámetro recibido
    return manoActual;
  }

  get cantidadBazas() {
    return this.bazas.length;
  }
}
