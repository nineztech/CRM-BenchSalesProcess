import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/dbConnection.js";
import Department from "./departmentModel.js";
import Activity from "./activityModel.js";
import User from "./userModel.js";
import SpecialUserPermission from "./specialUserPermissionModel.js";

const RolePermission = sequelize.define(
  "rolepermissions",
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
        model: 'activities',
        key: 'id'
      }
    },
    dept_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
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
        fields: ['activity_id', 'dept_id', 'subrole']
      }
    ],
    hooks: {
      afterCreate: async (rolePermission, options) => {
        try {
          // Find all special users with matching department and subrole
          const specialUsers = await User.findAll({
            where: {
              is_special: true,
              departmentId: rolePermission.dept_id,
              subrole: rolePermission.subrole
            }
          });

          // Create special permissions for each special user
          await Promise.all(specialUsers.map(async (user) => {
            await SpecialUserPermission.findOrCreate({
              where: {
                user_id: user.id,
                activity_id: rolePermission.activity_id,
                dept_id: rolePermission.dept_id,
                subrole: rolePermission.subrole
              },
              defaults: {
                canView: rolePermission.canView,
                canAdd: rolePermission.canAdd,
                canEdit: rolePermission.canEdit,
                canDelete: rolePermission.canDelete,
                createdBy: rolePermission.createdBy
              }
            });
          }));
        } catch (error) {
          console.error('Error syncing special user permissions:', error);
        }
      },
      afterUpdate: async (rolePermission, options) => {
        try {
          // Find all special users with matching department and subrole
          const specialUsers = await User.findAll({
            where: {
              is_special: true,
              departmentId: rolePermission.dept_id,
              subrole: rolePermission.subrole
            }
          });

          // Update special permissions for each special user
          // Only update if the special permission hasn't been customized
          await Promise.all(specialUsers.map(async (user) => {
            const [specialPermission] = await SpecialUserPermission.findOrCreate({
              where: {
                user_id: user.id,
                activity_id: rolePermission.activity_id,
                dept_id: rolePermission.dept_id,
                subrole: rolePermission.subrole
              },
              defaults: {
                canView: rolePermission.canView,
                canAdd: rolePermission.canAdd,
                canEdit: rolePermission.canEdit,
                canDelete: rolePermission.canDelete,
                createdBy: rolePermission.createdBy
              }
            });

            // If the special permission was not just created and hasn't been customized
            if (!specialPermission.updatedBy) {
              await specialPermission.update({
                canView: rolePermission.canView,
                canAdd: rolePermission.canAdd,
                canEdit: rolePermission.canEdit,
                canDelete: rolePermission.canDelete
              });
            }
          }));
        } catch (error) {
          console.error('Error syncing special user permissions:', error);
        }
      }
    }
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