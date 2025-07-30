import { Lead, User, ArchivedLead } from '../models/index.js';
import { client, LEAD_INDEX, ARCHIVED_LEAD_INDEX, indexLead, indexArchivedLead, createArchivedLeadIndex } from '../config/elasticSearch.js';
import colors from 'colors';

export const reindexLeads = async () => {
  try {
    console.log('Starting reindex process...');
    
    // First, let's check what indices exist and delete any leads-related indices
    try {
      const indices = await client.cat.indices({ format: 'json' });
      console.log('Existing indices:', indices.map(idx => idx.index));
      
      // Delete any indices that start with 'leads'
      for (const index of indices) {
        if (index.index.startsWith('leads')) {
          console.log(`Deleting index: ${index.index}`);
          await client.indices.delete({ 
            index: index.index, 
            ignore_unavailable: true 
          });
        }
      }
    } catch (error) {
      console.log('Error checking/deleting indices:', error.message);
    }

    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Recreate the index with proper mappings
    console.log('Creating new lead index...');
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
            },
            creator: {
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
            },
            updater: {
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

    // Create archived leads index
    console.log('Creating archived lead index...');
    await createArchivedLeadIndex();

    // Get total count of leads first
    const totalLeads = await Lead.count();
    console.log(`Total leads in database: ${totalLeads}`);

    // Get all leads with their assigned users, creators, and updaters
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
      ],
      // Ensure we get all records
      where: {},
      limit: null,
      offset: null
    });

    console.log(`Retrieved ${leads.length} leads from database`);

    // Check for leads with specific dates (July 1st)
    const julyFirstLeads = leads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return createdAt.getDate() === 1 && createdAt.getMonth() === 6; // July is month 6 (0-indexed)
    });
    console.log(`Found ${julyFirstLeads.length} leads created on July 1st`);

    // Get all archived leads with their assigned users
    const archivedLeads = await ArchivedLead.findAll({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    console.log(`Retrieved ${archivedLeads.length} archived leads from database`);

    // Index each lead
    let successCount = 0;
    let errorCount = 0;

    console.log('Starting to index leads...');
    for (const lead of leads) {
      try {
        const leadData = lead.toJSON();
        
        // Ensure we have valid data
        if (!leadData.id) {
          console.error('Lead missing ID:', leadData);
          errorCount++;
          continue;
        }
        
        // Determine the status group
        let statusGroup = 'open';
        if (leadData.status) {
          if (leadData.status === 'Enrolled') {
            statusGroup = 'Enrolled';
          } else if (['Dead', 'notinterested'].includes(leadData.status)) {
            statusGroup = 'archived';
          } else if (['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'].includes(leadData.status)) {
            statusGroup = 'inProcess';
          }
        }

        // Check if lead is in team followup
        const isTeamFollowup = leadData.is_Team_Followup === true || leadData.is_team_followup === true;

        // Add status group and team followup flag to lead data
        const enrichedLeadData = {
          ...leadData,
          statusGroup: statusGroup.toLowerCase(), // ensure lowercase for consistency
          is_Team_Followup: isTeamFollowup // ensure consistent field name
        };
        
        await indexLead(enrichedLeadData);
        successCount++;
        
        // Log progress every 50 leads
        if (successCount % 50 === 0) {
          console.log(`Indexed ${successCount} leads so far...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error indexing lead ${lead.id}:`, error.message);
      }
    }

    console.log(`Successfully indexed ${successCount} leads`);
    if (errorCount > 0) {
      console.log(`Failed to index ${errorCount} leads`);
    }

    // Index each archived lead
    console.log('Starting to index archived leads...');
    for (const archivedLead of archivedLeads) {
      try {
        const archivedLeadData = archivedLead.toJSON();
        
        await indexArchivedLead(archivedLeadData);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error indexing archived lead ${archivedLead.id}:`, error.message);
      }
    }

    console.log(`Total indexed: ${successCount} leads, Errors: ${errorCount}`);
    
    // Verify the indexing by checking the index count
    try {
      const indexStats = await client.indices.stats({ index: LEAD_INDEX });
      const documentCount = indexStats.body.indices[LEAD_INDEX].total.docs.count;
      console.log(`Elasticsearch index contains ${documentCount} documents`);
      
      if (documentCount !== successCount) {
        console.warn(`Warning: Indexed ${successCount} leads but Elasticsearch shows ${documentCount} documents`);
      }
    } catch (verifyError) {
      console.error('Error verifying index count:', verifyError.message);
    }
    
    console.log('Reindex process completed successfully!');

  } catch (error) {
    console.error('Error during reindex process:', error);
  }
};

// Run the reindexing
reindexLeads(); 
