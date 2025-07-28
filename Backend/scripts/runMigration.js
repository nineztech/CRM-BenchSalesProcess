import addNetAmountToInstallments from '../migrations/addNetAmountToInstallments.js';
import { sequelize } from '../config/dbConnection.js';

const runMigration = async () => {
  try {
    console.log('🔄 Starting migration...');
    await addNetAmountToInstallments();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration(); 