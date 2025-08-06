import { Lead, User, ArchivedLead } from '../models/index.js';
import { client, LEAD_INDEX, ARCHIVED_LEAD_INDEX, indexLead, indexArchivedLead, createArchivedLeadIndex, indexEnrolledClient } from '../config/elasticSearch.js';
import colors from 'colors';
import EnrolledClients from '../models/enrolledClientsModel.js';
import Packages from '../models/packagesModel.js';

export const reindexLeads = async () => {
  try {
    console.log('Starting lead reindexing...');
    
    const leads = await Lead.findAll({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    console.log(`Found ${leads.length} leads to reindex`);

    // Check if Elasticsearch is available before proceeding
    const { checkElasticsearchConnection } = await import('../config/elasticSearch.js');
    const isElasticsearchAvailable = await checkElasticsearchConnection();
    
    if (!isElasticsearchAvailable) {
      console.log('⚠️ Elasticsearch is not available. Skipping lead reindexing.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      try {
        // Convert Sequelize model to plain object to avoid circular references
        const plainLead = lead.get({ plain: true });
        await indexLead(plainLead);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error indexing lead ${lead.id}:`, error.message);
      }
    }

    console.log(`Lead reindexing completed: ${successCount} successful, ${errorCount} errors`);
  } catch (error) {
    console.error('Error in reindexLeads:', error.message);
  }
};

export const reindexEnrolledClients = async () => {
  try {
    console.log('Starting enrolled clients reindexing...');
    
    const enrolledClients = await EnrolledClients.findAll({
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'firstName', 'lastName', 'primaryEmail', 'primaryContact', 'status', 'technology', 'country', 'visaStatus', 'contactNumbers', 'leadSource'],
          where: { status: 'Enrolled' }
        },
        {
          model: User,
          as: 'salesPerson',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'admin',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: Packages,
          as: 'package',
          attributes: ['id', 'planName', 'enrollmentCharge', 'offerLetterCharge', 'firstYearSalaryPercentage', 'firstYearFixedPrice', 'features']
        },
        {
          model: User,
          as: 'assignedMarketingTeam',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    console.log(`Found ${enrolledClients.length} enrolled clients to reindex`);

    // Check if Elasticsearch is available before proceeding
    const { checkElasticsearchConnection } = await import('../config/elasticSearch.js');
    const isElasticsearchAvailable = await checkElasticsearchConnection();
    
    if (!isElasticsearchAvailable) {
      console.log('⚠️ Elasticsearch is not available. Skipping enrolled clients reindexing.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const enrolledClient of enrolledClients) {
      try {
        // Convert Sequelize model to plain object to avoid circular references
        const plainEnrolledClient = enrolledClient.get({ plain: true });
        await indexEnrolledClient(plainEnrolledClient);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error indexing enrolled client ${enrolledClient.id}:`, error.message);
      }
    }

    console.log(`Enrolled clients reindexing completed: ${successCount} successful, ${errorCount} errors`);
  } catch (error) {
    console.error('Error in reindexEnrolledClients:', error.message);
  }
};

// Run the reindexing
// reindexLeads();
// reindexEnrolledClients(); 
