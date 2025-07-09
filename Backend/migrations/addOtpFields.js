import { sequelize } from '../config/dbConnection.js';
import { QueryTypes } from 'sequelize';

const addOtpFields = async () => {
  try {
    // Check if columns exist
    const columns = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('resetPasswordOtp', 'resetPasswordOtpExpiry')",
      { type: QueryTypes.SELECT }
    );

    // Add resetPasswordOtp if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'resetPasswordOtp')) {
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN resetPasswordOtp VARCHAR(255) NULL"
      );
      console.log('✅ Added resetPasswordOtp column');
    }

    // Add resetPasswordOtpExpiry if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'resetPasswordOtpExpiry')) {
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN resetPasswordOtpExpiry DATETIME NULL"
      );
      console.log('✅ Added resetPasswordOtpExpiry column');
    }

    console.log('✅ OTP fields migration completed');
  } catch (error) {
    console.error('❌ Error in OTP fields migration:', error);
  }
};

export default addOtpFields; 