import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true,
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100],
      }
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Departments',
        key: 'id'
      }
    },
    subrole: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isValidSubrole(value) {
          if (value) {
            // This validation will be handled in the controller
            // where we can check if the subrole exists in the department's subroles
            return true;
          }
          return true; // Allow null values
        }
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'user', 'superadmin', 'masteradmin'),
      allowNull: false,
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
    },
    resetPasswordOtp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordOtpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = 10;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const saltRounds = 10;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
    }
  }
);

// Compare password instance method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to validate if subrole exists in department's subroles
User.prototype.validateSubrole = async function() {
  if (!this.subrole || !this.departmentId) return true;
  
  const department = await sequelize.models.Department.findByPk(this.departmentId);
  if (!department || !department.subroles) return false;
  
  return department.subroles.includes(this.subrole);
};

export default User;