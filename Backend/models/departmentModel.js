import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const Department = sequelize.define(
  "departments",
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
    subroles: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidSubroles(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Subroles must be an array');
          }
          if (value && value.some(item => typeof item !== 'string' || item.trim() === '')) {
            throw new Error('All subroles must be non-empty strings');
          }
        }
      }
    },
    isSalesTeam: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    isMarketingTeam: {
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
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (department) => {
        department.setDataValue('updatedAt', department.getDataValue('createdAt'));
      },
      beforeUpdate: async (department) => {
        // Auto-set updatedBy if not provided (handled in controller if needed)
      },
    }
  }
);

// Instance method to add a subrole
Department.prototype.addSubrole = function(newSubrole) {
  if (!this.subroles) {
    this.subroles = [];
  }
  if (!this.subroles.includes(newSubrole)) {
    this.subroles.push(newSubrole);
  }
  return this.subroles;
};

// Instance method to remove a subrole
Department.prototype.removeSubrole = function(subroleToRemove) {
  if (this.subroles) {
    this.subroles = this.subroles.filter(r => r !== subroleToRemove);
  }
  return this.subroles;
};

Department.associate = (models) => {
  Department.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator'
  });
  Department.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater'
  });
};

export default Department;
