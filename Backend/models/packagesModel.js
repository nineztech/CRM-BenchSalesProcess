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
    firstYearSalaryPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        max: 100,
        cannotCoexistWithFixedPrice(value) {
          if (value === null) return;
          
          if (value && this.firstYearFixedPrice) {
            throw new Error('Cannot set both firstYearSalaryPercentage and firstYearFixedPrice');
          }
        }
      }
    },
    firstYearFixedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        cannotCoexistWithPercentage(value) {
          if (value === null) return;
          
          if (value && this.firstYearSalaryPercentage) {
            throw new Error('Cannot set both firstYearSalaryPercentage and firstYearFixedPrice');
          }
        }
      }
    },
    initialPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isGreaterThanEnrollmentCharge(value) {
          if (parseFloat(value) <= parseFloat(this.enrollmentCharge)) {
            throw new Error('Initial price must be greater than enrollment charge');
          }
        }
      }
    },
    discountedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
          if (value && value.some(item => {
            return typeof item !== 'object' || 
                   !item.name || 
                   typeof item.percentage !== 'number' ||
                   item.percentage < 0 || 
                   item.percentage > 100 ||
                   !item.startDate ||
                   !item.startTime ||
                   !item.endDate ||
                   !item.endTime ||
                   new Date(item.startDate) > new Date(item.endDate);
          })) {
            throw new Error('All discounts must be valid objects with name, percentage (0-100), and valid date/time ranges');
          }
        }
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
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