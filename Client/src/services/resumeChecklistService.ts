const API_BASE_URL = 'http://localhost:5006/api';

export interface PersonalInformation {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface Degree {
  id?: number;
  degreeType: string;
  major: string;
  university: string;
  location: string;
  startDate: {
    month: string;
    year: string;
  };
  endDate: {
    month: string;
    year: string;
  };
}

export interface EducationalInformation {
  degrees: Degree[];
}

export interface TechnicalInformation {
  skills: string[];
  technologies: string;
}

export interface CurrentInformation {
  entryDate: string;
  currentLocation: {
    address: string;
    postalCode: string;
  };
  cptDuration?: {
    start: string;
    end: string;
  };
  optDuration?: {
    start: string;
    end: string;
  };
}

export interface AddressHistory {
  id?: number;
  state: string;
  country: string;
  from: string;
  to: string;
}

export interface VisaExperienceCertificate {
  currentVisaStatus: string;
  cptStatus: string;
  eadStartDate: string;
  hasExperience: boolean;
  certifications: string[];
}

export interface ResumeChecklist {
  id?: number;
  personalInformation: PersonalInformation;
  educationalInformation: EducationalInformation;
  technicalInformation: TechnicalInformation;
  currentInformation: CurrentInformation;
  addressHistory: AddressHistory[];
  visaExperienceCertificate: VisaExperienceCertificate;
  remarks?: string;
  status: 'draft' | 'completed' | 'submitted';
  clientUserId?: number;
  createdBy?: number;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateResumeChecklistRequest {
  personalInformation: PersonalInformation;
  educationalInformation: EducationalInformation;
  technicalInformation: TechnicalInformation;
  currentInformation: CurrentInformation;
  addressHistory: AddressHistory[];
  visaExperienceCertificate: VisaExperienceCertificate;
  remarks?: string;
  status?: 'draft' | 'completed' | 'submitted';
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

class ResumeChecklistService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async createResumeChecklist(data: CreateResumeChecklistRequest): Promise<ApiResponse<ResumeChecklist>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/add`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create resume checklist');
      }

      return result;
    } catch (error) {
      console.error('Error creating resume checklist:', error);
      throw error;
    }
  }

  async getResumeChecklistsByUser(): Promise<ApiResponse<{ checklists: ResumeChecklist[]; pagination: any }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/user`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch resume checklists');
      }

      return result;
    } catch (error) {
      console.error('Error fetching resume checklists:', error);
      throw error;
    }
  }

  async getResumeChecklistById(id: number): Promise<ApiResponse<ResumeChecklist>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch resume checklist');
      }

      return result;
    } catch (error) {
      console.error('Error fetching resume checklist:', error);
      throw error;
    }
  }

  async updateResumeChecklist(id: number, data: Partial<CreateResumeChecklistRequest>): Promise<ApiResponse<ResumeChecklist>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update resume checklist');
      }

      return result;
    } catch (error) {
      console.error('Error updating resume checklist:', error);
      throw error;
    }
  }

  async updateResumeChecklistStatus(id: number, status: 'draft' | 'completed' | 'submitted'): Promise<ApiResponse<ResumeChecklist>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/${id}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update resume checklist status');
      }

      return result;
    } catch (error) {
      console.error('Error updating resume checklist status:', error);
      throw error;
    }
  }

  async deleteResumeChecklist(id: number): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/resume-checklists/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete resume checklist');
      }

      return result;
    } catch (error) {
      console.error('Error deleting resume checklist:', error);
      throw error;
    }
  }
}

export const resumeChecklistService = new ResumeChecklistService();
