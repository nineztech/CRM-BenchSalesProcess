import { Lead, User } from '../models/index.js';
import { client, LEAD_INDEX, indexLead } from '../config/elasticSearch.js';
import colors from 'colors';

const reindexLeads = async () => {
  try {
    console.log(colors.yellow('🔄 Starting to reindex all leads...'));

    // First, check if the index exists
    const indexExists = await client.indices.exists({ index: LEAD_INDEX });
    
    // If it exists, delete it
    if (indexExists) {
      console.log(colors.blue('📦 Deleting existing index...'));
      await client.indices.delete({ index: LEAD_INDEX });
    }

    // Recreate the index with proper mappings
    console.log(colors.blue('📦 Creating new index with mappings...'));
    await client.indices.create({
      index: LEAD_INDEX,
      body: {
        settings: {
          "index.max_ngram_diff": 19,
          analysis: {
            analyzer: {
              text_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "ngram_filter"]
              },
              search_analyzer: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase"]
              },
              phone_analyzer: {
                type: "custom",
                tokenizer: "ngram",
                filter: ["lowercase"],
                char_filter: ["digit_only"]
              }
            },
            char_filter: {
              digit_only: {
                type: "pattern_replace",
                pattern: "[^0-9]",
                replacement: ""
              }
            },
            filter: {
              ngram_filter: {
                type: "ngram",
                min_gram: 1,
                max_gram: 20
              }
            }
          }
        },
        mappings: {
                      properties: {
              id: { type: 'integer' },
              is_Team_Followup: { type: 'boolean' },
              followUpDateTime: { type: 'date' },
              firstName: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              lastName: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              contactNumbers: { 
                type: 'keyword'
              },
              processedContactNumbers: {
                type: 'text',
                analyzer: 'phone_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              emails: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              primaryEmail: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              technology: { type: 'keyword' },
              country: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              countryCode: { type: 'keyword' },
              visaStatus: { type: 'keyword' },
              status: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              statusGroup: { 
                type: 'text',
                analyzer: 'text_analyzer',
                search_analyzer: 'search_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
            leadSource: { type: 'keyword' },
            assignTo: { type: 'integer' },
            assignedUser: {
              properties: {
                id: { type: 'integer' },
                firstname: { 
                  type: 'text',
                  analyzer: 'text_analyzer',
                  search_analyzer: 'search_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                lastname: { 
                  type: 'text',
                  analyzer: 'text_analyzer',
                  search_analyzer: 'search_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                email: { 
                  type: 'text',
                  analyzer: 'text_analyzer',
                  search_analyzer: 'search_analyzer',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                }
              }
            }
          }
        }
      }
    });

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

    console.log(colors.blue(`📊 Found ${leads.length} leads to reindex`));

    // Index each lead
    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      try {
        const leadData = lead.toJSON();
        
        // Determine the status group
        let statusGroup = 'open';
        if (leadData.status) {
          if (leadData.status === 'closed') {
            statusGroup = 'converted';
          } else if (['Dead', 'notinterested'].includes(leadData.status)) {
            statusGroup = 'archived';
          } else if (['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'].includes(leadData.status)) {
            statusGroup = 'inProcess';
          }
        }

        // Add status group to lead data
        const enrichedLeadData = {
          ...leadData,
          statusGroup: statusGroup.toLowerCase() // ensure lowercase for consistency
        };

        console.log(colors.yellow(`📝 Indexing lead ${lead.id} with status: ${leadData.status}, statusGroup: ${statusGroup}`));
        
        await indexLead(enrichedLeadData);
        successCount++;
        process.stdout.write(`\r${colors.green('✅ Progress:')} ${successCount}/${leads.length} leads indexed`);
      } catch (error) {
        errorCount++;
        console.error(colors.red(`\n❌ Error indexing lead ${lead.id}:`), error);
      }
    }

    console.log(colors.green(`\n\n✅ Reindexing completed:`));
    console.log(colors.blue(`📊 Total leads: ${leads.length}`));
    console.log(colors.green(`✅ Successfully indexed: ${successCount}`));
    console.log(colors.red(`❌ Failed to index: ${errorCount}`));

    process.exit(0);
  } catch (error) {
    console.error(colors.red('❌ Error during reindexing:'), error);
    process.exit(1);
  }
};

// Run the reindexing
reindexLeads(); 