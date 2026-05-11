import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import api from '../api';
import Button from './ui/animated-button';

function EquipmentModal({ isOpen, onClose, onSave, equipment }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mouse',
    brand: '',
    model: '',
    serialNumber: '',
    totalQuantity: 0,
    availableQuantity: 0,
    location: '',
    entryDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
        if (!equipment && response.data.length > 0) {
          setFormData(prev => ({ ...prev, category: response.data[0].name }));
        }
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
      }
    };
    if (isOpen) fetchCategories();
  }, [isOpen]);

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        name: '',
        category: 'Mouse',
        brand: '',
        model: '',
        serialNumber: '',
        totalQuantity: 0,
        availableQuantity: 0,
        location: '',
        entryDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [equipment, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalQuantity' || name === 'availableQuantity' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-animate-content">
        <div className="modal-header">
          <h3>{equipment ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Nome do Produto</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" required />
            </div>
            
            <div className="input-group">
              <label>Categoria</label>
              <select name="category" value={formData.category} onChange={handleChange} className="input-field" required>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Data de Entrada</label>
              <input type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Marca</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="input-field" />
            </div>

            <div className="input-group">
              <label>Modelo</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} className="input-field" />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Número de Série</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="input-field" />
            </div>

            <div className="input-group">
              <label>Quantidade Total</label>
              <input type="number" min="0" name="totalQuantity" value={formData.totalQuantity} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Quantidade Disponível</label>
              <input type="number" min="0" max={formData.totalQuantity} name="availableQuantity" value={formData.availableQuantity} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Localização (ex: Estoque Central)</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="button" onClick={onClose} className="btn-outline">Cancelar</Button>
            <Button type="submit" className="btn-primary">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EquipmentModal;
