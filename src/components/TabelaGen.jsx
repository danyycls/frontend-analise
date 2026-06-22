export default function TabelaGen({ cabecalhos, linhas, maxWidthCol }) {
  if (!linhas || linhas.length === 0) return <p className="ad-empty">Nenhum dado encontrado.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>{cabecalhos.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i}>
              {linha.map((val, j) => (
                <td key={j} style={maxWidthCol?.[j] ? { maxWidth: maxWidthCol[j], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}}>
                  {val ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
