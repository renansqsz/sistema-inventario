import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiBox, FiCheckCircle, FiMonitor, FiUserPlus } from 'react-icons/fi';
import api from '../api';

const FALLBACK_NEWS = [
  {
    title: 'Tendencias de IA em destaque',
    description: 'Acompanhe os principais movimentos em inteligencia artificial enquanto o feed externo e recarregado.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    link: 'https://news.google.com/home?hl=pt-BR&gl=BR&ceid=BR:pt-419',
    category: 'IA',
    pubDate: new Date().toISOString()
  },
  {
    title: 'Modelos, produtos e pesquisa em IA',
    description: 'O dashboard mantem somente noticias relacionadas a IA, com foco em tecnologia e inovacao.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    link: 'https://news.google.com/search?q=inteligencia%20artificial&hl=pt-BR&gl=BR&ceid=BR%3Apt-419',
    category: 'IA',
    pubDate: new Date().toISOString()
  },
  {
    title: 'Atualizacao automatica ativada',
    description: 'As tres postagens sao renovadas automaticamente para manter a secao sempre atualizada com IA.',
    image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80',
    link: 'https://news.google.com/search?q=inteligencia%20artificial&hl=pt-BR&gl=BR&ceid=BR%3Apt-419',
    category: 'IA',
    pubDate: new Date().toISOString()
  }
];

const StatCard = ({ icon, label, value, color, bgColor }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div
      style={{
        backgroundColor: bgColor,
        color,
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>
        {label}
      </p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{value}</h3>
    </div>
  </div>
);

const formatNewsDate = (value) => {
  if (!value) {
    return 'Atualizacao recente';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Atualizacao recente';
  }

  return parsedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const InfoCard = ({ image, title, description, link, category, pubDate }) => (
  <a
    className="card informative-card informative-link-card"
    href={link}
    target="_blank"
    rel="noreferrer"
  >
    <div className="informative-image-wrapper">
      <img src={image} alt={title} />
    </div>
    <div className="informative-body">
      <span className="informative-tag">{category}</span>
      <h4>{title}</h4>
      <p>{description}</p>
      <div className="informative-meta">
        <span>{formatNewsDate(pubDate)}</span>
        <span>Ler mais</span>
      </div>
    </div>
  </a>
);

function Dashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    inStock: 0,
    outOfStock: 0,
    totalEmployees: 0,
    totalNotebooks: 0,
    assignedItems: 0
  });
  const [news, setNews] = useState(FALLBACK_NEWS);

  useEffect(() => {
    fetchStats();
    fetchNews();

    const intervalId = window.setInterval(() => {
      fetchNews();
    }, 15 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const fetchStats = async () => {
    try {
      const [equipmentsRes, employeesRes, notebooksRes] = await Promise.all([
        api.get('/equipments'),
        api.get('/employees'),
        api.get('/notebooks')
      ]);

      const equipments = equipmentsRes.data;
      const employees = employeesRes.data;
      const notebooks = notebooksRes.data;

      const total = equipments.length;
      const inStock = equipments.filter((item) => item.status === 'Em estoque').length;
      const outOfStock = equipments.filter((item) => item.status === 'Em falta').length;

      const assigned = equipments.reduce((acc, item) => {
        const totalNum = Number(item.totalQuantity) || 0;
        const availableNum = Number(item.availableQuantity) || 0;
        return acc + (totalNum - availableNum);
      }, 0);

      setStats({
        totalItems: total,
        inStock,
        outOfStock,
        totalEmployees: employees.length,
        totalNotebooks: notebooks.length,
        assignedItems: assigned
      });
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await api.get('/news');
      const nextNews =
        Array.isArray(response.data?.items) && response.data.items.length > 0
          ? response.data.items
          : FALLBACK_NEWS;

      setNews(nextNews);
    } catch (error) {
      console.error('Erro ao buscar informativos do dashboard:', error);
      setNews(FALLBACK_NEWS);
    }
  };

  return (
    <div className="dashboard-view">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <StatCard
          icon={<FiBox />}
          label="Equipamentos (Tipos)"
          value={stats.totalItems}
          color="#4F46E5"
          bgColor="#EEF2FF"
        />
        <StatCard
          icon={<FiCheckCircle />}
          label="Em Estoque (Tipos)"
          value={stats.inStock}
          color="#16A34A"
          bgColor="#F0FDF4"
        />
        <StatCard
          icon={<FiAlertCircle />}
          label="Em Falta"
          value={stats.outOfStock}
          color="#DC2626"
          bgColor="#FEF2F2"
        />
        <StatCard
          icon={<FiUserPlus />}
          label="Colaboradores"
          value={stats.totalEmployees}
          color="#EA580C"
          bgColor="#FFF7ED"
        />
        <StatCard
          icon={<FiMonitor />}
          label="Notebooks"
          value={stats.totalNotebooks}
          color="#7C3AED"
          bgColor="#F5F3FF"
        />
        <StatCard
          icon={<FiBox />}
          label="Itens Alocados"
          value={stats.assignedItems}
          color="#059669"
          bgColor="#ECFDF5"
        />
      </div>

      <div className="informative-section">
        <h2 className="section-title">Informativos & Novidades</h2>
        <div className="info-cards-grid">
          {news.map((item, index) => (
            <InfoCard
              key={`${item.link}-${index}`}
              image={item.image}
              title={item.title}
              description={item.description}
              link={item.link}
              category={item.category}
              pubDate={item.pubDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
