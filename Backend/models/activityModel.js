import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Department from "./departmentModel.js";
import User from "./userModel.js";

const Activity = sequelize.define(
  "Activity",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      }
    },
    dept_ids: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidDeptIds(value) {
          if (!Array.isArray(value)) {
            throw new Error('Department IDs must be an array');
          }
          if (value.length === 0) {
            throw new Error('At least one department ID is required');
          }
          if (!value.every(id => Number.isInteger(id) && id > 0)) {
            throw new Error('All department IDs must be positive integers');
          }
        }
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    viewRoute: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    addRoute: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    editRoute: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deleteRoute: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
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
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeValidate: async (activity) => {
        if (activity.dept_ids && Array.isArray(activity.dept_ids)) {
          // Remove duplicates
          activity.dept_ids = [...new Set(activity.dept_ids)];
        }
      }
    }
  }
);

export default Activity; 