import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Department from "./departmentModel.js";
import User from "./userModel.js";

const Activity = sequelize.define(
  "activities",
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
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['Lead', 'User', 'Department', 'Package', 'System', 'Finance']]
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
    timestamps: true
  }
);

export default Activity; 