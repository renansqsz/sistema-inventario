import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './ui/animated-button';

const CONDITIONS = ['Novo', 'Bom', 'Razoável', 'Com Defeito'];
const STATUSES = ['Em Estoque', 'Em Uso', 'Manutenção'];
const STORAGE_TYPES = ['SSD', 'HD', 'NVMe', 'SSD + HD'];

function NotebookModal({ isOpen, onClose, onSave, equipment }) {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serialNumber: '',
    processor: '',
    gpu: '',
    screenSize: '',
    ramTotal: 8,
    ramSticks: 1,
    storageType: 'SSD',
    storageCapacity: '',
    condition: 'Novo',
    location: '',
    status: 'Em Estoque',
    entryDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        brand: '',
        model: '',
        serialNumber: '',
        processor: '',
        gpu: '',
        screenSize: '',
        ramTotal: 8,
        ramSticks: 1,
        storageType: 'SSD',
        storageCapacity: '',
        condition: 'Novo',
        location: '',
        status: 'Em Estoque',
        entryDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [equipment, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'ramTotal' || name === 'ramSticks' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-animate-content" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3>{equipment ? 'Editar Notebook' : 'Novo Notebook'}</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            
            <div className="input-group">
              <label>Marca</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Modelo</label>
              <input type="text" name="model" value={formData.model} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Número de Série / Service Tag</label>
              <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Processador (ex: Intel Core i5 11ª Gen)</label>
              <input type="text" name="processor" value={formData.processor} onChange={handleChange} className="input-field" required />
            </div>
            
            <div className="input-group">
              <label>Placa de Vídeo (Opcional)</label>
              <input type="text" name="gpu" value={formData.gpu} onChange={handleChange} className="input-field" />
            </div>
            
            <div className="input-group">
              <label>Tamanho da Tela (ex: 15.6")</label>
              <input type="text" name="screenSize" value={formData.screenSize} onChange={handleChange} className="input-field" />
            </div>

            <div className="input-group">
              <label>RAM Total (GB)</label>
              <input type="number" min="1" name="ramTotal" value={formData.ramTotal} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Qtd. de Pentes de RAM</label>
              <input type="number" min="1" name="ramSticks" value={formData.ramSticks} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Tipo de Armazenamento</label>
              <select name="storageType" value={formData.storageType} onChange={handleChange} className="input-field" required>
                {STORAGE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Capacidade Armazenamento (ex: 512GB)</label>
              <input type="text" name="storageCapacity" value={formData.storageCapacity} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Condição</label>
              <select name="condition" value={formData.condition} onChange={handleChange} className="input-field" required>
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field" required>
                {STATUSES.map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Localização (ex: Setor RH, Gaveta 2)</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} className="input-field" required />
            </div>

            <div className="input-group">
              <label>Data de Entrada</label>
              <input type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} className="input-field" required />
            </div>

          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <Button type="button" onClick={onClose} className="btn-outline">Cancelar</Button>
            <Button type="submit" className="btn-primary">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NotebookModal;
