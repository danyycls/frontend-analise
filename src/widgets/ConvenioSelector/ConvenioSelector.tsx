import { useState, useMemo, useCallback } from 'react';
import { useConvenios, CONVENIO_UFS, type ConvenioDTO } from './hooks';
import { normalizarCNPJ } from '@/shared/lib/formatters';
import './ConvenioSelector.css';

interface ConvenioSelectorProps {
  cnpjsSelecionados: string[];
  onToggleCnpj: (cnpj: string) => void;
  onSelectAll: (cnpjs: string[]) => void;
  onDeselectAll: () => void;
}

export default function ConvenioSelector({
  cnpjsSelecionados,
  onToggleCnpj,
  onSelectAll,
  onDeselectAll,
}: ConvenioSelectorProps) {
  const [pagina, setPagina] = useState(1);
  const [filtroUf, setFiltroUf] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const { data, isLoading } = useConvenios({
    pagina,
    porPagina: 10,
    uf: filtroUf,
    municipio: filtroMunicipio,
    tipo: filtroTipo,
  });

  const dados = data?.dados || [];
  const totalPaginas = data?.total_paginas || 1;
  const total = data?.total || 0;

  const cnpjsSelecionadosNorm = useMemo(
    () => cnpjsSelecionados.map(normalizarCNPJ),
    [cnpjsSelecionados]
  );

  const todosNestaPagina = useMemo(() => dados.map(d => d.cnpj), [dados]);
  const todosSelecionados = useMemo(
    () => dados.length > 0 && dados.every(d => cnpjsSelecionadosNorm.includes(normalizarCNPJ(d.cnpj))),
    [dados, cnpjsSelecionadosNorm]
  );

  const handleSelectAllToggle = useCallback(() => {
    if (todosSelecionados) {
      onDeselectAll();
    } else {
      onSelectAll(todosNestaPagina);
    }
  }, [todosSelecionados, todosNestaPagina, onSelectAll, onDeselectAll]);

  const tiposUnicos = useMemo(() => {
    if (!data?.dados) return [];
    const set = new Set<string>();
    data.dados.forEach(d => { if (d.tipo) set.add(d.tipo); });
    return Array.from(set).sort();
  }, [data]);

  return (
    <div className="convenio-selector">
      <div className="convenio-selector-header">
        <span className="convenio-selector-titulo">Consultar por CNPJ</span>
        <span className="convenio-selector-subtitulo">
          {total} convênio{total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="convenio-filtros">
        <select value={filtroUf} onChange={e => { setPagina(1); setFiltroUf(e.target.value); }}>
          <option value="">UF: Todas</option>
          {CONVENIO_UFS.map(uf => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Município..."
          value={filtroMunicipio}
          onChange={e => { setPagina(1); setFiltroMunicipio(e.target.value); }}
        />
        <select value={filtroTipo} onChange={e => { setPagina(1); setFiltroTipo(e.target.value); }}>
          <option value="">Tipo: Todos</option>
          {tiposUnicos.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="convenio-select-all">
        <label className="convenio-checkbox-label">
          <input
            type="checkbox"
            checked={todosSelecionados && dados.length > 0}
            onChange={handleSelectAllToggle}
            disabled={dados.length === 0}
          />
          <span>{todosSelecionados ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
        </label>
      </div>

      <div className="convenio-lista">
        {isLoading && (
          <div className="convenio-loading">Carregando...</div>
        )}
        {!isLoading && dados.length === 0 && (
          <div className="convenio-vazio">Nenhum convênio encontrado</div>
        )}
        {!isLoading && dados.map((d, index) => {
          const cnpjNorm = normalizarCNPJ(d.cnpj);
          return (
            <div
              key={`${index}-${d.cnpj}`}
              className={`convenio-item${cnpjsSelecionadosNorm.includes(cnpjNorm) ? ' selected' : ''}`}
            >
              <label className="convenio-checkbox-label">
                <input
                  type="checkbox"
                  checked={cnpjsSelecionadosNorm.includes(cnpjNorm)}
                  onChange={() => onToggleCnpj(d.cnpj)}
                />
                <div className="convenio-item-info">
                  <span className="convenio-item-cnpj">{d.cnpj}</span>
                  <span className="convenio-item-nome">{d.nome_orgao}</span>
                  <span className="convenio-item-meta">
                    {d.uf} · {d.municipio} · {d.tipo}
                  </span>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="convenio-paginacao">
          <button
            className="pagina-btn"
            disabled={pagina <= 1}
            onClick={() => setPagina(p => Math.max(1, p - 1))}
          >
            ◀
          </button>
          <span className="pagina-info">{pagina} / {totalPaginas}</span>
          <button
            className="pagina-btn"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(p => p + 1)}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
