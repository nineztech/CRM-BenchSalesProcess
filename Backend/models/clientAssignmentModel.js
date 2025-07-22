import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const ClientAssignment = sequelize.define(
  "clientassignments",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'enrolledclients',
        key: 'id'
      }
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    previousAssignedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    remark: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidRemark(value) {
          if (!value) {
            this.setDataValue('remark', []);
            return;
          }
          if (!Array.isArray(value)) {
            throw new Error('Remark must be an array');
          }
          for (let i = 0; i < value.length; i++) {
            const item = value[i];
            if (!item || typeof item !== 'object') {
              throw new Error(`Remark at index ${i} must be an object`);
            }
            if (item.changedTo && typeof item.changedTo === 'object') {
              if ('to' in item.changedTo && (typeof item.changedTo.to !== 'number' || isNaN(item.changedTo.to))) {
                throw new Error(`Remark at index ${i}: changedTo.to must be a valid number`);
              }
              if ('from' in item.changedTo && (typeof item.changedTo.from !== 'number' || isNaN(item.changedTo.from))) {
                throw new Error(`Remark at index ${i}: changedTo.from must be a valid number`);
              }
            }
            if (typeof item.text !== 'string' || item.text.trim() === '') {
              throw new Error(`Remark at index ${i} must have a non-empty text string`);
            }
            if (!item.timestamp) {
              item.timestamp = new Date().toISOString();
            } else if (typeof item.timestamp !== 'string' || isNaN(Date.parse(item.timestamp))) {
              throw new Error(`Remark at index ${i} has an invalid timestamp format`);
            }
          }
        }
      }
    },
    reassignedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
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

// Instance methods
ClientAssignment.prototype.addPreviousAssignment = function(userId) {
  if (!this.allPreviousAssignedIds) {
    this.allPreviousAssignedIds = [];
  }
  if (!this.allPreviousAssignedIds.includes(userId)) {
    this.allPreviousAssignedIds.push(userId);
  }
  return this.allPreviousAssignedIds;
};

ClientAssignment.prototype.getAssignmentHistory = function() {
  return {
    current: this.assignedToId,
    previous: this.previousAssignedId,
    allPrevious: this.allPreviousAssignedIds
  };
};

export default ClientAssignment; 