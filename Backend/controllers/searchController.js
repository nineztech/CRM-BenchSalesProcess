import { searchLeads, searchEnrolledClients } from '../config/elasticSearch.js';

export const searchLeadsController = async (req, res) => {
  try {
    const { query, statusGroup, page = 1, limit = 10, statusFilter, salesFilter, createdByFilter } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await searchLeads(query, statusGroup, parseInt(page), parseInt(limit), statusFilter, salesFilter, createdByFilter);
    
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in search leads controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const searchEnrolledClientsController = async (req, res) => {
  try {
    const { query, tabType, page = 1, limit = 10 } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await searchEnrolledClients(query, tabType, parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in search enrolled clients controller:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 