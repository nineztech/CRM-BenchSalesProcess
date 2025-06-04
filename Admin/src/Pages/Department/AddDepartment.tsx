import React, { useState, useEffect } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,

} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaEdit, FaGripVertical, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import './adddepartment.css';

interface Department {
  id: number;
  department_name: string;
  sequence_number: number;
  created_at: string;
}

interface ApiError {
  error: string;
  message?: string;
}

const AddDepartment: React.FC = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Department[]>('http://localhost:5000/api/departments');
      
      if (Array.isArray(response.data)) {
        setDepartments(response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;
        setError(apiError?.error || 'Failed to fetch departments. Please try again.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = departmentName.trim();
  if (!trimmed) {
    setError('Please enter a department name.');
    return;
  }

  try {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (editId) {
      await axios.put(`http://localhost:5000/api/departments/${editId}`, {
        department_name: trimmed,
      });
      setSuccess('Department updated successfully!');
      setEditId(null);
    } else {
      await axios.post('http://localhost:5000/api/departments', {
        department_name: trimmed,
      });
      setSuccess('Department created successfully!');
    }

    setDepartmentName('');
    await fetchDepartments();
    
    setTimeout(() => setSuccess(null), 3000);
  } catch (error) {
    console.error('Error submitting department:', error);
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      setError(apiError?.error || 'Failed to save department. Please try again.');
    } else {
      setError('Network error. Please check your connection.');
    }
  } finally {
    setLoading(false);
  }
};


  const handleEdit = (id: number) => {
    const dept = departments.find((d) => d.id === id);
    if (dept) {
      setDepartmentName(dept.department_name);
      setEditId(id);
      setError(null);
      setSuccess(null);
    }
  };

  const handleDelete = async (id: number) => {
    const dept = departments.find((d) => d.id === id);
    if (!dept) return;

    if (window.confirm(`Are you sure you want to delete "${dept.department_name}"?`)) {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        setSuccess('Department deleted successfully!');
        await fetchDepartments();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('Error deleting department:', error);
        if (axios.isAxiosError(error)) {
          const apiError = error.response?.data as ApiError;
          setError(apiError?.error || 'Failed to delete department. Please try again.');
        } else {
          setError('Network error. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = departments.findIndex((d) => d.id === active.id);
    const newIndex = departments.findIndex((d) => d.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(departments, oldIndex, newIndex);
    
    // Optimistically update the UI
    setDepartments(newOrder);

    try {
      const orderData = newOrder.map((d, index) => ({ 
        id: d.id, 
        sequence_number: index + 1 
      }));

      await axios.put('http://localhost:5000/api/departments/reorder', {
        order: orderData,
      });
      
      setSuccess('Department order updated successfully!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (error) {
      console.error('Error saving new order:', error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as ApiError;
        setError(apiError?.error || 'Failed to save new order. Refreshing...');
      } else {
        setError('Network error while saving order. Refreshing...');
      }
      
      // Revert the change
      await fetchDepartments();
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setDepartmentName('');
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <Sidebar />
      <div className="add-department-wrapper">
        <div className="add-department-container">
          <div className="title-form-row">
            <h2 className="form-title">Add Department</h2>
            <form className="inline-form" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
                disabled={loading}
                maxLength={100}
              />
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Processing...' : editId ? 'Update' : 'Add'}
              </button>
              {editId && (
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
          
          {error && (
            <div className="error-message" style={{ color: 'red', marginTop: '10px' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ color: 'green', marginTop: '10px' }}>
              {success}
            </div>
          )}
        </div>

        <div className="add-department-container">
          {loading && !departments.length && <div className="loading">Loading...</div>}
          
          {departments.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={departments.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="department-table">
                  <thead>
                    <tr>
                      <th className="drag-handle-column"></th>
                      <th className="sr-no">#</th>
                      <th className="department">Department</th>
                      <th className="date-time">Date & Time</th>
                      <th className="action-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept, index) => (
                      <DraggableRow
                        key={dept.id}
                        id={dept.id}
                        index={index}
                        department_name={dept.department_name}
                        created_at={dept.created_at}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isEditing={editId === dept.id}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          )}
          
          {departments.length === 0 && !loading && (
            <div className="no-departments">No departments found. Add your first department above.</div>
          )}
        </div>
      </div>
    </>
  );
};

interface RowProps {
  id: number;
  index: number;
  department_name: string;
  created_at: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isEditing: boolean;
}

const DraggableRow: React.FC<RowProps> = ({
  id,
  index,
  department_name,
  created_at,
  onEdit,
  onDelete,
  isEditing,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={isEditing ? 'editing-row' : ''}
    >
      <td 
        {...attributes} 
        {...listeners} 
        className="drag-handle-column" 
        style={{ cursor: 'grab', textAlign: 'center' }}
      >
        <FaGripVertical />
      </td>
      <td className="sr-no" style={{ textAlign: 'center' }}>
        {index + 1}
      </td>
      <td className="department" title={department_name}>
        {department_name}
      </td>
      <td className="date-time" title={formatDate(created_at)}>
        {formatDate(created_at)}
      </td>
      <td className="action-column">
        <button 
          onClick={() => onEdit(id)} 
          className="edit-btn" 
          title="Edit"
          disabled={isEditing}
        >
          <FaEdit />
        </button>
        <button 
          onClick={() => onDelete(id)} 
          className="delete-btn" 
          title="Delete"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default AddDepartment;