import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './ui/animated-button';

function UnassignModal({ isOpen, onClose, employeeId, item, onConfirm }) {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) setQuantity(1);
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onConfirm(employeeId, item.equipmentId, quantity);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content modal-animate-content" style={{ maxWidth: '25rem' }}>
        <div className="modal-header">
          <h3>Desatribuir Item</h3>
          <button className="close-btn" onClick={onClose}><FiX /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Quantas unidades de <strong>{item.name}</strong> deseja devolver ao estoque?
            (Disponível com colaborador: {item.quantity})
          </p>

          <div className="input-group">
            <label>Quantidade</label>
            <input 
              type="number" 
              min="1" 
              max={item.quantity} 
              value={quantity} 
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="input-field"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <Button type="button" onClick={onClose} className="btn-outline">Cancelar</Button>
            <Button type="submit" className="btn-danger" disabled={isSubmitting}>
              {isSubmitting ? 'Processando...' : 'Confirmar Devolução'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UnassignModal;
