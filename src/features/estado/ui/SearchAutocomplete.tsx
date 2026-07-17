import { useState, useEffect, useMemo, useRef } from 'react';

interface SearchAutocompleteProps {
  dados: any[];
  placeholder: string;
  campoNome: string;
  campoPartido: string;
  onFilter: (texto: string) => void;
}

export function SearchAutocomplete({ dados, placeholder, campoNome, campoPartido, onFilter }: SearchAutocompleteProps) {
  const [texto, setTexto] = useState('');
  const [dropdown, setDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sugestoes = useMemo(() => {
    if (!texto.trim()) return dados.slice(0, 15);
    const q = texto.toLowerCase();
    return dados.filter(d => {
      const nome = (d[campoNome] || '').toLowerCase();
      const partido = (d[campoPartido] || '').toLowerCase();
      return nome.includes(q) || partido.includes(q);
    }).slice(0, 15);
  }, [texto, dados, campoNome, campoPartido]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTexto(e.target.value);
    onFilter(e.target.value);
  };

  const handleSelect = (item: any) => {
    const val = (item[campoNome] || '') + ' ' + (item[campoPartido] || '');
    setTexto(val.trim());
    setDropdown(false);
    onFilter(val.trim());
  };

  const handleClear = () => {
    setTexto('');
    setDropdown(false);
    onFilter('');
  };

  const handleToggle = () => {
    setDropdown(!dropdown);
  };

  return (
    <div className="search-autocomplete" ref={ref}>
      <div className="search-input-row">
        <input
          className="search-input"
          type="text"
          placeholder={placeholder}
          value={texto}
          onChange={handleChange}
          onFocus={() => setDropdown(true)}
        />
        {texto ? (
          <button type="button" className="search-clear" onClick={handleClear} title="Limpar">×</button>
        ) : (
          <button type="button" className="search-toggle" onClick={handleToggle} title="Ver lista">{dropdown ? '▴' : '▾'}</button>
        )}
      </div>
      {dropdown && (
        <div className="autocomplete-list">
          {sugestoes.map((item, i) => (
            <div key={i} className="autocomplete-item" onClick={() => handleSelect(item)}>
              <span className="autocomplete-nome">{item[campoNome] || '-'}</span>
              {item[campoPartido] && <span className="autocomplete-partido">{item[campoPartido]}</span>}
            </div>
          ))}
          {sugestoes.length === 0 && texto && (
            <div className="autocomplete-empty">Nenhum resultado</div>
          )}
        </div>
      )}
    </div>
  );
}
