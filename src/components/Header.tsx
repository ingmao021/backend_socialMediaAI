import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <header className="header">
      <div className="header-container">
        <div
          className="header-logo"
          onClick={() => navigate('/dashboard')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')}
        >
          <span className="header-logo-icon">▶</span>
          <span>Social Video AI</span>
        </div>

        <nav className="header-nav">
          <button
            className={`header-nav-link${location.pathname === '/dashboard' ? ' header-nav-link--active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            Inicio
          </button>
          <button
            className={`header-nav-link${location.pathname === '/history' ? ' header-nav-link--active' : ''}`}
            onClick={() => navigate('/history')}
          >
            Historial
          </button>
          <button
            className={`header-nav-link${location.pathname === '/favorites' ? ' header-nav-link--active' : ''}`}
            onClick={() => navigate('/favorites')}
          >
            Favoritos
          </button>
        </nav>

        <div className="header-right">
          <div className="quota-badge" title="Videos generados / límite">
            <span className="quota-count">{user?.videosGenerated ?? 0}</span>
            <span className="quota-separator">/</span>
            <span className="quota-limit">{user?.videosLimit ?? 2}</span>
            <span className="quota-label">videos</span>
          </div>

          <div className="header-avatar-wrapper" ref={dropdownRef}>
            <button
              className="header-avatar-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="Menú de usuario"
              id="user-menu-btn"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="header-avatar-img"
                />
              ) : (
                <div className="header-avatar-fallback">{initials}</div>
              )}
            </button>

            {dropdownOpen && (
              <div className="header-dropdown" role="menu" id="user-menu-dropdown">
                <div className="header-dropdown-user">
                  <span className="header-dropdown-name">{user?.name}</span>
                  <span className="header-dropdown-email">{user?.email}</span>
                </div>
                <div className="header-dropdown-divider" />
                <button
                  className="header-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    navigate('/profile');
                    setDropdownOpen(false);
                  }}
                >
                  Editar perfil
                </button>
                <button
                  className="header-dropdown-item header-dropdown-item-danger"
                  role="menuitem"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
