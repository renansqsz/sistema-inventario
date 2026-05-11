import React, { useEffect, useState } from 'react';
import {
  FiClock,
  FiDownload,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUserPlus
} from 'react-icons/fi';
import api from '../api';
import AssignmentModal from '../components/AssignmentModal';
import EquipmentHistoryModal from '../components/EquipmentHistoryModal';
import EquipmentModal from '../components/EquipmentModal';
import Button from '../components/ui/animated-button';

function Inventory() {
  const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [historyEquipment, setHistoryEquipment] = useState(null);

  useEffect(() => {
    fetchEquipments();
  }, []);

  useEffect(() => {
    filterData();
  }, [equipments, searchTerm, statusFilter]);

  const fetchEquipments = async () => {
    try {
      const response = await api.get('/equipments');
      setEquipments(response.data);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  };

  const filterData = () => {
    let result = equipments;

    if (statusFilter !== 'Todos') {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((item) => (
        item.name.toLowerCase().includes(lowerTerm)
        || item.category.toLowerCase().includes(lowerTerm)
        || (item.serialNumber && item.serialNumber.toLowerCase().includes(lowerTerm))
      ));
    }

    setFilteredEquipments(result);
  };

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await api.put(`/equipments/${data.id}`, data);
      } else {
        await api.post('/equipments', data);
      }

      setIsModalOpen(false);
      fetchEquipments();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      alert('Erro ao salvar equipamento. Verifique os dados e tente novamente.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      return;
    }

    try {
      await api.delete(`/equipments/${id}`);
      fetchEquipments();
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventario_ti.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar relatorio:', error);
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const openAssignmentModal = () => {
    setIsAssignmentModalOpen(true);
  };

  const openHistoryModal = (equipment) => {
    setHistoryEquipment(equipment);
    setIsHistoryModalOpen(true);
  };

  const handleAssignmentSuccess = async () => {
    setIsAssignmentModalOpen(false);
    await fetchEquipments();
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}
      >
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Equipamentos</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button onClick={handleExport} className="btn-outline" title="Exportar Equipamentos">
            <FiDownload /> Exportar Excel
          </Button>
          <Button onClick={openAssignmentModal} className="btn-outline">
            <FiUserPlus /> Atribuir Equipamento
          </Button>
          <Button onClick={openAddModal} className="btn-primary">
            <FiPlus /> Novo Item
          </Button>
        </div>
      </div>

      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <FiSearch
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou numero de serie..."
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
          <option value="Em estoque">Em estoque</option>
          <option value="Em falta">Em falta</option>
        </select>
      </div>

      <div className="card table-wrapper" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Qtd. Total</th>
              <th>Qtd. Disponivel</th>
              <th>Status</th>
              <th>Localizacao</th>
              <th style={{ textAlign: 'center' }}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipments.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Nenhum equipamento encontrado.
                </td>
              </tr>
            ) : (
              filteredEquipments.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: '500' }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.totalQuantity}</td>
                  <td>{item.availableQuantity}</td>
                  <td>
                    <span className={`badge ${item.status === 'Em estoque' ? 'badge-ok' : 'badge-out'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.location}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <Button
                        onClick={() => openHistoryModal(item)}
                        className="btn-outline"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Ver historico"
                      >
                        <FiClock />
                      </Button>
                      <Button
                        onClick={() => openEditModal(item)}
                        className="btn-outline"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Editar equipamento"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        className="btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        title="Excluir equipamento"
                      >
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

      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        equipment={editingEquipment}
      />

      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        onAssigned={handleAssignmentSuccess}
        equipments={equipments}
      />

      <EquipmentHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        equipment={historyEquipment}
      />
    </div>
  );
}

export default Inventory;
