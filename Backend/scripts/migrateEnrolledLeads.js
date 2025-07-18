import { connectDB } from '../config/dbConnection.js';
import migrateEnrolledLeads from '../migrations/migrateEnrolledLeads.js';
import colors from 'colors';

console.log(colors.cyan('🔄 Starting Enrolled Leads Migration Script...'));

// Connect to database and run migration
connectDB()
  .then(() => {
    console.log(colors.green('✅ Database connected successfully!'));
    return migrateEnrolledLeads();
  })
  .then(() => {
    console.log(colors.green('🎉 Migration completed successfully!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(colors.red('❌ Migration failed:'), error);
    process.exit(1);
  }); 