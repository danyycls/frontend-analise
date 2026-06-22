export default function TabelaDespesasDeputado({ dados }) {
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
              <td>{formatValor(d.valorLiquido)}</td>
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

function fmtDoc(d) {
  if (!d) return '';
  const s = String(d).replace(/\D/g, '');
  if (s.length === 11) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (s.length === 14) return s.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return String(d);
}

function formatValor(v) {
  if (v == null) return '-';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
