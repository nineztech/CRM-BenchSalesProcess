import { searchLeads } from '../config/elasticSearch.js';

// Search leads with pagination
export const searchLeadsController = async (req, res) => {
  try {
    const { 
      query, 
      statusGroup, 
      page = 1, 
      limit = 10,
      statusFilter,
      salesFilter,
      createdByFilter
    } = req.query;

    // Validate required parameters
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        errors: [{
          field: 'query',
          message: 'Search query cannot be empty'
        }]
      });
    }

    // Validate status group if provided
    if (statusGroup) {
      const validStatusGroups = ['open', 'Enrolled', 'archived', 'inProcess', 'followUp', 'teamfollowup'];
      if (!validStatusGroups.includes(statusGroup)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status group',
          errors: [{
            field: 'statusGroup',
            message: `Status group must be one of: ${validStatusGroups.join(', ')}`
          }]
        });
      }
    }

    // Search leads with filters
    const result = await searchLeads(
      query, 
      statusGroup, 
      parseInt(page), 
      parseInt(limit),
      statusFilter,
      salesFilter,
      createdByFilter
    );

    return res.status(200).json({
      success: true,
      message: 'Leads retrieved successfully',
      data: {
        total: result.total,
        page: parseInt(page),
        limit: parseInt(limit),
        leads: result.leads
      }
    });
  } catch (error) {
    console.error('Error searching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching leads',
      errors: [{
        field: 'server',
        message: 'Internal server error'
      }]
    });
  }
}; 