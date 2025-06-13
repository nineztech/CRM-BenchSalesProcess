import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const Lead = sequelize.define(
  "Lead",
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
      type: DataTypes.ENUM('H1B', 'L1', 'F1', 'Green Card', 'Citizen', 'H4 EAD', 'L2 EAD', 'Other'),
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
        'closed',
        'call again later'
      ),
      allowNull: false,
      defaultValue: 'open',
      validate: {
        notEmpty: true
      }
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
        
        const statusGroups = {
          open: ['open'],
          converted: ['closed'],
          archived: ['Dead', 'notinterested'],
          inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'wrong no', 'call again later']
        };

        for (const [group, statuses] of Object.entries(statusGroups)) {
          if (statuses.includes(status)) {
            return group;
          }
        }
        return 'open';
      }
    },
    assignTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    previousAssign: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
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
        model: 'Users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
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