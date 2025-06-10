import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const Department = sequelize.define(
  "Department",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      }
    },
    roles: {
      type: DataTypes.JSON, // Store multiple roles as JSON array
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidRoles(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Roles must be an array');
          }
          if (value && value.some(item => typeof item !== 'string' || item.trim() === '')) {
            throw new Error('All roles must be non-empty strings');
          }
        }
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
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeUpdate: async (department) => {
        // Auto-set updatedBy if not provided (handled in controller if needed)
      },
    }
  }
);

// ✅ Instance method to add a role
Department.prototype.addRole = function(newRole) {
  if (!this.roles) {
    this.roles = [];
  }
  if (!this.roles.includes(newRole)) {
    this.roles.push(newRole);
  }
  return this.roles;
};

// ✅ Instance method to remove a role
Department.prototype.removeRole = function(roleToRemove) {
  if (this.roles) {
    this.roles = this.roles.filter(r => r !== roleToRemove);
  }
  return this.roles;
};

export default Department;
