import { useState, useMemo, useCallback, useRef } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { setTipoBusca } from '@/app/store/slices/navigationSlice';
import { useStartOrgaoAnalise } from '../api/hooks';
import './Formulario.css';

const TRIMESTRES = [
  { codigo: 1, nome: '1º Trim (Jan-Mar)' },
  { codigo: 2, nome: '2º Trim (Abr-Jun)' },
  { codigo: 3, nome: '3º Trim (Jul-Set)' },
  { codigo: 4, nome: '4º Trim (Out-Dez)' },
];

function trimestreParaDatas(ano: string, trimestre: number): { dataInicial: string; dataFinal: string } {
  const a = ano.trim();
  switch (trimestre) {
    case 1: return { dataInicial: `${a}-01-01`, dataFinal: `${a}-03-31` };
    case 2: return { dataInicial: `${a}-04-01`, dataFinal: `${a}-06-30` };
    case 3: return { dataInicial: `${a}-07-01`, dataFinal: `${a}-09-30` };
    case 4: return { dataInicial: `${a}-10-01`, dataFinal: `${a}-12-31` };
    default: return { dataInicial: `${a}-01-01`, dataFinal: `${a}-12-31` };
  }
}

interface TrimestreItem {
  trimestre: number;
  dataInicial: string;
  dataFinal: string;
}

interface FormularioProps {
  onIniciar: (jobId: string, meta: { cnpjs: string[]; total: number; dataInicial: string; dataFinal: string; trimestre: number }) => void;
  cnpjsExternos?: string[];
  onRemoverCnpjExterno?: (cnpj: string) => void;
}

export default function Formulario({ onIniciar, cnpjsExternos = [], onRemoverCnpjExterno }: FormularioProps) {
  const dispatch = useAppDispatch();
  const [cnpjsManualTexto, setCnpjsManualTexto] = useState('');
  const [anoInput, setAnoInput] = useState(String(new Date().getFullYear()));
  const [trimestresSelecionados, setTrimestresSelecionados] = useState(new Set<number>());
  const [erro, setErro] = useState('');
  const cancelRef = useRef(false);

  const [emAndamento, setEmAndamento] = useState(false);
  const [faseAtual, setFaseAtual] = useState(0);
  const [totalFases, setTotalFases] = useState(0);

  const { mutateAsync: iniciarAnalise } = useStartOrgaoAnalise();

  const cnpjsManual = useMemo(
    () => cnpjsManualTexto.split('\n').map(s => s.trim()).filter(Boolean),
    [cnpjsManualTexto]
  );

  const todosCnpjs = useMemo(
    () => [...new Set([...cnpjsExternos, ...cnpjsManual])],
    [cnpjsExternos, cnpjsManual]
  );

  const toggleTrimestre = useCallback((t: number) => {
    setTrimestresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');

    if (!anoInput.trim().match(/^\d{4}$/)) {
      setErro('Ano inválido. Use 4 dígitos.');
      return;
    }

    let sels = [...trimestresSelecionados];
    if (sels.length === 0) sels = [1, 2, 3, 4];

    if (todosCnpjs.length === 0) {
      setErro('Nenhum CNPJ selecionado. Selecione na lista ao lado ou digite manualmente.');
      return;
    }

    const trimestres: TrimestreItem[] = sels.map(t => ({
      trimestre: t,
      ...trimestreParaDatas(anoInput, t),
    }));

    cancelRef.current = false;
    setEmAndamento(true);
    setTotalFases(trimestres.length);
    setFaseAtual(0);

    for (let i = 0; i < trimestres.length; i++) {
      if (cancelRef.current) break;

      const tr = trimestres[i];
      setFaseAtual(i + 1);

      try {
        const data = await iniciarAnalise({
          cnpjs: todosCnpjs,
          dataInicial: tr.dataInicial,
          dataFinal: tr.dataFinal,
        });

        onIniciar(data.jobId, {
          cnpjs: todosCnpjs,
          total: todosCnpjs.length,
          dataInicial: tr.dataInicial,
          dataFinal: tr.dataFinal,
          trimestre: tr.trimestre,
        });
      } catch (err: any) {
        setErro(`Erro no ${tr.trimestre}º trimestre: ${err.message || 'Erro'}`);
        break;
      }
    }

    setEmAndamento(false);
  }

  function cancelar() {
    cancelRef.current = true;
    setEmAndamento(false);
  }

  const totalConsultas = todosCnpjs.length * (trimestresSelecionados.size || 4);

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="tipo-busca-bar">
        <button type="button" className="tipo-busca-btn ativo">Por CNPJ do Órgão</button>
        <button type="button" className="tipo-busca-btn" onClick={() => dispatch(setTipoBusca('publicacao'))}>
          Por Estado/Município
        </button>
      </div>

      <h2>Parâmetros da Consulta</h2>

      {cnpjsExternos.length > 0 && (
        <div className="form-group">
          <label>CNPJs selecionados ({cnpjsExternos.length})</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {cnpjsExternos.map(cnpj => (
              <span key={cnpj} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                {cnpj}
                {onRemoverCnpjExterno && (
                  <button type="button" onClick={() => onRemoverCnpjExterno(cnpj)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}>×</button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="form-group optional">
        <label htmlFor="cnpjs-manual">CNPJs adicionais (um por linha, opcional)</label>
        <textarea
          id="cnpjs-manual"
          rows={2}
          placeholder="00000000000000"
          value={cnpjsManualTexto}
          onChange={(e) => setCnpjsManualTexto(e.target.value)}
          disabled={emAndamento}
        />
        {cnpjsManual.length > 0 && (
          <span className="form-helper">{cnpjsManual.length} CNPJ(s) manuais</span>
        )}
      </div>

      <div className="form-group required">
        <label htmlFor="anoInput">Ano</label>
        <input
          id="anoInput"
          type="text"
          placeholder="2024"
          value={anoInput}
          onChange={e => setAnoInput(e.target.value)}
          maxLength={4}
          disabled={emAndamento}
        />
      </div>

      <div className="form-group">
        <label>Trimestre(s)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TRIMESTRES.map(t => (
            <button
              key={t.codigo}
              type="button"
              className={`ano-btn${trimestresSelecionados.has(t.codigo) ? ' ativo' : ''}`}
              onClick={() => toggleTrimestre(t.codigo)}
              disabled={emAndamento}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      {totalConsultas > 0 && !emAndamento && (
        <div className="form-helper" style={{ marginBottom: 8, fontSize: '0.72rem' }}>
          {todosCnpjs.length} CNPJ(s) × {(trimestresSelecionados.size || 4)} trimestre(s) = {totalConsultas} consulta(s)
        </div>
      )}

      {erro && <div className="form-erro">{erro}</div>}

      <div className="form-actions">
        <button type="submit" className="btn btn-accent" disabled={emAndamento || !anoInput.trim().match(/^\d{4}$/)}>
          {emAndamento ? 'Buscando...' : 'Iniciar Análise'}
        </button>
        {emAndamento && (
          <button type="button" className="btn btn-sm" onClick={cancelar} style={{ background: 'var(--error-bg)', border: '1px solid var(--error)', color: 'var(--error)' }}>
            Cancelar
          </button>
        )}
      </div>

      {emAndamento && (
        <div className="progresso-card" style={{ marginTop: 12 }}>
          <div className="dm-carregando">
            <div className="spinner-sm" />
            <span>Trimestre {faseAtual}/{totalFases} — aguardando conclusão...</span>
          </div>
        </div>
      )}
    </form>
  );
}
