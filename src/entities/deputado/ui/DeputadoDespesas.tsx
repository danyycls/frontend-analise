import { fmtDoc, fmtValor } from '@/shared/lib/formatters';

interface TabelaDespesasDeputadoProps {
  dados: Array<Record<string, any>>;
}

export default function TabelaDespesasDeputado({ dados }: TabelaDespesasDeputadoProps) {
  if (!dados || dados.length === 0) return <p className="ad-empty">Nenhuma despesa encontrada.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Fornecedor</th>
            <th>Valor</th>
            <th>Documento</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d, i) => (
            <tr key={i}>
              <td>{d.dataDocumento || '-'}</td>
              <td>{d.tipoDespesa || d.tipoDocumento || '-'}</td>
              <td>{d.nomeFornecedor || fmtDoc(d.cnpjCpfFornecedor) || '-'}</td>
              <td>{fmtValor(d.valorLiquido)}</td>
              <td>
                {d.urlDocumento ? (
                  <a href={d.urlDocumento} target="_blank" rel="noopener noreferrer" className="ad-link">Ver</a>
                ) : (
                  d.numDocumento || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
