import { useState, useEffect, useRef } from 'react';
import './WikiPesquisa.css';

const SECTIONS = [
  { id: 'objetivo',            label: 'Objetivo da Plataforma' },
  { id: 'licitacao',           label: 'O que é uma Licitação?' },
  { id: 'tcu',                 label: 'TCU' },
  { id: 'tse',                 label: 'TSE' },
  { id: 'portal-transparencia',label: 'Portal da Transparência' },
  { id: 'camara-deputados',    label: 'Câmara dos Deputados' },
  { id: 'senado',              label: 'Senado Federal' },
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
            O <strong>Liceu</strong> é uma plataforma de análise de dados públicos que centraliza e
            cruza informações de diversas fontes oficiais para facilitar a consulta sobre
            contratos públicos e conexões políticas.
          </p>
          <p>
            Nosso objetivo é permitir que qualquer pessoa — jornalistas, pesquisadores, órgãos de
            controle ou cidadãos comuns — consiga:
          </p>
          <ul>
            <li>
              <strong>Consultar licitações</strong> de forma rápida e eficiente, usando CNPJ do órgão
              público ou por estado/município, obtendo dados direto do PNCP (Portal Nacional de
              Contratações Públicas).
            </li>
            <li>
              <strong>Analisar conexões políticas</strong> cruzando CNPJs de empresas vencedoras de
              licitações com bancos de dados do TSE (doadores de campanha, candidatos, partidos).
            </li>
            <li>
              <strong>Integrar múltiplos serviços públicos</strong> em um único local: TCU, TSE,
              Portal da Transparência, Câmara dos Deputados e Senado Federal.
            </li>
            <li>
              <strong>Utilizar inteligência artificial</strong> para gerar análises automáticas,
              planos de investigação e relatórios detalhados.
            </li>
          </ul>
          <p>
            Em vez de abrir 5 sites diferentes e fazer cruzamentos manuais, o Liceu automatiza esse
            trabalho e apresenta tudo de forma estruturada e visual.
          </p>
        </section>

        <section id="licitacao" className="wiki-section">
          <h2>O que é uma Licitação?</h2>

          <h3>Definição</h3>
          <p>
            Licitação é o processo administrativo formal pelo qual a Administração Pública (União,
            Estados, Municípios, autarquias, fundações, empresas públicas) contrata obras, serviços,
            compras e alienações. É um procedimento obrigatório previsto na Constituição Federal
            (art. 37, XXI) e regulamentado pela Lei 14.133/2021 (Nova Lei de Licitações).
          </p>

          <h3>Quem pode fazer uma licitação?</h3>
          <p>
            Todos os órgãos e entidades da Administração Pública direta e indireta dos três poderes
            (Executivo, Legislativo e Judiciário) em todas as esferas (federal, estadual, distrital e
            municipal). Isso inclui ministérios, prefeituras, universidades, hospitais públicos,
            empresas estatais e autarquias.
          </p>

          <h3>Por que isso importa?</h3>
          <p>
            As licitações movimentam centenas de bilhões de reais por ano no Brasil. A transparência
            e o controle desses processos são fundamentais porque:
          </p>
          <ul>
            <li><strong>É dinheiro público</strong>: cada contrato é pago com impostos dos cidadãos.</li>
            <li>
              <strong>Fraudes e direcionamentos</strong>: empresas podem combinar preços, simular
              concorrência ou serem favorecidas por agentes públicos.
            </li>
            <li>
              <strong>Conexões políticas ocultas</strong>: empresas doadoras de campanha frequentemente
              vencem licitações — o cruzamento desses dados revela potenciais conflitos de interesse.
            </li>
            <li>
              <strong>Sobrepreço e irregularidades</strong>: contratos superfaturados desviam recursos que
              deveriam ir para saúde, educação e infraestrutura.
            </li>
          </ul>

          <h3>Tipos de licitação (Lei 14.133/2021)</h3>
          <ul>
            <li><strong>Pregão</strong>: para bens e serviços comuns (mais comum).</li>
            <li><strong>Concorrência</strong>: para obras e serviços de engenharia de grande porte.</li>
            <li><strong>Concurso</strong>: para trabalhos técnicos, científicos ou artísticos.</li>
            <li><strong>Leilão</strong>: para venda de bens públicos.</li>
            <li><strong>Diálogo Competitivo</strong>: para contratações complexas e inovadoras.</li>
          </ul>

          <h3>O PNCP</h3>
          <p>
            O Portal Nacional de Contratações Públicas (PNCP) centraliza todas as licitações do país
            desde 2024. É a fonte primária de dados que o Liceu consulta, oferecendo acesso a editais,
            contratos, atas e resultados de todas as esferas de governo.
          </p>
        </section>

        <section className="wiki-section" id="entidades-intro">
          <h2>Entidades Integradas</h2>
          <p>
            O Liceu integra dados das seguintes fontes oficiais. Cada uma oferece um ângulo diferente
            da investigação — juntas, permitem traçar o caminho completo do dinheiro público, desde a
            licitação até o destino final.
          </p>
        </section>

        <section id="tcu" className="wiki-section">
          <h2>TCU — Tribunal de Contas da União</h2>

          <h3>O que é</h3>
          <p>
            O TCU é o órgão de controle externo do governo federal, responsável por fiscalizar a
            aplicação dos recursos públicos federais. Ele julga as contas de administradores públicos,
            verifica a legalidade de contratos, licitações e convênios, e mantém listas de pessoas e
            empresas com irregularidades.
          </p>

          <h3>Dados consultados pelo Liceu</h3>
          <ul>
            <li>
              <strong>Contas Irregulares (por CPF/CNPJ):</strong> lista de pessoas físicas e jurídicas
              que tiveram contas julgadas irregulares pelo TCU. Inclui débitos, multas e sanções.
            </li>
            <li>
              <strong>Fins Eleitorais (por CPF/CNPJ):</strong> condenações por uso indevido de recursos
              públicos em campanhas eleitorais.
            </li>
            <li>
              <strong>Inabilitados (por CPF/CNPJ):</strong> pessoas declaradas inabilitadas para exercer
              cargo público ou função de confiança.
            </li>
            <li>
              <strong>Inidôneos (por CNPJ):</strong> empresas declaradas inidôneas para contratar com a
              Administração Pública.
            </li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            Se uma empresa que venceu uma licitação milionária aparece como inidônea no TCU, ou se um
            sócio dessa empresa tem contas julgadas irregulares, isso é um forte indício de
            irregularidade que merece investigação aprofundada.
          </p>
        </section>

        <section id="tse" className="wiki-section">
          <h2>TSE — Tribunal Superior Eleitoral</h2>

          <h3>O que é</h3>
          <p>
            O TSE é responsável por organizar e fiscalizar as eleições no Brasil. Mantém o banco de
            dados da Justiça Eleitoral com informações sobre candidatos, partidos, prestações de
            contas de campanha, doadores e fornecedores de campanhas eleitorais.
          </p>

          <h3>Dados consultados pelo Liceu</h3>
          <ul>
            <li>
              <strong>Relações Políticas e Empresas (por CNPJ):</strong> cruza um CNPJ de empresa
              com a base de dados eleitorais, revelando despesas de campanha recebidas por essa
              empresa e receitas de campanha que ela doou a candidatos.
            </li>
            <li>
              <strong>Políticos por Cargo:</strong> busca políticos que ocuparam ou ocupam cargos
              específicos (prefeito, vereador, deputado, etc.).
            </li>
            <li>
              <strong>Políticos por Partido:</strong> lista políticos filiados a um determinado
              partido.
            </li>
            <li>
              <strong>Relação de Doadores (por CPF/CNPJ):</strong> identifica todas as doações
              feitas por uma pessoa ou empresa para campanhas eleitorais.
            </li>
            <li>
              <strong>Relação de Fornecedores (por CPF/CNPJ):</strong> identifica todos os
              pagamentos recebidos por uma pessoa ou empresa de campanhas eleitorais.
            </li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O cruzamento entre dados eleitorais e licitações é o cerne da análise de dados públicos.
            Se uma empresa doou R$500 mil para a campanha de um prefeito e, meses depois, venceu uma
            licitação de R$10 milhões na prefeitura, isso configura um potencial conflito de interesse
            que merece atenção. O Liceu automatiza exatamente esse tipo de cruzamento.
          </p>
        </section>

        <section id="portal-transparencia" className="wiki-section">
          <h2>Portal da Transparência</h2>

          <h3>O que é</h3>
          <p>
            O Portal da Transparência do Governo Federal é mantido pela Controladoria-Geral da União
            (CGU) e disponibiliza dados sobre receitas e despesas do governo federal, incluindo
            transferências, servidores, cartões de pagamento, emendas parlamentares e muito mais.
          </p>

          <h3>Dados consultados pelo Liceu</h3>
          <ul>
            <li>
              <strong>Órgãos (SIAPE/SIAFI):</strong> lista de órgãos públicos federais com seus
              códigos de identificação.
            </li>
            <li>
              <strong>Pessoas (PF/PJ):</strong> busca de pessoas físicas ou jurídicas com vínculos
              a sanções administrativas.
            </li>
            <li><strong>Cartões de Pagamento:</strong> consulta de gastos com cartões corporativos.</li>
            <li>
              <strong>Servidores:</strong> consulta de servidores públicos federais por CPF, nome
              ou órgão.
            </li>
            <li>
              <strong>Despesas:</strong> consulta detalhada de despesas do governo federal por ano,
              órgão, favorecido e tipo.
            </li>
            <li>
              <strong>Emendas Parlamentares:</strong> consulta de emendas parlamentares por código,
              autor ou ano.
            </li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O Portal da Transparência fornece o "outro lado" da investigação: enquanto o PNCP mostra
            a licitação (quem contratou e quem venceu), o Portal mostra os pagamentos efetivamente
            realizados. É possível verificar se o dinheiro foi de fato pago para uma empresa, se um
            servidor público está envolvido, ou se há emendas parlamentares direcionando recursos
            para um contrato específico.
          </p>
        </section>

        <section id="camara-deputados" className="wiki-section">
          <h2>Câmara dos Deputados</h2>

          <h3>O que é</h3>
          <p>
            A Câmara dos Deputados é a casa legislativa federal que representa o povo brasileiro.
            Seus 513 deputados são eleitos a cada 4 anos e têm poder de criar leis, fiscalizar o
            Executivo e controlar o orçamento federal.
          </p>

          <h3>Dados consultados pelo Liceu</h3>
          <ul>
            <li>
              <strong>Deputados Ativos:</strong> lista completa de deputados em exercício com
              partido, estado e legislatura.
            </li>
            <li>
              <strong>Deputado Completo (por ID):</strong> dados detalhados de um deputado: nome
              civil, data de nascimento, escolaridade, redes sociais, gabinete, telefone, email.
            </li>
            <li>
              <strong>Despesas de Deputado (por ID):</strong> todos os gastos da cota parlamentar:
              passagens, alimentação, divulgação, combustível, aluguel de veículos, etc.
            </li>
            <li>
              <strong>Órgãos da Câmara (por ID):</strong> comissões, frentes parlamentares e
              órgãos aos quais o deputado está vinculado.
            </li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            Deputados federais têm poder de influenciar o orçamento através de emendas parlamentares
            e comissões. Se um deputado destinou emendas para um município e uma empresa doadora de
            sua campanha venceu a licitação correspondente, isso pode indicar favorecimento. O Liceu
            permite cruzar dados de doadores do TSE com despesas e órgãos da Câmara.
          </p>
        </section>

        <section id="senado" className="wiki-section">
          <h2>Senado Federal</h2>

          <h3>O que é</h3>
          <p>
            O Senado Federal representa os estados e o Distrito Federal, com 81 senadores (3 por
            estado). Atua na criação de leis, fiscalização do Executivo e aprovação de autoridades.
          </p>

          <h3>Dados consultados pelo Liceu</h3>
          <ul>
            <li>
              <strong>Senadores Ativos:</strong> lista completa de senadores em exercício com
              partido e estado.
            </li>
            <li>
              <strong>Senador Completo (por código):</strong> dados detalhados de um senador: nome
              civil, nascimento, profissão, biografia.
            </li>
            <li><strong>Cargos (por código):</strong> cargos ocupados ao longo da carreira política.</li>
            <li><strong>Comissões (por código):</strong> comissões das quais o senador participa.</li>
            <li><strong>Mandatos (por código):</strong> histórico de mandatos do senador.</li>
            <li>
              <strong>Votações:</strong> histórico de votações no plenário e comissões, permitindo
              rastrear como cada senador votou em pautas específicas.
            </li>
            <li><strong>Processos e Matérias:</strong> tramitação de projetos e emendas no Senado.</li>
            <li><strong>Orçamento:</strong> dados do orçamento do Senado.</li>
          </ul>

          <h3>Por que é relevante</h3>
          <p>
            O Senado aprova autoridades indicadas pelo Executivo (como ministros do TCU) e fiscaliza
            grandes contratos federais. Saber quais senadores estão em comissões de orçamento ou
            fiscalização e cruzar isso com doadores de campanha e vencedores de licitações revela
            conexões que merecem escrutínio público.
          </p>
        </section>
      </main>
    </div>
  );
}
