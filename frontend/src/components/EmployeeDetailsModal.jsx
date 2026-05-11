import React from 'react';
import { FiX, FiPackage, FiUserMinus } from 'react-icons/fi';
import Button from './ui/animated-button';

function EmployeeDetailsModal({ isOpen, onClose, employee, onUnassignItem, onUnassignAll }) {
  if (!isOpen || !employee) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-animate-content" style={{ maxWidth: '40rem' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Perfil do Colaborador</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{employee.nome} • {employee.escritorio}</p>
          </div>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPackage /> Equipamentos Atribuídos
            </h4>
            {employee.items && employee.items.length > 0 && (
              <Button 
                onClick={() => onUnassignAll(employee.id)} 
                className="btn-danger" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <FiUserMinus /> Desatribuir Tudo
              </Button>
            )}
          </div>

          <div className="table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th style={{ textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {!employee.items || employee.items.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Nenhum equipamento atribuído a este colaborador.
                    </td>
                  </tr>
                ) : (
                  employee.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Button 
                          onClick={() => onUnassignItem(employee.id, item)} 
                          className="btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Desatribuir
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Button onClick={onClose} className="btn-primary">Fechar</Button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailsModal;
