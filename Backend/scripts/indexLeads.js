import { indexLead } from '../config/elasticSearch.js';
import Lead from '../models/leadModel.js';
import User from '../models/userModel.js';
import colors from 'colors';
import dotenv from 'dotenv';

dotenv.config();

const indexExistingLeads = async () => {
  try {
    console.log(colors.yellow('🔄 Starting to index existing leads...'));

    // Get all leads with their assigned users
    const leads = await Lead.findAll({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    console.log(colors.blue(`📊 Found ${leads.length} leads to index`));

    // Index each lead
    for (const lead of leads) {
      try {
        await indexLead(lead.toJSON());
        console.log(colors.green(`✅ Indexed lead ${lead.id}`));
      } catch (error) {
        console.error(colors.red(`❌ Error indexing lead ${lead.id}:`), error);
      }
    }

    console.log(colors.green('✅ Finished indexing all leads'));
    process.exit(0);
  } catch (error) {
    console.error(colors.red('❌ Error during indexing:'), error);
    process.exit(1);
  }
};

indexExistingLeads(); 