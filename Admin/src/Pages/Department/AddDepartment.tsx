import React, { useState, useEffect } from 'react';
import Layout from '../../Components/Layout/Layout';
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
    <Layout>
      <div className="flex flex-col gap-6 max-w-[98%]">
        {/* Title and Form Container */}
        <div className="border-2 border-gray-300 p-10 rounded-lg shadow-lg font-['Poppins']">
          <div className="flex justify-between gap-5 md:flex-row flex-col md:items-center items-stretch md:gap-5 gap-2.5">
            <h2 className="text-2xl font-bold pb-20 md:pb-0">Add Department</h2>
            
            <form 
              className="flex items-center gap-2.5 mt-7 md:mt-0 flex-1 min-w-[200px] md:w-auto w-full" 
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                required
                className="flex-grow p-2.5 text-base rounded border border-gray-300 md:w-auto w-full"
              />
              <button 
                type="submit" 
                className="px-5 py-2.5 bg-[#3e5f80] text-white border-none rounded-[30px] text-base cursor-pointer hover:bg-[#2f4e6a] md:w-auto w-full"
              >
                {editId ? 'Update' : 'Add'}
              </button>
            </form>
          </div>
        </div>

        {/* Departments Table Container */}
        <div className="border-2 border-gray-300 p-10 rounded-lg shadow-lg font-['Poppins']">
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
                <table className="w-full border-collapse mt-7 table-fixed md:text-base text-sm">
                  <thead>
                    <tr>
                      <th className="w-2.5 text-center cursor-grab select-none border border-gray-300 p-2.5 bg-gray-100 overflow-hidden text-ellipsis whitespace-nowrap"></th>
                      <th className="w-10 text-center whitespace-nowrap border border-gray-300 p-2.5 bg-gray-100 overflow-hidden text-ellipsis">Sr.No</th>
                      <th className="w-75 whitespace-nowrap overflow-hidden text-ellipsis text-left border border-gray-300 p-2.5 bg-gray-100">Department</th>
                      <th className="w-40 whitespace-nowrap text-left overflow-hidden text-ellipsis border border-gray-300 p-2.5 bg-gray-100">Date & Time</th>
                      <th className="w-20 text-center whitespace-nowrap border border-gray-300 p-2.5 bg-gray-100 overflow-hidden text-ellipsis">Actions</th>
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
    </Layout>
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
      <td 
        {...attributes} 
        {...listeners} 
        className="cursor-grab text-center border border-gray-300 p-2.5 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        <FaGripVertical />
      </td>
      <td className="text-center border border-gray-300 p-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
        {index + 1}
      </td>
      <td className="border border-gray-300 p-2.5 whitespace-nowrap overflow-hidden text-ellipsis text-left">
        {department_name}
      </td>
      <td className="border border-gray-300 p-2.5 whitespace-nowrap text-left overflow-hidden text-ellipsis">
        {created_at}
      </td>
      <td className="border border-gray-300 p-2.5 text-center whitespace-nowrap overflow-hidden text-ellipsis">
        <button 
          onClick={() => onEdit(id)} 
          className="bg-transparent border-none cursor-pointer text-lg text-blue-600 hover:text-blue-800 mr-2" 
          title="Edit"
        >
          <FaEdit />
        </button>
        <button 
          onClick={() => onDelete(id)} 
          className="bg-transparent border-none cursor-pointer text-lg text-red-600 hover:text-red-800" 
          title="Delete"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default AddDepartment;