import { Lead, User, ArchivedLead } from '../models/index.js';
import { client, LEAD_INDEX, ARCHIVED_LEAD_INDEX, indexLead, indexArchivedLead, createArchivedLeadIndex } from '../config/elasticSearch.js';
import colors from 'colors';

export const reindexLeads = async () => {
  try {
    // First, check if the index exists
    const indexExists = await client.indices.exists({ index: LEAD_INDEX });
    
    // If it exists, delete it
    if (indexExists) {
      await client.indices.delete({ index: LEAD_INDEX });
    }

    // Check if archived leads index exists
    const archivedIndexExists = await client.indices.exists({ index: ARCHIVED_LEAD_INDEX });
    
    // If it exists, delete it
    if (archivedIndexExists) {
      await client.indices.delete({ index: ARCHIVED_LEAD_INDEX });
    }

    // Recreate the index with proper mappings
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
    await createArchivedLeadIndex();

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
      ]
    });

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

    // Index each lead
    let successCount = 0;
    let errorCount = 0;

    for (const lead of leads) {
      try {
        const leadData = lead.toJSON();
        
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
      } catch (error) {
        errorCount++;
      }
    }

    // Index each archived lead
    for (const archivedLead of archivedLeads) {
      try {
        const archivedLeadData = archivedLead.toJSON();
        
        await indexArchivedLead(archivedLeadData);
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

  } catch (error) {
    // Error handling without console output
  }
};

// Run the reindexing
reindexLeads(); 