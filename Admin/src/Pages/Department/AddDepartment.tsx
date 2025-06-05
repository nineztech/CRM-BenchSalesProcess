import React, { useState, useEffect } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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
  created_at: string;
}

const AddDepartment: React.FC = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editId, setEditId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

 useEffect(() => {
  fetchDepartments();
}, []);

const fetchDepartments = async () => {
  try {
    const response = await axios.get<Department[]>('http://localhost:5000/api/departments');
    setDepartments(response.data);
  } catch (error) {
    console.error('Error fetching departments:', error);
  }
   
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = departmentName.trim();
    if (!trimmed) {
      alert('Please enter a department name.');
      return;
    }

    try {
      if (editId) {
  await axios.put(`http://localhost:5000/api/departments/${editId}`, {
    name: trimmed,
  });
  setEditId(null);
} else {
  await axios.post('http://localhost:5000/api/departments', {
    department_name: trimmed,
  });
}

      setDepartmentName('');
      fetchDepartments();
    } catch (error) {
      console.error('Error submitting department:', error);
    }
  };

  const handleEdit = (id: number) => {
    const dept = departments.find((d) => d.id === id);
    if (dept) {
      setDepartmentName(dept.department_name);
      setEditId(id);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`http://localhost:5000/api/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = departments.findIndex((d) => d.id === active.id);
      const newIndex = departments.findIndex((d) => d.id === over.id);
      const newOrder = arrayMove(departments, oldIndex, newIndex);
      setDepartments(newOrder);

      try {
        await axios.post('http://localhost:5000/api/departments/reorder', {
  order: newOrder.map((d) => d.id),
});

      } catch (error) {
        console.error('Error saving new order:', error);
      }
    }
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
              />
              <button type="submit" className="btn">
                {editId ? 'Update' : 'Add'}
              </button>
            </form>
          </div>
        </div>

        <div className="add-department-container">
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
                      <th className="sr-no">Sr.No</th>
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
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
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
}

const DraggableRow: React.FC<RowProps> = ({
  id,
  index,
  department_name,
  created_at,
  onEdit,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td {...attributes} {...listeners} className="drag-handle-column" style={{ cursor: 'grab', textAlign: 'center' }}>
        <FaGripVertical />
      </td>
      <td className="sr-no" style={{ textAlign: 'center' }}>{index + 1}</td>
      <td className="department">{department_name}</td>
      <td className="date-time">{created_at}</td>
      <td className="action-column">
        <button onClick={() => onEdit(id)} className="edit-btn" title="Edit">
          <FaEdit />
        </button>
        <button onClick={() => onDelete(id)} className="delete-btn" title="Delete">
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default AddDepartment;
 