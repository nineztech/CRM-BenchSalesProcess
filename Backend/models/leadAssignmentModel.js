import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const LeadAssignment = sequelize.define(
  "LeadAssignment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Leads',
        key: 'id'
      }
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    previousAssignedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    allPreviousAssignedIds: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidPreviousAssignments(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Previous assignments must be an array');
          }
          if (value && value.some(item => typeof item !== 'number')) {
            throw new Error('All previous assignments must be user IDs');
          }
        }
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeUpdate: async (assignment) => {
        // Auto-set updatedBy if not provided (handled in controller if needed)
      },
    }
  }
);

// Instance method to add a previous assignment
LeadAssignment.prototype.addPreviousAssignment = function(userId) {
  if (!this.allPreviousAssignedIds) {
    this.allPreviousAssignedIds = [];
  }
  if (!this.allPreviousAssignedIds.includes(userId)) {
    this.allPreviousAssignedIds.push(userId);
  }
  return this.allPreviousAssignedIds;
};

// Instance method to get assignment history
LeadAssignment.prototype.getAssignmentHistory = function() {
  return {
    current: this.assignedToId,
    previous: this.previousAssignedId,
    allPrevious: this.allPreviousAssignedIds
  };
};

export default LeadAssignment; 