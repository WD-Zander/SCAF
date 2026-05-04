import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { BASE_URL } from '../../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setGlobalAlert } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      localStorage.setItem('scaf_token', data.token);
      localStorage.setItem('scaf_user', JSON.stringify(data.user));

      setGlobalAlert({ isOpen: true, title: 'Bienvenido', message: `Hola, ${data.user.name}` });
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'var(--accent-primary)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'var(--success)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }}></div>

      <div className="glass-panel animate-fade-in" style={{ padding: '48px', width: '100%', maxWidth: '420px', zIndex: 10, textAlign: 'center' }}>
        <div style={{ margin: '0 auto 24px auto', width: '64px', height: '64px', background: 'var(--accent-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
          <Shield size={32} />
        </div>

        <h2 style={{ marginBottom: '8px', fontSize: '1.75rem' }}>SCAF Pro</h2>
        <p className="text-muted" style={{ marginBottom: '32px' }}>Control de Activos y Depreciación</p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div className="input-group">
            <label>Usuario</label>
            <input type="text" required className="input-control" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input type="password" required className="input-control" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
          </div>

          <div className="flex-between" style={{ marginTop: '16px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-primary)' }}/> Recordarme
            </label>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
