import { fmtNum } from '@/shared/lib/formatters';

interface ContadoresBarProps {
  prefeitos: number;
  vices: number;
  vereadores: number;
  deputados: number;
  senadores: number;
  municipios: number;
  pequenos: number;
  populacao: number;
}

export function ContadoresBar({ prefeitos, vices, vereadores, deputados, senadores, municipios, pequenos, populacao }: ContadoresBarProps) {
  return (
    <div className="estado-section estado-counters-section">
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
        Quantidades de politicos responsaveis por UF ou municipio dessa UF
      </div>
      <div className="estado-counters">
        <div className="estado-counter-item">
          <span className="estado-counter-val">{prefeitos}</span>
          <span className="estado-counter-lbl">PREFEITOS 2024</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{vices}</span>
          <span className="estado-counter-lbl">VICE-PREFEITOS 2024</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{vereadores}</span>
          <span className="estado-counter-lbl">VEREADORES 2024</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{deputados}</span>
          <span className="estado-counter-lbl">DEPUTADOS</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{senadores}</span>
          <span className="estado-counter-lbl">SENADORES</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{municipios}</span>
          <span className="estado-counter-lbl">MUNICÍPIOS</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{pequenos}</span>
          <span className="estado-counter-lbl">MUNICÍPIOS &lt;10K HAB</span>
        </div>
        <div className="estado-counter-item">
          <span className="estado-counter-val">{fmtNum(populacao)}</span>
          <span className="estado-counter-lbl">POPULAÇÃO TOTAL</span>
        </div>
      </div>
    </div>
  );
}
