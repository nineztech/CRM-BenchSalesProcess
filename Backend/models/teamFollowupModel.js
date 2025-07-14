import { DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Lead from "./leadModel.js";
import User from "./userModel.js";

const TeamFollowup = sequelize.define(
  "teamFollowups",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id'
      }
    },
    assignedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assignedToId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM(
        'interested',
        'notinterested',
        'DNR1',
        'DNR2',
        'DNR3',
        'Dead',
        'open',
        'not working',
        'wrong no',
        'closed',
        'call again later',
        'follow up',
        'teamfollowup'  // Add teamfollowup status
      ),
      allowNull: false,
      defaultValue: 'open',
      validate: {
        notEmpty: true
      }
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    followUpTime: {
      type: DataTypes.TIME,
      allowNull: true
    },
    followUpDateTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remarks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidRemarks(value) {
          if (!Array.isArray(value)) {
            throw new Error('Remarks must be an array');
          }
        }
      }
    },
    statusGroup: {
      type: DataTypes.VIRTUAL,
      get() {
        const status = this.getDataValue('status');
        if (!status) return 'open';
        
        // Check if lead is within 24 hours of follow-up
        const followUpDateTime = this.getDataValue('followUpDateTime');
        if (followUpDateTime) {
          const now = new Date();
          const timeDiff = followUpDateTime.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          // If follow-up is within next 24 hours, show in followUp tab
          if (hoursDiff > 0 && hoursDiff <= 24) {
            return 'followUp';
          }
        }
        
        const statusGroups = {
          open: ['open'],
          converted: ['closed'],
          archived: ['Dead', 'notinterested'],
          inProcess: ['DNR1', 'DNR2', 'DNR3', 'interested', 'not working', 'follow up', 'wrong no', 'call again later']
        };
        
        // Check each status group
        for (const [group, statuses] of Object.entries(statusGroups)) {
          if (statuses.includes(status)) {
            // For inProcess group, only return if not in followUp
            if (group === 'inProcess') {
              const followUpDateTime = this.getDataValue('followUpDateTime');
              if (followUpDateTime) {
                const now = new Date();
                const timeDiff = followUpDateTime.getTime() - now.getTime();
                const hoursDiff = timeDiff / (1000 * 60 * 60);
                
                // If within 24 hours, it will be shown in followUp tab
                if (hoursDiff > 0 && hoursDiff <= 24) {
                  return 'followUp';
                }
              }
            }
            return group;
          }
        }
        
        return 'open';
      }
    },
    timeToFollowUp: {
      type: DataTypes.VIRTUAL,
      get() {
        const followUpDateTime = this.getDataValue('followUpDateTime');
        if (!followUpDateTime) return null;
        
        const now = new Date();
        const timeDiff = followUpDateTime.getTime() - now.getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutesDiff = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (timeDiff <= 0) return 'Now';
        if (hoursDiff > 24) {
          const days = Math.floor(hoursDiff / 24);
          return `${days}d ${hoursDiff % 24}h`;
        }
        if (hoursDiff > 0) {
          return `${hoursDiff}h ${minutesDiff}m`;
        }
        return `${minutesDiff}m`;
      }
    }
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: (teamFollowup) => {
        // Combine followUpDate and followUpTime into followUpDateTime
        if (teamFollowup.followUpDate && teamFollowup.followUpTime) {
          const [hours, minutes, seconds] = teamFollowup.followUpTime.split(':');
          const followUpDateTime = new Date(teamFollowup.followUpDate);
          followUpDateTime.setHours(parseInt(hours, 10));
          followUpDateTime.setMinutes(parseInt(minutes, 10));
          followUpDateTime.setSeconds(parseInt(seconds, 10));
          teamFollowup.followUpDateTime = followUpDateTime;
        }
      }
    }
  }
);

// Set up associations
TeamFollowup.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
TeamFollowup.belongsTo(User, { foreignKey: 'assignedById', as: 'assignedBy' });
TeamFollowup.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });

export default TeamFollowup; 