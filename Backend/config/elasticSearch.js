import { Client } from '@elastic/elasticsearch';

// Create Elasticsearch client with optimized configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: false,
  ssl: {
    rejectUnauthorized: false
  },
  // Performance optimizations
  compression: true,
  keepAlive: true,
  maxSockets: 10,
  minSockets: 2
});

// Define lead index mapping
const LEAD_INDEX = 'leads';
const ARCHIVED_LEAD_INDEX = 'archived_leads';

// Create lead index with mapping
const createLeadIndex = async () => {
  try {
    // First check if Elasticsearch is available
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    const indexExists = await client.indices.exists({ index: LEAD_INDEX });
    if (!indexExists) {
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
    }

    // Also create archived leads index
    await createArchivedLeadIndex();
  } catch (error) {
    // Error handling without console output
  }
};

// Create archived lead index with mapping
const createArchivedLeadIndex = async () => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    const indexExists = await client.indices.exists({ index: ARCHIVED_LEAD_INDEX });
    if (!indexExists) {
      await client.indices.create({
        index: ARCHIVED_LEAD_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'integer' },
              originalLeadId: { type: 'integer' },
              firstName: { type: 'text' },
              lastName: { type: 'text' },
              contactNumbers: { type: 'keyword' },
              emails: { type: 'keyword' },
              primaryEmail: { type: 'keyword' },
              primaryContact: { type: 'keyword' },
              technology: { type: 'keyword' },
              country: { type: 'keyword' },
              countryCode: { type: 'keyword' },
              visaStatus: { type: 'keyword' },
              status: { type: 'keyword' },
              leadstatus: { type: 'keyword' },
              archiveReason: { type: 'keyword' },
              leadSource: { type: 'keyword' },
              assignTo: { type: 'integer' },
              archivedAt: { type: 'date' },
              assignedUser: {
                properties: {
                  id: { type: 'integer' },
                  firstname: { type: 'text' },
                  lastname: { type: 'text' },
                  email: { type: 'keyword' }
                }
              }
            }
          }
        }
      });
    }
  } catch (error) {
    // Error handling without console output
  }
};

// Check if Elasticsearch is available
const checkElasticsearchConnection = async () => {
  try {
    await client.ping();
    return true;
  } catch (error) {
    return false;
  }
};

// Function to process phone numbers - remove country code and special characters
const processPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove any special characters first
  const cleanNumber = phone.replace(/[^\d+]/g, '');
  
  // If starts with +, remove the + and check for country code
  if (cleanNumber.startsWith('+')) {
    // Get first 3 characters after + to check for country code
    const firstThree = cleanNumber.substring(1, 4);
    
    // Common 3-digit country codes
    if (['256', '255', '254', '971', '966', '852'].includes(firstThree)) {
      return cleanNumber.substring(4);
    }
    
    // Common 2-digit country codes
    const firstTwo = cleanNumber.substring(1, 3);
    if (['91', '86', '44', '61', '49', '81', '82', '33', '34', '39'].includes(firstTwo)) {
      return cleanNumber.substring(3);
    }
    
    // Common 1-digit country codes
    const firstOne = cleanNumber.substring(1, 2);
    if (['1', '7'].includes(firstOne)) {
      return cleanNumber.substring(2);
    }
    
    // If no known country code, return as is
    return cleanNumber.substring(1);
  }
  
  // If no +, check for country code without +
  const firstThree = cleanNumber.substring(0, 3);
  if (['256', '255', '254', '971', '966', '852'].includes(firstThree)) {
    return cleanNumber.substring(3);
  }
  
  const firstTwo = cleanNumber.substring(0, 2);
  if (['91', '86', '44', '61', '49', '81', '82', '33', '34', '39'].includes(firstTwo)) {
    return cleanNumber.substring(2);
  }
  
  const firstOne = cleanNumber.substring(0, 1);
  if (['1', '7'].includes(firstOne)) {
    return cleanNumber.substring(1);
  }
  
  // If no country code detected, return as is
  return cleanNumber;
};

// Function to index a lead
const indexLead = async (lead) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    // Process contact numbers to create searchable versions without country codes
    const processedContactNumbers = Array.isArray(lead.contactNumbers) 
      ? lead.contactNumbers.map(processPhoneNumber)
      : [];

    // Add the processed numbers to the lead object
    const leadToIndex = {
      ...lead,
      processedContactNumbers,
      // Keep original contact numbers as well
      contactNumbers: Array.isArray(lead.contactNumbers) ? lead.contactNumbers : []
    };

    await client.index({
      index: LEAD_INDEX,
      id: lead.id.toString(),
      body: leadToIndex
    });
  } catch (error) {
    throw error;
  }
};

// Function to update indexed lead
const updateLead = async (lead) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) return;

    await client.update({
      index: LEAD_INDEX,
      id: lead.id.toString(),
      body: {
        doc: {
          ...lead,
          statusGroup: getStatusGroup(lead)
        }
      }
    });
  } catch (error) {
    // Error handling without console output
  }
};

// Function to delete indexed lead
const deleteLead = async (leadId) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) return;

    await client.delete({
      index: LEAD_INDEX,
      id: leadId.toString()
    });
  } catch (error) {
    // Error handling without console output
  }
};

// Helper function to determine status group
const getStatusGroup = (lead) => {
  if (!lead.status) return 'open';

  // Check if lead is within 24 hours of follow-up
  if (lead.followUpDateTime) {
    const now = new Date();
    const timeDiff = new Date(lead.followUpDateTime).getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 0 && hoursDiff <= 24) {
      return 'followUp';
    }
  }

  const statusGroups = {
    open: ['open'],
    Enrolled: ['Enrolled'],
    archived: ['Dead', 'notinterested'],
    inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later']
  };

  for (const [group, statuses] of Object.entries(statusGroups)) {
    if (statuses.includes(lead.status)) {
      return group;
    }
  }

  return 'open';
};

// Function to search leads
const searchLeads = async (query, statusGroup, page = 1, limit = 10, statusFilter, salesFilter, createdByFilter) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return {
        total: 0,
        leads: []
      };
    }

    const offset = (page - 1) * limit;

    // Process the search query if it looks like a phone number
    const processedQuery = query.match(/^\+?\d+$/) ? processPhoneNumber(query) : query;

    // Build efficient search query using multi_match instead of multiple wildcards
    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: processedQuery,
              type: "best_fields",
              fields: [
                "firstName^3",
                "lastName^3", 
                "assignedUser.firstname^2",
                "assignedUser.lastname^2",
                "creator.firstname^2",
                "creator.lastname^2",
                "updater.firstname^2",
                "updater.lastname^2",
                "country^2",
                "status^2",
                "emails",
                "primaryEmail",
                "processedContactNumbers^2"
              ],
              fuzziness: "AUTO",
              operator: "or"
            }
          }
        ]
      }
    };

    // Add status group filter if provided
    if (statusGroup) {
      const now = new Date();

      // Define conditions based on status group
      switch(statusGroup.toLowerCase()) {
        case 'teamfollowup':
          searchQuery.bool.must.push({
            term: { "is_Team_Followup": true }
          });
          searchQuery.bool.must.push({
            bool: {
              must_not: {
                terms: { "status.keyword": ["Dead", "notinterested", "Enrolled", "open"] }
              }
            }
          });
          break;

        case 'followup':
          searchQuery.bool.must.push({
            bool: {
              must: [
                {
                  exists: { field: "followUpDateTime" }
                },
                {
                  range: {
                    followUpDateTime: {
                      lte: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
                    }
                  }
                },
                {
                  bool: {
                    must_not: {
                      terms: { "status.keyword": ["Dead", "notinterested", "Enrolled", "open"] }
                    }
                  }
                }
              ]
            }
          });
          break;

        case 'inprocess':
          // For inProcess tab, we want leads that are in inProcess statuses
          const inProcessStatuses = ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'];
          
          // Simplified and optimized inProcess query
          searchQuery.bool.must.push({
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      {
                        bool: {
                          must: [
                            { exists: { field: "followUpDateTime" } },
                            {
                              range: {
                                followUpDateTime: {
                                  gt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
                                }
                              }
                            }
                          ]
                        }
                      },
                      { bool: { must_not: { exists: { field: "followUpDateTime" } } } }
                    ],
                    minimum_should_match: 1
                  }
                },
                {
                  bool: {
                    must_not: {
                      terms: { "status.keyword": ["Dead", "notinterested", "Enrolled", "Team Followup", "open"] }
                    }
                  }
                },
                { bool: { must_not: { term: { "is_Team_Followup": true } } } }
              ]
            }
          });
          break;

        case 'open':
          searchQuery.bool.must.push({
            term: { "status.keyword": "open" }
          });
          break;

        case 'Enrolled':
          searchQuery.bool.must.push({
            term: { "status.keyword": "Enrolled" }
          });
          break;

        case 'archived':
          searchQuery.bool.must.push({
            terms: { "status.keyword": ["Dead", "notinterested"] }
          });
          break;
      }
    }

    // Add additional filters if provided - use efficient term queries
    if (statusFilter) {
      searchQuery.bool.must.push({
        term: { "status.keyword": statusFilter }
      });
    }

    if (salesFilter) {
      const nameParts = salesFilter.trim().split(' ');
      const firstName = nameParts[0]?.toLowerCase();
      const lastName = nameParts[1]?.toLowerCase();
      
      const salesFilterQuery = {
        bool: {
          should: [
            {
              match: { "assignedUser.firstname": firstName }
            },
            {
              match: { "assignedUser.lastname": lastName || firstName }
            }
          ],
          minimum_should_match: 1
        }
      };
      
      searchQuery.bool.must.push(salesFilterQuery);
    }

    if (createdByFilter) {
      const nameParts = createdByFilter.trim().split(' ');
      const firstName = nameParts[0]?.toLowerCase();
      const lastName = nameParts[1]?.toLowerCase();
      
      const createdByFilterQuery = {
        bool: {
          should: [
            {
              match: { "creator.firstname": firstName }
            },
            {
              match: { "creator.lastname": lastName || firstName }
            }
          ],
          minimum_should_match: 1
        }
      };
      
      searchQuery.bool.must.push(createdByFilterQuery);
    }

    const response = await client.search({
      index: LEAD_INDEX,
      body: {
        from: offset,
        size: limit,
        query: searchQuery,
        sort: [
          { _score: 'desc' },
          { id: 'desc' }
        ],
        // Performance optimizations
        _source: {
          excludes: ['processedContactNumbers'] // Exclude large fields from response
        },
        timeout: '30s'
      }
    });

    return {
      total: response.hits.total.value,
      leads: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }))
    };
  } catch (error) {
    return {
      total: 0,
      leads: []
    };
  }
};

// Function to index an archived lead
const indexArchivedLead = async (archivedLead) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    // Process contact numbers to create searchable versions without country codes
    const processedContactNumbers = Array.isArray(archivedLead.contactNumbers) 
      ? archivedLead.contactNumbers.map(processPhoneNumber)
      : [];

    // Add the processed numbers to the archived lead object
    const archivedLeadToIndex = {
      ...archivedLead,
      processedContactNumbers,
      // Keep original contact numbers as well
      contactNumbers: Array.isArray(archivedLead.contactNumbers) ? archivedLead.contactNumbers : []
    };

    await client.index({
      index: ARCHIVED_LEAD_INDEX,
      id: archivedLead.id.toString(),
      body: archivedLeadToIndex
    });
  } catch (error) {
    throw error;
  }
};

// Function to update indexed archived lead
const updateArchivedLead = async (archivedLead) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) return;

    await client.update({
      index: ARCHIVED_LEAD_INDEX,
      id: archivedLead.id.toString(),
      body: {
        doc: archivedLead
      }
    });
  } catch (error) {
    // Error handling without console output
  }
};

// Function to delete indexed archived lead
const deleteArchivedLead = async (archivedLeadId) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) return;

    await client.delete({
      index: ARCHIVED_LEAD_INDEX,
      id: archivedLeadId.toString()
    });
  } catch (error) {
    // Error handling without console output
  }
};

// Function to search archived leads
const searchArchivedLeads = async (query, page = 1, limit = 10) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return {
        total: 0,
        leads: []
      };
    }

    const offset = (page - 1) * limit;

    // Process the search query if it looks like a phone number
    const processedQuery = query.match(/^\+?\d+$/) ? processPhoneNumber(query) : query;

    const searchQuery = {
      bool: {
        must: [
          {
            bool: {
              should: [
                {
                  bool: {
                    should: [
                      {
                        wildcard: {
                          "firstName": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 3
                          }
                        }
                      },
                      {
                        wildcard: {
                          "lastName": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 3
                          }
                        }
                      },
                      {
                        wildcard: {
                          "assignedUser.firstname": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      },
                      {
                        wildcard: {
                          "assignedUser.lastname": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      },
                      {
                        wildcard: {
                          "country": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      },
                      {
                        wildcard: {
                          "leadstatus": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      },
                      {
                        wildcard: {
                          "archiveReason": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      },
                      {
                        wildcard: {
                          "leadSource": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 2
                          }
                        }
                      }
                    ]
                  }
                },
                {
                  bool: {
                    should: [
                      {
                        wildcard: {
                          "emails": {
                            value: `*${processedQuery.toLowerCase()}*`
                          }
                        }
                      },
                      {
                        wildcard: {
                          "primaryEmail": {
                            value: `*${processedQuery.toLowerCase()}*`
                          }
                        }
                      }
                    ]
                  }
                },
                {
                  wildcard: {
                    "processedContactNumbers": {
                      value: `*${processedQuery}*`,
                      boost: 2
                    }
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
        ]
      }
    };

    const response = await client.search({
      index: ARCHIVED_LEAD_INDEX,
      body: {
        from: offset,
        size: limit,
        query: searchQuery,
        sort: [
          { _score: 'desc' },
          { archivedAt: 'desc' }
        ]
      }
    });

    return {
      total: response.hits.total.value,
      leads: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }))
    };
  } catch (error) {
    return {
      total: 0,
      leads: []
    };
  }
};

export {
  client,
  LEAD_INDEX,
  ARCHIVED_LEAD_INDEX,
  createLeadIndex,
  createArchivedLeadIndex,
  indexLead,
  updateLead,
  deleteLead,
  searchLeads,
  indexArchivedLead,
  updateArchivedLead,
  deleteArchivedLead,
  searchArchivedLeads
}; 