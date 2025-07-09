import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LogoIcon from "../../../assets/xls_logo.webp";
import countries from 'i18n-iso-countries';
import english from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(english);

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006/api";

// Get all countries data
const countryList = Object.entries(countries.getNames('en')).map(([code, name]) => ({
  name,
  code: code.toUpperCase(),
})).sort((a, b) => a.name.localeCompare(b.name));

const downloadErrorFile = (base64Data: string, fileName: string, contentType: string) => {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Error downloading error file');
  }
};

const BulkLeadUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const downloadSampleTemplate = () => {
    // Create sample data with valid examples
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Primary Contact': '+12345678901',
        'Secondary Contact': '+19876543210',
        'Primary Email': 'john.doe@example.com',
        'Secondary Email': 'johndoe.work@example.com',
        'LinkedIn URL': 'https://www.linkedin.com/in/johndoe',
        'Technology': 'React, Node.js, TypeScript',
        'Country': 'United States',
        'Country Code': 'US',
        'Visa Status': 'H1B',
        'Lead Source': 'LinkedIn',
        'Remarks': 'Experienced full-stack developer'
      },
      {
        'First Name': 'Sarah',
        'Last Name': 'Smith',
        'Primary Contact': '+442012345678',
        'Secondary Contact': '',
        'Primary Email': 'sarah.smith@example.com',
        'Secondary Email': '',
        'LinkedIn URL': 'https://www.linkedin.com/in/sarahsmith',
        'Technology': 'Java, Spring Boot, AWS',
        'Country': 'United Kingdom',
        'Country Code': 'GB',
        'Visa Status': 'Citizen',
        'Lead Source': 'Indeed',
        'Remarks': 'Senior backend developer'
      }
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData, { 
      header: [
        'First Name',
        'Last Name',
        'Primary Contact',
        'Secondary Contact',
        'Primary Email',
        'Secondary Email',
        'LinkedIn URL',
        'Technology',
        'Country',
        'Country Code',
        'Visa Status',
        'Lead Source',
        'Remarks'
      ]
    });

    // Create hidden sheet for country data
    const countryDataWs = XLSX.utils.aoa_to_sheet([
      ['Country', 'Code'],
      ...countryList.map(country => [country.name, country.code])
    ]);

    // Add the sheets to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.utils.book_append_sheet(wb, countryDataWs, 'CountryData');

    // Set column widths
    ws['!cols'] = [
      { width: 15 },  // First Name
      { width: 15 },  // Last Name
      { width: 20 },  // Primary Contact
      { width: 20 },  // Secondary Contact
      { width: 30 },  // Primary Email
      { width: 30 },  // Secondary Email
      { width: 40 },  // LinkedIn URL
      { width: 30 },  // Technology
      { width: 25 },  // Country
      { width: 15 },  // Country Code
      { width: 15 },  // Visa Status
      { width: 15 },  // Lead Source
      { width: 40 }   // Remarks
    ];

    // Style the header row
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F46E5" } }, // Indigo color
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Apply header styles
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:M1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = headerStyle;
    }

    // Add data validation for Country column
    ws['!dataValidations'] = [{
      sqref: 'I2:I1048576',
      type: 'list',
      formula1: '=CountryData!$A$2:$A$' + (countryList.length + 1),
      allowBlank: false,
      showErrorMessage: true,
      errorTitle: 'Invalid Country',
      error: 'Please select a country from the dropdown',
      showInputMessage: true,
      promptTitle: 'Country Selection',
      prompt: 'Select a country from the list'
    }];

    // Add formula for Country Code column
    for (let i = 2; i <= 1000; i++) {
      const cellRef = `J${i}`;
      ws[cellRef] = {
        f: `=VLOOKUP(I${i},CountryData!$A$2:$B$${countryList.length + 1},2,FALSE)`,
        t: 'f'
      };
    }

    // Add cell comments/notes
    const comments = {
      A1: { text: 'Required: 2-50 characters' },
      B1: { text: 'Required: 2-50 characters' },
      C1: { text: 'Required: Format: +[country code][number], e.g., +12345678901' },
      D1: { text: 'Optional: Same format as Primary Contact' },
      E1: { text: 'Required: Valid email format' },
      F1: { text: 'Optional: Valid email format' },
      G1: { text: 'Required: Valid LinkedIn URL' },
      H1: { text: 'Required: Comma-separated technologies' },
      I1: { text: 'Required: Select country from dropdown' },
      J1: { text: 'Auto-generated based on selected country' },
      K1: { text: 'Required: One of: H1B, L1, F1, Green Card, Citizen, H4 EAD, L2 EAD, Other' },
      L1: { text: 'Required: Source of the lead' },
      M1: { text: 'Optional: Any additional notes' }
    };

    // Apply comments
    if (!ws['!comments']) ws['!comments'] = {};
    for (const [cell, comment] of Object.entries(comments)) {
      ws['!comments'][cell] = comment;
    }

    // Lock Country Code column
    if (!ws['!protect']) {
      ws['!protect'] = {
        selectLockedCells: true,
        selectUnlockedCells: true,
        password: undefined
      };
    }

    // Save the file
    XLSX.writeFile(wb, 'lead_template.xlsx', {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
      cellStyles: true,
      compression: true
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      // Read file to check if it's an error file
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const data = e.target?.result;
          if (data instanceof ArrayBuffer) {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            // Check if this is an error file
            if (jsonData.length > 0 && (jsonData[0] as Record<string, unknown>).hasOwnProperty('Error')) {
              toast.error('Please fix the errors in the original file. Do not upload the error file.');
              setFile(null);
              const fileInput = document.getElementById('fileInput') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
              return;
            }

            setFile(selectedFile);
          }
        } catch (error) {
          console.error('Error reading file:', error);
          toast.error('Error reading file');
          setFile(null);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const processExcelFile = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const data = e.target?.result;
          if (!(data instanceof ArrayBuffer)) {
            throw new Error('Invalid file data');
          }

          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate data structure
          if (jsonData.length === 0) {
            toast.error('The Excel file is empty');
            setIsLoading(false);
            return;
          }

          // Validate required fields
          const requiredFields = [
            'First Name',
            'Last Name',
            'Primary Contact',
            'Primary Email',
            'Technology',
            'Country',
            'Visa Status',
            'Lead Source',
            'LinkedIn URL'
          ];

          const missingFields = requiredFields.filter(field => 
            !Object.keys(jsonData[0] as Record<string, unknown>).includes(field)
          );

          if (missingFields.length > 0) {
            toast.error(`Missing required fields: ${missingFields.join(', ')}`);
            setIsLoading(false);
            return;
          }

          // Get the token
          const token = localStorage.getItem('token');
          if (!token) {
            toast.error('Authentication required');
            setIsLoading(false);
            return;
          }

          // Send data to backend
          try {
            const response = await axios.post(
              `${BASE_URL}/bulk/leads`,
              { leads: jsonData },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                onUploadProgress: (progressEvent: any) => {
                  if (progressEvent.total) {
                    const progress = progressEvent.loaded / progressEvent.total;
                    setUploadProgress(Math.round(progress * 100));
                  }
                }
              }
            );

            if (response.data.success) {
              toast.success(response.data.message);
              setFile(null);
              // Reset file input
              const fileInput = document.getElementById('fileInput') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
            }
          } catch (error: any) {
            console.error('API Error:', error.response?.data);
            
            // Handle error file download if available
            if (error.response?.data?.errorFile) {
              const { errorFile, fileName, contentType } = error.response.data;
              downloadErrorFile(errorFile, fileName, contentType);
              toast.error(`${error.response.data.errorCount} errors found. Error file downloaded.`);
            } else {
              toast.error(error.response?.data?.message || 'Error uploading leads');
            }
          }
        } catch (error: any) {
          console.error('File Processing Error:', error);
          toast.error('Error processing Excel file');
        }
        setIsLoading(false);
        setUploadProgress(0);
      };

      reader.onerror = (error) => {
        console.error('FileReader Error:', error);
        toast.error('Error reading file');
        setIsLoading(false);
        setUploadProgress(0);
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error('Error uploading file');
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <img 
            src={LogoIcon}
            alt="Excel" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Lead Upload</h2>
          <p className="text-gray-600">Upload multiple leads at once using an Excel file</p>
        </div>

        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="fileInput"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="fileInput"
              className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Choose Excel File
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Download Template
            </button>

            <button
              onClick={processExcelFile}
              disabled={!file || isLoading}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                !file || isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Leads'
              )}
            </button>
          </div>

          {isLoading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {uploadProgress}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-300"
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Download the template file for the correct format</li>
            <li>Fill in the lead information in the Excel file</li>
            <li>Make sure all required fields are filled</li>
            <li>Upload the completed Excel file</li>
            <li>Wait for the upload to complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkLeadUpload;
