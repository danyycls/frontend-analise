import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import './Formulario.css';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const MODALIDADES = [
  { codigo: '', nome: 'Todas as modalidades' },
  { codigo: '1', nome: 'Dispensa de Licitação' },
  { codigo: '2', nome: 'Inexigibilidade' },
  { codigo: '3', nome: 'Pregão' },
  { codigo: '4', nome: 'Concorrência' },
  { codigo: '5', nome: 'Concurso' },
  { codigo: '6', nome: 'Leilão' },
  { codigo: '7', nome: 'Chamamento Público' },
  { codigo: '8', nome: 'Credenciamento' },
];

function pad(n) { return String(n).padStart(2, '0'); }
function hoje() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function tresMesesAtras() { const d = new Date(); d.setMonth(d.getMonth()-3); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function toAPI(d) { return d.replace(/-/g, ''); }

export default function FormularioPublicacao({ onIniciar }) {
  const [tipo, setTipo] = useState('uf');
  const [uf, setUf] = useState('DF');
  const [codigoMunicipio, setCodigoMunicipio] = useState('');
  const [municipioNome, setMunicipioNome] = useState('');
  const [municipios, setMunicipios] = useState([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [codigoModalidade, setCodigoModalidade] = useState('');
  const [dataInicial, setDataInicial] = useState(tresMesesAtras);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (tipo === 'municipio' && uf) {
      carregarMunicipios(uf);
    }
  }, [tipo, uf]);

  async function carregarMunicipios(ufSigla) {
    setCarregandoMunicipios(true);
    setMunicipios([]);
    setCodigoMunicipio('');
    setMunicipioNome('');
    try {
      const resp = await fetch(`${API_BASE_URL}/ibge/municipios/${ufSigla}`);
      if (resp.ok) {
        const data = await resp.json();
        setMunicipios(data);
      }
    } catch (err) {
      console.error('Erro ao carregar municipios:', err);
    }
    setCarregandoMunicipios(false);
  }

  function handleMunicipioChange(e) {
    const idx = e.target.value;
    if (idx === '') {
      setCodigoMunicipio('');
      setMunicipioNome('');
      return;
    }
    const mun = municipios[parseInt(idx)];
    if (mun) {
      setCodigoMunicipio(String(mun.id));
      setMunicipioNome(mun.nome);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (tipo === 'municipio' && !codigoMunicipio) {
      setErro('Selecione um município.');
      return;
    }

    setLoading(true);

    const body = {
      tipo,
      uf,
      dataInicial: toAPI(dataInicial),
      dataFinal: toAPI(dataFinal),
      codigoModalidadeContratacao: codigoModalidade || undefined,
    };
    if (tipo === 'municipio') {
      body.codigoMunicipioIbge = codigoMunicipio;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/publicacao/analise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setErro(data.erro || 'Erro ao iniciar análise');
        setLoading(false);
        return;
      }

      const label = tipo === 'municipio'
        ? `${municipioNome}/${uf}`
        : `UF ${uf}`;

      onIniciar(data.jobId, {
        tipo: 'publicacao',
        label,
        total: 1,
        dataInicial,
        dataFinal,
        uf,
        codigoMunicipio,
        municipioNome,
      });
    } catch (err) {
      setErro(err.message);
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Busca por Estado/Município</h2>

      <div className="form-row">
        <div className="form-group required">
          <label>Tipo de Busca</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="uf">Por Estado (UF)</option>
            <option value="municipio">Por Município</option>
          </select>
        </div>
        <div className="form-group required">
          <label>UF</label>
          <select value={uf} onChange={(e) => setUf(e.target.value)}>
            {UFS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {tipo === 'municipio' && (
        <div className="form-group required">
          <label>Município</label>
          {carregandoMunicipios ? (
            <p className="form-status">Carregando municípios...</p>
          ) : municipios.length === 0 ? (
            <p className="form-status vazio">Nenhum município encontrado para {uf}.</p>
          ) : (
            <select value={municipios.findIndex(m => String(m.id) === codigoMunicipio)} onChange={handleMunicipioChange}>
              <option value="">Selecione um município</option>
              {municipios.map((m, i) => (
                <option key={m.id} value={i}>{m.nome}</option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="form-group optional">
        <label htmlFor="modalidade">Modalidade</label>
        <select id="modalidade" value={codigoModalidade} onChange={(e) => setCodigoModalidade(e.target.value)}>
          {MODALIDADES.map((m) => (
            <option key={m.codigo} value={m.codigo}>{m.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group optional">
          <label htmlFor="pubDataInicial">Data Inicial</label>
          <input id="pubDataInicial" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        </div>
        <div className="form-group optional">
          <label htmlFor="pubDataFinal">Data Final</label>
          <input id="pubDataFinal" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
        </div>
      </div>

      {erro && <p className="form-erro">{erro}</p>}

      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Processando…' : '▶  Buscar Licitações'}
      </button>
    </form>
  );
}
