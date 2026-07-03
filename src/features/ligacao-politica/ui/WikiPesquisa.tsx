// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import LicitacaoInfo from '@/features/licitacao/ui/LicitacaoInfo';
import './WikiPesquisa.css';

const SECTIONS = [
  { id: 'objetivo',            label: 'Objetivo da Plataforma' },
  { id: 'licitacao',           label: 'O que é uma Licitação?' },
  { id: 'pncp',                label: 'PNCP' },
  { id: 'tcu',                 label: 'TCU' },
  { id: 'tse-arquitetura',     label: 'TSE — Arquitetura' },
  { id: 'tse-consultas',       label: 'TSE — Consultas' },
  { id: 'portal-transparencia',label: 'Portal da Transparência' },
  { id: 'camara-deputados',    label: 'Câmara dos Deputados' },
  { id: 'senado',              label: 'Senado Federal' },
  { id: 'opencnpj',            label: 'OpenCNPJ' },
  { id: 'ibge',                label: 'IBGE' },
  { id: 'siconfi',             label: 'SICONFI' },
  { id: 'repositorios',        label: 'Repositórios' },
];

export default function WikiPesquisa() {
  const [ativa, setAtiva] = useState('objetivo');
  const observado = useRef(null);

  useEffect(() => {
    const el = observado.current;
    if (!el) return;

    const onScroll = () => {
      const offsets = SECTIONS.map(s => {
        const e = document.getElementById(s.id);
        return { id: s.id, top: e ? e.getBoundingClientRect().top : Infinity };
      });

      let melhor = offsets[0].id;
      for (const o of offsets) {
        if (o.top <= 120) melhor = o.id;
        else break;
      }
      setAtiva(melhor);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setAtiva(id);
    }
  };

  return (
    <div className="wiki-page">
      <aside className="wiki-sidebar">
        <nav className="wiki-nav">
          <div className="wiki-nav-title">Nesta página</div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`wiki-nav-item ${ativa === s.id ? 'ativo' : ''}`}
              onClick={() => handleClick(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="wiki-content" ref={observado}>
        <section id="objetivo" className="wiki-section">
          <h2>Objetivo da Plataforma</h2>
          <p>
            O <strong>PODP</strong> — <strong>P</strong>rojeto <strong>O</strong>bservatório de
            <strong> D</strong>ados <strong>P</strong>úblicos — é um painel unificado para análise
            de dados públicos brasileiros. Consolida informações eleitorais (TSE), parlamentares
            (Deputados, Senado), gastos públicos (Portal da Transparência, TCU), contratações (PNCP)
            e dados fiscais (SICONFI/IBGE) em uma única plataforma.
          </p>
          <p>
            O objetivo do projeto é construir um sistema opensource unificado que facilita o acesso a dados publicos.
          </p>
          <ul>
            <li>
              <strong>Consulte licitações</strong> de forma rápida e eficiente, usando CNPJ do órgão
              público ou por estado/município, obtendo dados direto do PNCP (Portal Nacional de
              Contratações Públicas).
            </li>
            <li>
              <strong>Analise conexões políticas</strong> cruzando CNPJs de empresas vencedoras de
              licitações com bancos de dados do TSE (doadores de campanha, candidatos, partidos), dado de servidores do Portal transparência e
              sanções do TCU.
            </li>
            <li>
              <strong>Integre múltiplos serviços públicos</strong> em um único local: TCU, TSE,
              Portal da Transparência, Câmara dos Deputados, Senado Federal, IBGE e
              SICONFI, e encontre informações em um clique.
            </li>
          </ul>
          <p>
            Em vez de abrir varios sites diferentes e fazer cruzamentos manuais, o PODP automatiza esse
            trabalho e apresenta tudo de forma organizada e visual.
          </p>
        </section>

        <section id="pncp" className="wiki-section">
          <h2>PNCP — Portal Nacional de Contratações Públicas</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> contratos e contratações públicas centralizados de todas as esferas de governo, incluindo atas, editais e resultados de licitações.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/pncp.md" target="_blank" rel="noopener noreferrer">docs/clientes/pncp.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O PNCP centraliza todas as licitações do país desde 2024. É a fonte primária de dados
            que o PODP consulta para obter editais, contratos, atas e resultados de todas as esferas
            de governo.
          </p>

          <h3>Por que é relevante</h3>
          <p>
            O PNCP é uma das bases de todo o fluxo de análise: a partir de uma licitação suspeita, o PODP
            cruza os CNPJs vencedores com as bases do TSE, TCU, Portal transferencia e etc...
          </p>

             <section id="licitacao" className="wiki-section">
          <LicitacaoInfo />
        </section>

        </section>

        <section id="tcu" className="wiki-section">
          <h2>TCU — Tribunal de Contas da União</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> sanções e condenações do TCU, incluindo contas julgadas irregulares (CADIRREG), contas com implicação eleitoral, responsáveis inabilitados para cargo em comissão e licitantes inidôneos.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/tcu.md" target="_blank" rel="noopener noreferrer">docs/clientes/tcu.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O TCU é o órgão de controle externo do governo federal, responsável por fiscalizar a
            aplicação dos recursos públicos federais. Ele julga contas, verifica legalidade de
            contratos e mantém listas de pessoas e empresas com irregularidades.
          </p>

          <h3>Dados consultados pelo PODP</h3>
          <ul>
            <li>
              <strong>Contas Irregulares</strong> — pessoas físicas e jurídicas com contas julgadas
              irregulares. Inclui número do processo, nome, tipo de registro, município, UF, data
              de trânsito em julgado e link para deliberações.
            </li>
            <li>
              <strong>Fins Eleitorais</strong> — condenações por uso indevido de recursos públicos
              em campanhas eleitorais, com data final da restrição.
            </li>
            <li>
              <strong>Inabilitados</strong> — pessoas declaradas inabilitadas para exercer cargo
              público ou função de confiança.
            </li>
            <li>
              <strong>Inidôneos</strong> — empresas declaradas inidôneas para contratar com a
              Administração Pública.
            </li>
          </ul>
          <h3>Por que é relevante</h3>
          <p>
            Se uma empresa vencedora de licitação aparece como inidônea no TCU, ou um sócio tem
            contas julgadas irregulares, isso é forte indício de irregularidade.
          </p>
        </section>

        <section id="tse-arquitetura" className="wiki-section">
          <h2>TSE — Arquitetura de Dados</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> dados eleitorais históricos desde 2006, incluindo candidatos, partidos, doadores, fornecedores de campanha, prestação de contas (receitas e despesas) e bens declarados.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/db-tse.md" target="_blank" rel="noopener noreferrer">docs/db-tse.md</a>
              {' | '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/tse-importacao.md" target="_blank" rel="noopener noreferrer">docs/tse-importacao.md</a>
            </p>
          </div>

          <h3>Visão Geral</h3>
          <p>
            Os dados do TSE são originalmente disponibilizados como planilhas CSV por ano eleitoral
            e por UF. O PODP importa esses CSVs para um banco PostgreSQL, normalizando
            as entidades e mantendo a rastreabilidade por arquivo importado.
          </p>

          <h3>Dados históricos</h3>
          <ul>
            <li><strong>2006 a 2024</strong>: todos os dados eleitorais mapeados.</li>
            <li><strong>2018 em diante</strong>: também disponíveis dados de prestação de contas
            (receitas e despesas de campanha).</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O cruzamento entre dados eleitorais e licitações é o cerne da análise. Se uma empresa
            doou R$500 mil para a campanha de um prefeito e, meses depois, venceu uma licitação de
            R$10 milhões na prefeitura, isso configura potencial conflito de interesse.
          </p>
        </section>

        <section id="portal-transparencia" className="wiki-section">
          <h2>Portal da Transparência</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> órgãos públicos federais (SIAPE/SIAFI), pessoas físicas e jurídicas, despesas federais, cartões corporativos, emendas parlamentares e servidores públicos (cadastro, remuneração, cargos e PEPs).</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/portal-da-transparencia.md" target="_blank" rel="noopener noreferrer">docs/clientes/portal-da-transparencia.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O Portal da Transparência do Governo Federal é mantido pela CGU e disponibiliza dados
            sobre receitas e despesas do governo federal. O cliente
            (<code>internal/shared/clients/portaltransparencia/</code>) consome a API em
            <code>https://api.portaldatransparencia.gov.br</code> com autenticação via API Key.
          </p>

          <h3>Dados consultados pelo PODP</h3>
          <ul>
            <li>
              <strong>Órgãos (SIAPE/SIAFI)</strong> — lista de órgãos públicos federais com seus
              códigos de identificação.
            </li>
            <li>
              <strong>Pessoas (PF/PJ)</strong> — pessoas físicas ou jurídicas com vínculos a
              sanções administrativas.
            </li>
            <li>
              <strong>Cartões de Pagamento</strong> — gastos com cartões corporativos, com filtros
              por mês, tipo, órgão, CPF do portador e valor.
            </li>
            <li>
              <strong>Servidores</strong> — consulta de servidores públicos federais por CPF, nome
              ou órgão, incluindo remuneração e funções.
            </li>
            <li>
              <strong>Despesas</strong> — consulta detalhada de despesas por ano, órgão,
              favorecido, funcional programática, empenhos e plano orçamentário.
            </li>
            <li>
              <strong>Emendas Parlamentares</strong> — consulta de emendas por código, autor ou
              ano, com documentos relacionados.
            </li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O Portal da
            Transparência mostra os pagamentos efetivamente realizados, servidores publicos, emendas e outras informações.
          </p>
        </section>

        <section id="camara-deputados" className="wiki-section">
          <h2>Câmara dos Deputados</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> deputados federais, despesas da cota parlamentar, frentes parlamentares, blocos partidários, grupos, legislaturas, votações e referências.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/camara-dos-deputados.md" target="_blank" rel="noopener noreferrer">docs/clientes/camara-dos-deputados.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            A Câmara dos Deputados representa o povo brasileiro, com 513 deputados eleitos a cada
            4 anos. O cliente (<code>internal/shared/clients/deputados/</code>) consome a API de
            Dados Abertos em <code>https://dadosabertos.camara.leg.br/api/v2</code>.
          </p>

          <h3>APIs integradas</h3>
          <p>O cliente da Câmara é o mais completo do projeto, com 7 grupos de APIs:</p>

          <h4>Deputados</h4>
          <ul>
            <li><strong>ListarInfoDeputadosAtivos</strong> — lista com filtros por partido, UF, legislatura.</li>
            <li><strong>BuscarDeputado</strong> — dados completos: nome civil, nascimento, escolaridade, redes sociais, gabinete.</li>
            <li><strong>ListarDespesasPorDeputado</strong> — gastos da cota parlamentar (passagens, alimentação, divulgação, etc.).</li>
            <li><strong>ListarTodasDespesasPorDeputado</strong> — todas as despesas com paginação automática.</li>
            <li><strong>ListarFrentesDeputado</strong> — frentes parlamentares do deputado.</li>
            <li><strong>ListarHistorico</strong> — histórico de mandatos e filiações.</li>
            <li><strong>ListarMandatosExternos</strong> — mandatos externos anteriores.</li>
            <li><strong>ListarOrgaos</strong> — órgãos e comissões do deputado.</li>
          </ul>

          <h4>Legislaturas</h4>
          <ul>
            <li>Listar/Buscar legislaturas, líderes de bancada e mesa diretora.</li>
          </ul>

          <h4>Blocos</h4>
          <ul>
            <li>Listar blocos parlamentares, buscar bloco, listar partidos do bloco.</li>
          </ul>

          <h4>Votações</h4>
          <ul>
            <li>Listar votações, buscar votação, orientações de bancada e votos nominais.</li>
          </ul>

          <h4>Frentes</h4>
          <ul>
            <li>Listar frentes parlamentares, buscar frente, listar membros.</li>
          </ul>

          <h4>Grupos</h4>
          <ul>
            <li>Listar grupos, buscar grupo, histórico e membros.</li>
          </ul>

          <h4>Referências</h4>
          <ul>
            <li>Listar referências por tipo.</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            Deputados federais influenciam o orçamento através de emendas parlamentares. Se um
            deputado destinou emendas para um município e uma empresa doadora de sua campanha
            venceu a licitação correspondente, isso pode indicar favorecimento.
          </p>
        </section>

        <section id="senado" className="wiki-section">
          <h2>Senado Federal</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> senadores, comissões, processos legislativos, votações em plenário e comissões, matérias em tramitação, agenda do plenário e emendas orçamentárias.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/senado-federal.md" target="_blank" rel="noopener noreferrer">docs/clientes/senado-federal.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O Senado Federal representa os estados e o Distrito Federal, com 81 senadores (3 por
            estado). O cliente (<code>internal/shared/clients/senado/</code>) consome a API de
            Dados Abertos em <code>https://legis.senado.leg.br/dadosabertos</code>.
          </p>

          <h3>APIs integradas</h3>

          <h4>Senadores</h4>
          <ul>
            <li><strong>ListarSenadores</strong> — lista completa de senadores ativos.</li>
            <li><strong>BuscarSenador</strong> — dados detalhados: nome, nascimento, profissão, biografia.</li>
            <li><strong>ListarCargos</strong> — cargos ocupados ao longo da carreira.</li>
            <li><strong>ListarComissoes</strong> — comissões das quais participa.</li>
            <li><strong>ListarMandatos</strong> — histórico de mandatos.</li>
          </ul>

          <h4>Orçamento</h4>
          <ul>
            <li>Listar emendas ao orçamento.</li>
          </ul>

          <h4>Votações</h4>
          <ul>
            <li>Votações em plenário e em comissões (por comissão ou por parlamentar).</li>
            <li>Tramitação de matérias.</li>
          </ul>

          <h4>Processos</h4>
          <ul>
            <li>Listar processos, assuntos, emendas, buscar processo.</li>
          </ul>

          <h4>Comissões</h4>
          <ul>
            <li>Listar todas as comissões, buscar comissão por código.</li>
          </ul>

          <h4>Plenário (Agenda)</h4>
          <ul>
            <li>Agenda do dia/mês, buscar encontro plenário.</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O Senado aprova autoridades indicadas pelo Executivo (como ministros do TCU) e fiscaliza
            grandes contratos federais. Cruzar senadores em comissões de orçamento ou fiscalização
            com doadores de campanha e vencedores de licitações revela conexões que merecem
            escrutínio público.
          </p>
        </section>

        <section id="ibge" className="wiki-section">
          <h2>IBGE — Localidades e População</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> localidades brasileiras (estados e municípios) com hierarquia administrativa (microrregião, mesorregião, UF) e estimativas populacionais dos municípios.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/ibge.md" target="_blank" rel="noopener noreferrer">docs/clientes/ibge.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O IBGE disponibiliza dados de localidades (estados e municípios) e estimativas
            populacionais. O cliente (<code>internal/shared/clients/ibge/</code>) consome as APIs
            em <code>https://servicodados.ibge.gov.br/api</code>.
          </p>

          <h3>APIs integradas</h3>
          <ul>
            <li><strong>ListarEstados</strong> — todos os estados brasileiros (ID, sigla, nome).</li>
            <li><strong>ListarMunicipios</strong> — municípios de uma UF.</li>
            <li><strong>ListarMunicipiosCompleto</strong> — todos os municípios com microrregião.</li>
            <li><strong>BuscarPopulacao</strong> — população de municípios por ID.</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            Os dados do IBGE contextualizam as análises: permitem saber o porte de um município,
            sua população e região, ajudando a dimensionar a relevância de contratos e conexões
            políticas locais.
          </p>
        </section>

        <section id="siconfi" className="wiki-section">
          <h2>SICONFI — Tesouro Nacional</h2>

          <div className="wiki-entidade-header">
            <p><strong>Dados disponibilizados:</strong> dados contábeis e fiscais do setor público brasileiro, incluindo Declaração de Contas Anuais (DCA), Relatório de Gestão Fiscal (RGF), Relatório Resumido de Execução Orçamentária (RREO), Matriz de Saldos Contábeis (MSC) e extrato de entregas.</p>
            <p><strong>Documentação:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/clientes/siconfi.md" target="_blank" rel="noopener noreferrer">docs/clientes/siconfi.md</a>
            </p>
          </div>

          <h3>O que é</h3>
          <p>
            O SICONFI (Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro) é
            mantido pelo Tesouro Nacional. O cliente (<code>internal/shared/clients/siconfi/</code>)
            consome a API em <code>https://apidatalake.tesouro.gov.br/ords/siconfi/tt</code>.
          </p>

          <h3>APIs integradas</h3>
          <ul>
            <li><strong>ListarEntes</strong> — entes federativos cadastrados.</li>
            <li><strong>BuscarDCA</strong> — Declaração de Contas Anuais (balanços patrimoniais, financeiros e orçamentários).</li>
            <li><strong>BuscarRGF</strong> — Relatório de Gestão Fiscal (despesa com pessoal, dívida, limites constitucionais).</li>
            <li><strong>BuscarRREO</strong> — Relatório Resumido de Execução Orçamentária (receitas, despesas, resultados).</li>
            <li><strong>BuscarMSC</strong> — Matriz de Saldos Contábeis (visão contábil completa) nas versões patrimonial, orçamentária e de controle.</li>
            <li><strong>ListarExtratoEntregas</strong> — extrato de entregas do ente.</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O SICONFI fornece a saúde fiscal de estados e municípios. É possível verificar se um
            município que fez uma licitação milionária está dentro dos limites legais de gasto com
            pessoal, se tem capacidade de endividamento e qual sua situação fiscal geral — dados
            essenciais para avaliar a regularidade de grandes contratos públicos.
          </p>
        </section>

        <section id="repositorios" className="wiki-section">
          <h2>Repositórios do Projeto</h2>

          <div className="wiki-entidade-header">
            <p><strong>Documentação geral:</strong>{' '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/dev-roadmap.md" target="_blank" rel="noopener noreferrer">docs/dev-roadmap.md</a>
              {' (status das integrações) | '}
              <a href="https://github.com/danyycls/backend-analise/blob/main/docs/mapeamento-de-rotas.md" target="_blank" rel="noopener noreferrer">docs/mapeamento-de-rotas.md</a>
              {' (84 rotas mapeadas)'}
            </p>
          </div>

          <p>O PODP é dividido em dois repositórios principais:</p>
          <ul>
            <li>
              <strong>Back-end (Go)</strong>:{" "}
              <a href="https://github.com/danyycls/backend-analise" target="_blank" rel="noopener noreferrer">
                github.com/danyycls/backend-analise
              </a>
              — API REST e WebSocket em Go, integração com serviços externos,
              banco PostgreSQL, cache Redis e análises automatizadas.
            </li>
            <li>
              <strong>Front-end (React)</strong>:{" "}
              <a href="https://github.com/danyycls/frontend-analise" target="_blank" rel="noopener noreferrer">
                github.com/danyycls/frontend-analise
              </a>
              — interface web em React com Vite, mapas interativos,
              visualização de dados e dashboards de análise.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
