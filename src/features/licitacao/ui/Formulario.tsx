import { useState, type FormEvent } from 'react';
import { useAppDispatch } from '@/app/store/hooks';
import { setTipoBusca } from '@/app/store/slices/navigationSlice';
import { useStartOrgaoAnalise } from '../api/hooks';
import { fmtDoc } from '@/shared/lib/formatters';
import './Formulario.css';

function toAPI(d: string) {
  return d.replace(/-/g, '');
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function tresMesesAtras(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface FormularioProps {
  onIniciar: (jobId: string, meta: { cnpjs: string[]; total: number; dataInicial: string; dataFinal: string }) => void;
}

export default function Formulario({ onIniciar }: FormularioProps) {
  const dispatch = useAppDispatch();
  const [cnpjsTexto, setCnpjsTexto] = useState('');
  const [dataInicial, setDataInicial] = useState(tresMesesAtras);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [erro, setErro] = useState('');

  const { mutate: iniciarAnalise, isPending: loading } = useStartOrgaoAnalise();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro('');

    const cnpjs = cnpjsTexto
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!cnpjs.length) {
      setErro('Informe pelo menos um CNPJ.');
      return;
    }

    iniciarAnalise(
      { cnpjs, dataInicial, dataFinal },
      {
        onSuccess: (data) => {
          onIniciar(data.jobId, {
            cnpjs,
            total: cnpjs.length,
            dataInicial,
            dataFinal,
          });
        },
        onError: (err: Error) => {
          setErro(err.message || 'Erro ao iniciar análise');
        },
      }
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="tipo-busca-bar">
        <button
          type="button"
          className="tipo-busca-btn ativo"
        >
          Por CNPJ do Órgão
        </button>
        <button
          type="button"
          className="tipo-busca-btn"
          onClick={() => dispatch(setTipoBusca('publicacao'))}
        >
          Por Estado/Município
        </button>
      </div>
      <h2>Parâmetros da Consulta</h2>

      <div className="form-group full required">
        <label htmlFor="cnpjs">CNPJs (um por linha)</label>
        <textarea
          id="cnpjs"
          rows={3}
          placeholder="00000000000000&#10;00000000000000"
          value={cnpjsTexto}
          onChange={(e) => setCnpjsTexto(e.target.value)}
        />
        {cnpjsTexto && (
          <span className="form-helper">
            {cnpjsTexto.split('\n').filter(Boolean).length} CNPJ(s)
          </span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group required">
          <label htmlFor="data-inicial">Data Inicial</label>
          <input
            id="data-inicial"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>
        <div className="form-group required">
          <label htmlFor="data-final">Data Final</label>
          <input
            id="data-final"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>
      </div>

      {erro && <div className="form-erro">{erro}</div>}

      <button type="submit" className="btn btn-accent" disabled={loading}>
        {loading ? 'Iniciando...' : 'Iniciar Análise'}
      </button>
    </form>
  );
}
