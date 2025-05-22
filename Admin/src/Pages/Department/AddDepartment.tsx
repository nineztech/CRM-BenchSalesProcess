import React, { useState } from 'react';
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
import './adddepartment.css';

interface Department {
  id: string;
  name: string;
  dateTime: string;
}

const LOCAL_STORAGE_KEY = 'departments';

const AddDepartment: React.FC = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [departments, setDepartments] = useState<Department[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [editId, setEditId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = departmentName.trim();
    if (!trimmed) {
      alert('Please enter a department name.');
      return;
    }

    const duplicate = departments.find(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase() && d.id !== editId
    );
    if (duplicate) {
      alert('This department already exists.');
      return;
    }

    if (editId) {
      const updated = departments.map((dept) =>
        dept.id === editId ? { ...dept, name: trimmed } : dept
      );
      setDepartments(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setEditId(null);
    } else {
      const newDepartment: Department = {
        id: crypto.randomUUID(),
        name: trimmed,
        dateTime: new Date().toLocaleString(),
      };
      const updated = [...departments, newDepartment];
      setDepartments(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
    setDepartmentName('');
  };

  const handleEdit = (id: string) => {
    const dept = departments.find((d) => d.id === id);
    if (dept) {
      setDepartmentName(dept.name);
      setEditId(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      const updated = departments.filter((d) => d.id !== id);
      setDepartments(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      if (editId === id) {
        setEditId(null);
        setDepartmentName('');
      }
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = departments.findIndex((d) => d.id === active.id);
      const newIndex = departments.findIndex((d) => d.id === over.id);
      const newOrder = arrayMove(departments, oldIndex, newIndex);
      setDepartments(newOrder);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrder));
    }
  };

  return (
    <>
      <Sidebar />
      <div className="add-department-wrapper">
        <div className="add-department-container">
          <h2 className="form-title">Add Department</h2>
          <form onSubmit={handleSubmit} className="horizontal-form">
            <input
              type="text"
              placeholder="Enter Department Name"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
            <button type="submit" className="btn">
              {editId ? 'Update' : 'Add'}
            </button>
          </form>
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
                        name={dept.name}
                        dateTime={dept.dateTime}
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
  id: string;
  index: number;
  name: string;
  dateTime: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const DraggableRow: React.FC<RowProps> = ({
  id,
  index,
  name,
  dateTime,
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
      <td className="department">{name}</td>
      <td className="date-time">{dateTime}</td>
      <td className="action-column">
        <button onClick={() => onEdit(id)} className="edit-btn" title="Edit">
          <FaEdit />
        </button>
      
      </td>
    </tr>
  );
};

export default AddDepartment;
