import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import { indexLead, updateLead, deleteLead } from '../config/elasticSearch.js';

const Lead = sequelize.define(
  "leads",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    contactNumbers: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidContacts(value) {
          if (!Array.isArray(value)) {
            throw new Error('Contact numbers must be an array');
          }
          if (value.length === 0 || value.length > 2) {
            throw new Error('Must provide 1-2 contact numbers');
          }
          if (value.some(num => !(/^[\+]?[1-9][\d]{0,15}$/.test(num)))) {
            throw new Error('Invalid contact number format');
          }
        }
      }
    },
    primaryContact: {
      type: DataTypes.VIRTUAL,
      get() {
        const numbers = this.getDataValue('contactNumbers');
        return Array.isArray(numbers) && numbers.length > 0 ? numbers[0] : null;
      }
    },
    emails: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidEmails(value) {
          if (!Array.isArray(value)) {
            throw new Error('Emails must be an array');
          }
          if (value.length === 0 || value.length > 2) {
            throw new Error('Must provide 1-2 email addresses');
          }
          if (value.some(email => !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
            throw new Error('Invalid email format');
          }
        }
      }
    },
    primaryEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    linkedinId: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          args: true,
          msg: 'Must be a valid URL'
        }
      }
    },
    technology: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidTechnologies(value) {
          if (!Array.isArray(value)) {
            throw new Error('Technologies must be an array');
          }
          if (value.length === 0) {
            throw new Error('At least one technology must be provided');
          }
          if (value.some(tech => typeof tech !== 'string' || !tech.trim())) {
            throw new Error('Invalid technology format');
          }
        }
      }
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 3]
      }
    },
    visaStatus: {
      type: DataTypes.ENUM('H1B', 'L1', 'F1', 'Green Card', 'Citizen', 'H4 EAD', 'L2 EAD', 'Other', 'USC'),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.ENUM(
        'interested',
        'notinterested',
        'DNR1',
        'DNR2',
        'DNR3',
        'Dead',
        'open',
        'not working',
        'wrong no',
        'Enrolled',
        'call again later',
        'follow up',
        'teamfollowup'
      ),
      allowNull: false,
      defaultValue: 'open',
      validate: {
        notEmpty: true
      }
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    followUpTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    followUpDateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    leadSource: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true
    },
    remarks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidRemarks(value) {
          if (!Array.isArray(value)) {
            throw new Error('Remarks must be an array');
          }
        }
      }
    },
    statusGroup: {
      type: DataTypes.VIRTUAL,
      get() {
        const status = this.getDataValue('status');
        if (!status) return 'open';
        
        // Check if lead is within 24 hours of follow-up
        const followUpDateTime = this.getDataValue('followUpDateTime');
        if (followUpDateTime) {
          const now = new Date();
          const timeDiff = followUpDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // If follow-up is within next 24 hours, show in followUp tab
          if (hoursDiff > 0 && hoursDiff <= 24) {
            return 'followUp';
          }
        }
        
        const statusGroups = {
          open: ['open'],
          Enrolled: ['Enrolled'],
          archived: ['Dead', 'notinterested'],
          inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later', 'teamfollowup'],
          teamFollowup: ['teamfollowup']
        };
        
        // Check each status group
        for (const [group, statuses] of Object.entries(statusGroups)) {
          if (statuses.includes(status)) {
            // For inProcess group, only return if not in followUp
            if (group === 'inProcess') {
              const followUpDateTime = this.getDataValue('followUpDateTime');
              if (followUpDateTime) {
                const now = new Date();
                const timeDiff = followUpDateTime.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                // If within 24 hours, it will be shown in followUp tab
                if (hoursDiff > 0 && hoursDiff <= 24) {
                  return 'followUp';
                }
              }
            }
            return group;
          }
        }
        
        return 'open';
      }
    },
    timeToFollowUp: {
      type: DataTypes.VIRTUAL,
      get() {
        const followUpDateTime = this.getDataValue('followUpDateTime');
        if (!followUpDateTime) return null;
        
        const now = new Date();
        const timeDiff = followUpDateTime.getTime() - now.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (timeDiff <= 0) return 'Now';
        if (hoursDiff > 24) {
          const days = Math.floor(hoursDiff / 24);
          return `${days}d ${hoursDiff % 24}h`;
        }
        if (hoursDiff > 0) {
          return `${hoursDiff}h ${minutesDiff}m`;
        }
        return `${minutesDiff}m`;
      }
    },
    assignTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    previousAssign: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalAssign: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    is_team_followup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_team_followup'
    },
    team_followup_assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'team_followup_assigned_by'
    },
    team_followup_assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'team_followup_assigned_to'
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['primaryEmail'],
        unique: true
      },
      {
        fields: ['country']
      },
      {
        fields: ['visaStatus']
      },
      {
        fields: ['status']
      },
      {
        fields: ['assignTo']
      },
      {
        fields: ['leadSource']
      }
    ],
    hooks: {
      beforeValidate: (lead) => {
        // Set primaryEmail from emails array
        if (Array.isArray(lead.emails) && lead.emails.length > 0) {
          lead.primaryEmail = lead.emails[0].toLowerCase();
        }
      },
      beforeSave: (lead) => {
        // Combine followUpDate and followUpTime into followUpDateTime
        if (lead.followUpDate && lead.followUpTime) {
          // Create date object treating input as local time (user's timezone)
          const followUpDateTime = new Date(`${lead.followUpDate}T${lead.followUpTime}`);
          lead.followUpDateTime = followUpDateTime;
        }
      },
      afterCreate: async (lead) => {
        try {
          await indexLead(lead.toJSON());
        } catch (error) {
          console.error('Error indexing lead:', error);
        }
      },
      afterUpdate: async (lead) => {
        try {
          await updateLead(lead.toJSON());
        } catch (error) {
          console.error('Error updating lead in Elasticsearch:', error);
        }
      },
      afterDestroy: async (lead) => {
        try {
          await deleteLead(lead.id);
        } catch (error) {
          console.error('Error deleting lead from Elasticsearch:', error);
        }
      }
    }
  }
);

// Add a virtual field for technology search
Lead.addHook('afterSync', async () => {
  try {
    await sequelize.query(`
      ALTER TABLE Leads 
      ADD COLUMN technology_search VARCHAR(255) GENERATED ALWAYS AS (
        JSON_UNQUOTE(JSON_EXTRACT(technology, '$[0]'))
      ) STORED,
      ADD INDEX idx_technology_search (technology_search)
    `);
  } catch (error) {
    console.log('Technology search column might already exist:', error.message);
  }
});

export default Lead;