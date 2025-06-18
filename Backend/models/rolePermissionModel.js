import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Department from "./departmentModel.js";

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Departments',
        key: 'id'
      }
    },
    subrole: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        async isValidSubrole(value) {
          const department = await Department.findByPk(this.dept_id);
          if (!department || !department.subroles.includes(value)) {
            throw new Error('Invalid subrole for this department');
          }
        }
      }
    },
    hasAccessTo: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isValidAccessFormat(value) {
          if (typeof value !== 'object' || value === null) {
            throw new Error('hasAccessTo must be an object');
          }
          
          // Check each activity's permissions
          for (const [activityId, permissions] of Object.entries(value)) {
            if (!Array.isArray(permissions)) {
              throw new Error(`Permissions for activity ${activityId} must be an array`);
            }
            if (!permissions.every(p => typeof p === 'number' && Number.isInteger(p))) {
              throw new Error(`All permissions must be valid permission IDs for activity ${activityId}`);
            }
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
    }
  },
  {
    timestamps: true
  }
);

export default RolePermission; 