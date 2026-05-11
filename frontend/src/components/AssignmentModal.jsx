import React, { useEffect, useState } from 'react';
import { FiPackage, FiUserPlus, FiX } from 'react-icons/fi';
import api from '../api';
import Button from './ui/animated-button';

const getDefaultEquipmentId = (equipments) => {
  if (equipments.length === 0) {
    return '';
  }

  const firstAvailable = equipments.find((item) => Number(item.availableQuantity) > 0);
  return String((firstAvailable || equipments[0]).id);
};

function AssignmentModal({ isOpen, onClose, onAssigned, equipments }) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    equipmentId: '',
    quantity: 1,
    office: '',
    employeeId: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      equipmentId: getDefaultEquipmentId(equipments),
      quantity: 1,
      office: '',
      employeeId: ''
    });
    setEmployees([]);
    setError('');
    fetchEmployees();
  }, [isOpen, equipments]);

  useEffect(() => {
    if (!isOpen || employees.length === 0) {
      return;
    }

    const offices = [...new Set(employees.map((employee) => employee.escritorio))];

    setFormData((prev) => {
      const nextOffice = offices.includes(prev.office) ? prev.office : offices[0];
      const employeesForOffice = employees.filter(
        (employee) => employee.escritorio === nextOffice
      );
      const hasCurrentEmployee = employeesForOffice.some(
        (employee) => String(employee.id) === String(prev.employeeId)
      );

      return {
        ...prev,
        office: nextOffice || '',
        employeeId: hasCurrentEmployee
          ? prev.employeeId
          : String(employeesForOffice[0]?.id || '')
      };
    });
  }, [employees, isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.office) {
      return;
    }

    const employeesForOffice = employees.filter(
      (employee) => employee.escritorio === formData.office
    );

    setFormData((prev) => {
      const isValidEmployee = employeesForOffice.some(
        (employee) => String(employee.id) === String(prev.employeeId)
      );

      if (isValidEmployee) {
        return prev;
      }

      return {
        ...prev,
        employeeId: String(employeesForOffice[0]?.id || '')
      };
    });
  }, [formData.office, employees, isOpen]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (requestError) {
      console.error('Erro ao buscar funcionarios:', requestError);
      setError('Nao foi possivel carregar os funcionarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError('');

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.equipmentId) {
      setError('Selecione um equipamento para atribuir.');
      return;
    }

    if (!formData.employeeId) {
      setError('Selecione o funcionario responsavel.');
      return;
    }

    if (!formData.office) {
      setError('Selecione o escritório da atribuição.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await api.post(`/equipments/${formData.equipmentId}/assignments`, {
        quantity: Number(formData.quantity),
        employeeId: Number(formData.employeeId),
        office: formData.office
      });

      await onAssigned();
    } catch (requestError) {
      console.error('Erro ao atribuir equipamento:', requestError);
      setError(
        requestError.response?.data?.error
        || 'Não foi possível concluir a atribuição.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const selectedEquipment = equipments.find(
    (item) => String(item.id) === String(formData.equipmentId)
  );
  const offices = [...new Set(employees.map((employee) => employee.escritorio))];
  const employeesForOffice = employees.filter(
    (employee) => employee.escritorio === formData.office
  );

  return (
    <div className="modal-overlay">
      <div
        className="modal-content modal-animate-content"
        style={{ maxWidth: '44rem', maxHeight: '85vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <h3>Atribuir Equipamento</h3>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
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

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Equipamento</label>
              <select
                name="equipmentId"
                value={formData.equipmentId}
                onChange={handleChange}
                className="input-field"
                required
              >
                {equipments.length === 0 ? (
                  <option value="">Nenhum equipamento cadastrado</option>
                ) : (
                  equipments.map((equipment) => (
                    <option key={equipment.id} value={equipment.id}>
                      {`${equipment.name} | ${equipment.category} | disponível: ${equipment.availableQuantity}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="input-group">
              <label>Quantidade</label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label>Escritório</label>
              <select
                name="office"
                value={formData.office}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading || offices.length === 0}
              >
                {offices.length === 0 ? (
                  <option value="">Nenhum escritório disponível</option>
                ) : (
                  offices.map((office) => (
                    <option key={office} value={office}>
                      {office}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label>Funcionário</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="input-field"
                required
                disabled={loading || employeesForOffice.length === 0}
              >
                {employeesForOffice.length === 0 ? (
                  <option value="">Nenhum funcionário disponível</option>
                ) : (
                  employeesForOffice.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.nome}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div
            className="card"
            style={{
              marginTop: '1rem',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '1rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontWeight: '600'
              }}
            >
              <FiPackage />
              Resumo da atribuicao
            </div>

            {selectedEquipment ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <strong>Equipamento:</strong> {selectedEquipment.name}
                </div>
                <div>
                  <strong>Categoria:</strong> {selectedEquipment.category}
                </div>
                <div>
                  <strong>Disponivel:</strong> {selectedEquipment.availableQuantity}
                </div>
                <div>
                  <strong>Localizacao:</strong> {selectedEquipment.location}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                Selecione um equipamento para visualizar os detalhes.
              </p>
            )}

            {selectedEquipment && Number(selectedEquipment.availableQuantity) <= 0 && (
              <p style={{ color: '#991B1B', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                Este equipamento aparece na lista, mas não possui saldo disponível para atribuição.
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              marginTop: '1.5rem'
            }}
          >
            <Button type="button" onClick={onClose} className="btn-outline">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              disabled={submitting || loading || equipments.length === 0}
            >
              <FiUserPlus />
              {submitting ? 'Atribuindo...' : 'Confirmar atribuicao'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentModal;
