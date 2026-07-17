import { useState, useMemo, useRef, useEffect } from 'react';
import './FilaSession.css';

const ITEMS_POR_PAGINA = 10;

export interface FilaItemView {
  id: number;
  tipo: string;
  valor: string;
  ano: string;
  trimestres: number[];
}

interface FilaSessionProps {
  titulo: string;
  itens: FilaItemView[];
  onRemover: (id: number) => void;
  onRemoverMultiplos: (ids: number[]) => void;
  onPausar: (pausado: boolean) => void;
  pausado: boolean;
  processando: boolean;
  onIniciarProximo?: () => void;
  onVerProgresso?: () => void;
}

export default function FilaSession({
  titulo,
  itens,
  onRemover,
  onRemoverMultiplos,
  onPausar,
  pausado,
  processando,
  onIniciarProximo,
  onVerProgresso,
}: FilaSessionProps) {
  const [minimizado, setMinimizado] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const pausadoRef = useRef(pausado);

  useEffect(() => {
    pausadoRef.current = pausado;
  }, [pausado]);

  const totalPaginas = Math.max(1, Math.ceil(itens.length / ITEMS_POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas - 1);

  const itensPagina = useMemo(() => {
    const inicio = paginaSegura * ITEMS_POR_PAGINA;
    return itens.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [itens, paginaSegura]);

  const todosSelecionados = itens.length > 0 && selectedIds.size === itens.length;

  function toggleAll() {
    if (todosSelecionados) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itens.map(i => i.id)));
    }
  }

  function toggleItem(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apagarSelecionados() {
    if (selectedIds.size === 0) return;
    onRemoverMultiplos(Array.from(selectedIds));
    setSelectedIds(new Set());
  }

  function togglePausar() {
    const novaPausa = !pausado;
    onPausar(novaPausa);
    if (!novaPausa && !processando && onIniciarProximo) {
      setTimeout(() => onIniciarProximo(), 100);
    }
  }

  function irPagina(p: number) {
    setPagina(Math.max(0, Math.min(p, totalPaginas - 1)));
  }

  if (itens.length === 0) return null;

  return (
    <div className="fila-session card" style={{ marginTop: 16, padding: 16 }}>
      <div className="fila-header">
        <div className="fila-header-left">
          <h3 className="fila-titulo">
            {titulo} ({itens.length})
          </h3>
          <label className="fila-select-all">
            <input
              type="checkbox"
              checked={todosSelecionados}
              onChange={toggleAll}
            />
            Selecionar Todos
          </label>
          {selectedIds.size > 0 && (
            <>
              <span className="fila-selected-count">{selectedIds.size} selecionado(s)</span>
              <button className="btn btn-sm btn-outline-danger" onClick={apagarSelecionados}>
                Apagar Selecionados
              </button>
            </>
          )}
          {selectedIds.size > 0 && selectedIds.size < itens.length && (
            <button className="btn btn-sm" onClick={() => setSelectedIds(new Set())}>
              Limpar Seleção
            </button>
          )}
        </div>
        <div className="fila-header-right">
          {onVerProgresso && (
            <button className="btn btn-sm" onClick={onVerProgresso} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              Ver Progresso
            </button>
          )}
          <button
            className={`btn btn-sm ${pausado ? '' : 'btn-outline-danger'}`}
            onClick={togglePausar}
          >
            {pausado ? '▶ Retomar' : '⏸ Pausar'}
          </button>
          <button
            className="btn btn-sm fila-toggle"
            onClick={() => setMinimizado(v => !v)}
            title={minimizado ? 'Expandir' : 'Minimizar'}
          >
            {minimizado ? '▸' : '▾'}
          </button>
        </div>
      </div>

      {!minimizado && (
        <>
          <div className="fila-lista">
            {itensPagina.map(item => (
              <div key={item.id} className="fila-item">
                <div className="fila-item-info">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className="fila-item-tipo">
                    {item.tipo === 'uf' ? 'UF' : item.tipo === 'municipio' ? 'Município' : 'Órgão'}
                  </span>
                  <span className="fila-item-valor">{item.valor}</span>
                  <span className="fila-item-ano">{item.ano}</span>
                  <span className="fila-item-trimestres">
                    {item.trimestres.length > 0 ? `T${item.trimestres.join(',T')}` : 'Todos'}
                  </span>
                </div>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onRemover(item.id)}>
                  Remover
                </button>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="fila-paginacao">
              <button
                className="btn btn-sm"
                disabled={paginaSegura === 0}
                onClick={() => irPagina(paginaSegura - 1)}
              >
                ‹ Anterior
              </button>
              <span className="fila-paginacao-info">
                {paginaSegura + 1} / {totalPaginas}
              </span>
              <button
                className="btn btn-sm"
                disabled={paginaSegura >= totalPaginas - 1}
                onClick={() => irPagina(paginaSegura + 1)}
              >
                Próximo ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
