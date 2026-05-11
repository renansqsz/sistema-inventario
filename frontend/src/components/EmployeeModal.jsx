import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../api';
import Button from './ui/animated-button';

function EmployeeModal({ isOpen, onClose, onSave, employee }) {
  const [formData, setFormData] = useState({
    nome: '',
    escritorio: ''
  });
  const [offices, setOffices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await api.get('/offices');
        setOffices(response.data);
        if (!employee && response.data.length > 0 && !formData.escritorio) {
          setFormData(prev => ({ ...prev, escritorio: response.data[0] }));
        }
      } catch (err) {
        console.error('Erro ao buscar escritórios:', err);
      }
    };
    if (isOpen) fetchOffices();
  }, [isOpen]);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({
        nome: '',
        escritorio: offices.length > 0 ? offices[0] : ''
      });
    }
  }, [employee, isOpen, offices]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (employee) {
        // Update logic if needed, but for now we only handle creation based on request
        await api.put(`/employees/${employee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar colaborador:', err);
      alert('Erro ao salvar colaborador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-animate-content" style={{ maxWidth: '30rem' }}>
        <div className="modal-header">
          <h3>{employee ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nome Completo</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="input-field"
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="input-group">
            <label>Escritório</label>
            <select
              name="escritorio"
              value={formData.escritorio}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Selecione um escritório</option>
              {[...new Set([...offices, 'CampSoft', 'Tocalivros'])].map(office => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="button" onClick={onClose} className="btn-outline">Cancelar</Button>
            <Button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Colaborador'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeModal;
