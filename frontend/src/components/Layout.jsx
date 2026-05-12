import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiBox, FiLogOut, FiMonitor, FiList, FiMenu, FiUserPlus, FiSun, FiMoon, FiInstagram, FiFacebook, FiLinkedin } from 'react-icons/fi';
import Button from './ui/animated-button';

const BigBigBrand = ({ isCollapsed }) => (
  <div className={`sidebar-brand-card ${isCollapsed ? 'collapsed' : ''}`}>
    <a
      className="sidebar-brand-link"
      href="https://big-big.streamlit.app/"
      target="_blank"
      rel="noreferrer"
      title="BigBig"
    >
      <svg className="sidebar-brand-logo" viewBox="0 0 120 80" aria-hidden="true">
        <defs>
          <linearGradient id="bigbigGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        <text
          x="50%"
          y="58%"
          textAnchor="middle"
          fontSize="52"
          fontWeight="900"
          letterSpacing="-6"
          fill="url(#bigbigGradient)"
          fontFamily="Arial, sans-serif"
        >
          BB
        </text>
      </svg>
    </a>
  </div>
);

function Layout({ onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="app-container">
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <h2>Dashboard - TI</h2>}
          <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
            <FiMenu />
          </button>
        </div>
        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} title="Dashboard">
            <FiHome size={20} style={{ minWidth: '20px' }} />
            <span className="link-text">Dashboard</span>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} title="Equipamentos">
            <FiBox size={20} style={{ minWidth: '20px' }} />
            <span className="link-text">Equipamentos</span>
          </NavLink>
          <NavLink to="/notebooks" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} title="Notebooks">
            <FiMonitor size={20} style={{ minWidth: '20px' }} />
            <span className="link-text">Notebooks</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} title="Categorias">
            <FiList size={20} style={{ minWidth: '20px' }} />
            <span className="link-text">Categorias</span>
          </NavLink>
          <NavLink to="/employees" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} title="Colaboradores">
            <FiUserPlus size={20} style={{ minWidth: '20px' }} />
            <span className="link-text">Colaboradores</span>
          </NavLink>
          <BigBigBrand isCollapsed={isCollapsed} />

          <div className="logout-container">
            <Button onClick={onLogout} className="nav-link logout-link" style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }} title="Sair">
              <FiLogOut size={20} style={{ minWidth: '20px' }} />
              <span className="link-text">Sair</span>
            </Button>
          </div>
        </nav>
      </aside>

      <main className="main-content">
        <div className="theme-toggle-wrapper">
          {/* Custom Toggle Switch */}
          <div
            onClick={toggleTheme}
            className="theme-toggle-switch"
          >
            <div className="theme-toggle-thumb">
              {isDark ? <FiMoon size={18} color="#4F46E5" /> : <FiSun size={18} color="#F59E0B" />}
            </div>
          </div>
        </div>

        <div className="page-container">
          <Outlet />
        </div>

        <footer className="corporate-footer">
          {/* Área Superior */}
          <div className="footer-top-area">
            <div className="footer-container">
              <div className="footer-left-block">
                <div className="footer-logo-wrapper">
                  <img src="/images/footer-logo.png" alt="Corporate Logo" className="footer-logo-img" />
                </div>
                <nav className="footer-horizontal-menu">
                  <a href="#" className="menu-item active">Início</a>
                  <a href="#" className="menu-item">Produtos</a>
                  <a href="#" className="menu-item">Artigos</a>
                  <a href="#" className="menu-item">Contato</a>
                  <a href="#" className="menu-item">A Campsoft</a>
                  <a href="#" className="menu-item">Integrações</a>
                </nav>
              </div>

              <div className="footer-right-block">
                <div className="social-buttons-wrapper">
                  <a href="#" className="social-button"><FiInstagram size={24} /></a>
                  <a href="#" className="social-button"><FiFacebook size={24} /></a>
                  <a href="#" className="social-button"><FiLinkedin size={24} /></a>
                </div>
              </div>
            </div>
          </div>

          {/* Área Inferior */}
          <div className="footer-bottom-area">
            <div className="footer-legal-container">
              <p className="legal-main-text">Campsoft Tecnologia LTDA © 2026 – Todos os direitos reservados</p>
              <p className="legal-address-text">
                CNPJ n.º 35.434.544/0001-46 – Av. Marquês de São Vicente, 182, Parque Industrial Tomas<br />
                Edson Barra Funda, CEP: 01139-000, São Paulo – SP – Brasil
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default Layout;
