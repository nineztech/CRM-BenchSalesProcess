import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import path from 'path';

const EnrolledClients = sequelize.define(
  "enrolledclients",
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
    packageid: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'packages',
        key: 'id'
      }
    },
    payable_enrollment_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    payable_offer_letter_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    payable_first_year_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
        cannotCoexistWithFixedPrice(value) {
          if (value === null || value === undefined) return;
          
          if (value && this.payable_first_year_fixed_charge) {
            throw new Error('Cannot set both payable_first_year_percentage and payable_first_year_fixed_charge');
          }
        }
      }
    },
    payable_first_year_fixed_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        cannotCoexistWithPercentage(value) {
          if (value === null || value === undefined) return;
          
          if (value && this.payable_first_year_percentage) {
            throw new Error('Cannot set both payable_first_year_percentage and payable_first_year_fixed_charge');
          }
        }
      }
    },
    net_payable_first_year_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    first_year_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        requiredIfPercentage(value) {
          if (this.payable_first_year_percentage && (value === null || value === undefined)) {
            throw new Error('First year salary is required when first year percentage is set');
          }
        }
      }
    },
    Approval_by_sales: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    Sales_person_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    Approval_by_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    Admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    has_update: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    edited_enrollment_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    edited_offer_letter_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    edited_first_year_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
        cannotCoexistWithEditedFixedPrice(value) {
          if (value === null || value === undefined) return;
          
          if (value && this.edited_first_year_fixed_charge) {
            throw new Error('Cannot set both edited_first_year_percentage and edited_first_year_fixed_charge');
          }
        }
      }
    },
    edited_first_year_fixed_charge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        cannotCoexistWithEditedPercentage(value) {
          if (value === null || value === undefined) return;
          
          if (value && this.edited_first_year_percentage) {
            throw new Error('Cannot set both edited_first_year_percentage and edited_first_year_fixed_charge');
          }
        }
      }
    },
    edited_net_payable_first_year_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    edited_first_year_salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    final_approval_sales: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    final_approval_by_admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    has_update_in_final: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
      allowNull: true,
      validate: {
        isValidPath(value) {
          if (value) {
            // Normalize path to forward slashes for validation
            const normalizedPath = value.split(path.sep).join('/');
            if (!normalizedPath.startsWith('uploads/resumes/')) {
              throw new Error('Invalid resume path');
            }
          }
        }
      }
    }
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ['lead_id'],
        unique: true
      },
      {
        fields: ['packageid']
      },
      {
        fields: ['Sales_person_id']
      },
      {
        fields: ['Admin_id']
      },
      {
        fields: ['Approval_by_sales']
      },
      {
        fields: ['Approval_by_admin']
      }
    ],
    hooks: {
      beforeUpdate: async (enrolledClient, options) => {
        // Auto-approval logic based on requirements
        const changedFields = enrolledClient._changed || new Set();
        
        // If admin approves without changes (approved_by_admin = 1, has_update = 0)
        if (changedFields.has('Approval_by_admin') && 
            enrolledClient.Approval_by_admin === true && 
            enrolledClient.has_update === false) {
          enrolledClient.Approval_by_sales = true;
        }
        
        // If sales accepts admin changes (approved_by_sales = 1, has_update = 0)
        if (changedFields.has('Approval_by_sales') && 
            enrolledClient.Approval_by_sales === true && 
            enrolledClient.has_update === false) {
          enrolledClient.Approval_by_admin = true;
        }
      }
    }
  }
);

export default EnrolledClients; 