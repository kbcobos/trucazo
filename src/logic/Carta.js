export const Palo = Object.freeze({
  ESPADA: 0,
  BASTO:  1,
  ORO:    2,
  COPA:   3
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