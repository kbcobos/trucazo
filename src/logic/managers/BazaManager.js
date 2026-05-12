export class BazaManager {
  constructor() {
    this.bazas = [];
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
    let wJ = 0, wR = 0;
    for (const b of this.bazas) {
      if (b.ganador === 'jugador') wJ++;
      else if (b.ganador === 'rival') wR++;
    }
    return wJ >= 2 || wR >= 2;
  }

  determinarGanadorMano() {
    let wJ = 0, wR = 0;
    let primerGanadorNoEmpate = '';

    for (let i = 0; i < this.bazas.length; i++) {
      const b = this.bazas[i];
      if (b.ganador === 'jugador') wJ++;
      else if (b.ganador === 'rival') wR++;
      
      if (primerGanadorNoEmpate === '' && b.ganador !== 'empate') {
        primerGanadorNoEmpate = b.ganador;
      }
    }

    if (wJ >= 2) return 'jugador';
    if (wR >= 2) return 'rival';

    if (primerGanadorNoEmpate !== '') return primerGanadorNoEmpate;

    return 'jugador';
  }

  get cantidadBazas() {
    return this.bazas.length;
  }
}
