import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

// Add Department
export const addDepartment = async (req, res) => {
  try {
    const { departmentName, subroles, isSalesTeam, isMarketingTeam } = req.body;
    const userId = req.user?.id;

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const existingDepartment = await Department.findOne({
      where: { departmentName: departmentName.trim() }
    });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists"
      });
    }

    let subrolesArray = [];
    if (subroles) {
      if (Array.isArray(subroles)) {
        subrolesArray = subroles.filter(r => r && r.trim() !== '').map(r => r.trim());
      } else if (typeof subroles === 'string') {
        subrolesArray = [subroles.trim()];
      }
    }

    const newDepartment = await Department.create({
      departmentName: departmentName.trim(),
      subroles: subrolesArray,
      isSalesTeam: isSalesTeam || false,
      isMarketingTeam: isMarketingTeam || false,
      createdBy: userId,
      status: 'active'
    });

    const departmentWithUser = await Department.findByPk(newDepartment.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: departmentWithUser
    });

  } catch (error) {
    console.error("Error creating department:", error);
    handleError(error, res);
  }
};

// Get All Departments
export const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    handleError(error, res);
  }
};

// Get Department by ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    handleError(error, res);
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentName, subroles, status, isSalesTeam, isMarketingTeam } = req.body;
    const userId = req.user?.id;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    let subrolesArray = department.subroles;
    if (subroles) {
      if (Array.isArray(subroles)) {
        subrolesArray = subroles.filter(r => r && r.trim() !== '').map(r => r.trim());
      } else if (typeof subroles === 'string') {
        subrolesArray = [subroles.trim()];
      }
    }

    await department.update({
      departmentName: departmentName?.trim() || department.departmentName,
      subroles: subrolesArray,
      isSalesTeam: isSalesTeam !== undefined ? isSalesTeam : department.isSalesTeam,
      isMarketingTeam: isMarketingTeam !== undefined ? isMarketingTeam : department.isMarketingTeam,
      status: status || department.status,
      updatedBy: userId,
      updatedAt: new Date()
    }, {
      silent: false
    });

    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Department updated successfully",
      data: updatedDepartment
    });
  } catch (error) {
    console.error("Error updating department:", error);
    handleError(error, res);
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await department.destroy();

    res.status(200).json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    handleError(error, res);
  }
};

// Get Department Subroles by ID
export const getDepartmentSubroles = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    // Check if department is active
    if (department.status === 'inactive') {
      return res.status(400).json({
        success: false,
        message: "Department is inactive"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        departmentId: department.id,
        departmentName: department.departmentName,
        subroles: department.subroles || []
      }
    });
  } catch (error) {
    console.error("Error fetching department subroles:", error);
    handleError(error, res);
  }
};

// Check if sales team department exists
export const checkSalesTeamExists = async (req, res) => {
  try {
    const salesTeamDepartment = await Department.findOne({
      where: { isSalesTeam: true }
    });

    res.status(200).json({
      success: true,
      data: {
        exists: !!salesTeamDepartment,
        department: salesTeamDepartment ? {
          id: salesTeamDepartment.id,
          departmentName: salesTeamDepartment.departmentName
        } : null
      }
    });
  } catch (error) {
    console.error("Error checking sales team department:", error);
    handleError(error, res);
  }
};

// Check if marketing team department exists
export const checkMarketingTeamExists = async (req, res) => {
  try {
    const marketingTeamDepartment = await Department.findOne({
      where: { isMarketingTeam: true }
    });

    res.status(200).json({
      success: true,
      data: {
        exists: !!marketingTeamDepartment,
        department: marketingTeamDepartment ? {
          id: marketingTeamDepartment.id,
          departmentName: marketingTeamDepartment.departmentName
        } : null
      }
    });
  } catch (error) {
    console.error("Error checking marketing team department:", error);
    handleError(error, res);
  }
};

// Update Department Status
export const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    await department.update({
      status: status,
      updatedBy: userId
    });

    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: "Department status updated successfully",
      data: updatedDepartment
    });
  } catch (error) {
    console.error("Error updating department status:", error);
    handleError(error, res);
  }
};

// Error handler
const handleError = (error, res) => {
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: "Department name must be unique"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
