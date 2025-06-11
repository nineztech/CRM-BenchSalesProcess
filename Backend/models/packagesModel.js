import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";

const Packages = sequelize.define(
  "Packages",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    planName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      }
    },
    enrollmentCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    offerLetterCharge: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidFeatures(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Features must be an array');
          }
          if (value && value.some(item => typeof item !== 'string' || item.trim() === '')) {
            throw new Error('All features must be non-empty strings');
          }
        }
      }
    },
    discounts: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidDiscounts(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('Discounts must be an array');
          }
          if (value && value.some(item => typeof item !== 'object')) {
            throw new Error('All discounts must be objects');
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
  }
);

// Instance method to add a feature
Packages.prototype.addFeature = function(newFeature) {
  if (!this.features) {
    this.features = [];
  }
  if (!this.features.includes(newFeature)) {
    this.features.push(newFeature);
  }
  return this.features;
};

// Instance method to add a discount
Packages.prototype.addDiscount = function(newDiscount) {
  if (!this.discounts) {
    this.discounts = [];
  }
  this.discounts.push(newDiscount);
  return this.discounts;
};

export default Packages; 