import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const tableName = 'ArchivedLeads';

export const up = async () => {
  await sequelize.query(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN archiveReason VARCHAR(255) NOT NULL;
  `);
};

export const down = async () => {
  await sequelize.query(`
    ALTER TABLE ${tableName}
    MODIFY COLUMN archiveReason ENUM('Dead', 'notinterested') NOT NULL;
  `);
};

// Run the migration
up().then(() => {
  console.log('Migration: archiveReason column type updated successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
}); 