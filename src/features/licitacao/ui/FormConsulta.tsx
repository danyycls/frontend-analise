import { useState, useEffect, useMemo } from 'react';
import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { normalizarCNPJ } from '@/shared/lib/formatters';
import './Formulario.css';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const TRIMESTRES = [
  { codigo: 1, nome: '1º Trimestre (Jan-Mar)' },
  { codigo: 2, nome: '2º Trimestre (Abr-Jun)' },
  { codigo: 3, nome: '3º Trimestre (Jul-Set)' },
  { codigo: 4, nome: '4º Trimestre (Out-Dez)' },
];

export interface ItemBusca {
  tipo: 'uf' | 'municipio' | 'orgao';
  valor: string;
  uf?: string;
  nome?: string;
}

export interface ParametrosBusca {
  ano: string;
  trimestres: number[];
  modalidade: string;
  dataInicial: string;
  dataFinal: string;
}

function trimestreParaDatas(ano: string, trimestre: number): { dataInicial: string; dataFinal: string } {
  const a = ano.trim();
  switch (trimestre) {
    case 1: return { dataInicial: `${a}0101`, dataFinal: `${a}0331` };
    case 2: return { dataInicial: `${a}0401`, dataFinal: `${a}0630` };
    case 3: return { dataInicial: `${a}0701`, dataFinal: `${a}0930` };
    case 4: return { dataInicial: `${a}1001`, dataFinal: `${a}1231` };
    default: return { dataInicial: `${a}0101`, dataFinal: `${a}1231` };
  }
}

interface FormConsultaProps {
  onSubmit: (itens: ItemBusca[], params: ParametrosBusca) => void;
  cnpjsSelecionados?: string[];
  onCnpjsChange?: (cnpjs: string[]) => void;
  submitLabel?: string;
  error?: string;
}

export default function FormConsulta({
  onSubmit,
  cnpjsSelecionados: cnpjsExternos = [],
  onCnpjsChange,
  submitLabel,
  error: externalError,
}: FormConsultaProps) {
  const [selectedUfs, setSelectedUfs] = useState<string[]>([]);
  const [ufFilter, setUfFilter] = useState('SP');
  const [municipioSearch, setMunicipioSearch] = useState('');
  const [municipios, setMunicipios] = useState<{ id: number; nome: string }[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(false);
  const [selectedMunicipios, setSelectedMunicipios] = useState<{ uf: string; codigo: string; nome: string }[]>([]);
  const [cnpjInput, setCnpjInput] = useState('');
  const [cnpjsLocais, setCnpjsLocais] = useState<string[]>([]);
  const [anoInput, setAnoInput] = useState(String(new Date().getFullYear()));
  const [trimestresSelecionados, setTrimestresSelecionados] = useState(new Set<number>());
  const [codigoModalidade, setCodigoModalidade] = useState('');
  const [erroInterno, setErroInterno] = useState('');

  const erro = externalError || erroInterno;

  const cnpjsCombinados = useMemo(
    () => [...new Set([...cnpjsExternos, ...cnpjsLocais])],
    [cnpjsExternos, cnpjsLocais]
  );

  const todosCnpjsNorm = useMemo(
    () => [...new Set(cnpjsCombinados.map(normalizarCNPJ))],
    [cnpjsCombinados]
  );

  useEffect(() => {
    if (ufFilter) {
      carregarMunicipios(ufFilter);
    }
  }, [ufFilter]);

  async function carregarMunicipios(ufSigla: string) {
    setCarregandoMunicipios(true);
    setMunicipios([]);
    try {
      const data = await api.get<{ id: number; nome: string }[]>(`${ENDPOINTS.IBGE_MUNICIPIOS}/${ufSigla}`);
      setMunicipios(data);
    } catch (err) {
      console.error('Erro ao carregar municipios:', err);
    }
    setCarregandoMunicipios(false);
  }

  const municipiosFiltrados = useMemo(
    () => municipioSearch
      ? municipios.filter(m => m.nome.toLowerCase().includes(municipioSearch.toLowerCase()))
      : municipios,
    [municipios, municipioSearch]
  );

  function toggleUf(uf: string) {
    setSelectedUfs(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    );
  }

  function toggleMunicipio(m: { id: number; nome: string }) {
    setSelectedMunicipios(prev => {
      const exists = prev.find(sm => sm.codigo === String(m.id));
      return exists
        ? prev.filter(sm => sm.codigo !== String(m.id))
        : [...prev, { uf: ufFilter, codigo: String(m.id), nome: m.nome }];
    });
  }

  function toggleTrimestre(t: number) {
    setTrimestresSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function handleCnpjInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setCnpjInput(raw);
    const norm = normalizarCNPJ(raw);
    if (norm.length === 14) {
      setCnpjsLocais(prev => {
        const prevNorm = prev.map(normalizarCNPJ);
        if (prevNorm.includes(norm)) return prev;
        return [...prev, raw];
      });
      setCnpjInput('');
    }
  }

  function removerCnpj(cnpj: string) {
    const norm = normalizarCNPJ(cnpj);
    if (cnpjsExternos.some(c => normalizarCNPJ(c) === norm)) {
      const novos = cnpjsExternos.filter(c => normalizarCNPJ(c) !== norm);
      onCnpjsChange?.(novos);
    } else {
      setCnpjsLocais(prev => {
        const prevNorm = prev.map(normalizarCNPJ);
        return prev.filter((_, i) => prevNorm[i] !== norm);
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErroInterno('');

    if (!anoInput.trim().match(/^\d{4}$/)) {
      setErroInterno('Ano inválido. Use 4 dígitos.');
      return;
    }

    const sels = trimestresSelecionados.size > 0
      ? [...trimestresSelecionados]
      : [1, 2, 3, 4];

    const itens: ItemBusca[] = [];

    for (const uf of selectedUfs) {
      itens.push({ tipo: 'uf', valor: uf, uf, nome: uf });
    }

    for (const mun of selectedMunicipios) {
      itens.push({ tipo: 'municipio', valor: mun.codigo, uf: mun.uf, nome: mun.nome });
    }

    for (const cnpj of todosCnpjsNorm) {
      itens.push({ tipo: 'orgao', valor: cnpj });
    }

    if (itens.length === 0) {
      setErroInterno('Selecione ao menos uma UF, município ou CNPJ.');
      return;
    }

    const { dataInicial, dataFinal } = trimestreParaDatas(anoInput, sels[0]);
    const params: ParametrosBusca = {
      ano: anoInput,
      trimestres: sels,
      modalidade: codigoModalidade,
      dataInicial,
      dataFinal,
    };

    setSelectedUfs([]);
    setSelectedMunicipios([]);
    setCnpjsLocais([]);
    setCnpjInput('');

    onSubmit(itens, params);
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2 style={{ marginBottom: 16 }}>Parâmetros da Consulta</h2>

      <div className="form-group">
        <label>▣ UFs</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {UFS.map(uf => (
            <button key={uf} type="button"
              className={`ano-btn${selectedUfs.includes(uf) ? ' ativo' : ''}`}
              onClick={() => toggleUf(uf)}>
              {uf}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>▣ Municípios</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select value={ufFilter} onChange={(e) => { setUfFilter(e.target.value); setMunicipioSearch(''); }}
            style={{ flex: 1 }}>
            {UFS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="🔍 Filtrar por nome..." value={municipioSearch}
            onChange={e => setMunicipioSearch(e.target.value)}
            style={{ flex: 2 }} />
          {!carregandoMunicipios && municipiosFiltrados.length > 0 && (
            <button type="button"
              onClick={() => {
                const todosDaUF = selectedMunicipios.filter(sm => sm.uf === ufFilter);
                const filtradosSet = new Set(municipiosFiltrados.map(m => String(m.id)));
                const todosNaLista = todosDaUF.length > 0 && todosDaUF.every(sm => filtradosSet.has(sm.codigo));
                if (todosNaLista) {
                  setSelectedMunicipios(prev => prev.filter(sm => !(sm.uf === ufFilter && filtradosSet.has(sm.codigo))));
                } else {
                  const novos = municipiosFiltrados
                    .filter(m => !todosDaUF.some(sm => sm.codigo === String(m.id)))
                    .map(m => ({ uf: ufFilter, codigo: String(m.id), nome: m.nome }));
                  setSelectedMunicipios(prev => [...prev, ...novos]);
                }
              }}
              style={{
                flexShrink: 0,
                whiteSpace: 'nowrap',
                fontSize: '0.62rem',
                marginTop: 0,
                width: 'auto',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
                cursor: 'pointer',
                borderRadius: 4,
                padding: '4px 10px',
              }}>
              {selectedMunicipios.filter(sm => sm.uf === ufFilter).length > 0 &&
               municipiosFiltrados.every(m => selectedMunicipios.some(sm => sm.codigo === String(m.id)))
                ? 'Limpar'
                : `Marcar ${municipiosFiltrados.length}`}
            </button>
          )}
        </div>
        {carregandoMunicipios ? (
          <p className="form-status">Carregando municípios...</p>
        ) : municipiosFiltrados.length === 0 ? (
          <p className="form-status vazio">Nenhum município encontrado{municipioSearch ? ` para "${municipioSearch}"` : ` para ${ufFilter}`}.</p>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 180, overflowY: 'auto' }}>
            {municipiosFiltrados.map(m => (
              <button key={m.id} type="button"
                className={`ano-btn${selectedMunicipios.some(sm => sm.codigo === String(m.id)) ? ' ativo' : ''}`}
                onClick={() => toggleMunicipio(m)}>
                {m.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label>▣ Órgãos (CNPJ)</label>
        {cnpjsCombinados.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {cnpjsCombinados.map(cnpj => (
              <span key={cnpj} className="ano-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                {cnpj}
                <button type="button" onClick={() => removerCnpj(cnpj)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
        <input type="text" placeholder="Digite um CNPJ..." value={cnpjInput} onChange={handleCnpjInput} />
      </div>

      <div className="form-group required">
        <label>Ano</label>
        <input type="text" placeholder="2024" value={anoInput} onChange={e => setAnoInput(e.target.value)} maxLength={4} />
      </div>

      <div className="form-group">
        <label>Trimestre(s)</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TRIMESTRES.map(t => (
            <button key={t.codigo} type="button"
              className={`ano-btn${trimestresSelecionados.has(t.codigo) ? ' ativo' : ''}`}
              onClick={() => toggleTrimestre(t.codigo)}>
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group optional">
        <label>Modalidade (opcional)</label>
        <select value={codigoModalidade} onChange={(e) => setCodigoModalidade(e.target.value)}>
          <option value="">Todas as modalidades</option>
          <option value="1">Dispensa de Licitação</option>
          <option value="2">Inexigibilidade</option>
          <option value="3">Pregão</option>
          <option value="4">Concorrência</option>
          <option value="5">Concurso</option>
          <option value="6">Leilão</option>
          <option value="7">Chamamento Público</option>
          <option value="8">Credenciamento</option>
        </select>
      </div>

      {erro && <div className="form-erro">{erro}</div>}

      <button type="submit" className="btn btn-accent">
        {submitLabel || `Buscar ${selectedUfs.length + selectedMunicipios.length + todosCnpjsNorm.length} item(ns)`}
      </button>
    </form>
  );
}

export { trimestreParaDatas };
