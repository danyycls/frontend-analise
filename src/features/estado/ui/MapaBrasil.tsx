// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { api } from '@/shared/api/client';
import { TOPO_URL } from '@/shared/config';
import './MapaBrasil.css';

const IBGE_TO_UF = {
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
};

const STATE_COORDS = {
  'AC': [-70, -9], 'AL': [-36.5, -9.6], 'AP': [-52, 1], 'AM': [-64, -4],
  'BA': [-41, -12.5], 'CE': [-39.5, -5], 'DF': [-47.9, -15.8], 'ES': [-40.5, -19.5],
  'GO': [-49.5, -16], 'MA': [-45, -5], 'MT': [-55.5, -12], 'MS': [-55, -20.5],
  'MG': [-44, -18.5], 'PA': [-53, -5], 'PB': [-36.5, -7.5], 'PR': [-51.5, -24.5],
  'PE': [-38, -8.5], 'PI': [-43, -7], 'RJ': [-42.5, -22.5], 'RN': [-36.5, -5.8],
  'RS': [-52, -30], 'RO': [-63, -11], 'RR': [-61, 2.5], 'SC': [-50, -27],
  'SP': [-48.5, -22.5], 'SE': [-37.5, -10.5], 'TO': [-48.5, -10],
};

export default function MapaBrasil() {
  const [estados, setEstados] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [scale, setScale] = useState(1);

  const TOTAL_ESTADOS = 27;
  const TOTAL_MUNICIPIOS = 5570;

  useEffect(() => {
    api.get(`/ibge/estados`)
      .then(r => r.json())
      .then(data => {
        if (data.dados) setEstados(data.dados);
      })
      .catch(err => console.error('Erro estados:', err));
  }, []);

  const nomeMap = {};
  estados.forEach(e => { nomeMap[e.sigla] = e.nome; });

  const handleWheel = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isOver = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (isOver) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.5, Math.min(4, prev + delta)));
    }
  }, []);

  const zoomIn = () => setScale(prev => Math.min(4, prev + 0.2));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2));
  const resetZoom = () => setScale(1);

  const projectionConfig = {
    scale: 800 * scale,
    center: [-55, -14],
  };

  return (
    <div className="mapa-container" id="mapa-container">
      <div className="mapa-titulo">SELECIONE UM ESTADO</div>
      <div className="mapa-info-card">
        <div className="mapa-info-item">
          <span className="mapa-info-val">{TOTAL_ESTADOS}</span>
          <span className="mapa-info-lbl">ESTADOS</span>
        </div>
        <div className="mapa-info-divider" />
        <div className="mapa-info-item">
          <span className="mapa-info-val">{TOTAL_MUNICIPIOS}</span>
          <span className="mapa-info-lbl">MUNICÍPIOS</span>
        </div>
      </div>
      <div className="mapa-controls">
        <button className="mapa-zoom-btn" onClick={zoomIn} title="Ampliar">+</button>
        <button className="mapa-zoom-btn" onClick={zoomOut} title="Reduzir">−</button>
        <button className="mapa-zoom-btn" onClick={resetZoom} title="Resetar" style={{ fontSize: '0.8rem' }}>⟲</button>
        <span className="mapa-zoom-level">{Math.round(scale * 100)}%</span>
      </div>
      <div className="mapa-wrapper" onWheel={handleWheel}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={projectionConfig}
          style={{ width: '100%', height: '100%' }}
        >
          <Geographies geography={TOPO_URL}>
            {({ geographies }) => (
              <>
                {geographies.map(geo => (
                  <Geography
                    key={`outline-${geo.rsmKey}`}
                    geography={geo}
                    style={{
                      default: { fill: 'none', stroke: 'var(--accent-secondary)', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round', outline: 'none' },
                      hover: { fill: 'none', stroke: 'var(--accent-secondary)', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round', outline: 'none' },
                      pressed: { fill: 'none', stroke: 'var(--accent-secondary)', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round', outline: 'none' },
                    }}
                  />
                ))}
                {geographies.map(geo => {
                  const cod = geo.properties?.codarea || '';
                  const sigla = IBGE_TO_UF[cod] || cod;
                  const nome = nomeMap[sigla] || sigla;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className="estado-geography"
                      style={{
                        default: { fill: 'transparent', stroke: 'var(--accent-tertiary)', strokeWidth: 1.5, outline: 'none' },
                        hover: { fill: 'rgba(95,145,127,0.08)', stroke: 'var(--accent)', strokeWidth: 2.2, outline: 'none' },
                        pressed: { fill: 'rgba(95,145,127,0.12)', stroke: 'var(--accent)', strokeWidth: 2.2, outline: 'none' },
                      }}
                      onMouseEnter={() => setTooltip({ name: nome })}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (sigla && sigla.length === 2) window.open(`/estado/${sigla}`, '_blank');
                      }}
                    />
                  );
                })}
              </>
            )}
          </Geographies>

          {Object.entries(STATE_COORDS).map(([sigla, coords]) => {
            const nome = nomeMap[sigla] || sigla;
            return (
              <Marker key={sigla} coordinates={coords}>
                <circle
                  r={5}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth={1.5}
                  className="mapa-dot"
                  onClick={() => window.open(`/estado/${sigla}`, '_blank')}
                />
                <text
                  textAnchor="middle"
                  y={-12}
                  className="mapa-label"
                  onClick={() => window.open(`/estado/${sigla}`, '_blank')}
                >
                  {sigla}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>

        {tooltip && (
          <div className="mapa-tooltip" style={{ top: 10, left: 10 }}>
            {tooltip.name}
          </div>
        )}
      </div>
    </div>
  );
}
