import React, { useEffect, useState } from 'react';
import { FiClock, FiPackage, FiUser, FiX } from 'react-icons/fi';
import api from '../api';

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString('pt-BR');
};

function EquipmentHistoryModal({ isOpen, onClose, equipment }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !equipment) {
      return;
    }

    fetchHistory();
  }, [isOpen, equipment]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/equipments/${equipment.id}/history`);
      setHistory(response.data);
    } catch (requestError) {
      console.error('Erro ao buscar historico do equipamento:', requestError);
      setError('Nao foi possivel carregar o historico deste equipamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-animate-content"
        style={{ maxWidth: '56rem', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <h3>Historico do Equipamento</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {equipment.name}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div
          className="card"
          style={{
            backgroundColor: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <strong>Categoria:</strong> {equipment.category}
            </div>
            <div>
              <strong>Disponivel:</strong> {equipment.availableQuantity}
            </div>
            <div>
              <strong>Total:</strong> {equipment.totalQuantity}
            </div>
            <div>
              <strong>Localizacao:</strong> {equipment.location}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Carregando historico...
          </div>
        ) : history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhuma movimentacao registrada para este equipamento.
          </div>
        ) : (
          <div className="card table-wrapper" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Movimento</th>
                  <th>Funcionario</th>
                  <th>Escritorio</th>
                  <th>Quantidade</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiClock />
                        <span className="badge badge-info">{item.movementType}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiUser />
                        {item.employeeName}
                      </div>
                    </td>
                    <td>{item.office}</td>
                    <td>{item.quantity}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            <FiPackage /> Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EquipmentHistoryModal;
