import User  from './userModel.js';
import Department  from './departmentModel.js';
import Lead from './leadModel.js';

// Department associations
Department.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Department.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Department, { foreignKey: 'createdBy', as: 'createdDepartments' });
User.hasMany(Department, { foreignKey: 'updatedBy', as: 'updatedDepartments' });

// Lead associations
Lead.belongsTo(User, { 
  foreignKey: 'assignTo', 
  as: 'assignedUser',
  onDelete: 'SET NULL'
});

Lead.belongsTo(User, { 
  foreignKey: 'previousAssign', 
  as: 'previouslyAssignedUser',
  onDelete: 'SET NULL'
});

User.hasMany(Lead, { 
  foreignKey: 'assignTo', 
  as: 'assignedLeads'
});

User.hasMany(Lead, { 
  foreignKey: 'previousAssign', 
  as: 'previouslyAssignedLeads'
});

export {
  User,
  Department,
  Lead
};
