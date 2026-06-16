// ═══════════════════════════════════════════════════
// Componente Formulario
// Formulário para iniciar uma consulta de licitações
// Coleta CNPJs, data inicial e data final
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import API_BASE_URL from '../config';
import './Formulario.css';

// Remove traços de uma string de data para o formato ISO básico (AAAAMMDD)
function toAPI(d) {
  return d.replace(/-/g, '');
}

// Adiciona zero à esquerda para números de 1 dígito
function pad(n) {
  return String(n).padStart(2, '0');
}

// Retorna a data atual no formato AAAA-MM-DD
function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Retorna a data de 3 meses atrás no formato AAAA-MM-DD
function tresMesesAtras() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Formulario({ onIniciar }) {
  const [cnpjsTexto, setCnpjsTexto] = useState('');
  const [dataInicial, setDataInicial] = useState(tresMesesAtras);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Envia a requisição para iniciar a análise no backend
  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    // Converte o texto em lista de CNPJs, removendo linhas vazias
    const cnpjs = cnpjsTexto
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!cnpjs.length) {
      setErro('Informe pelo menos um CNPJ.');
      return;
    }

    setLoading(true);

    try {
      // Chama o endpoint /orgao/analise para disparar o processamento assíncrono
      const resp = await fetch(`${API_BASE_URL}/orgao/analise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpjs,
          dataInicial: toAPI(dataInicial),
          dataFinal: toAPI(dataFinal),
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setErro(data.erro || 'Erro ao iniciar análise');
        setLoading(false);
        return;
      }

      // Retorna o jobId para o componente pai iniciar o monitoramento SSE
      onIniciar(data.jobId, {
        cnpjs,
        total: cnpjs.length,
        dataInicial,
        dataFinal,
      });
    } catch (err) {
      setErro(err.message);
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Parâmetros da Consulta</h2>

      {/* Campo de texto para múltiplos CNPJs, um por linha */}
      <div className="form-group full required">
        <label htmlFor="cnpjs">CNPJs (um por linha)</label>
        <textarea
          id="cnpjs"
          rows={6}
          placeholder={`01629276000104\n12345678000100\n99887766000155`}
          value={cnpjsTexto}
          onChange={(e) => setCnpjsTexto(e.target.value)}
        />
      </div>

      {/* Linha com os campos de data inicial e final */}
      <div className="form-row">
        <div className="form-group optional">
          <label htmlFor="dataInicial">Data Inicial</label>
          <input
            id="dataInicial"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>
        <div className="form-group optional">
          <label htmlFor="dataFinal">Data Final</label>
          <input
            id="dataFinal"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>
      </div>

      {/* Mensagem de erro, se houver */}
      {erro && <p className="form-erro">{erro}</p>}

      {/* Botão de submissão: desabilitado durante o loading */}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Processando…' : '▶  Iniciar Análise'}
      </button>
    </form>
  );
}
