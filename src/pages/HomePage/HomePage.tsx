import { useAppDispatch } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import { setFormAberto } from '@/app/store/slices/navigationSlice';
import { setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';
import { useAppSelector } from '@/app/store/hooks';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const lpResultados = useAppSelector((s) => s.ligacaoPolitica.lpResultados);
  const ligPoliticaCache = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaCache);
  const showLpNavBtn = lpResultados && ligPoliticaCache.length > 0;

  return (
    <div className="tab-page">
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">// PLATAFORMA DE ANÁLISE // SYS.v1</div>
          <h1 className="hero-title">
            <span className="hero-highlight">PODP - Ambiente de visualização da ferramenta</span>
          </h1>
          <div className="hero-alerta">
            ⚠ ACESSO AO TSE disponivel na interface, mas essa versao ambiente nao possui os dados populados!!! DEMAIS INTEGRACOES EM FUNCIONAMENTO
          </div>
          <div className="hero-actions">
            <button
              className="hero-cta"
              onClick={() => { dispatch(setAbaAtiva('licitacoes')); dispatch(setFormAberto(true)); }}
            >
              <span className="hero-cta-icon">▸</span>
              INICIAR ANÁLISE
            </button>
            <button className="hero-cta" onClick={() => dispatch(setAbaAtiva('conheca-estado'))}>
              <span className="hero-cta-icon">▣</span>
              CONHEÇA SEU ESTADO
            </button>
            <button className="hero-cta-secondary" onClick={() => dispatch(setAbaAtiva('wiki-pesquisa'))}>
              ▣ ENTENDA A FERRAMENTA
            </button>
          </div>
        </div>

        <div className="features" id="mode-cards">
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('licitacoes')); dispatch(setFormAberto(true)); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Licitações</h3>
            <p className="feature-desc">Pesquise licitações e contratos públicos no PNCP por CNPJ de órgão ou por estado/município.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('conheca-estado'))}>
            <div className="feature-icon">■</div>
            <h3 className="feature-title">Conheça seu Estado</h3>
            <p className="feature-desc">Explore dados de todos os estados do Brasil: prefeitos, vereadores, deputados e senadores eleitos.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('relacoes'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">TSE</h3>
            <p className="feature-desc">Consulte dados eleitorais, doações de campanha e conexões partidárias de empresas e candidatos.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('portal'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Portal Transparência</h3>
            <p className="feature-desc">Acesse dados do Portal da Transparência do Governo Federal: órgãos, servidores, despesas e emendas.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('deputados'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análise de Deputados</h3>
            <p className="feature-desc">Consulte dados, despesas e atividades de deputados federais registrados na Câmara.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('senadores'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análise de Senadores</h3>
            <p className="feature-desc">Consulte dados, mandatos, comissões e votações de senadores no Senado Federal.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('tcu'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análises TCU</h3>
            <p className="feature-desc">Consulte contas irregulares, prestadores de contas e empresas inidôneas no TCU.</p>
          </div>
          <div className="feature-card" onClick={() => dispatch(setAbaAtiva('wiki-pesquisa'))}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Entenda a Ferramenta</h3>
            <p className="feature-desc">Entenda como usar a plataforma, suas fontes de dados e como interpretar os resultados.</p>
          </div>
          {showLpNavBtn && (
            <div className="feature-card" onClick={() => { dispatch(setSubTabAtiva('geral')); dispatch(setAbaAtiva('ligacao-politica')); }}>
              <div className="feature-icon">▣</div>
              <h3 className="feature-title">Ligações Políticas</h3>
              <p className="feature-desc">Cruzamento de dados entre fornecedores de licitações e agentes políticos.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
