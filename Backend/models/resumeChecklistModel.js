import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import path from "path";

const ResumeChecklist = sequelize.define(
  "resume_checklists",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    personalInformation: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidPersonalInfo(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Personal information must be an object');
          }
          const requiredFields = ['fullName', 'email', 'phone', 'dateOfBirth'];
          const missingFields = requiredFields.filter(field => !value[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required personal information fields: ${missingFields.join(', ')}`);
          }
          
          // Validate email format
          if (value.email && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))) {
            throw new Error('Invalid email format');
          }
          
          // Validate phone format
          if (value.phone && !(/^[\+]?[1-9][\d]{0,15}$/.test(value.phone))) {
            throw new Error('Invalid phone number format');
          }
          
          // Validate date format (DD/MM/YYYY)
          if (value.dateOfBirth && !(/^\d{2}\s\d{2}\s\d{4}$/.test(value.dateOfBirth))) {
            throw new Error('Date of birth must be in DD MM YYYY format');
          }
        }
      }
    },
    educationalInformation: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { degrees: [] },
      validate: {
        isValidEducationalInfo(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Educational information must be an object');
          }
          if (!Array.isArray(value.degrees)) {
            throw new Error('Degrees must be an array');
          }
          if (value.degrees.length === 0) {
            throw new Error('At least one degree must be provided');
          }
          
          value.degrees.forEach((degree, index) => {
            const requiredFields = ['degreeType', 'major', 'university', 'location'];
            const missingFields = requiredFields.filter(field => !degree[field]);
            if (missingFields.length > 0) {
              throw new Error(`Degree ${index + 1} missing required fields: ${missingFields.join(', ')}`);
            }
            
            // Validate date formats
            if (degree.startDate) {
              if (!degree.startDate.month || !degree.startDate.year) {
                throw new Error(`Degree ${index + 1} start date must have month and year`);
              }
            }
            if (degree.endDate) {
              if (!degree.endDate.month || !degree.endDate.year) {
                throw new Error(`Degree ${index + 1} end date must have month and year`);
              }
            }
          });
        }
      }
    },
    technicalInformation: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidTechnicalInfo(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Technical information must be an object');
          }
          if (!value.technologies || typeof value.technologies !== 'string') {
            throw new Error('Technologies must be a string');
          }
          if (!Array.isArray(value.skills)) {
            throw new Error('Skills must be an array');
          }
          if (value.skills.length === 0) {
            throw new Error('At least one skill must be provided');
          }
        }
      }
    },
    currentInformation: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidCurrentInfo(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Current information must be an object');
          }
          const requiredFields = ['entryDate', 'currentLocation'];
          const missingFields = requiredFields.filter(field => !value[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required current information fields: ${missingFields.join(', ')}`);
          }
          
          if (value.currentLocation) {
            if (!value.currentLocation.address || !value.currentLocation.postalCode) {
              throw new Error('Current location must have address and postal code');
            }
          }
        }
      }
    },
    addressHistory: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidAddressHistory(value) {
          if (!Array.isArray(value)) {
            throw new Error('Address history must be an array');
          }
          if (value.length < 1) {
            throw new Error('At least one address history entry must be provided');
          }
          
          value.forEach((address, index) => {
            const requiredFields = ['state', 'country', 'from', 'to'];
            const missingFields = requiredFields.filter(field => !address[field]);
            if (missingFields.length > 0) {
              throw new Error(`Address ${index + 1} missing required fields: ${missingFields.join(', ')}`);
            }
          });
        }
      }
    },
    visaExperienceCertificate: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidVisaInfo(value) {
          if (!value || typeof value !== 'object') {
            throw new Error('Visa/Experience/Certificate information must be an object');
          }
          const requiredFields = ['currentVisaStatus', 'cptStatus', 'eadStartDate', 'hasExperience'];
          const missingFields = requiredFields.filter(field => !(field in value));
          if (missingFields.length > 0) {
            throw new Error(`Missing required visa/experience fields: ${missingFields.join(', ')}`);
          }
          
          if (!Array.isArray(value.certifications)) {
            throw new Error('Certifications must be an array');
          }
        }
      }
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'submitted'),
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        notEmpty: true
      }
    },
    clientUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clientusers',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    resume: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isResumeUpdated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['createdBy']
      },
      {
        fields: ['clientUserId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

export default ResumeChecklist;
