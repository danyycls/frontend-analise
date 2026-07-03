import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/store/hooks';
import { setAbaAtiva } from '@/app/store/slices/navigationSlice';
import { setFormAberto } from '@/app/store/slices/navigationSlice';
import { setSubTabAtiva } from '@/app/store/slices/ligacaoPoliticaSlice';
import { useAppSelector } from '@/app/store/hooks';
import PageNav from '@/shared/ui/PageNav/PageNav';

const FAQ_DATA = [
  {
    q: 'De onde vêm os dados?',
    a: 'Todos os dados são obtidos diretamente de fontes oficiais do governo brasileiro.',
  },
  {
    q: 'Os dados são confiáveis?',
    a: 'Sim, a consulta é de dados já publicados oficialmente. Você pode auditar a fonte de cada informação enquanto consulta, nenhum dado é inventado ou gerado por inteligência artificial.',
  },
  {
    q: 'Preciso de cadastro?',
    a: 'Não. A plataforma é de acesso livre e não exige cadastro. Basta acessar e começar a pesquisar.',
  },
];

const PAGE_SECTIONS = [
  { id: 'home-hero', label: 'Início' },
  { id: 'home-ferramentas', label: 'Ferramentas' },
  { id: 'home-como-funciona', label: 'Como funciona' },
  { id: 'home-o-que-encontrar', label: 'O que encontrar' },
  { id: 'home-faq', label: 'FAQ' },
];

export default function HomePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const lpResultados = useAppSelector((s) => s.ligacaoPolitica.lpResultados);
  const ligPoliticaCache = useAppSelector((s) => s.ligacaoPolitica.ligPoliticaCache);
  const showLpNavBtn = lpResultados && ligPoliticaCache.length > 0;

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setExpandedFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="tab-page">
      <PageNav position="right" sections={PAGE_SECTIONS} />
      {/* ── Hero Section ── */}
      <section className="hero" id="home-hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-badge">// PODP - PROJETO OBSERVATORIO DE DADOS PUBLICOS //</div>
          <h1 className="hero-title">
            Projeto Observatório de<br />
            <span className="hero-highlight">Dados Públicos</span>
          </h1>
          <p className="hero-desc">
            Pesquise sobre qualquer estado ou
            município do Brasil com dados reais, auditáveis e de fontes oficiais.
          </p>

          <div className="home-stats">
            <div className="stat-card">
              <div className="stat-number">9</div>
              <div className="stat-label">Fontes oficiais integradas</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">18+</div>
              <div className="stat-label">Anos de dados eleitorais</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">5.570</div>
              <div className="stat-label">Municípios brasileiros</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Dados auditáveis, nada gerado por IA</div>
            </div>
          </div>

          <div className="hero-actions">
            <button
              className="hero-cta"
              onClick={() => { dispatch(setAbaAtiva('licitacoes')); dispatch(setFormAberto(true)); navigate('/licitacoes'); }}
            >
              <span className="hero-cta-icon">▸</span>
              INICIAR ANÁLISE
            </button>
            <button
              className="hero-cta"
              onClick={() => { dispatch(setAbaAtiva('conheca-estado')); navigate('/estado'); }}
            >
              <span className="hero-cta-icon">■</span>
              CONHEÇA SEU ESTADO
            </button>
            <button
              className="hero-cta"
              onClick={() => { dispatch(setAbaAtiva('anomalias-encontradas')); dispatch(setFormAberto(true)); navigate('/anomalias-encontradas'); }}
            >
              <span className="hero-cta-icon">⚡</span>
              ANOMALIAS ENCONTRADAS
            </button>
          </div>
        </div>

        {/* ── Ferramentas ── */}
        <div className="features" id="home-ferramentas">
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('licitacoes')); dispatch(setFormAberto(true)); navigate('/licitacoes'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Licitações</h3>
            <p className="feature-desc">Pesquise licitações e contratos públicos no PNCP por CNPJ de órgão ou por estado/município.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('conheca-estado')); navigate('/estado'); }}>
            <div className="feature-icon">■</div>
            <h3 className="feature-title">Conheça seu Estado</h3>
            <p className="feature-desc">Explore dados de todos os estados do Brasil: politicos, recursos recebidos, licitações.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('anomalias-encontradas')); navigate('/anomalias-encontradas'); }}>
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Anomalias Encontradas</h3>
            <p className="feature-desc">Explore as anomalias detectadas nas análises de dados.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('relacoes')); navigate('/tse'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">TSE</h3>
            <p className="feature-desc">Consulte dados eleitorais, doações de campanha e conexões partidárias de empresas e candidatos.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('portal')); navigate('/portal'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Portal Transparência</h3>
            <p className="feature-desc">Acesse dados do Portal da Transparência do Governo Federal: órgãos, servidores, despesas e emendas.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('deputados')); navigate('/deputados'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análise de Deputados</h3>
            <p className="feature-desc">Consulte dados, despesas e atividades de deputados federais registrados na Câmara.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('senadores')); navigate('/senadores'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análise de Senadores</h3>
            <p className="feature-desc">Consulte dados, mandatos, comissões e votações de senadores no Senado Federal.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('tcu')); navigate('/tcu'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Análises TCU</h3>
            <p className="feature-desc">Consulte contas irregulares, prestadores de contas e empresas inidôneas no TCU.</p>
          </div>
          <div className="feature-card" onClick={() => { dispatch(setAbaAtiva('wiki-pesquisa')); navigate('/wiki'); }}>
            <div className="feature-icon">▣</div>
            <h3 className="feature-title">Conheça a Ferramenta</h3>
            <p className="feature-desc">Entenda como usar a plataforma, suas fontes de dados e como interpretar os resultados.</p>
          </div>
          {showLpNavBtn && (
            <div className="feature-card" onClick={() => { dispatch(setSubTabAtiva('geral')); dispatch(setAbaAtiva('ligacao-politica')); navigate('/ligacao-politica'); }}>
              <div className="feature-icon">▣</div>
              <h3 className="feature-title">Ligações Políticas</h3>
              <p className="feature-desc">Cruzamento de dados entre fornecedores de licitações e agentes políticos.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Como Funciona ── */}
      <div className="section-divider" />

      <section className="how-works" id="home-como-funciona">
        <span className="section-label">// COMO FUNCIONA //</span>
        <h2 className="section-title">Painel centralizado de dados públicos</h2>
        <div className="how-works-grid">
          <div className="how-work-card">
            <div className="how-work-number">01</div>
            <h3 className="how-work-title">Conheça seu estado/município</h3>
            <p className="how-work-desc">
              Em alguns cliques, veja quanto recurso o estado recebeu por período, contratos
              realizados, informações dos municípios, deputados e senadores associados e gastos
              por categoria.
            </p>
          </div>
          <div className="how-work-card">
            <div className="how-work-number">02</div>
            <h3 className="how-work-title">Encontre conexões</h3>
            <p className="how-work-desc">
              Cruze informações de pesquisa e descubra contratos, doadores, políticos e
              empresas relacionadas em uma mesma rede de interesses.
            </p>
          </div>
          <div className="how-work-card">
            <div className="how-work-number">03</div>
            <h3 className="how-work-title">Feito para todos</h3>
            <p className="how-work-desc">
              Não precisa ser um mestre em política. Nós facilitamos o acesso ao dado público
              e explicamos de onde vem cada informação exibida.
            </p>
          </div>
        </div>
      </section>

      {/* ── O que posso encontrar ── */}
      <div className="section-divider" />

      <section className="what-find" id="home-o-que-encontrar">
        <span className="section-label">// O QUE VOCÊ PODE ENCONTRAR //</span>
        <h2 className="section-title">Informações e cruzamentos</h2>
        <div className="what-find-list">
          <div className="what-find-item">
            <span className="what-find-icon">▸</span>
            <span className="what-find-text">
              Vencedores de licitações que doaram ou forneceram serviços a políticos ou
              partidos do município vencedor.
            </span>
          </div>
          <div className="what-find-item">
            <span className="what-find-icon">▸</span>
            <span className="what-find-text">
              Políticos ou servidores públicos relacionados a empresas vencedoras de
              contratos públicos.
            </span>
          </div>
          <div className="what-find-item">
            <span className="what-find-icon">▸</span>
            <span className="what-find-text">
              Pessoas ou empresas com sanções legais registradas nos órgãos de controle.
            </span>
          </div>
          <div className="what-find-item">
            <span className="what-find-icon">▸</span>
            <span className="what-find-text">
              Quem são os políticos da sua região, quais propostas e emendas participou e
              como votou em cada uma delas.
            </span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <div className="section-divider" />

      <section className="faq-section" id="home-faq">
        <span className="section-label">// PERGUNTAS FREQUENTES //</span>
        <h2 className="section-title">FAQ</h2>
        <div className="faq-list">
          {FAQ_DATA.map((item, idx) => (
            <div
              key={idx}
              className={`faq-item ${expandedFaq === idx ? 'expanded' : ''}`}
            >
              <button className="faq-question" onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                <span className="faq-arrow">▼</span>
              </button>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
