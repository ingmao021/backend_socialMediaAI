import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import type { ApiError } from '../types/api.types';

const MAX_NAME_LENGTH = 50;
const NAME_WARNING_THRESHOLD = 70;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio.';
    } else if (name.length > MAX_NAME_LENGTH) {
      newErrors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
    }
    if (!email.trim()) {
      newErrors.email = 'El email es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido.';
    }
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as ApiError | undefined;
        const code = apiError?.code;

        if (code === 'EMAIL_ALREADY_REGISTERED') {
          setErrors({ email: 'Este email ya está registrado.' });
          toast.error(
            <span>
              Email ya registrado.{' '}
              <a
                href="/login"
                onClick={(ev) => {
                  ev.preventDefault();
                  navigate('/login');
                }}
                style={{ color: '#a78bfa', fontWeight: 600 }}
              >
                Iniciar sesión
              </a>
            </span>,
            { duration: 5000 },
          );
        } else if (code === 'VALIDATION_ERROR' && apiError?.fields) {
          setErrors(apiError.fields);
        } else {
          toast.error('Ocurrió un error. Intentá de nuevo.');
        }
      } else {
        toast.error('Error de conexión. Verificá tu internet.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">
          Empezá a generar videos con IA en segundos
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Nombre
            </label>
            <input
              id="register-name"
              type="text"
              className={`form-input ${errors.name || name.length > MAX_NAME_LENGTH ? 'input-error' : ''}`}
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name && e.target.value.length <= MAX_NAME_LENGTH) {
                  setErrors((prev) => ({ ...prev, name: '' }));
                }
              }}
              autoComplete="name"
              disabled={loading}
            />
            {name.length >= NAME_WARNING_THRESHOLD && (
              <span
                className="form-hint"
                style={
                  name.length > MAX_NAME_LENGTH
                    ? { color: 'var(--error, #ef4444)', fontWeight: 600 }
                    : { color: 'var(--warning, #f59e0b)' }
                }
              >
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            )}
            {name.length > MAX_NAME_LENGTH && !errors.name && (
              <span className="form-error">
                El nombre no puede superar {MAX_NAME_LENGTH} caracteres.
              </span>
            )}
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />
            {errors.email && (
              <span className="form-error">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Contraseña
            </label>
            <input
              id="register-password"
              type="password"
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm">
              Confirmar contraseña
            </label>
            <input
              id="register-confirm"
              type="password"
              className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repetí tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            id="register-submit-btn"
          >
            {loading ? (
              <div className="spinner spinner-sm" />
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
