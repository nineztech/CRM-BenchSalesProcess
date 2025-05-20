import React, { useState } from 'react';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';
import './adddepartment.css';

interface Department {
  id: string;
  name: string;
}

const LOCAL_STORAGE_KEY = 'departments';

const AddDepartment: React.FC = () => {
  const [departmentName, setDepartmentName] = useState('');
  const [departments, setDepartments] = useState<Department[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const sensors = useSensors(useSensor(PointerSensor));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = departmentName.trim();
    if (!trimmed) {
      alert('Please enter a department name.');
      return;
    }
    if (departments.find((d) => d.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This department already exists.');
      return;
    }

    const newDepartment: Department = {
      id: crypto.randomUUID(),
      name: trimmed,
    };

    const updated = [...departments, newDepartment];
    setDepartments(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setDepartmentName('');
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

  const handleDelete = (id: string) => {
    const filtered = departments.filter((d) => d.id !== id);
    setDepartments(filtered);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  };

  return (
    <div className="add-department-wrapper">
      <div className="add-department-container">
        <h2>Add Department</h2>
        <form onSubmit={handleSubmit} className="add-department-form">
          <input
            type="text"
            placeholder="Enter Department Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            required
          />
          <button type="submit">Add Department</button>
        </form>

        {departments.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={departments.map((d) => d.id)} strategy={verticalListSortingStrategy}>
              <ul className="department-list">
                {departments.map((dept, index) => (
                  <SortableItem
                    key={dept.id}
                    id={dept.id}
                    name={dept.name}
                    index={index}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default AddDepartment;

interface SortableItemProps {
  id: string;
  name: string;
  index: number;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, name, index, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="department-item">
      <span className="sequence-number">{index + 1}.</span> {name}
      <button className="delete-btn" onClick={() => onDelete(id)}>✕</button>
    </li>
  );
};