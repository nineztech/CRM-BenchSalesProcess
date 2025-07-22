import User  from './userModel.js';
import Department  from './departmentModel.js';
import Lead from './leadModel.js';
import Packages from './packagesModel.js';
import LeadAssignment from './leadAssignmentModel.js';
import Activity from './activityModel.js';
import RolePermission from './rolePermissionModel.js';
import AdminPermission from './adminPermissionModel.js';
import ArchivedLead from './archivedLeadModel.js';
import SpecialUserPermission from './specialUserPermissionModel.js';
import EnrolledClients from './enrolledClientsModel.js';
import ClientAssignment from './clientAssignmentModel.js';
import {sequelize} from '../config/dbConnection.js';

// Department associations
Department.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Department.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Department, { foreignKey: 'createdBy', as: 'createdDepartments' });
User.hasMany(Department, { foreignKey: 'updatedBy', as: 'updatedDepartments' });

// User-Department association for department and subroles
User.belongsTo(Department, { 
  foreignKey: 'departmentId',
  as: 'userDepartment'
});

Department.hasMany(User, {
  foreignKey: 'departmentId',
  as: 'departmentUsers'
});

// Activity associations
Activity.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Activity.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

User.hasMany(Activity, { foreignKey: 'createdBy', as: 'createdActivities' });
User.hasMany(Activity, { foreignKey: 'updatedBy', as: 'updatedActivities' });





// RolePermission associations
RolePermission.belongsTo(Department, { foreignKey: 'dept_id', as: 'roleDepartment' });
RolePermission.belongsTo(Activity, { foreignKey: 'activity_id', as: 'roleActivity' });
RolePermission.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
RolePermission.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater' });

Department.hasMany(RolePermission, { foreignKey: 'dept_id', as: 'departmentRolePermissions' });
Activity.hasMany(RolePermission, { foreignKey: 'activity_id', as: 'activityRolePermissions' });
User.hasMany(RolePermission, { foreignKey: 'createdBy', as: 'createdRolePermissions' });
User.hasMany(RolePermission, { foreignKey: 'updatedBy', as: 'updatedRolePermissions' });

// AdminPermission associations
AdminPermission.belongsTo(User, { 
  foreignKey: 'admin_id', 
  as: 'permissionAdminUser',
  onDelete: 'CASCADE'
});

AdminPermission.belongsTo(Activity, { 
  foreignKey: 'activity_id', 
  as: 'permissionActivity',
  onDelete: 'CASCADE'
});

AdminPermission.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'permissionCreatedBy',
  onDelete: 'SET NULL'
});

AdminPermission.belongsTo(User, { 
  foreignKey: 'updatedBy', 
  as: 'permissionUpdatedBy',
  onDelete: 'SET NULL'
});

User.hasMany(AdminPermission, { 
  foreignKey: 'admin_id', 
  as: 'adminUserPermissions'
});

Activity.hasMany(AdminPermission, { 
  foreignKey: 'activity_id', 
  as: 'activityAdminPermissions'
});

User.hasMany(AdminPermission, { 
  foreignKey: 'createdBy', 
  as: 'adminPermissionsCreated'
});

User.hasMany(AdminPermission, { 
  foreignKey: 'updatedBy', 
  as: 'adminPermissionsUpdated'
});

// Special User Permission associations
SpecialUserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'permissionOwner' });
SpecialUserPermission.belongsTo(Activity, { foreignKey: 'activity_id', as: 'permissionActivity' });
SpecialUserPermission.belongsTo(Department, { foreignKey: 'dept_id', as: 'permissionDepartment' });
SpecialUserPermission.belongsTo(User, { foreignKey: 'createdBy', as: 'permissionCreatedBy' });
SpecialUserPermission.belongsTo(User, { foreignKey: 'updatedBy', as: 'permissionUpdatedBy' });

User.hasMany(SpecialUserPermission, { foreignKey: 'user_id', as: 'userOwnedSpecialPermissions' });
Activity.hasMany(SpecialUserPermission, { foreignKey: 'activity_id', as: 'activitySpecialPermissions' });
Department.hasMany(SpecialUserPermission, { foreignKey: 'dept_id', as: 'departmentSpecialPermissions' });
User.hasMany(SpecialUserPermission, { foreignKey: 'createdBy', as: 'specialPermissionsCreated' });
User.hasMany(SpecialUserPermission, { foreignKey: 'updatedBy', as: 'specialPermissionsUpdated' });

// Add a virtual field to User model to access department subroles
User.prototype.getSubroles = async function() {
  if (this.userDepartment && this.userDepartment.subroles) {
    return this.userDepartment.subroles;
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

// ArchivedLead associations
ArchivedLead.belongsTo(User, { 
  foreignKey: 'assignTo', 
  as: 'assignedUser',
  onDelete: 'SET NULL'
});

ArchivedLead.belongsTo(User, { 
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'RESTRICT'
});

ArchivedLead.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
  onDelete: 'RESTRICT'
});

User.hasMany(ArchivedLead, { 
  foreignKey: 'assignTo', 
  as: 'assignedArchivedLeads'
});

User.hasMany(ArchivedLead, {
  foreignKey: 'createdBy',
  as: 'createdArchivedLeads'
});

User.hasMany(ArchivedLead, {
  foreignKey: 'updatedBy',
  as: 'updatedArchivedLeads'
});

// EnrolledClients associations
EnrolledClients.belongsTo(Lead, { 
  foreignKey: 'lead_id', 
  as: 'lead',
  onDelete: 'CASCADE'
});

EnrolledClients.belongsTo(Packages, { 
  foreignKey: 'packageid', 
  as: 'package',
  onDelete: 'SET NULL'
});

EnrolledClients.belongsTo(User, { 
  foreignKey: 'Sales_person_id', 
  as: 'salesPerson',
  onDelete: 'SET NULL'
});

EnrolledClients.belongsTo(User, { 
  foreignKey: 'Admin_id', 
  as: 'admin',
  onDelete: 'SET NULL'
});

EnrolledClients.belongsTo(User, { 
  foreignKey: 'createdBy', 
  as: 'creator',
  onDelete: 'SET NULL'
});

EnrolledClients.belongsTo(User, { 
  foreignKey: 'updatedBy', 
  as: 'updater',
  onDelete: 'SET NULL'
});

Lead.hasOne(EnrolledClients, { 
  foreignKey: 'lead_id', 
  as: 'enrolledClient'
});

Packages.hasMany(EnrolledClients, { 
  foreignKey: 'packageid', 
  as: 'enrolledClients'
});

User.hasMany(EnrolledClients, { 
  foreignKey: 'Sales_person_id', 
  as: 'salesEnrolledClients'
});

User.hasMany(EnrolledClients, { 
  foreignKey: 'Admin_id', 
  as: 'adminEnrolledClients'
});

User.hasMany(EnrolledClients, { 
  foreignKey: 'createdBy', 
  as: 'createdEnrolledClients'
});

User.hasMany(EnrolledClients, { 
  foreignKey: 'updatedBy', 
  as: 'updatedEnrolledClients'
});

// ClientAssignment associations
ClientAssignment.belongsTo(EnrolledClients, {
  foreignKey: 'clientId',
  as: 'enrolledClient',
  onDelete: 'CASCADE'
});

EnrolledClients.hasMany(ClientAssignment, {
  foreignKey: 'clientId',
  as: 'clientAssignments'
});

// User associations for ClientAssignment
ClientAssignment.belongsTo(User, {
  foreignKey: 'assignedToId',
  as: 'assignedTo',
  onDelete: 'RESTRICT'
});

ClientAssignment.belongsTo(User, {
  foreignKey: 'previousAssignedId',
  as: 'previousAssigned',
  onDelete: 'SET NULL'
});

ClientAssignment.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator',
  onDelete: 'RESTRICT'
});

ClientAssignment.belongsTo(User, {
  foreignKey: 'updatedBy',
  as: 'updater',
  onDelete: 'RESTRICT'
});

ClientAssignment.belongsTo(User, {
  foreignKey: 'reassignedBy',
  as: 'reassignedByUser',
  onDelete: 'SET NULL'
});

// User reverse associations for ClientAssignment
User.hasMany(ClientAssignment, {
  foreignKey: 'assignedToId',
  as: 'assignedClientAssignments'
});

User.hasMany(ClientAssignment, {
  foreignKey: 'previousAssignedId',
  as: 'previousClientAssignments'
});

User.hasMany(ClientAssignment, {
  foreignKey: 'createdBy',
  as: 'createdClientAssignments'
});

User.hasMany(ClientAssignment, {
  foreignKey: 'updatedBy',
  as: 'updatedClientAssignments'
});

User.hasMany(ClientAssignment, {
  foreignKey: 'reassignedBy',
  as: 'reassignedClientAssignments'
});

// Add active assignment association to EnrolledClients
EnrolledClients.hasOne(ClientAssignment, {
  foreignKey: 'clientId',
  as: 'activeAssignment',
  scope: {
    status: 'active'
  }
});

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

    
    // Create RolePermission table
    await RolePermission.sync({ alter: true });
    console.log('RolePermission table synced successfully');

    // Create AdminPermission table
    await AdminPermission.sync({ alter: true });
    console.log('AdminPermission table synced successfully');

    // Create Lead and ArchivedLead tables
    // Create SpecialUserPermission table
    await SpecialUserPermission.sync({ alter: true });
    console.log('SpecialUserPermission table synced successfully');

    // Create other tables
    await Lead.sync({ alter: true });
    console.log('Lead table synced successfully');

    await ArchivedLead.sync({ alter: true });
    console.log('ArchivedLead table synced successfully');

    // Create other tables
    await Packages.sync({ alter: true });
    console.log('Packages table synced successfully');

    await LeadAssignment.sync({ alter: true });
    console.log('LeadAssignment table synced successfully');

    await EnrolledClients.sync({ alter: true });
    console.log('EnrolledClients table synced successfully');

    await ClientAssignment.sync({ alter: true });
    console.log('ClientAssignment table synced successfully');

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
  RolePermission,
  AdminPermission,
  ArchivedLead,
  SpecialUserPermission,
  EnrolledClients,
  ClientAssignment
};
