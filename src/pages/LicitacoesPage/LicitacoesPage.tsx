// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva, setFormAberto } from '@/app/store/slices/navigationSlice';
import { addConsulta, removeConsulta as removeConsultaAction, setConsultas, setActiveJob } from '@/app/store/slices/consultaSlice';
import { addSubTab, setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';
import Formulario from '@/features/licitacao/ui/Formulario';
import FormularioPublicacao from '@/features/licitacao/ui/FormularioPublicacao';
import Progresso from '@/features/licitacao/ui/Progresso';
import Resultados from '@/features/ligacao-politica/ui/Resultados';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import EntityPopup from '@/features/ligacao-politica/ui/EntityPopup';
import { api } from '@/shared/api/client';
import { fmtDoc } from '@/shared/lib/formatters';
import './LicitacoesPage.css';

let uid = 0;

export default function LicitacoesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const formAberto = useAppSelector((s) => s.navigation.formAberto);
  const tipoBusca = useAppSelector((s) => s.navigation.tipoBusca);

  const consultas = useAppSelector((s) => s.consulta.consultas);
  const consultasFiltradas = useMemo(
    () => consultas.filter(c => tipoBusca === 'publicacao' ? c.meta.tipo === 'publicacao' : c.meta.tipo !== 'publicacao'),
    [consultas, tipoBusca]
  );
  const activeJob = useAppSelector((s) => s.consulta.activeJob);
  const [pncpDestacado, setPncpDestacado] = useState(null);
  const [popup, setPopup] = useState(null);
  const [entidadeCache, setEntidadeCache] = useState({});

  const KEY_TO_TIPO = {
    sq_candidato: 'candidato',
    sq_despesa: 'despesa',
    sq_receita: 'receita',
    sq_prestador_contas: 'prestador_contas',
    cpf_cnpj: 'fornecedor',
    cpf: 'candidato',
    cpf_cnpj_doador: 'doador',
  };

  const handleIniciar = useCallback((jobId, meta) => {
    dispatch(setActiveJob({ jobId, meta: { ...meta, tipo: 'orgao' } }));
  }, [dispatch]);

  const handleFinalizar = useCallback((resultados, meta, paginasErro) => {
    const nova = {
      id: ++uid,
      timestamp: new Date().toISOString(),
      meta: { ...meta, paginasErro },
      resultados,
    };
    dispatch(addConsulta(nova));
    dispatch(setActiveJob(null));
  }, [dispatch]);

  const handleApagar = useCallback((id) => {
    dispatch(removeConsultaAction(id));
  }, [dispatch]);

  const handleLigacaoPoliticaConsulta = useCallback((consultaId: number) => {
    dispatch(addSubTab({ kind: 'consulta', id: consultaId }));
    dispatch(setSubTabAtiva(`consulta-${consultaId}`));
    dispatch(setAbaAtiva('ligacao-politica'));
    navigate('/ligacao-politica');
  }, [dispatch, navigate]);

  const handleCancelarJob = useCallback(() => {
    dispatch(setActiveJob(null));
    dispatch(setFormAberto(true));
  }, [dispatch]);

  const handlePublicacaoResultados = useCallback((dados: any[], meta: Record<string, unknown>) => {
    const grouped = new Map<string, any[]>();
    dados.forEach((c) => {
      const key = c.cnpjOrgao || c.orgaoEntidade?.cnpj || c.nomeOrgao || 'desconhecido';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(c);
    });

    const resultados = Array.from(grouped.entries()).map(([key, contratos]) => {
      const primeiro = contratos[0];
      return {
        orgao: {
          cnpj: key,
          razaoSocial: primeiro?.nomeOrgao || primeiro?.orgaoEntidade?.razaoSocial || key,
        },
        contratos,
        resumo: {
          totalContratos: contratos.length,
          totalEmpresas: new Set(contratos.map((c) => c.fornecedor?.cnpj || c.niFornecedor).filter(Boolean)).size,
          valorTotalContratos: contratos.reduce((sum, c) => sum + (c.valorGlobal ?? c.valorTotalEstimado ?? 0), 0),
        },
        periodo: {
          dataInicial: `${meta.ano}-01-01`,
          dataFinal: `${meta.ano}-12-31`,
        },
      };
    });

    const nova = {
      id: ++uid,
      timestamp: new Date().toISOString(),
      meta,
      resultados,
    };
    dispatch(addConsulta(nova));
  }, [dispatch]);

  const handleIdClickFromAnalise = useCallback((key, value) => {
    const tipo = KEY_TO_TIPO[key];
    if (tipo) {
      setPopup({ tipo: 'entidade', chave: value, idKey: key });
    } else {
      setPopup({ tipo: 'generic', data: { [key]: value }, titulo: key });
    }
  }, []);

  const handleAtualizarEntidadeCache = useCallback((tipo, chave, dados) => {
    setEntidadeCache(prev => ({ ...prev, [`${tipo}_${chave}`]: dados }));
  }, []);

  const handleLicitacaoPopup = useCallback((pncp) => {
    for (const c of consultas) {
      for (const r of (c.resultados || [])) {
        for (const ct of (r.contratos || [])) {
          if (ct.numeroControlePNCP === pncp) {
            setPopup({ tipo: 'contrato', data: ct, titulo: `Licitação ${pncp}` });
            return;
          }
        }
      }
    }
    setPopup({ tipo: 'contrato', data: { numeroControlePNCP: pncp }, titulo: `Licitação ${pncp}` });
  }, [consultas]);

  const totalOrgaos = consultasFiltradas.reduce((acc, c) => acc + (c.resultados?.length || 0), 0);

  useEffect(() => {
    if (pncpDestacado) {
      const timer = setTimeout(() => setPncpDestacado(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pncpDestacado]);

  return (
    <div className="tab-page">
      <div className="licitacoes-page">
        <div className="licitacoes-header">
          <div className="licitacoes-badge">// CONSULTA DE LICITAÇÕES //</div>
          <h1 className="licitacoes-title">
            Busca de Licitações<br />
            <span style={{ color: 'var(--accent)', fontSize: 'inherit' }}>PNCP</span>
          </h1>
          <p className="licitacoes-subtitle">Consulte contratos públicos no Portal Nacional de Contratações Públicas por órgão ou região.</p>
        </div>

        <div className="licitacoes-form-wrapper">
          {activeJob ? (
            <Progresso
              jobId={activeJob.jobId}
              total={activeJob.meta.total}
              meta={activeJob.meta}
              onFinalizar={handleFinalizar}
              onCancelar={handleCancelarJob}
              streamPath={activeJob.meta.tipo === 'publicacao' ? '/publicacao/analise/stream' : '/orgao/analise/stream'}
              batchPath={activeJob.meta.tipo === 'publicacao' ? '/publicacao/analise/batch' : '/orgao/analise/batch'}
            />
          ) : (
            <div className="licitacoes-form-inner" style={{ display: formAberto ? 'block' : 'none' }}>
              <div style={{ display: tipoBusca === 'orgao' ? 'block' : 'none', width: '100%' }}>
                <Formulario onIniciar={handleIniciar} />
              </div>
              <div style={{ display: tipoBusca === 'publicacao' ? 'block' : 'none', width: '100%' }}>
                <FormularioPublicacao onIniciar={handleIniciar} onResultados={handlePublicacaoResultados} />
              </div>
            </div>
          )}
        </div>

        {consultasFiltradas.length > 0 && (
          <>
            {(formAberto || activeJob) && <div className="licitacoes-section-divider" />}
            <div className="licitacoes-content">
              <div className="consultas-bar">
                {!formAberto && !activeJob && (
                  <button className="btn btn-sm" onClick={() => dispatch(setFormAberto(true))}>
                    + Nova Consulta
                  </button>
                )}
                {consultasFiltradas.length > 0 && (
                  <span className="consultas-count">
                    {consultasFiltradas.length} consulta{consultasFiltradas.length > 1 ? 's' : ''}
                    {totalOrgaos > 0 && ` · ${totalOrgaos} orgaos`}
                  </span>
                )}
              </div>

              {consultasFiltradas.map((consulta) => (
                <ConsultaCard
                  key={consulta.id}
                  consulta={consulta}
                  pncpDestacado={pncpDestacado}
                  onIdClick={handleIdClickFromAnalise}
                  onClose={() => handleApagar(consulta.id)}
                  onLigacaoPolitica={() => handleLigacaoPoliticaConsulta(consulta.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {popup && popup.tipo === 'contrato' && (
        <JanelaPopup titulo={popup.titulo} onFechar={() => setPopup(null)}>
          <ContratoDetalhes contrato={popup.data} onIdClick={handleIdClickFromAnalise} />
        </JanelaPopup>
      )}
      {popup && popup.tipo === 'entidade' && (
        <JanelaPopup titulo={`Entidade: ${fmtDoc(popup.chave)}`} onFechar={() => setPopup(null)}>
          <EntityPopup tipo={KEY_TO_TIPO[popup.idKey]} chave={popup.chave} cache={entidadeCache} onCache={handleAtualizarEntidadeCache} />
        </JanelaPopup>
      )}
    </div>
  );
}

function ConsultaCard({ consulta, pncpDestacado, onIdClick, onClose, onLigacaoPolitica }) {
  const [minimizado, setMinimizado] = useState(false);
  const [maximizado, setMaximizado] = useState(false);

  const isPublicacao = consulta.meta.tipo === 'publicacao';
  const totalContratos = consulta.resultados.reduce((sum, r) => sum + (r.contratos?.length || 0), 0);
  const totalOrgaos = consulta.resultados.length;

  const titulo = isPublicacao
    ? `UF: ${consulta.meta.uf}${consulta.meta.municipioNome ? ' \u00b7 ' + consulta.meta.municipioNome : ''}`
    : `${consulta.meta.cnpjs?.length || 0} CNPJs`;

  const subtitulo = isPublicacao
    ? `${consulta.meta.ano} \u00b7 ${consulta.meta.trimestres?.length || 0} trimestre(s)`
    : `${consulta.meta.dataInicial || '?'} a ${consulta.meta.dataFinal || '?'}`;

  const resumo = `${totalOrgaos} \u00f3rg\u00e3o(s) \u00b7 ${totalContratos} contrato(s)`;

  if (maximizado) {
    return createPortal(
      <div className="consulta-card consulta-card-maximizada">
        <div className="consulta-header">
          <div className="consulta-header-left">
            <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
            <span className="consulta-data">{titulo}</span>
            <span className="consulta-meta">{subtitulo}</span>
          </div>
          <div className="consulta-header-right">
            <span className="consulta-sumario">{resumo}</span>
            <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
              Lig. Política
            </button>
            <button className="btn btn-sm" onClick={() => setMaximizado(false)} title="Restaurar">{'\ud83d\udd97'}</button>
            <button className="btn-apagar" onClick={onClose} title="Fechar">{'\u2715'}</button>
          </div>
        </div>
        <div className="consulta-body" style={{ overflow: 'auto', flex: 1 }}>
          <Resultados
            resultados={consulta.resultados}
            consultaMeta={consulta.meta}
            pncpDestacado={pncpDestacado}
            onIdClick={onIdClick}
          />
        </div>
      </div>,
      document.body
    );
  }

  if (minimizado) {
    return (
      <div className="consulta-card consulta-card-minimizada" onClick={() => setMinimizado(false)}>
        <div className="consulta-header">
          <div className="consulta-header-left">
            <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
            <span className="consulta-data">{titulo}</span>
            <span className="consulta-meta">{subtitulo}</span>
          </div>
          <div className="consulta-header-right">
            <span className="consulta-sumario">{resumo}</span>
            <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
              Lig. Política
            </button>
            <button
              className="consulta-restore-btn"
              onClick={(e) => { e.stopPropagation(); setMinimizado(false); }}
              title="Restaurar"
            >{'\ud83d\udd97'}</button>
            <button
              className="btn-apagar"
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Fechar"
            >{'\u2715'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="consulta-card">
      <div className="consulta-header">
        <div className="consulta-header-left">
          <span className="consulta-tag">{isPublicacao ? 'ESTADO' : 'CNPJ'}</span>
          <span className="consulta-data">{titulo}</span>
          <span className="consulta-meta">{subtitulo}</span>
        </div>
        <div className="consulta-header-right">
          <span className="consulta-sumario">{resumo}</span>
          <button className="btn btn-sm btn-outline-accent" onClick={(e) => { e.stopPropagation(); onLigacaoPolitica?.(); }} title="Análise de Ligação Política">
            Lig. Política
          </button>
          <button className="consulta-restore-btn" onClick={() => setMinimizado(true)} title="Minimizar">{'\ud83d\udd55'}</button>
          <button className="consulta-restore-btn" onClick={() => setMaximizado(true)} title="Maximizar">{'\ud83d\udd56'}</button>
          <button className="btn-apagar" onClick={onClose} title="Fechar">{'\u2715'}</button>
        </div>
      </div>
      <div className="consulta-body">
        <Resultados
          resultados={consulta.resultados}
          consultaMeta={consulta.meta}
          pncpDestacado={pncpDestacado}
          onIdClick={onIdClick}
        />
      </div>
    </div>
  );
}
