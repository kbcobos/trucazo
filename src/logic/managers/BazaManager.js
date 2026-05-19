export class BazaManager {

  constructor() {
    this.reset();
  }

  reset() {
    this.bazas = [];
  }

  compararCartas(cJ, cR) {

    if (cJ.valorTruco < cR.valorTruco) {
      return 'jugador';
    }

    if (cJ.valorTruco > cR.valorTruco) {
      return 'rival';
    }

    return 'empate';
  }

  registrarBaza(ganador) {

    this.bazas.push({
      ganador
    });
  }

  hayGanadorAnticipado() {

    const ganador =
      this.determinarGanadorParcial();

    return ganador !== null;
  }

  determinarGanadorParcial() {

    const b1 = this.bazas[0]?.ganador;
    const b2 = this.bazas[1]?.ganador;

    // todavía no hay suficientes bazas
    if (!b1) {
      return null;
    }

    // gana primera y segunda
    if (
      b1 === 'jugador' &&
      b2 === 'jugador'
    ) {
      return 'jugador';
    }

    if (
      b1 === 'rival' &&
      b2 === 'rival'
    ) {
      return 'rival';
    }

    // gana primera + empata segunda
    if (
      (b1 === 'jugador' || b1 === 'rival') &&
      b2 === 'empate'
    ) {
      return b1;
    }

    // primera parda + gana segunda
    if (
      b1 === 'empate' &&
      (b2 === 'jugador' || b2 === 'rival')
    ) {
      return b2;
    }

    return null;
  }

  determinarGanadorMano(manoActual) {

    const parcial =
      this.determinarGanadorParcial();

    if (parcial) {
      return parcial;
    }

    const b1 = this.bazas[0]?.ganador;
    const b2 = this.bazas[1]?.ganador;
    const b3 = this.bazas[2]?.ganador;

    // tercera baza normal
    if (b3 === 'jugador') {
      return 'jugador';
    }

    if (b3 === 'rival') {
      return 'rival';
    }

    // tercera parda

    // gana quien ganó primera
    if (
      b1 === 'jugador' ||
      b1 === 'rival'
    ) {
      return b1;
    }

    // primera parda
    // gana quien ganó segunda
    if (
      b2 === 'jugador' ||
      b2 === 'rival'
    ) {
      return b2;
    }

    // todas pardas -> gana mano
    return this.manoActual;;
  }

  get cantidadBazas() {
    return this.bazas.length;
  }
}