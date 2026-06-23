// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config';
import SecaoGeralSenador from '@/entities/senador/ui/SenadorSecaoGeral';
import TabelaGen from '@/shared/ui/TabelaGen/TabelaGen';
import './AnaliseDeputados.css';

function Card({ header, children }) {
  return (
    <div className="ad-card" style={{ marginBottom: 12 }}>
      {header && <div className="ad-card-header">{header}</div>}
      <div className="ad-card-body">{children}</div>
    </div>
  );
}

function SectionCargos({ dados }) {
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhum cargo encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Cargos ({dados.length})</h3>
      <div className="ad-card-grid">
        {dados.map((c, i) => {
          const com = c.IdentificacaoComissao || {};
          return (
            <div key={i} className="ad-card">
              <div className="ad-card-header"><span className="ad-card-tag">{com.SiglaComissao || '-'}</span> {c.DescricaoCargo || '-'}</div>
              <div className="ad-card-body">
                <div className="ad-card-row"><span className="ad-card-label">Código Cargo:</span> {c.CodigoCargo || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Comissão:</span> {com.NomeComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Código Comissão:</span> {com.CodigoComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Casa:</span> {com.SiglaCasaComissao || '-'}</div>
                <div className="ad-card-row"><span className="ad-card-label">Período:</span> {c.DataInicio || '-'} ~ {c.DataFim || 'atual'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionComissoes({ dados }) {
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhuma comissão encontrada.</p>;
  const ativas = dados.filter(c => !c.DataFim);
  const passadas = dados.filter(c => c.DataFim);
  const ComissaoCard = ({ c }) => {
    const com = c.IdentificacaoComissao || {};
    return (
      <div className="ad-card">
        <div className="ad-card-header"><span className="ad-card-tag">{com.SiglaComissao || '-'}</span> {com.NomeComissao || '-'}</div>
        <div className="ad-card-body">
          <div className="ad-card-row"><span className="ad-card-label">Código:</span> {com.CodigoComissao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Casa:</span> {com.SiglaCasaComissao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Participação:</span> {c.DescricaoParticipacao || '-'}</div>
          <div className="ad-card-row"><span className="ad-card-label">Início:</span> {c.DataInicio || '-'}</div>
          {c.DataFim && <div className="ad-card-row"><span className="ad-card-label">Fim:</span> {c.DataFim}</div>}
        </div>
      </div>
    );
  };
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Comissões Atuais ({ativas.length})</h3>
      {ativas.length > 0 ? <div className="ad-card-grid">{ativas.map((c, i) => <ComissaoCard key={i} c={c} />)}</div> : <p className="ad-empty">Nenhuma comissão atual.</p>}
      {passadas.length > 0 && (
        <><h3 className="ad-section-title" style={{ marginTop: 16 }}>Comissões Passadas ({passadas.length})</h3><div className="ad-card-grid">{passadas.map((c, i) => <ComissaoCard key={i} c={c} />)}</div></>
      )}
    </div>
  );
}

function SectionMandatos({ dados }) {
  if (!Array.isArray(dados) || dados.length === 0) return <p className="ad-empty">Nenhum mandato encontrado.</p>;
  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Mandatos ({dados.length})</h3>
      {dados.map((m, i) => {
        const suplentes = m.Suplentes?.Suplente || [];
        const exercicios = m.Exercicios?.Exercicio || [];
        const partidos = m.Partidos?.Partido || [];
        return (
          <Card key={i} header={`Mandato ${m.UfParlamentar || '-'} — ${m.DescricaoParticipacao || '-'}`}>
            <div className="ad-card-row"><span className="ad-card-label">Código Mandato:</span> {m.CodigoMandato || '-'}</div>
            <div className="ad-card-row"><span className="ad-card-label">UF:</span> {m.UfParlamentar || '-'}</div>
            <div className="ad-card-row"><span className="ad-card-label">1ª Legislatura:</span> {m.PrimeiraLegislaturaDoMandato ? `${m.PrimeiraLegislaturaDoMandato.NumeroLegislatura || '-'} (${m.PrimeiraLegislaturaDoMandato.DataInicio || '-'} ~ ${m.PrimeiraLegislaturaDoMandato.DataFim || '-'})` : '-'}</div>
            {m.SegundaLegislaturaDoMandato?.NumeroLegislatura && <div className="ad-card-row"><span className="ad-card-label">2ª Legislatura:</span> {m.SegundaLegislaturaDoMandato.NumeroLegislatura} ({m.SegundaLegislaturaDoMandato.DataInicio} ~ {m.SegundaLegislaturaDoMandato.DataFim})</div>}
            {suplentes.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Suplentes:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Suplente', 'Código', 'Nome']} linhas={suplentes.map(s => [s.DescricaoParticipacao, s.CodigoParlamentar, s.NomeParlamentar])} />
            </div></div>}
            {exercicios.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Exercícios:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Código Exercício', 'Data Início']} linhas={exercicios.map(e => [e.CodigoExercicio, e.DataInicio])} />
            </div></div>}
            {partidos.length > 0 && <div style={{ marginTop: 8 }}><span className="ad-card-label">Partidos no Mandato:</span><div className="ad-table-wrap" style={{ marginTop: 4 }}>
              <TabelaGen cabecalhos={['Código', 'Sigla', 'Nome', 'Filiação', 'Desfiliação']} linhas={partidos.map(p => [p.CodigoPartido, p.Sigla ? <span className="ad-card-tag">{p.Sigla}</span> : '-', p.Nome, p.DataFiliacao, p.DataDesfiliacao])} />
            </div></div>}
          </Card>
        );
      })}
    </div>
  );
}

function SectionEmendas({ codigoSenador, nomeSenador }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtro, setFiltro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/senado/processo/emendas?codigoParlamentarAutor=${codigoSenador}`);
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const json = await resp.json();
      setDados(json.dados || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }, [codigoSenador]);

  const filtrados = dados ? dados.filter(d => {
    const t = filtro.toLowerCase();
    return (d.identificacao || d.Identificacao || '').toLowerCase().includes(t) ||
           (d.autoria || d.Autoria || '').toLowerCase().includes(t) ||
           (d.descricaoDocumentoEmenda || '').toLowerCase().includes(t) ||
           (d.siglaColegiado || '').toLowerCase().includes(t) ||
           (d.nomeColegiado || '').toLowerCase().includes(t) ||
           (d.tipo || d.Tipo || '').toLowerCase().includes(t);
  }) : [];

  return (
    <div className="ad-section">
      <h3 className="ad-section-title">Emendas Propostas por {nomeSenador}</h3>
      {!dados && !loading && !erro && (
        <button className="btn btn-accent" onClick={carregar}>Carregar Emendas</button>
      )}
      {loading && <div className="ad-loading">Buscando emendas...</div>}
      {erro && <p className="ad-error">Erro: {erro}</p>}
      {dados && (
        <>
          <div className="ad-query-form-grid" style={{ marginBottom: 12 }}>
            <input
              className="ad-query-form-input"
              style={{ flex: 1, maxWidth: 400 }}
              placeholder="Filtrar por identificação, autoria, comissão, tipo..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtrados.length} de {dados.length} registros</span>
          </div>
          <TabelaGen
            cabecalhos={['ID', 'Identificação', 'Autoria', 'Comissão', 'Tipo', 'Data', 'Descrição', 'Documento']}
            maxWidthCol={{ 1: 250, 2: 200, 6: 300 }}
            linhas={filtrados.map(d => [
              d.id || d.Id,
              d.identificacao || d.Identificacao,
              d.autoria || d.Autoria,
              d.siglaColegiado || '-',
              d.tipo || d.Tipo || '-',
              d.dataApresentacao || d.DataApresentacao || '-',
              d.descricaoDocumentoEmenda || '-',
              d.urlDocumentoEmenda || d.UrlDocumentoEmenda ? <a href={d.urlDocumentoEmenda || d.UrlDocumentoEmenda} target="_blank" rel="noopener noreferrer" className="ad-link">Abrir</a> : '-'
            ])}
          />
        </>
      )}
    </div>
  );
}

export default function SenadorDetailView({ senadorCodigo, onFechar }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [subSecao, setSubSecao] = useState('geral');

  useEffect(() => {
    if (!senadorCodigo) return;
    setLoading(true);
    setErro(null);
    fetch(`${API_BASE_URL}/senado/senadores/${senadorCodigo}/completo`)
      .then(r => {
        if (!r.ok) throw new Error(`Erro ${r.status}`);
        return r.json();
      })
      .then(data => {
        setDados(data);
        setLoading(false);
      })
      .catch(e => {
        setErro(e.message);
        setLoading(false);
      });
  }, [senadorCodigo]);

  const renderSecao = (secao) => {
    if (!dados) return null;
    if (secao === 'geral') return <SecaoGeralSenador senador={dados?.senador || dados} />;
    if (secao === 'cargos') return <SectionCargos dados={dados.cargos} />;
    if (secao === 'comissoes') return <SectionComissoes dados={dados.comissoes} />;
    if (secao === 'mandatos') return <SectionMandatos dados={dados.mandatos} />;
    if (secao === 'emendas') {
      const s = dados?.senador || dados;
      const i = s?.IdentificacaoParlamentar || {};
      const n = i.NomeParlamentar || i.NomeCompletoParlamentar || '-';
      return <SectionEmendas codigoSenador={senadorCodigo} nomeSenador={n} />;
    }
    return null;
  };

  if (loading) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Carregando...</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <div className="estado-detalhe-loading"><div className="spinner" /> Carregando dados do senador...</div>
    </div>
  );

  if (erro) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Erro</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <p style={{ textAlign: 'center', padding: 40, color: '#ff6b6b' }}>Erro ao carregar detalhes: {erro}</p>
    </div>
  );

  const sen = dados?.senador ?? dados;
  if (!sen) return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <h3>Senador não encontrado</h3>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>
      <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Dados do senador não disponíveis</p>
    </div>
  );

  const ident = sen.IdentificacaoParlamentar || {};
  const nome = ident.NomeParlamentar || ident.NomeCompletoParlamentar || '-';

  return (
    <div className="estado-detalhe">
      <div className="estado-detalhe-header">
        <div className="estado-detalhe-header-info">
          {ident.UrlFotoParlamentar && <img className="ad-dep-foto" src={ident.UrlFotoParlamentar} alt={nome} onError={(e) => { e.target.style.display = 'none'; }} />}
          <div>
            <h3>{nome}</h3>
            <div className="ad-dep-tags">
              <span className="tag tag-candidato">{ident.SiglaPartidoParlamentar || '-'}</span>
              <span className="tag tag-partido">{ident.UfParlamentar || '-'}</span>
            </div>
          </div>
        </div>
        <button className="voltar-btn" onClick={onFechar}>× Voltar</button>
      </div>

      <div className="ad-secao-btns">
        <button className={`ad-secao-btn ${subSecao === 'geral' ? 'ativo' : ''}`} onClick={() => setSubSecao('geral')}>Informações Gerais</button>
        <button className={`ad-secao-btn ${subSecao === 'cargos' ? 'ativo' : ''}`} onClick={() => setSubSecao('cargos')}>
          Cargos{Array.isArray(dados.cargos) && dados.cargos.length > 0 && <span className="ad-secao-badge">{dados.cargos.length}</span>}
        </button>
        <button className={`ad-secao-btn ${subSecao === 'comissoes' ? 'ativo' : ''}`} onClick={() => setSubSecao('comissoes')}>
          Comissões{Array.isArray(dados.comissoes) && dados.comissoes.length > 0 && <span className="ad-secao-badge">{dados.comissoes.filter(c => !c.DataFim).length}</span>}
        </button>
        <button className={`ad-secao-btn ${subSecao === 'mandatos' ? 'ativo' : ''}`} onClick={() => setSubSecao('mandatos')}>
          Mandatos{Array.isArray(dados.mandatos) && dados.mandatos.length > 0 && <span className="ad-secao-badge">{dados.mandatos.length}</span>}
        </button>
        <button className={`ad-secao-btn ${subSecao === 'emendas' ? 'ativo' : ''}`} onClick={() => setSubSecao('emendas')}>
          Emendas
        </button>
      </div>

      {renderSecao(subSecao)}
    </div>
  );
}
