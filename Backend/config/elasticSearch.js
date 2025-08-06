import { Client } from '@elastic/elasticsearch';

// Create Elasticsearch client with retry configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: false,
  ssl: {
    rejectUnauthorized: false
  }
});

// Define lead index mapping
const LEAD_INDEX = 'leads';
const ARCHIVED_LEAD_INDEX = 'archived_leads';
const ENROLLED_CLIENTS_INDEX = 'enrolled_clients';

// Create lead index with mapping
const createLeadIndex = async () => {
  try {
    // First check if Elasticsearch is available
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    const indexExists = await client.indices.exists({ index: LEAD_INDEX });
    if (indexExists) {
      // Delete existing index to recreate with new mapping
      await client.indices.delete({ index: LEAD_INDEX });
      console.log('Deleted existing index to recreate with new mapping');
    }
    
    await client.indices.create({
      index: LEAD_INDEX,
      body: {
        mappings: {
          properties: {
            id: { type: 'integer' },
            is_Team_Followup: { type: 'boolean' },
            firstName: { type: 'text' },
            lastName: { type: 'text' },
            contactNumbers: { type: 'keyword' },
            emails: { type: 'keyword' },
            primaryEmail: { type: 'keyword' },
            technology: { type: 'keyword' },
            country: { type: 'keyword' },
            countryCode: { type: 'keyword' },
            visaStatus: { type: 'keyword' },
            status: { type: 'keyword' },
            statusGroup: { type: 'keyword' },
            leadSource: { 
              type: 'text',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            assignTo: { type: 'integer' },
            assignedUser: {
              properties: {
                id: { type: 'integer' },
                firstname: { type: 'text' },
                lastname: { type: 'text' },
                email: { type: 'keyword' }
              }
            },
            creator: {
              properties: {
                id: { type: 'integer' },
                firstname: { type: 'text' },
                lastname: { type: 'text' },
                email: { type: 'keyword' }
              }
            },
            updater: {
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
              leadSource: { 
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
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

     // Ensure lead has required fields
     if (!lead || !lead.id) {
       return;
     }

     // Check if the index exists, if not, create it
     const indexExists = await client.indices.exists({ index: LEAD_INDEX });
     if (!indexExists) {
       await createLeadIndex();
       // Wait a moment for the index to be ready
       await new Promise(resolve => setTimeout(resolve, 1000));
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

     // Remove any circular references by stringifying and parsing
     const sanitizedLead = JSON.parse(JSON.stringify(leadToIndex));

         await client.index({
       index: LEAD_INDEX,
       id: lead.id.toString(),
       body: sanitizedLead,
       refresh: true
     });
  } catch (error) {
    console.error(`Error indexing lead ${lead?.id}:`, error.message);
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

    const searchQuery = {
      bool: {
        must: [
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
                    "creator.firstname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "creator.lastname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "updater.firstname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "updater.lastname": {
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
                    "status": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
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
                },
                {
                  wildcard: {
                    "leadSource": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "leadSource.keyword": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 3
                    }
                  }
                },
                {
                  wildcard: {
                    "leadSource": {
                      value: `*${processedQuery}*`,
                      boost: 1
                    }
                  }
                },
                {
                  term: {
                    "leadSource.keyword": {
                      value: processedQuery,
                      boost: 4
                    }
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
                terms: { "status": ["Dead", "notinterested", "Enrolled", "open"] }
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
                      terms: { "status": ["Dead", "notinterested", "Enrolled", "open","teamfollowup"] }
                    }
                  }
                  
                },
                 {
                  bool: {
                    must_not: {
                      term: { "is_Team_Followup": true }
                    }
                  }
                }
                
              ]
            }
          });
          break;

        case 'inprocess':
          // For inProcess tab, we want leads that are in inProcess statuses
          // Always apply timer conditions for inProcess tab, regardless of status filter
          const inProcessStatuses = ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'];
          
          // Always apply timer conditions for inProcess tab
          // Include leads that either have a future followUpDateTime OR no followUpDateTime at all
          // Exclude leads with past due timers (they should be in followup tab)
          searchQuery.bool.must.push({
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      {
                        bool: {
                          must: [
                            {
                              exists: { field: "followUpDateTime" }
                            },
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
                      {
                        bool: {
                          must_not: {
                            exists: { field: "followUpDateTime" }
                          }
                        }
                      }
                    ],
                    minimum_should_match: 1
                  }
                },
                {
                  bool: {
                    must_not: {
                      terms: { "status": ["Dead", "notinterested", "Enrolled","Team Followup", "open"] }
                    }
                  }
                },
                {
                  bool: {
                    must_not: {
                      term: { "is_Team_Followup": true }
                    }
                  }
                }
              ]
            }
          });
          
          if (statusFilter) {
            // If status filter is provided, log it but the timer conditions are already applied above
            if (inProcessStatuses.includes(statusFilter)) {
              // Status filter provided for inProcess tab, timer conditions still enforced
            }
          }
          break;

        case 'open':
          searchQuery.bool.must.push({
            term: { "status": "open" }
          });
          break;

        case 'Enrolled':
          searchQuery.bool.must.push({
            term: { "status": "Enrolled" }
          },
        );
          break;

        case 'archived':
          searchQuery.bool.must.push({
            terms: { "status": ["Dead", "notinterested"] }
          });
          break;
      }
    }

    // Add additional filters if provided
    if (statusFilter) {
      searchQuery.bool.must.push({
        wildcard: { "status": `*${statusFilter.toLowerCase()}*` }
      });
    }

    if (salesFilter) {
      const nameParts = salesFilter.trim().split(' ');
      const firstName = nameParts[0]?.toLowerCase();
      const lastName = nameParts[1]?.toLowerCase();
      
      const salesFilterQuery = {
        bool: {
          should: [
            // Match full name in firstname field
            {
              wildcard: { "assignedUser.firstname": `*${firstName}*` }
            },
            // Match full name in lastname field
            {
              wildcard: { "assignedUser.lastname": `*${lastName || firstName}*` }
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
            // Match full name in firstname field
            {
              wildcard: { "creator.firstname": `*${firstName}*` }
            },
            // Match full name in lastname field
            {
              wildcard: { "creator.lastname": `*${lastName || firstName}*` }
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
      body: archivedLeadToIndex,
      refresh: true
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
                      },
                      {
                        wildcard: {
                          "leadSource.keyword": {
                            value: `*${processedQuery.toLowerCase()}*`,
                            boost: 3
                          }
                        }
                      },
                      {
                        wildcard: {
                          "leadSource": {
                            value: `*${processedQuery}*`,
                            boost: 1
                          }
                        }
                      },
                      {
                        term: {
                          "leadSource.keyword": {
                            value: processedQuery,
                            boost: 4
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

// Function to search enrolled clients
const searchEnrolledClients = async (query, tabType, page = 1, limit = 10) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return {
        total: 0,
        enrolledClients: []
      };
    }

    // Check if the index exists, if not, create it
    const indexExists = await client.indices.exists({ index: ENROLLED_CLIENTS_INDEX });
    if (!indexExists) {
      await createEnrolledClientsIndex();
      // Wait a moment for the index to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
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
                  wildcard: {
                    "lead.firstName": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 3
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.lastName": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 3
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.primaryEmail": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.primaryContact": {
                      value: `*${processedQuery}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.contactNumbers": {
                      value: `*${processedQuery}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "assignedMarketingTeam.firstname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "assignedMarketingTeam.lastname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "salesPerson.firstname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 1
                    }
                  }
                },
                {
                  wildcard: {
                    "salesPerson.lastname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 1
                    }
                  }
                },
                {
                  wildcard: {
                    "admin.firstname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 1
                    }
                  }
                },
                {
                  wildcard: {
                    "admin.lastname": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 1
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.leadSource": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.leadSource.keyword": {
                      value: `*${processedQuery.toLowerCase()}*`,
                      boost: 3
                    }
                  }
                },
                {
                  wildcard: {
                    "lead.leadSource": {
                      value: `*${processedQuery}*`,
                      boost: 1
                    }
                  }
                },
                {
                  term: {
                    "lead.leadSource.keyword": {
                      value: processedQuery,
                      boost: 4
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

    // Add tab-specific filters
    if (tabType) {
      switch(tabType.toLowerCase()) {
        case 'approved':
          searchQuery.bool.must.push({
            bool: {
              must: [
                { term: { "Approval_by_sales": true } },
                { term: { "Approval_by_admin": true } }
              ]
            }
          });
          break;

        case 'admin_pending':
          searchQuery.bool.must.push({
            bool: {
              must: [
                { exists: { field: "packageid" } },
                { term: { "Approval_by_admin": false } },
                { term: { "has_update": false } }
              ]
            }
          });
          break;

        case 'my_review':
          searchQuery.bool.must.push({
            bool: {
              must: [
                { term: { "has_update": true } },
                { term: { "Approval_by_admin": false } }
              ]
            }
          });
          break;

        case 'all':
        default:
          // No additional filters for 'all' tab
          break;
      }
    }

    const response = await client.search({
      index: ENROLLED_CLIENTS_INDEX,
      body: {
        from: offset,
        size: limit,
        query: searchQuery,
        sort: [
          { _score: 'desc' },
          { createdAt: 'desc' }
        ]
      }
    });

    return {
      total: response.hits.total.value,
      enrolledClients: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }))
    };
  } catch (error) {
    console.error('Error searching enrolled clients:', error);
    return {
      total: 0,
      enrolledClients: []
    };
  }
};

// Function to index an enrolled client
const indexEnrolledClient = async (enrolledClient) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    // Check if the index exists, if not, create it
    const indexExists = await client.indices.exists({ index: ENROLLED_CLIENTS_INDEX });
    if (!indexExists) {
      await createEnrolledClientsIndex();
      // Wait a moment for the index to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Process contact numbers to create searchable versions
    const processedContactNumbers = Array.isArray(enrolledClient.lead?.contactNumbers) 
      ? enrolledClient.lead.contactNumbers.map(processPhoneNumber)
      : [];

         // Add the processed numbers to the enrolled client object
     const enrolledClientToIndex = {
       ...enrolledClient,
       lead: {
         ...enrolledClient.lead,
         processedContactNumbers
       }
     };

     // Remove any circular references by stringifying and parsing
     const sanitizedEnrolledClient = JSON.parse(JSON.stringify(enrolledClientToIndex));

     await client.index({
       index: ENROLLED_CLIENTS_INDEX,
       id: enrolledClient.id.toString(),
       body: sanitizedEnrolledClient,
       refresh: true
     });
  } catch (error) {
    console.error('Error indexing enrolled client:', error);
  }
};

// Function to update an enrolled client in Elasticsearch
const updateEnrolledClient = async (enrolledClient) => {
  try {
    await indexEnrolledClient(enrolledClient);
  } catch (error) {
    console.error('Error updating enrolled client:', error);
  }
};

// Function to delete an enrolled client from Elasticsearch
const deleteEnrolledClient = async (enrolledClientId) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    await client.delete({
      index: ENROLLED_CLIENTS_INDEX,
      id: enrolledClientId.toString()
    });
  } catch (error) {
    console.error('Error deleting enrolled client:', error);
  }
};

// Create enrolled clients index
const createEnrolledClientsIndex = async () => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return;
    }

    const indexExists = await client.indices.exists({ index: ENROLLED_CLIENTS_INDEX });
    if (indexExists) {
      return;
    }

    await client.indices.create({
      index: ENROLLED_CLIENTS_INDEX,
      body: {
        mappings: {
          properties: {
            id: { type: 'integer' },
            lead_id: { type: 'integer' },
            packageid: { type: 'integer' },
            payable_enrollment_charge: { type: 'float' },
            payable_offer_letter_charge: { type: 'float' },
            payable_first_year_percentage: { type: 'float' },
            payable_first_year_fixed_charge: { type: 'float' },
            Approval_by_sales: { type: 'boolean' },
            Sales_person_id: { type: 'integer' },
            Approval_by_admin: { type: 'boolean' },
            Admin_id: { type: 'integer' },
            has_update: { type: 'boolean' },
            edited_enrollment_charge: { type: 'float' },
            edited_offer_letter_charge: { type: 'float' },
            edited_first_year_percentage: { type: 'float' },
            edited_first_year_fixed_charge: { type: 'float' },
            initial_payment: { type: 'float' },
            is_training_required: { type: 'boolean' },
            first_call_status: { type: 'keyword' },
            assignTo: { type: 'integer' },
            resume: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            lead: {
              properties: {
                id: { type: 'integer' },
                firstName: { type: 'text', analyzer: 'standard' },
                lastName: { type: 'text', analyzer: 'standard' },
                primaryEmail: { type: 'keyword' },
                primaryContact: { type: 'keyword' },
                contactNumbers: { type: 'keyword' },
                processedContactNumbers: { type: 'keyword' },
                status: { type: 'keyword' },
                technology: { type: 'keyword' },
                country: { type: 'keyword' },
                visaStatus: { type: 'keyword' },
                leadSource: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                }
              }
            },
            package: {
              properties: {
                id: { type: 'integer' },
                planName: { type: 'text' },
                enrollmentCharge: { type: 'float' },
                offerLetterCharge: { type: 'float' },
                firstYearSalaryPercentage: { type: 'float' },
                firstYearFixedPrice: { type: 'float' },
                features: { type: 'keyword' }
              }
            },
            salesPerson: {
              properties: {
                id: { type: 'integer' },
                firstname: { type: 'text', analyzer: 'standard' },
                lastname: { type: 'text', analyzer: 'standard' },
                email: { type: 'keyword' }
              }
            },
            admin: {
              properties: {
                id: { type: 'integer' },
                firstname: { type: 'text', analyzer: 'standard' },
                lastname: { type: 'text', analyzer: 'standard' },
                email: { type: 'keyword' }
              }
            },
            assignedMarketingTeam: {
              properties: {
                id: { type: 'integer' },
                firstname: { type: 'text', analyzer: 'standard' },
                lastname: { type: 'text', analyzer: 'standard' },
                email: { type: 'keyword' }
              }
            }
          }
        }
      }
    });

    // Index created successfully
  } catch (error) {
    console.error('Error creating enrolled clients index:', error);
  }
};

export {
  client,
  LEAD_INDEX,
  ARCHIVED_LEAD_INDEX,
  ENROLLED_CLIENTS_INDEX,
  createLeadIndex,
  createArchivedLeadIndex,
  createEnrolledClientsIndex,
  checkElasticsearchConnection,
  processPhoneNumber,
  getStatusGroup,
  indexLead,
  updateLead,
  deleteLead,
  searchLeads,
  indexArchivedLead,
  updateArchivedLead,
  deleteArchivedLead,
  searchArchivedLeads,
  indexEnrolledClient,
  updateEnrolledClient,
  deleteEnrolledClient,
  searchEnrolledClients
}; 