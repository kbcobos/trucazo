import { LlamadaEnvido, Respuesta } from '../core/Enums.js';

export class EnvidoManager {
  constructor() {
    this.envidoActual = LlamadaEnvido.NINGUNA;
    this.quienCanto = '';
    this.respuesta = Respuesta.PENDIENTE;
  }

  reset() {
    this.envidoActual = LlamadaEnvido.NINGUNA;
    this.quienCanto = '';
    this.respuesta = Respuesta.PENDIENTE;
  }

  calcularPuntosMano(mano) {
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

  getPuntosEnJuego(nivel, ptsParaGanar, ptsJ, ptsR) {
    if (nivel === LlamadaEnvido.FALTA_ENVIDO) {
      return ptsParaGanar - Math.min(ptsJ, ptsR);
    }
    return { [LlamadaEnvido.ENVIDO]:2, [LlamadaEnvido.ENVIDO_ENVIDO]:4, [LlamadaEnvido.REAL_ENVIDO]:3 }[nivel] ?? 2;
  }
}
