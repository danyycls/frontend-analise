export function trimestreParaDatas(ano: string, trimestre: number): { dataInicial: string; dataFinal: string } {
  switch (trimestre) {
    case 1: return { dataInicial: `${ano}0101`, dataFinal: `${ano}0331` }
    case 2: return { dataInicial: `${ano}0401`, dataFinal: `${ano}0630` }
    case 3: return { dataInicial: `${ano}0701`, dataFinal: `${ano}0930` }
    default: return { dataInicial: `${ano}1001`, dataFinal: `${ano}1231` }
  }
}
