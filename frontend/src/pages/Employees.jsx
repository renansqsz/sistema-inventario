import React, { useState, useEffect } from 'react';
import { FiUserPlus, FiSearch, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiEye } from 'react-icons/fi';
import api from '../api';
import Button from '../components/ui/animated-button';
import EmployeeModal from '../components/EmployeeModal';
import EmployeeDetailsModal from '../components/EmployeeDetailsModal';
import UnassignModal from '../components/UnassignModal';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [officeFilter, setOfficeFilter] = useState('Todos');
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [itemToUnassign, setItemToUnassign] = useState(null);

  useEffect(() => {
    fetchData();
    fetchOffices();
  }, []);

  useEffect(() => {
    filterData();
  }, [employees, searchTerm, officeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees/with-assignments');
      setEmployees(response.data);
    } catch (err) {
      console.error('Erro ao buscar colaboradores:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await api.get('/offices');
      setOffices(response.data);
    } catch (err) {
      console.error('Erro ao buscar escritorios:', err);
    }
  };

  const filterData = () => {
    let result = employees;

    if (officeFilter !== 'Todos') {
      result = result.filter(emp => emp.escritorio === officeFilter);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(emp => 
        emp.nome.toLowerCase().includes(lowerTerm) ||
        emp.escritorio.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredEmployees(result);
    setCurrentPage(1); // Reset to first page on filter
  };

  const handleEdit = (employee) => {
    setEditingEmployee({
      id: employee.id,
      nome: employee.nome,
      escritorio: employee.escritorio
    });
    setIsModalOpen(true);
  };

  const handleViewDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  const handleUnassignItemClick = (empId, item) => {
    setItemToUnassign(item);
    setIsUnassignModalOpen(true);
  };

  const handleUnassignAll = async (empId) => {
    if (!window.confirm('Tem certeza que deseja desatribuir TODOS os itens deste colaborador?')) return;
    try {
      await api.post(`/employees/${empId}/unassign`, { unassignAll: true });
      await fetchData();
      // Update selected employee data if details modal is open
      const updated = employees.find(e => e.id === empId);
      if (updated) setSelectedEmployee(updated);
      setIsDetailsModalOpen(false); // Better to close if everything is gone
    } catch (err) {
      console.error('Erro ao desatribuir tudo:', err);
      alert('Erro ao desatribuir itens.');
    }
  };

  const handleConfirmUnassign = async (empId, equipId, qty) => {
    try {
      await api.post(`/employees/${empId}/unassign`, { equipmentId: equipId, quantity: qty });
      await fetchData();
      // Since selectedEmployee state might be stale after fetchData, we'll let the user re-open or find it
      setIsDetailsModalOpen(false); 
      setIsUnassignModalOpen(false);
    } catch (err) {
      console.error('Erro ao desatribuir item:', err);
      alert('Erro ao desatribuir item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchData();
    } catch (err) {
      console.error('Erro ao excluir colaborador:', err);
      alert('Erro ao excluir colaborador.');
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Colaboradores</h1>
        <Button onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }} className="btn-primary">
          <FiUserPlus /> Novo Colaborador
        </Button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou escritório..." 
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="input-field" 
          style={{ width: '200px' }}
          value={officeFilter}
          onChange={(e) => setOfficeFilter(e.target.value)}
        >
          <option value="Todos">Todos os Escritórios</option>
          {offices.map(office => (
            <option key={office} value={office}>{office}</option>
          ))}
        </select>
      </div>

      <div className="card table-wrapper" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Escritório</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Nenhum colaborador encontrado.</td></tr>
            ) : (
              currentItems.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: '500' }}>{emp.nome}</td>
                  <td>{emp.escritorio}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <Button onClick={() => handleViewDetails(emp)} className="btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Ver Detalhes">
                        <FiEye size={16} />
                      </Button>
                      <Button onClick={() => handleEdit(emp)} className="btn-outline" style={{ padding: '0.25rem 0.5rem' }} title="Editar">
                        <FiEdit2 size={16} />
                      </Button>
                      <Button onClick={() => handleDelete(emp.id)} className="btn-danger" style={{ padding: '0.25rem 0.5rem' }} title="Excluir">
                        <FiTrash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <Button 
            onClick={() => paginate(currentPage - 1)} 
            disabled={currentPage === 1}
            className="btn-outline"
            style={{ padding: '0.5rem' }}
          >
            <FiChevronLeft />
          </Button>
          <span style={{ fontWeight: '500' }}>Página {currentPage} de {totalPages}</span>
          <Button 
            onClick={() => paginate(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="btn-outline"
            style={{ padding: '0.5rem' }}
          >
            <FiChevronRight />
          </Button>
        </div>
      )}

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={editingEmployee}
        onSave={() => {
          fetchData();
          fetchOffices();
        }}
      />

      <EmployeeDetailsModal 
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        employee={selectedEmployee}
        onUnassignItem={handleUnassignItemClick}
        onUnassignAll={handleUnassignAll}
      />

      <UnassignModal 
        isOpen={isUnassignModalOpen}
        onClose={() => setIsUnassignModalOpen(false)}
        employeeId={selectedEmployee?.id}
        item={itemToUnassign}
        onConfirm={handleConfirmUnassign}
      />
    </div>
  );
}

export default Employees;
