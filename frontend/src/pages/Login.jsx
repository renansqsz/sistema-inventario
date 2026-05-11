import React, { useState, useEffect } from 'react';
import api from '../api';
import Button from '../components/ui/animated-button';

const frases = [
  "✨ A organização é o primeiro passo para o sucesso!",
  "🚀 Tecnologia bem gerenciada, produtividade garantida!",
  "💡 Cada equipamento conta. Controle é poder!",
  "🎯 Eficiência começa com um bom inventário!",
  "🌟 Grandes resultados nascem de pequenos controles!",
  "⚡ Inovar é organizar o presente para conquistar o futuro!",
  "🔥 Quem controla seus recursos, domina seus resultados!",
];

const cores = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#76D7C4',
];

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fraseIndex, setFraseIndex] = useState(0);
  const [corIndex, setCorIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setVisible(prev => !prev);
    }, 800);

    const colorInterval = setInterval(() => {
      setCorIndex(prev => (prev + 1) % cores.length);
    }, 1200);

    const fraseInterval = setInterval(() => {
      setFraseIndex(prev => (prev + 1) % frases.length);
    }, 4000);

    return () => {
      clearInterval(blinkInterval);
      clearInterval(colorInterval);
      clearInterval(fraseInterval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      onLogin(response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
      
      <p style={{
        fontSize: '1.1rem',
        fontWeight: 'bold',
        color: cores[corIndex],
        opacity: visible ? 1 : 0.2,
        transition: 'opacity 0.4s ease, color 0.6s ease',
        marginBottom: '2rem',
        textAlign: 'center',
        padding: '0 1rem',
        minHeight: '2rem',
        textShadow: `0 0 15px ${cores[corIndex]}55`,
      }}>
        {frases[fraseIndex]}
      </p>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>Sistema de Inventário</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Faça login para continuar</p>
        </div>
        
        {error && <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuário</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Login;
