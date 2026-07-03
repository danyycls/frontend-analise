// @ts-nocheck

export function LicitacaoDefinicao() {
  return (
    <>
      <p>
        Licitação é o processo administrativo formal pelo qual a Administração Pública (União,
        Estados, Municípios, autarquias, fundações, empresas públicas) contrata obras, serviços,
        compras e alienações. É um procedimento obrigatório previsto na Constituição Federal
        (art. 37, XXI) e regulamentado pela Lei 14.133/2021 (Nova Lei de Licitações).
      </p>
      <p>
        Todos os órgãos e entidades da Administração Pública direta e indireta dos três poderes
        (Executivo, Legislativo e Judiciário) em todas as esferas (federal, estadual, distrital e
        municipal) podem realizar licitações. Isso inclui ministérios, prefeituras, universidades,
        hospitais públicos, empresas estatais e autarquias.
      </p>
    </>
  );
}

export function LicitacaoImportancia() {
  return (
    <>
      <ul>
        <li><strong>Licitações = dinheiro público</strong>: cada contrato é pago com impostos dos cidadãos.</li>
        <li>
          <strong>Encontre conexões políticas ocultas</strong>: ao cruzar os dados de várias fontes, encontramos potenciais conflitos de interesse ou relações políticas ocultas.
        </li>
        <li>
          <strong>Sobrepreço e irregularidades</strong>: contratos superfaturados desviam recursos que
          deveriam ir para saúde, educação e infraestrutura.
        </li>
      </ul>
    </>
  );
}

export function LicitacaoDispensa() {
  return (
    <>
      <p>
        Diferente das modalidades tradicionais (Pregão, Concorrência, Concurso, Leilão, Diálogo
        Competitivo), a <strong>Dispensa de Licitação</strong> não é exatamente uma modalidade, mas
        sim uma exceção à obrigatoriedade de licitar. A administração pública <strong>pode</strong>
        contratar diretamente, sem licitação, nos casos previstos no <strong>Art. 75 da Lei
        14.133/2021</strong>.
      </p>
      <h4>Principais casos de dispensa</h4>
      <ul>
        <li><strong>Baixo valor</strong>: obras e serviços de engenharia até R$ 100.000,00; outros serviços e compras até R$ 50.000,00.</li>
        <li><strong>Emergência e calamidade</strong>: quando a demora de uma licitação pode causar prejuízo ou comprometer a segurança.</li>
        <li><strong>Guerra ou grave perturbação da ordem</strong>: situações excepcionais que exigem contratação imediata.</li>
        <li><strong>Licitação deserta ou fracassada</strong>: quando não aparecem interessados ou as propostas são inadequadas.</li>
        <li><strong>Pesquisa científica ou tecnológica</strong>: contratação de instituições de pesquisa.</li>
        <li><strong>Contratação de artistas</strong>: para shows e eventos culturais de notória relevância.</li>
      </ul>
      <p>
        A dispensa não significa ausência de controle: o processo deve ser devidamente justificado,
        publicado no PNCP e fiscalizado pelos órgãos de controle interno e externo.
      </p>
    </>
  );
}

export default function LicitacaoInfo() {
  return (
    <>
      <h2>O que é uma Licitação?</h2>
      <h3>Definição</h3>
      <LicitacaoDefinicao />
      <h3>Por que isso importa?</h3>
      <LicitacaoImportancia />
      <h3>Modalidade Dispensa de Licitação</h3>
      <LicitacaoDispensa />
    </>
  );
}
