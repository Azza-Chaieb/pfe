// admin/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../../api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(identifier, password);
      console.log('API Login response user:', data.user);

      // Store token and user info
      localStorage.setItem('jwt', data.jwt);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      // Fallback: If username is "admin", treat as admin even if user_type is incorrect
      let userType = (data.user.user_type || '').toLowerCase();
      if (data.user.username?.toLowerCase() === 'admin') {
        userType = 'admin';
      }

      console.log('Login redirection logic. user_type determined as:', userType);

      if (userType === 'admin') {
        console.log('Navigating to /admin');
        navigate('/admin');
      } else if (userType === 'etudiant' || userType === 'student') {
        console.log('Navigating to /dashboard');
        navigate('/dashboard');
      } else if (userType === 'formateur' || userType === 'trainer') {
        console.log('Navigating to /trainer/dashboard');
        navigate('/trainer/dashboard');
      } else {
        console.log('Navigating to /profile');
        navigate('/profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Identifiants invalides ou erreur serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <div className="login-container" style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div className="login-header" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#1a1a1a', marginBottom: '0.5rem' }}>Connexion Admin</h2>
          <p style={{ color: '#666', margin: 0 }}>Accès réservé aux administrateurs</p>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#b91c1c',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email ou Nom d'utilisateur</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              Vous n'avez pas de compte ? S'inscrire
            </button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none',
                border: 'none',
                color: '#4b5563',
                cursor: 'pointer',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginTop: '0.5rem',
                display: 'block',
                width: '100%'
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;