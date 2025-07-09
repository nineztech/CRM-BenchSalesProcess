// Validate lead data
export const validateLead = (data) => {
  // Validate First Name
  if (!data.firstName || typeof data.firstName !== 'string' || 
      data.firstName.length < 2 || data.firstName.length > 50) {
    return 'First name must be between 2 and 50 characters';
  }

  // Validate Last Name
  if (!data.lastName || typeof data.lastName !== 'string' || 
      data.lastName.length < 2 || data.lastName.length > 50) {
    return 'Last name must be between 2 and 50 characters';
  }

  // Validate Contact Numbers
  if (!Array.isArray(data.contactNumbers)) {
    return 'Contact numbers must be an array';
  }
  if (data.contactNumbers.length === 0 || data.contactNumbers.length > 2) {
    return 'Must provide 1-2 contact numbers';
  }
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (data.contactNumbers.some(num => !phoneRegex.test(num))) {
    return 'Invalid contact number format';
  }

  // Validate Emails
  if (!Array.isArray(data.emails)) {
    return 'Emails must be an array';
  }
  if (data.emails.length === 0 || data.emails.length > 2) {
    return 'Must provide 1-2 email addresses';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.emails.some(email => !emailRegex.test(email))) {
    return 'Invalid email format';
  }

  // Validate Primary Email
  if (!data.primaryEmail || !emailRegex.test(data.primaryEmail)) {
    return 'Invalid primary email format';
  }

  // Validate LinkedIn URL
  if (data.linkedinId) {
    try {
      new URL(data.linkedinId);
    } catch (e) {
      return 'LinkedIn URL must be a valid URL';
    }
  }

  // Validate Technologies
  if (!Array.isArray(data.technology)) {
    return 'Technologies must be an array';
  }
  if (data.technology.length === 0) {
    return 'At least one technology must be provided';
  }
  if (data.technology.some(tech => typeof tech !== 'string' || !tech.trim())) {
    return 'Invalid technology format';
  }

  // Validate Country
  if (!data.country || typeof data.country !== 'string' || 
      data.country.length < 2 || data.country.length > 100) {
    return 'Country must be between 2 and 100 characters';
  }

  // Validate Country Code
  if (!data.countryCode || typeof data.countryCode !== 'string' || 
      data.countryCode.length < 2 || data.countryCode.length > 3) {
    return 'Country code must be 2-3 characters';
  }

  // Validate Visa Status
  const validVisaStatuses = ['H1B', 'L1', 'F1', 'Green Card', 'Citizen', 'H4 EAD', 'L2 EAD', 'Other'];
  if (!validVisaStatuses.includes(data.visaStatus)) {
    return 'Invalid visa status. Valid values are: ' + validVisaStatuses.join(', ');
  }

  // Validate Status
  const validStatuses = [
    'interested', 'notinterested', 'DNR1', 'DNR2', 'DNR3', 'Dead',
    'open', 'not working', 'wrong no', 'closed', 'call again later'
  ];
  if (data.status && !validStatuses.includes(data.status)) {
    return 'Invalid status. Valid values are: ' + validStatuses.join(', ');
  }

  // Validate Lead Source
  if (!data.leadSource || typeof data.leadSource !== 'string' || !data.leadSource.trim()) {
    return 'Lead source is required';
  }

  // Validate Remarks
  if (data.remarks && !Array.isArray(data.remarks)) {
    return 'Remarks must be an array';
  }

  return null; // No validation errors
}; 