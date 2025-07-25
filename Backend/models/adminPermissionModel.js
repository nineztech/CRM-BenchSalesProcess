import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Activity from "./activityModel.js";
import User from "./userModel.js";

const AdminPermission = sequelize.define(
  "adminpermissions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'activities',
        key: 'id'
      }
    },
    canView: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    canAdd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['admin_id', 'activity_id']
      }
    ]
  }
);

export default AdminPermission; 