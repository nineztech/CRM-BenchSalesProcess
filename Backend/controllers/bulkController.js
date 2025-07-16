import Lead from '../models/leadModel.js';
import { validateLead } from '../utils/validation.js';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadTemplate = async (req, res) => {
  try {
    const templatePath = path.join(__dirname, '../excel_template/lead_template.xlsx');
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        success: false,
        message: 'Template file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=lead_template.xlsx');

    // Stream the file
    const fileStream = fs.createReadStream(templatePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading template:', error);
    return res.status(500).json({
      success: false,
      message: 'Error downloading template file'
    });
  }
};

export const uploadBulkLeads = async (req, res) => {
  try {
    const { leads } = req.body;
    console.log('Received leads data:', leads);

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leads data provided or invalid format'
      });
    }

    // Check if this is an error file upload
    if (leads.some(lead => lead.hasOwnProperty('Error'))) {
      return res.status(400).json({
        success: false,
        message: 'Please fix the errors in the original file. Do not upload the error file.'
      });
    }

    // Skip the first entry (example data) and process the rest
    const leadsToProcess = leads.slice(1);

    if (leadsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leads data found after skipping the example row'
      });
    }

    const validationResults = [];
    let hasErrors = false;

    // First pass: Validate all leads
    for (let i = 0; i < leadsToProcess.length; i++) {
      const leadData = leadsToProcess[i];
      try {
        // Check for duplicate email first
        const existingLead = await Lead.findOne({
          where: { primaryEmail: leadData['Primary Email']?.toString().trim().toLowerCase() }
        });

        if (existingLead) {
          hasErrors = true;
          validationResults.push({
            ...leadData,
            Error: `Primary email '${leadData['Primary Email']}' already exists in the system`,
            rowIndex: i + 3 // Add 3 to account for 0-based index and skipped first row and header row
          });
          continue;
        }

        // Transform Excel column names to match database fields
        const transformedData = {
          firstName: leadData['First Name']?.trim(),
          lastName: leadData['Last Name']?.trim(),
          contactNumbers: [
            leadData['Primary Contact'],
            leadData['Secondary Contact']
          ].filter(Boolean).map(num => num.toString().trim()),
          emails: [
            leadData['Primary Email'],
            leadData['Secondary Email']
          ].filter(Boolean).map(email => email.toString().trim().toLowerCase()),
          primaryEmail: leadData['Primary Email']?.toString().trim().toLowerCase(),
          technology: typeof leadData['Technology'] === 'string' 
            ? leadData['Technology'].split(',').map(tech => tech.trim())
            : [],
          country: leadData['Country']?.trim(),
          countryCode: leadData['Country Code']?.trim() || 'US',
          visaStatus: leadData['Visa Status']?.trim(),
          leadSource: leadData['Lead Source']?.trim(),
          linkedinId: leadData['LinkedIn URL']?.trim(),
          status: 'open',
          statusGroup: 'open',
          remarks: [{
            text: leadData['Remarks']?.trim() || 'Lead created through bulk upload',
            createdAt: new Date().toISOString(),
            createdBy: req.user.id,
            statusChange: {
              to: 'open'
            }
          }],
          createdBy: req.user.id,
          updatedBy: req.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const validationError = validateLead(transformedData);
        if (validationError) {
          hasErrors = true;
          validationResults.push({
            ...leadData,
            Error: validationError,
            rowIndex: i + 3 // Add 3 to account for 0-based index and skipped first row and header row
          });
        } else {
          validationResults.push({
            ...leadData,
            transformedData,
            Error: ''
          });
        }
      } catch (error) {
        hasErrors = true;
        validationResults.push({
          ...leadData,
          Error: error.message,
          rowIndex: i + 3 // Add 3 to account for 0-based index and skipped first row and header row
        });
      }
    }

    // If there are any errors, generate error file and return
    if (hasErrors) {
      // Create workbook with error information
      const wb = XLSX.utils.book_new();
      const errorData = validationResults.map(result => ({
        'First Name': result['First Name'],
        'Last Name': result['Last Name'],
        'Primary Contact': result['Primary Contact'],
        'Secondary Contact': result['Secondary Contact'],
        'Primary Email': result['Primary Email'],
        'Secondary Email': result['Secondary Email'],
        'LinkedIn URL': result['LinkedIn URL'],
        'Technology': result['Technology'],
        'Country': result['Country'],
        'Country Code': result['Country Code'],
        'Visa Status': result['Visa Status'],
        'Lead Source': result['Lead Source'],
        'Remarks': result['Remarks'],
        'Error': result['Error']
      }));

      const ws = XLSX.utils.json_to_sheet(errorData);

      // Set column widths based on content
      const colWidths = [
        { wch: 15 },  // First Name
        { wch: 15 },  // Last Name
        { wch: 20 },  // Primary Contact
        { wch: 20 },  // Secondary Contact
        { wch: 30 },  // Primary Email
        { wch: 30 },  // Secondary Email
        { wch: 40 },  // LinkedIn URL
        { wch: 30 },  // Technology
        { wch: 20 },  // Country
        { wch: 15 },  // Country Code
        { wch: 15 },  // Visa Status
        { wch: 15 },  // Lead Source
        { wch: 40 },  // Remarks
        { wch: 50 }   // Error
      ];

      // Adjust column widths based on content
      errorData.forEach(row => {
        Object.entries(row).forEach(([key, value], index) => {
          if (value && value.toString().length > colWidths[index].wch) {
            colWidths[index].wch = Math.min(value.toString().length + 2, 100);
          }
        });
      });

      ws['!cols'] = colWidths;

      // Add red fill to error cells
      const redFill = {
        fgColor: { rgb: "FFFF0000" }
      };
      const redFont = {
        color: { rgb: "FFFF0000" }
      };

      for (let i = 0; i < errorData.length; i++) {
        if (errorData[i].Error) {
          const errorCell = XLSX.utils.encode_cell({ r: i + 1, c: 13 }); // Column N (14th column)
          if (!ws[errorCell].s) ws[errorCell].s = {};
          ws[errorCell].s.font = redFont;
          ws[errorCell].s.redFill = redFill;
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Errors');

      // Convert workbook to buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Send error response with file
      return res.status(400).json({
        success: false,
        message: 'Validation errors found. Please check the error file.',
        errorFile: buffer.toString('base64'),
        fileName: 'lead_upload_errors.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        errorCount: validationResults.filter(r => r.Error).length
      });
    }

    // If no errors, proceed with saving all leads
    const savedLeads = [];
    for (const result of validationResults) {
      const lead = new Lead(result.transformedData);
      await lead.save();
      savedLeads.push(lead);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${savedLeads.length} leads.`,
      data: {
        successCount: savedLeads.length,
        failedCount: 0
      }
    });

  } catch (error) {
    console.error('Error in bulk lead upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing bulk upload',
      error: error.message
    });
  }
};
