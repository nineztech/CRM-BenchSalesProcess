import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Department from "./departmentModel.js";
import Activity from "./activityModel.js";

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    activity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Activities',
        key: 'id'
      }
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
    canView: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    canAdd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    canDelete: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
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
    indexes: [
      {
        unique: true,
        fields: ['activity_id', 'dept_id', 'subrole']
      }
    ]
  }
);

// Add associations
RolePermission.belongsTo(Activity, {
  foreignKey: 'activity_id',
  as: 'activity'
});

RolePermission.belongsTo(Department, {
  foreignKey: 'dept_id',
  as: 'department'
});

export default RolePermission; 