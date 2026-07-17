import { useAppSelector } from '@/app/store/hooks';
import { fmtDoc } from '@/shared/lib/formatters';
import './Progresso.css';

const STAGES = [
  { id: 'buscando', label: 'Buscando contratos' },
  { id: 'enriquecendo', label: 'Buscando detalhes por órgão' },
  { id: 'processando', label: 'Processando dados' },
  { id: 'concluido', label: 'Concluído' },
];

const STAGE_ORDER = STAGES.map(s => s.id);

function stageStatus(stageId: string, currentStage: string, concluido: boolean): 'done' | 'active' | 'pending' | 'error' {
  if (concluido) return 'done';
  if (currentStage === 'cancelado') return 'error';
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageIdx = STAGE_ORDER.indexOf(stageId);
  if (stageIdx < currentIdx) return 'done';
  if (stageIdx === currentIdx) return 'active';
  return 'pending';
}

function StageIcon({ status }: { status: string }) {
  if (status === 'done') return <span style={{ color: 'var(--success)' }}>&#10003;</span>;
  if (status === 'active') return <span style={{ color: '#e8c547' }}>&#9679;</span>;
  if (status === 'error') return <span style={{ color: 'var(--error)' }}>&#10007;</span>;
  return <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>&#9675;</span>;
}

function StageLabel({ label }: { label: string }) {
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{label}</span>;
}

interface ProgressoProps {
  onCancelar: () => void;
  onNovaAnalise?: () => void;
}

export default function Progresso({ onCancelar, onNovaAnalise }: ProgressoProps) {
  const { progresso, fila } = useAppSelector(s => s.consulta);
  const etapa = progresso.stage;
  const total = progresso.processed || 1;
  const pct = total > 0 ? Math.round((progresso.processed / total) * 100) : 0;

  const etapaComDone = progresso.concluido ? 'done' : etapa;
  const ev = progresso.ultimoEvento as Record<string, unknown> | null;
  const msgBanner = ev?.Orgao
    ? `${String(ev.Orgao)} — ${String(ev.TotalContratos ?? ev.totalContratos ?? 0)} contratos`
    : String(ev?.Message ?? ev?.message ?? '');

  return (
    <div className="progresso-card">
      <div className="progresso-topo">
        <h2>{progresso.concluido ? 'Resultado da Consulta' : 'Progresso da Consulta'}</h2>
        {!progresso.concluido && !progresso.cancelado && (
          <button className="btn btn-sm btn-outline-danger" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>

      {msgBanner && !progresso.concluido && !progresso.cancelado && (
        <div className="progresso-banner-mensagem">
          <span className="progresso-banner-dot"></span>
          <span>{msgBanner}</span>
        </div>
      )}

      {progresso.fetchProgresso && progresso.fetchProgresso.total > 0 && (
        <div className="progresso-fetch-info">
          {progresso.fetchProgresso.concluidos}/{progresso.fetchProgresso.total} {progresso.stage === 'enriquecendo' ? 'órgãos processados' : 'trimestres concluídos'}
        </div>
      )}

      {(progresso.stage === 'buscando' || progresso.stage === 'enriquecendo' || progresso.stage === 'processando') && (fila?.length ?? 0) > 0 && (
        <div className="progresso-fetch-info">
          {(fila?.length ?? 0)} etapa{(fila?.length ?? 0) > 1 ? 's' : ''} restante{(fila?.length ?? 0) > 1 ? 's' : ''}
        </div>
      )}

      <div className="progresso-etapas">
        {STAGES.map((stage) => {
          const status = stageStatus(stage.id, etapaComDone, progresso.concluido);
          const isActive = status === 'active';

          return (
            <div key={stage.id} className="progresso-etapa" data-status={status}>
              <div className="progresso-etapa-icon">
                <StageIcon status={status} />
              </div>
              <StageLabel label={stage.label} />
              {stage.id === 'processando' && isActive && total > 0 && (
                <span className="progresso-etapa-count">
                  {progresso.processed}/{total}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="progresso-bar">
        <div className="progresso-preenchimento" style={{ width: `${progresso.cancelado ? 0 : progresso.concluido ? 100 : pct}%` }} />
      </div>

      <div className="progresso-stats">
        <div className="progresso-stat">
          <span className="progresso-stat-val">{progresso.processed}/{total}</span>
          <span className="progresso-stat-lbl">Processados</span>
        </div>
        <div className="progresso-stat">
          <span className="progresso-stat-val" style={{ color: 'var(--success)' }}>{progresso.success}</span>
          <span className="progresso-stat-lbl">Sucesso</span>
        </div>
        <div className="progresso-stat">
          <span className="progresso-stat-val" style={{ color: 'var(--error)' }}>{progresso.errors}</span>
          <span className="progresso-stat-lbl">Erros</span>
        </div>
      </div>

      <div className="progresso-logs">
        {progresso.log.map((entry, i) => (
          <div key={i} className={`progresso-log ${entry.type === 'error' ? 'erro' : entry.type === 'success' || entry.type === 'completed' ? 'sucesso' : ''}`}>
            {entry.cnpj && <span className="progresso-cnpj">{fmtDoc(entry.cnpj)} </span>}
            {entry.msg}
          </div>
        ))}
      </div>

      {progresso.cancelado && (
        <p className="progresso-mensagem">
          Busca cancelada. Nenhum resultado foi carregado.
        </p>
      )}

      {progresso.concluido && (
        <div className="progresso-concluido">
          <p className="progresso-mensagem accent">
            {progresso.results ? `${progresso.results.length} contratos encontrados` : 'Concluído'}
          </p>
          {(progresso.success > 0 || progresso.results) && onNovaAnalise && (
            <button className="btn btn-sm" onClick={onNovaAnalise}>
              + Nova Consulta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
