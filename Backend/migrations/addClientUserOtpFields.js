import { sequelize } from '../config/dbConnection.js';
import { QueryTypes } from 'sequelize';

const addClientUserOtpFields = async () => {
  try {
    // Check if columns exist
    const columns = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clientusers' AND COLUMN_NAME IN ('isFirstLogin', 'changePasswordOtp', 'changePasswordOtpExpiry')",
      { type: QueryTypes.SELECT }
    );

    // Add isFirstLogin if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'isFirstLogin')) {
      await sequelize.query(
        "ALTER TABLE clientusers ADD COLUMN isFirstLogin BOOLEAN NOT NULL DEFAULT TRUE"
      );
      console.log('✅ Added isFirstLogin column to clientusers table');
    }

    // Add changePasswordOtp if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'changePasswordOtp')) {
      await sequelize.query(
        "ALTER TABLE clientusers ADD COLUMN changePasswordOtp VARCHAR(255) NULL"
      );
      console.log('✅ Added changePasswordOtp column to clientusers table');
    }

    // Add changePasswordOtpExpiry if it doesn't exist
    if (!columns.find(col => col.COLUMN_NAME === 'changePasswordOtpExpiry')) {
      await sequelize.query(
        "ALTER TABLE clientusers ADD COLUMN changePasswordOtpExpiry DATETIME NULL"
      );
      console.log('✅ Added changePasswordOtpExpiry column to clientusers table');
    }

    console.log('✅ ClientUser OTP fields migration completed');
  } catch (error) {
    console.error('❌ Error in ClientUser OTP fields migration:', error);
  }
};

export default addClientUserOtpFields;
