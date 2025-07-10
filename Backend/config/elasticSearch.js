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
  } catch (error) {
    console.error('Error creating lead index:', error);
    // Don't throw the error, just log it and continue
    // This allows the application to start even if Elasticsearch is not available
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

// Function to index a lead
const indexLead = async (lead) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) return;

    await client.index({
      index: LEAD_INDEX,
      id: lead.id.toString(),
      body: {
        ...lead,
        statusGroup: getStatusGroup(lead)
      }
    });
  } catch (error) {
    console.error('Error indexing lead:', error);
    // Don't throw the error, just log it
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
    converted: ['closed'],
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
const searchLeads = async (query, statusGroup, page = 1, limit = 10) => {
  try {
    const isAvailable = await checkElasticsearchConnection();
    if (!isAvailable) {
      return {
        total: 0,
        leads: []
      };
    }

    const offset = (page - 1) * limit;

    const searchQuery = {
      bool: {
        must: [
          {
            multi_match: {
              query: query,
              fields: [
                'firstName',
                'lastName',
                'contactNumbers',
                'emails',
                'primaryEmail',
                'country',
                'assignedUser.firstname',
                'assignedUser.lastname'
              ]
            }
          }
        ]
      }
    };

    // Add status group filter if provided
    if (statusGroup) {
      searchQuery.bool.filter = [
        { term: { statusGroup: statusGroup } }
      ];
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
    console.error('Error searching leads:', error);
    return {
      total: 0,
      leads: []
    };
  }
};

export {
  client,
  LEAD_INDEX,
  createLeadIndex,
  indexLead,
  updateLead,
  deleteLead,
  searchLeads
}; 