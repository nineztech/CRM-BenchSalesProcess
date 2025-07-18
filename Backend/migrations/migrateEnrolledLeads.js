import { sequelize } from '../config/dbConnection.js';
import Lead from '../models/leadModel.js';
import EnrolledClients from '../models/enrolledClientsModel.js';

const migrateEnrolledLeads = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Starting migration of enrolled leads...');
    
    // Find all leads with status "Enrolled"
    const enrolledLeads = await Lead.findAll({
      where: {
        status: 'Enrolled'
      },
      attributes: ['id', 'createdBy', 'createdAt'],
      transaction
    });

    console.log(`📊 Found ${enrolledLeads.length} enrolled leads to migrate`);

    if (enrolledLeads.length === 0) {
      console.log('✅ No enrolled leads found to migrate');
      await transaction.commit();
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const lead of enrolledLeads) {
      try {
        // Check if enrolled client already exists for this lead
        const existingEnrolledClient = await EnrolledClients.findOne({
          where: { lead_id: lead.id },
          transaction
        });

        if (existingEnrolledClient) {
          console.log(`⚠️  Skipping lead ${lead.id} - already exists in enrolledclients`);
          skippedCount++;
          continue;
        }

        // Create enrolled client record with only lead_id and createdBy
        await EnrolledClients.create({
          lead_id: lead.id,
          createdBy: lead.createdBy || null,
          createdAt: lead.createdAt || new Date(),
          updatedAt: new Date()
        }, { transaction });

        migratedCount++;
        console.log(`✅ Migrated lead ${lead.id} to enrolledclients`);

      } catch (error) {
        console.error(`❌ Error migrating lead ${lead.id}:`, error.message);
        // Continue with next lead instead of failing entire migration
      }
    }

    await transaction.commit();
    
    console.log('🎉 Migration completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - Total enrolled leads found: ${enrolledLeads.length}`);
    console.log(`   - Successfully migrated: ${migratedCount}`);
    console.log(`   - Skipped (already exists): ${skippedCount}`);
    console.log(`   - Failed: ${enrolledLeads.length - migratedCount - skippedCount}`);

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Export the migration function
export default migrateEnrolledLeads;

// If this file is run directly, execute the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEnrolledLeads()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
} 