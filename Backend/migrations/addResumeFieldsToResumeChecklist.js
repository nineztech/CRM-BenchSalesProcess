import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Add resume field
  await queryInterface.addColumn('resume_checklists', 'resume', {
    type: DataTypes.STRING,
    allowNull: true
  });
  
  // Add isResumeUpdated field
  await queryInterface.addColumn('resume_checklists', 'isResumeUpdated', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });
};

export const down = async (queryInterface, Sequelize) => {
  // Remove the added columns
  await queryInterface.removeColumn('resume_checklists', 'resume');
  await queryInterface.removeColumn('resume_checklists', 'isResumeUpdated');
};
