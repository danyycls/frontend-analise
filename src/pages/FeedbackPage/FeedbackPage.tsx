import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api/client';
import '@/features/licitacao/ui/Formulario.css';

export default function FeedbackPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Mensagem é obrigatória');
      return;
    }
    try {
      await api.post('/feedback', { name, email, message });
      alert('Feedback enviado com sucesso');
      setName('');
      setEmail('');
      setMessage('');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar feedback');
    }
  };

  return (
    <div className="feedback-page container">
      <form className="card" onSubmit={onSubmit}>
        <h2>Envie seu feedback</h2>

        <div className="form-row">
          <div className="form-group optional">
            <label htmlFor="nome">Nome</label>
            <input id="nome" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group optional">
            <label htmlFor="email">E‑mail</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="form-group full required">
          <label htmlFor="mensagem">Mensagem</label>
          <textarea id="mensagem" rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>

        <button type="submit" className="btn btn-accent">Enviar</button>
      </form>
    </div>
  );
}
