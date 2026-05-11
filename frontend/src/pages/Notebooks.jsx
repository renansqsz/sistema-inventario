import React, { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import api from '../api';
import NotebookModal from '../components/NotebookModal';
import Button from '../components/ui/animated-button';

function Notebooks() {
  const [notebooks, setNotebooks] = useState([]);
  const [filteredNotebooks, setFilteredNotebooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState(null);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  useEffect(() => {
    filterData();
  }, [notebooks, searchTerm, statusFilter]);

  const fetchNotebooks = async () => {
    try {
      const response = await api.get('/notebooks');
      setNotebooks(response.data);
    } catch (error) {
      console.error('Erro ao buscar notebooks:', error);
    }
  };

  const filterData = () => {
    let result = notebooks;
    
    if (statusFilter !== 'Todos') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.brand.toLowerCase().includes(lowerTerm) || 
        item.model.toLowerCase().includes(lowerTerm) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(lowerTerm))
      );
    }
    
    setFilteredNotebooks(result);
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/notebooks/${data.id}`, data);
      } else {
        await api.post('/notebooks', data);
      }
      setIsModalOpen(false);
      fetchNotebooks();
    } catch (error) {
      console.error('Erro ao salvar notebook:', error);
      alert('Erro ao salvar notebook. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este notebook?')) {
      try {
        await api.delete(`/notebooks/${id}`);
        fetchNotebooks();
      } catch (error) {
        console.error('Erro ao excluir notebook:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/notebooks/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventario_notebooks.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const openAddModal = () => {
    setEditingNotebook(null);
    setIsModalOpen(true);
  };

  const openEditModal = (notebook) => {
    setEditingNotebook(notebook);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Notebooks</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={handleExport} className="btn-outline">
            <FiDownload /> Exportar Excel
          </Button>
          <Button onClick={openAddModal} className="btn-primary">
            <FiPlus /> Novo Notebook
          </Button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo ou nº série..." 
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="input-field" 
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Todos">Todos os Status</option>
          <option value="Em Estoque">Em Estoque</option>
          <option value="Em Uso">Em Uso</option>
          <option value="Manutenção">Manutenção</option>
        </select>
      </div>

      <div className="card table-wrapper" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Marca/Modelo</th>
              <th>Nº Série</th>
              <th>Processador</th>
              <th>RAM</th>
              <th>Armazenamento</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotebooks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Nenhum notebook encontrado.
                </td>
              </tr>
            ) : (
              filteredNotebooks.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '500' }}>{item.brand} {item.model}</td>
                  <td>{item.serialNumber}</td>
                  <td>{item.processor}</td>
                  <td>{item.ramTotal}GB ({item.ramSticks}x)</td>
                  <td>{item.storageCapacity} {item.storageType}</td>
                  <td>
                    <span className={`badge ${item.status === 'Em Estoque' ? 'badge-ok' : item.status === 'Em Uso' ? 'badge-info' : 'badge-out'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <Button onClick={() => openEditModal(item)} className="btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                        <FiEdit2 />
                      </Button>
                      <Button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                        <FiTrash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NotebookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        equipment={editingNotebook} 
      />
    </div>
  );
}

export default Notebooks;
