import { DataTypes } from 'sequelize';
import { sequelize } from '../config/dbConnection.js';

const Installments = sequelize.define('installments', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enrolledClientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'enrolledclients',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  installment_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1 }
  },
  charge_type: {
    type: DataTypes.ENUM('enrollment_charge', 'offer_letter_charge', 'first_year_charge'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  paidDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  remark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_initial_payment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['enrolledClientId']
    },
    {
      fields: ['charge_type']
    },
    {
      fields: ['dueDate']
    },
    {
      fields: ['paid']
    },
    {
      fields: ['installment_number']
    },
    {
      fields: ['is_initial_payment']
    },
    {
      fields: ['enrolledClientId', 'installment_number'],
      unique: true
    }
  ]
});

export default Installments; 