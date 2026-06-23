// @ts-nocheck
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { setAbaAtiva, setFormAberto, setTipoBusca } from '@/app/store/slices/navigationSlice';
import { addConsulta, removeConsulta as removeConsultaAction, setConsultas, setActiveJob } from '@/app/store/slices/consultaSlice';
import Formulario from '@/features/licitacao/ui/Formulario';
import FormularioPublicacao from '@/features/licitacao/ui/FormularioPublicacao';
import Progresso from '@/features/licitacao/ui/Progresso';
import Resultados from '@/features/ligacao-politica/ui/Resultados';
import { JanelaPopup, ContratoDetalhes } from '@/features/ligacao-politica/ui/Resultados';
import EntityPopup from '@/features/ligacao-politica/ui/EntityPopup';
import { api } from '@/shared/api/client';
import { fmtDoc } from '@/shared/lib/formatters';

let uid = 0;

export default function LicitacoesPage() {
  const dispatch = useAppDispatch();
  const formAberto = useAppSelector((s) => s.navigation.formAberto);
  const tipoBusca = useAppSelector((s) => s.navigation.tipoBusca);

  const consultas = useAppSelector((s) => s.consulta.consultas);
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
    dispatch(setActiveJob({ jobId, meta }));
    dispatch(setFormAberto(false));
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

  const handleCancelarJob = useCallback(() => {
    dispatch(setActiveJob(null));
    dispatch(setFormAberto(true));
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

  const totalOrgaos = consultas.reduce((acc, c) => acc + (c.resultados?.length || 0), 0);

  useEffect(() => {
    if (pncpDestacado) {
      const timer = setTimeout(() => setPncpDestacado(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [pncpDestacado]);

  return (
    <div className="tab-page">
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">Busca de Licitações</h2>
          <p className="tab-desc">Consulte contratos públicos no PNCP por órgão ou região.</p>
        </div>

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
          formAberto && (
            <>
              <div className="tipo-busca-bar">
                <button
                  className={`tipo-busca-btn ${tipoBusca === 'orgao' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setTipoBusca('orgao'))}
                >
                  Por CNPJ do Órgão
                </button>
                <button
                  className={`tipo-busca-btn ${tipoBusca === 'publicacao' ? 'ativo' : ''}`}
                  onClick={() => dispatch(setTipoBusca('publicacao'))}
                >
                  Por Estado/Município
                </button>
              </div>
              {tipoBusca === 'orgao' ? (
                <Formulario onIniciar={handleIniciar} />
              ) : (
                <FormularioPublicacao onIniciar={handleIniciar} />
              )}
            </>
          )
        )}

        <div className="consultas-bar">
          {!formAberto && !activeJob && (
            <button className="btn btn-sm" onClick={() => dispatch(setFormAberto(true))}>
              + Nova Consulta
            </button>
          )}
          {consultas.length > 0 && (
            <span className="consultas-count">
              {consultas.length} consulta{consultas.length > 1 ? 's' : ''}
              {totalOrgaos > 0 && ` · ${totalOrgaos} orgaos`}
            </span>
          )}
        </div>

        {consultas.map((consulta, idx) => (
          <ConsultaCardInner
            key={consulta.id}
            consulta={consulta}
            numero={idx + 1}
            onApagar={handleApagar}
            pncpDestacado={pncpDestacado}
            onIdClick={handleIdClickFromAnalise}
          />
        ))}
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

function ConsultaCardInner({ consulta, numero, onApagar, pncpDestacado, onIdClick }) {
  return (
    <Resultados
      consulta={consulta}
      numero={numero}
      onApagar={onApagar}
      pncpDestacado={pncpDestacado}
      onIdClick={onIdClick}
    />
  );
}
