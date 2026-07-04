import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transações', end: false },
  { to: '/categories', label: 'Categorias', end: false },
];

export function Layout() {
  const { user, loading, logout } = useAuth();

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <span className="app-nav__brand">Finança Simples</span>
        <div className="app-nav__links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `app-nav__link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        {user ? (
          <>
            <span className="app-nav__user">{user.name}</span>
            <button type="button" className="btn btn-secondary" onClick={() => logout()}>
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary">
            Entrar
          </Link>
        )}
      </nav>

      {!loading && !user && (
        <div className="demo-banner">
          Você está explorando com dados fictícios. <Link to="/login">Entre ou crie uma conta</Link> para
          usar com os seus dados.
        </div>
      )}

      <main className="app-main">{loading ? <div className="empty-state">Carregando…</div> : <Outlet />}</main>
    </div>
  );
}
