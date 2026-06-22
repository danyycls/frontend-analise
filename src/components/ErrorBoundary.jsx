import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(error) {
    return { erro: error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] erro capturado:', error, info);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="estado-detalhe" style={{ padding: 40, textAlign: 'center' }}>
          <div className="estado-detalhe-header" style={{ justifyContent: 'center', borderBottom: 'none' }}>
            <h3 style={{ color: '#ff6b6b' }}>Erro inesperado</h3>
          </div>
          <p style={{ margin: '16px 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            Ocorreu um erro ao renderizar esta seção
          </p>
          <pre style={{
            background: 'rgba(255,0,0,0.06)',
            border: '1px solid rgba(255,107,107,0.2)',
            padding: 12,
            fontSize: '0.7rem',
            color: '#ff6b6b',
            maxWidth: 500,
            margin: '0 auto 20px',
            overflow: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {this.state.erro.message}
            {this.state.erro.stack && '\n---\n' + this.state.erro.stack}
          </pre>
          {this.props.onFechar && (
            <button className="voltar-btn" onClick={this.props.onFechar}>× Voltar</button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
