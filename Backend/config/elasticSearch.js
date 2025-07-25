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

// Create lead index with mapping
const createLeadIndex = async () => {
  try {
    // First check if Elasticsearch is available
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      console.warn('⚠️ Elasticsearch is not available. The application will continue without search functionality.');
      return;
    }

    const indexExists = await client.indices.exists({ index: LEAD_INDEX });
    if (!indexExists) {
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
              leadSource: { type: 'keyword' },
              assignTo: { type: 'integer' },
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
      console.log('Lead index created successfully');
    }

    // Also create archived leads index
    await createArchivedLeadIndex();
  } catch (error) {
    console.error('Error creating lead index:', error);
    // Don't throw the error, just log it and continue
    // This allows the application to start even if Elasticsearch is not available
  }
};

// Create archived lead index with mapping
const createArchivedLeadIndex = async () => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      console.warn('⚠️ Elasticsearch is not available. The application will continue without search functionality.');
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
      console.log('Archived lead index created successfully');
    }
  } catch (error) {
    console.error('Error creating archived lead index:', error);
  }
};

// Check if Elasticsearch is available
const checkElasticsearchConnection = async () => {
  try {
    await client.ping();
    console.log('✅ Elasticsearch is available');
    return true;
  } catch (error) {
    console.error('❌ Elasticsearch is not available:', error.message);
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
      console.warn('⚠️ Elasticsearch is not available for indexing');
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
      body: leadToIndex,
      refresh: true
    });

    console.log(`✅ Progress: ${lead.id} lead indexed`);
  } catch (error) {
    console.error(`❌ Error indexing lead ${lead.id}:`, error);
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
    console.error('Error updating lead:', error);
    // Don't throw the error, just log it
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
    console.error('Error deleting lead:', error);
    // Don't throw the error, just log it
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
      console.warn('⚠️ Elasticsearch is not available for search');
      return {
        total: 0,
        leads: []
      };
    }

    console.log('🔍 Search query:', { query, statusGroup, page, limit, statusFilter, salesFilter, createdByFilter });

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
      console.log('🔍 Adding status group filter:', statusGroup);
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
                      lte: now.toISOString()
                    }
                  }
                },
                {
                  bool: {
                    must_not: {
                      terms: { "status": ["Dead", "notinterested", "Enrolled", "open"] }
                    }
                  }
                }
              ]
            }
          });
          break;

        case 'inprocess':
          // For inProcess tab, we want leads that are in inProcess statuses
          // If a specific status filter is applied, we should prioritize that
          if (statusFilter) {
            // If status filter is provided, just ensure it's a valid inProcess status
            const inProcessStatuses = ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later'];
            if (inProcessStatuses.includes(statusFilter)) {
              // The status filter will be applied later, so we don't need additional conditions here
              console.log('🔍 Status filter provided for inProcess tab, will apply specific status filter');
            }
          } else {
            // If no status filter, apply the general inProcess conditions
            searchQuery.bool.must.push({
              bool: {
                must: [
                  {
                    exists: { field: "followUpDateTime" }
                  },
                  {
                    range: {
                      followUpDateTime: {
                        gt: now.toISOString()
                      }
                    }
                  },
                  {
                    bool: {
                      must_not: {
                        terms: { "status": ["Dead", "notinterested", "Enrolled","Team Followup", "open"] }
                      }
                    }
                  }
                ]
              }
            });
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
      console.log('🔍 Adding status filter:', statusFilter);
      searchQuery.bool.must.push({
        wildcard: { "status": `*${statusFilter.toLowerCase()}*` }
      });
    }

    if (salesFilter) {
      console.log('🔍 Adding sales filter:', salesFilter);
      searchQuery.bool.must.push({
        bool: {
          should: [
            {
              term: { "assignedUser.firstname": salesFilter.split(' ')[0] }
            },
            {
              term: { "assignedUser.lastname": salesFilter.split(' ')[1] || salesFilter.split(' ')[0] }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    if (createdByFilter) {
      console.log('🔍 Adding created by filter:', createdByFilter);
      searchQuery.bool.must.push({
        bool: {
          should: [
            {
              term: { "creator.firstname": createdByFilter.split(' ')[0] }
            },
            {
              term: { "creator.lastname": createdByFilter.split(' ')[1] || createdByFilter.split(' ')[0] }
            }
          ],
          minimum_should_match: 1
        }
      });
    }

    console.log('🔍 Final search query with filters:', JSON.stringify(searchQuery, null, 2));

    // Debug: Let's also check what leads exist with the specific status
    if (statusFilter) {
      try {
        const debugResponse = await client.search({
          index: LEAD_INDEX,
          body: {
            size: 5,
            query: {
              wildcard: { "status": `*${statusFilter.toLowerCase()}*` }
            }
          }
        });
        console.log('🔍 Debug: Found leads with status filter:', statusFilter, 'Count:', debugResponse.hits.total.value);
        if (debugResponse.hits.hits.length > 0) {
          console.log('🔍 Debug: Sample leads with this status:', debugResponse.hits.hits.map(hit => ({
            id: hit._source.id,
            firstName: hit._source.firstName,
            lastName: hit._source.lastName,
            status: hit._source.status
          })));
        }
      } catch (debugError) {
        console.log('🔍 Debug query failed:', debugError.message);
      }
    }

    // Debug: Let's also check what leads exist with the search query
    if (query) {
      try {
        const debugSearchResponse = await client.search({
          index: LEAD_INDEX,
          body: {
            size: 5,
            query: {
              wildcard: { "firstName": `*${query.toLowerCase()}*` }
            }
          }
        });
        console.log('🔍 Debug: Found leads with search query:', query, 'Count:', debugSearchResponse.hits.total.value);
        if (debugSearchResponse.hits.hits.length > 0) {
          console.log('🔍 Debug: Sample leads with this search term:', debugSearchResponse.hits.hits.map(hit => ({
            id: hit._source.id,
            firstName: hit._source.firstName,
            lastName: hit._source.lastName,
            status: hit._source.status
          })));
        }
      } catch (debugError) {
        console.log('🔍 Debug search query failed:', debugError.message);
      }
    }

    console.log('📦 Elasticsearch query:', JSON.stringify(searchQuery, null, 2));

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

    console.log('📊 Raw Elasticsearch response:', JSON.stringify(response.hits, null, 2));
    console.log('📊 Search results:', {
      total: response.hits.total.value,
      hits: response.hits.hits.length,
      statusGroup: statusGroup
    });

    return {
      total: response.hits.total.value,
      leads: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }))
    };
  } catch (error) {
    console.error('❌ Error searching leads:', error);
    if (error.meta?.body?.error) {
      console.error('Elasticsearch error details:', JSON.stringify(error.meta.body.error, null, 2));
    }
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
      console.warn('⚠️ Elasticsearch is not available for indexing archived lead');
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

    console.log(`✅ Archived lead ${archivedLead.id} indexed successfully`);
  } catch (error) {
    console.error(`❌ Error indexing archived lead ${archivedLead.id}:`, error);
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
    console.error('Error updating archived lead:', error);
    // Don't throw the error, just log it
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
    console.error('Error deleting archived lead:', error);
    // Don't throw the error, just log it
  }
};

// Function to search archived leads
const searchArchivedLeads = async (query, page = 1, limit = 10) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      console.warn('⚠️ Elasticsearch is not available for search');
      return {
        total: 0,
        leads: []
      };
    }

    console.log('🔍 Archived leads search query:', { query, page, limit });

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

    console.log('📦 Archived leads Elasticsearch query:', JSON.stringify(searchQuery, null, 2));

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

    console.log('📊 Archived leads search results:', {
      total: response.hits.total.value,
      hits: response.hits.hits.length
    });

    return {
      total: response.hits.total.value,
      leads: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score
      }))
    };
  } catch (error) {
    console.error('❌ Error searching archived leads:', error);
    if (error.meta?.body?.error) {
      console.error('Elasticsearch error details:', JSON.stringify(error.meta.body.error, null, 2));
    }
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