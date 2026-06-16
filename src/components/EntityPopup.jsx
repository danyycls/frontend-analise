import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { ObjCard } from './AnaliseDetalhada';

const TIPO_LABEL = {
  candidato: 'Candidato',
  fornecedor: 'Fornecedor',
  doador: 'Doador',
  receita: 'Receita',
  despesa: 'Despesa',
};

export function EntidadeView({ dados, tipo }) {
  if (!dados) return null;
  if (tipo === 'candidato') {
    return (
      <div className="ev-grid">
        <CampoEV rotulo="Nome" valor={dados.nome_completo} />
        <CampoEV rotulo="CPF" valor={dados.cpf} />
        <CampoEV rotulo="Partido" valor={dados.partido_sigla ? `${dados.partido_sigla} - ${dados.partido_nome}` : '-'} />
        <CampoEV rotulo="Cargo" valor={dados.cargo_nome} />
        <CampoEV rotulo="UF" valor={dados.sg_uf} />
        <CampoEV rotulo="SQ" valor={String(dados.sq_candidato)} />
        <CampoEV rotulo="Genero" valor={dados.genero} />
        <CampoEV rotulo="Cor/Raca" valor={dados.cor_raca} />
        <CampoEV rotulo="Ocupacao" valor={dados.ocupacao_nome} />
      </div>
    );
  }
  if (tipo === 'fornecedor' || tipo === 'doador') {
    return (
      <div className="ev-grid">
        <CampoEV rotulo="Nome" valor={dados.nome} />
        <CampoEV rotulo="Nome RFB" valor={dados.nome_rfb} />
        <CampoEV rotulo="CPF/CNPJ" valor={dados.cpf_cnpj} />
        <CampoEV rotulo="CNAE" valor={dados.cnae} />
        <CampoEV rotulo="UF" valor={dados.sg_uf} />
      </div>
    );
  }
  return <ObjCard data={dados} titulo={TIPO_LABEL[tipo] || tipo} open />;
}

function CampoEV({ rotulo, valor }) {
  return (
    <div className="ev-campo">
      <span className="ev-rotulo">{rotulo}</span>
      <span className="ev-valor">{valor || '-'}</span>
    </div>
  );
}

export default function EntityPopup({ tipo, chave, cachedData, onLoaded }) {
  const [loading, setLoading] = useState(!cachedData);
  const [erro, setErro] = useState(null);
  const [dados, setDados] = useState(cachedData || null);

  useEffect(() => {
    if (cachedData) return;
    let cancelled = false;
    setLoading(true);
    setErro(null);
    setDados(null);

    fetch(`${API_BASE_URL}/entidade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, chave }),
    })
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        if (json.erro) {
          setErro(json.erro);
        } else {
          setDados(json.dados);
          onLoaded?.(json.dados);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setErro(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [tipo, chave, cachedData]);

  if (loading) {
    return <div className="ev-loading"><p>Consultando dados...</p></div>;
  }
  if (erro) {
    return <div className="ev-erro"><p>{erro}</p></div>;
  }
  return <EntidadeView dados={dados} tipo={tipo} />;
}
