// @ts-nocheck
import React, { useState } from 'react';

export default function MayorVicePanel({ prefeitos, vicePrefeitos }) {
  const [maximized, setMaximized] = useState(false);

  const toggle = () => setMaximized(!maximized);

  return (
    <section className="neon-section mayor-vice-panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Prefeitos & Vice‑Prefeitos 2024</h2>
        <button className="neon-btn" onClick={toggle}>{maximized ? '▼' : '▶'} Maximize</button>
      </div>
      {maximized ? (
        <div className="panel-grid">
          <div className="panel-column">
            <h3>Prefeitos</h3>
            <div className="cards-grid">
              {prefeitos.map((p, i) => (
                <div key={i} className="deputado-card neon-card">
                  <div>{p.nome || '-'} ({p.sigla_partido})</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel-column">
            <h3>Vice‑Prefeitos</h3>
            <div className="cards-grid">
              {vicePrefeitos.map((v, i) => (
                <div key={i} className="deputado-card neon-card">
                  <div>{v.nome || '-'} ({v.sigla_partido})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {prefeitos.slice(0, 4).map((p, i) => (
            <div key={i} className="deputado-card neon-card">
              <div>{p.nome || '-'} ({p.sigla_partido})</div>
            </div>
          ))}
          {vicePrefeitos.slice(0, 4).map((v, i) => (
            <div key={i} className="deputado-card neon-card">
              <div>{v.nome || '-'} ({v.sigla_partido})</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
