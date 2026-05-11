import React, { useState, useEffect } from 'react';
import { FiBox, FiAlertCircle, FiCheckCircle, FiUserPlus, FiMonitor } from 'react-icons/fi';
import api from '../api';

const StatCard = ({ icon, label, value, color, bgColor }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ backgroundColor: bgColor, color: color, padding: '1rem', borderRadius: '0.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>{label}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>{value}</h3>
    </div>
  </div>
);

const InfoCard = ({ image, title, description }) => (
  <div className="card informative-card">
    <div className="informative-image-wrapper">
      <img src={image} alt={title} />
    </div>
    <div className="informative-body">
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  </div>
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

  useEffect(() => {
    fetchStats();
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
      const inStock = equipments.filter(item => item.status === 'Em estoque').length;
      const outOfStock = equipments.filter(item => item.status === 'Em falta').length;
      
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

  return (
    <div className="dashboard-view">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <StatCard icon={<FiBox />} label="Equipamentos (Tipos)" value={stats.totalItems} color="#4F46E5" bgColor="#EEF2FF" />
        <StatCard icon={<FiCheckCircle />} label="Em Estoque (Tipos)" value={stats.inStock} color="#16A34A" bgColor="#F0FDF4" />
        <StatCard icon={<FiAlertCircle />} label="Em Falta" value={stats.outOfStock} color="#DC2626" bgColor="#FEF2F2" />
        <StatCard icon={<FiUserPlus />} label="Colaboradores" value={stats.totalEmployees} color="#EA580C" bgColor="#FFF7ED" />
        <StatCard icon={<FiMonitor />} label="Notebooks" value={stats.totalNotebooks} color="#7C3AED" bgColor="#F5F3FF" />
        <StatCard icon={<FiBox />} label="Itens Alocados" value={stats.assignedItems} color="#059669" bgColor="#ECFDF5" />
      </div>

      <div className="informative-section">
        <h2 className="section-title">Informativos & Novidades</h2>
        <div className="info-cards-grid">
          <InfoCard 
            image="/images/guide.png" 
            title="Boas Práticas de Gestão" 
            description="Mantenha seu inventário sempre atualizado para evitar gargalos na operação e otimizar custos de TI."
          />
          <InfoCard 
            image="/images/new_tech.png" 
            title="Novos Equipamentos" 
            description="Novos modelos de notebooks chegaram ao estoque central. Verifique as especificações na aba de notebooks."
          />
          <InfoCard 
            image="/images/support.png" 
            title="Canal de Suporte" 
            description="Dúvidas sobre alocação ou devolução? Entre em contato com a equipe de infraestrutura via Slack."
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
