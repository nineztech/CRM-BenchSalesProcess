import { up as addResumeFieldsToResumeChecklist } from '../migrations/addResumeFieldsToResumeChecklist.js';
import { sequelize } from '../config/dbConnection.js';

const runMigration = async () => {
  try {
    console.log('🔄 Starting migration...');
    
    // Run new resume fields migration
    console.log('🔄 Adding resume fields to resume checklist...');
    await addResumeFieldsToResumeChecklist(sequelize.getQueryInterface(), sequelize.constructor);
    
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration(); 