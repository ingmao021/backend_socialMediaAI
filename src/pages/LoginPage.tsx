import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import type { ApiError } from '../types/api.types';

export function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Completá todos los campos.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as ApiError | undefined;
        const code = apiError?.code;

        if (code === 'INVALID_CREDENTIALS') {
          setError('Email o contraseña incorrectos.');
        } else if (code === 'VALIDATION_ERROR') {
          setError(apiError?.message || 'Datos inválidos.');
        } else {
          setError('Ocurrió un error. Intentá de nuevo.');
        }
      } else {
        setError('Error de conexión. Verificá tu internet.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    const googleToken = credentialResponse.credential;
    if (!googleToken) {
      toast.error('No se recibió el token de Google. Intentá de nuevo.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await googleLogin(googleToken);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      console.error('Google login error:', err);
      if (axios.isAxiosError(err)) {
        const code = (err.response?.data as ApiError | undefined)?.code;
        if (code === 'INVALID_GOOGLE_TOKEN') {
          toast.error('Token de Google inválido. Intentá de nuevo.');
        } else {
          toast.error('Error al iniciar sesión con Google.');
        }
      } else {
        toast.error('Error de conexión.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">
          Generá videos increíbles con inteligencia artificial
        </p>

        {error && <div className="auth-error-banner">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? (
              <div className="spinner spinner-sm" />
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>o</span>
        </div>

        <div className="auth-google-wrapper" style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Error al conectar con Google.')}
            theme="outline"
            size="large"
            width={320}
            text="continue_with"
          />
        </div>

        <p className="auth-footer">
          ¿No tenés cuenta?{' '}
          <Link to="/register">Registrate</Link>
        </p>
      </div>
    </div>
  );
}
