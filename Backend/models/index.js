import User  from './userModel.js';
import Department  from './departmentModel.js';
import Lead from './leadModel.js';
import Packages from './packagesModel.js';
import LeadAssignment from './leadAssignmentModel.js';
import Activity from './activityModel.js';
import Permission from './permissionsModel.js';
import RolePermission from './rolePermissionModel.js';
import {sequelize} from '../config/dbConnection.js';

// Department associations
Department.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Department.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Department, { foreignKey: 'createdBy', as: 'createdDepartments' });
User.hasMany(Department, { foreignKey: 'updatedBy', as: 'updatedDepartments' });

// User-Department association for department and subroles
User.belongsTo(Department, { 
  foreignKey: 'departmentId',
  as: 'department'
});

Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'users'
});

// Activity associations
Activity.belongsTo(Department, { foreignKey: 'dept_id', as: 'department' });
Activity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Department.hasMany(Activity, { foreignKey: 'dept_id', as: 'activities' });
User.hasMany(Activity, { foreignKey: 'createdBy', as: 'createdActivities' });
User.hasMany(Activity, { foreignKey: 'updatedBy', as: 'updatedActivities' });

// Permission associations
Permission.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Permission.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Permission, { foreignKey: 'createdBy', as: 'createdPermissions' });
User.hasMany(Permission, { foreignKey: 'updatedBy', as: 'updatedPermissions' });

// RolePermission associations
RolePermission.belongsTo(Department, { foreignKey: 'dept_id', as: 'department' });
RolePermission.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
RolePermission.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Department.hasMany(RolePermission, { foreignKey: 'dept_id', as: 'rolePermissions' });
User.hasMany(RolePermission, { foreignKey: 'createdBy', as: 'createdRolePermissions' });
User.hasMany(RolePermission, { foreignKey: 'updatedBy', as: 'updatedRolePermissions' });

// Add a virtual field to User model to access department subroles
User.prototype.getSubroles = async function() {
  if (this.department && this.department.subroles) {
    return this.department.subroles;
  }
  return [];
};

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

// Add createdBy and updatedBy associations for Lead
Lead.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'RESTRICT'
});

Lead.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
  onDelete: 'RESTRICT'
});

User.hasMany(Lead, {
  foreignKey: 'createdBy',
  as: 'createdLeads'
});

User.hasMany(Lead, {
  foreignKey: 'updatedBy',
  as: 'updatedLeads'
});

// Lead Assignment associations
LeadAssignment.belongsTo(Lead, {
  foreignKey: 'leadId',
  as: 'lead',
  onDelete: 'CASCADE'
});

Lead.hasMany(LeadAssignment, {
  foreignKey: 'leadId',
  as: 'assignments'
});

LeadAssignment.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'assignedTo',
  onDelete: 'RESTRICT'
});

LeadAssignment.belongsTo(User, {
  foreignKey: 'previousAssignedId',
  as: 'previousAssigned',
  onDelete: 'SET NULL'
});

User.hasMany(LeadAssignment, {
  foreignKey: 'assignedToId',
  as: 'currentAssignments'
});

User.hasMany(LeadAssignment, {
  foreignKey: 'previousAssignedId',
  as: 'previousAssignments'
});

// Add createdBy and updatedBy associations for LeadAssignment
LeadAssignment.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'RESTRICT'
});

LeadAssignment.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
  onDelete: 'RESTRICT'
});

User.hasMany(LeadAssignment, {
  foreignKey: 'createdBy',
  as: 'createdAssignments'
});

User.hasMany(LeadAssignment, {
  foreignKey: 'updatedBy',
  as: 'updatedAssignments'
});

// Packages associations
Packages.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Packages.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Packages, { foreignKey: 'createdBy', as: 'createdPackages' });
User.hasMany(Packages, { foreignKey: 'updatedBy', as: 'updatedPackages' });

// Function to sync all models in the correct order
export const syncModels = async () => {
  try {
    // First create tables without foreign keys
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Create User table first
    await User.sync({ alter: true });
    console.log('User table synced successfully');

    // Create Department table
    await Department.sync({ alter: true });
    console.log('Department table synced successfully');

    // Create Activity table
    await Activity.sync({ alter: true });
    console.log('Activity table synced successfully');

    // Create Permission table
    await Permission.sync({ alter: true });
    console.log('Permission table synced successfully');

    // Create RolePermission table
    await RolePermission.sync({ alter: true });
    console.log('RolePermission table synced successfully');

    // Create other tables
    await Lead.sync({ alter: true });
    console.log('Lead table synced successfully');

    await Packages.sync({ alter: true });
    console.log('Packages table synced successfully');

    await LeadAssignment.sync({ alter: true });
    console.log('LeadAssignment table synced successfully');

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('All models synced successfully');
  } catch (error) {
    console.error('Error syncing models:', error);
    throw error;
  }
};

export {
  User,
  Department,
  Lead,
  Packages,
  LeadAssignment,
  Activity,
  Permission,
  RolePermission
};
