import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import bcrypt from 'bcrypt';

const ClientUser = sequelize.define(
  "clientusers",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    enrolled_client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'enrolledclients',
        key: 'id'
      }
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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
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
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
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
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeValidate: (clientUser) => {
        // Set primaryEmail from emails array
        if (Array.isArray(clientUser.emails) && clientUser.emails.length > 0) {
          clientUser.primaryEmail = clientUser.emails[0].toLowerCase();
        }
      },
      beforeCreate: async (clientUser) => {
        // Hash password before saving
        if (clientUser.password) {
          const salt = await bcrypt.genSalt(10);
          clientUser.password = await bcrypt.hash(clientUser.password, salt);
        }
      }
    },
    indexes: [
      {
        fields: ['lead_id'],
        unique: true
      },
      {
        fields: ['enrolled_client_id'],
        unique: true
      },
      {
        fields: ['username'],
        unique: true
      },
      {
        fields: ['primaryEmail'],
        unique: true
      }
    ]
  }
);

// Instance method to check password
ClientUser.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default ClientUser; 