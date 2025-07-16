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

  const downloadSampleTemplate = async () => {
    try {
      // Get the token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Fetch the template file from the backend
      const response = await axios({
        method: 'GET',
        url: `${BASE_URL}/bulk/template`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Important for file download
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lead_template.xlsx');
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Error downloading template file');
    }
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header Section - Updated */}
          <div className="bg-gray-50 border-b border-gray-200 p-8">
            <div className="flex items-center space-x-6">
              <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
                <img 
                  src={LogoIcon}
                  alt="Excel" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1 text-start">Bulk Lead Upload</h2>
                <p className="text-gray-600">Upload and manage multiple leads efficiently using Excel</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Upload Section */}
            <div className="space-y-8">
              <div className="border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50 p-8 transition-all duration-300 hover:border-indigo-400">
                <input
                  type="file"
                  id="fileInput"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="text-center">
                  <label
                    htmlFor="fileInput"
                    className="group cursor-pointer inline-block"
                  >
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-indigo-400 group-hover:text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-indigo-600 font-medium text-lg mb-1">Choose Excel File</span>
                      <span className="text-gray-500 text-sm">or drag and drop your file here</span>
                    </div>
                  </label>
                  {file && (
                    <div className="mt-4 flex items-center justify-center text-sm">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700 font-medium">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center px-6 py-3 border border-indigo-200 rounded-lg shadow-sm text-base font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </button>

                <button
                  onClick={processExcelFile}
                  disabled={!file || isLoading}
                  className={`inline-flex items-center px-8 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    !file || isLoading
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Upload...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload Leads
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              {isLoading && uploadProgress > 0 && (
                <div className="mt-6">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-100">
                          Upload Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-3 rounded-full bg-indigo-100">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="mt-12 bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Instructions</h3>
              </div>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Download and review the template file for the correct format
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Fill in all required lead information in the Excel file
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Ensure all mandatory fields are properly filled
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Upload the completed Excel file using the form above
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Monitor the progress bar and wait for confirmation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkLeadUpload;
