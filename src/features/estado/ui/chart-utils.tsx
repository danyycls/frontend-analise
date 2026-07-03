// @ts-nocheck
import './chart-utils.css';
export const CHART_COLORS = [
  '#ff0080', '#00ffff', '#39ff14', '#ff6600', '#b000ff',
  '#ff00ff', '#00ffcc', '#ffff00', '#0066ff', '#ff4400',
];

export const CHART_SIZE_SM = 170;
export const CHART_SIZE_MD = 190;
export const CHART_SIZE_LG = 340;

export function fmtMoneyCompact(v: number) {
  if (v >= 1e9) return 'R$ ' + (v / 1e9).toFixed(1) + ' bi';
  if (v >= 1e6) return 'R$ ' + (v / 1e6).toFixed(1) + ' mi';
  if (v >= 1e3) return 'R$ ' + (v / 1e3).toFixed(0) + ' mil';
  return 'R$ ' + v.toFixed(0);
}

export function aggregateBy(data: any[], key: string) {
  const map = new Map<string, number>();
  data.forEach(d => {
    const k = d[key] || 'Desconhecido';
    map.set(k, (map.get(k) || 0) + Number(d.valor || 0));
  });
  return Array.from(map.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
}

export function topN(data: { nome: string; valor: number }[], n = 8) {
  if (data.length <= n) return data;
  const top = data.slice(0, n - 1);
  const outrosValor = data.slice(n - 1).reduce((s, d) => s + d.valor, 0);
  return [...top, { nome: `Outros (${data.length - n + 1})`, valor: outrosValor }];
}

export function PieChart({ data, size = CHART_SIZE_SM }: { data: { nome: string; valor: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  if (total === 0 || data.length === 0) {
    return <div className="chart-empty">Sem dados</div>;
  }

  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  let currentAngle = -90;

  const slices = data.map(d => {
    const pctVal = (d.valor / total) * 100;
    const sweep = pctVal * 3.6;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweep;
    currentAngle += sweep;
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle * Math.PI) / 180;
    const labelR = radius * 0.62;
    return {
      ...d,
      startAngle,
      endAngle,
      pctVal,
      labelX: cx + labelR * Math.cos(midRad),
      labelY: cy + labelR * Math.sin(midRad),
    };
  });

  return (
    <div className="chart-wrap">
      <svg className="chart-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => {
          const startRad = (slice.startAngle * Math.PI) / 180;
          const endRad = (slice.endAngle * Math.PI) / 180;
          const x1 = cx + radius * Math.cos(startRad);
          const y1 = cy + radius * Math.sin(startRad);
          const x2 = cx + radius * Math.cos(endRad);
          const y2 = cy + radius * Math.sin(endRad);
          const largeArc = slice.endAngle - slice.startAngle > 180 ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return (
            <g key={i}>
              <path d={d} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="var(--bg-surface)" strokeWidth="1.5" />
              {slice.pctVal >= 7 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontSize={size > 250 ? 11 : 9}
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {slice.pctVal.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {slices.map((slice, i) => (
          <div className="chart-legend-item" key={i} title={`${slice.nome}: ${fmtMoneyCompact(slice.valor)} (${slice.pctVal.toFixed(1)}%)`}>
            <span className="chart-legend-color" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="chart-legend-name">{slice.nome}</span>
            <span className="chart-legend-val">
              {fmtMoneyCompact(slice.valor)}
              <span className="chart-legend-pct">{slice.pctVal.toFixed(1)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
