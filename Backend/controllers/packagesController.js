import Packages from "../models/packagesModel.js";
import User from "../models/userModel.js";

// Add Package
export const addPackage = async (req, res) => {
  try {
    const { planName, enrollmentCharge, offerLetterCharge, features, discounts, firstYearSalaryPercentage } = req.body;
    const userId = req.user?.id;

    if (!planName || !enrollmentCharge || !offerLetterCharge || firstYearSalaryPercentage === undefined) {
      return res.status(400).json({
        success: false,
        message: "Plan name, enrollment charge, offer letter charge, and first year salary percentage are required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const existingPackage = await Packages.findOne({
      where: { planName: planName.trim() }
    });

    if (existingPackage) {
      return res.status(409).json({
        success: false,
        message: "Package already exists"
      });
    }

    let featuresArray = [];
    if (features) {
      if (Array.isArray(features)) {
        featuresArray = features.filter(f => f && f.trim() !== '').map(f => f.trim());
      } else if (typeof features === 'string') {
        featuresArray = [features.trim()];
      }
    }

    let discountsArray = [];
    if (discounts) {
      if (Array.isArray(discounts)) {
        // Validate each discount object
        discountsArray = discounts.filter(discount => {
          return (
            discount &&
            typeof discount === 'object' &&
            typeof discount.planName === 'string' &&
            typeof discount.name === 'string' &&
            typeof discount.percentage === 'number' &&
            discount.percentage >= 0 &&
            discount.percentage <= 100
          );
        });
      } else if (typeof discounts === 'object') {
        // Single discount object validation
        if (
          discounts.planName &&
          discounts.name &&
          typeof discounts.percentage === 'number' &&
          discounts.percentage >= 0 &&
          discounts.percentage <= 100
        ) {
          discountsArray = [discounts];
        }
      }
    }

    const newPackage = await Packages.create({
      planName: planName.trim(),
      enrollmentCharge,
      offerLetterCharge,
      firstYearSalaryPercentage,
      features: featuresArray,
      discounts: discountsArray,
      createdBy: userId,
      status: 'active'
    });

    const packageWithUser = await Packages.findByPk(newPackage.id, {
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
      message: "Package created successfully",
      data: packageWithUser
    });

  } catch (error) {
    console.error("Error creating package:", error);
    handleError(error, res);
  }
};

// Get All Packages
export const getAllPackages = async (req, res) => {
  try {
    const packages = await Packages.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    handleError(error, res);
  }
};

// Get Package by ID
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package_ = await Packages.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    res.status(200).json({
      success: true,
      data: package_
    });
  } catch (error) {
    console.error("Error fetching package:", error);
    handleError(error, res);
  }
};

// Update Package
export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, enrollmentCharge, offerLetterCharge, features, discounts, status, firstYearSalaryPercentage } = req.body;
    const userId = req.user?.id;

    const package_ = await Packages.findByPk(id);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    let featuresArray = package_.features;
    if (features) {
      if (Array.isArray(features)) {
        featuresArray = features.filter(f => f && f.trim() !== '').map(f => f.trim());
      } else if (typeof features === 'string') {
        featuresArray = [features.trim()];
      }
    }

    let discountsArray = package_.discounts;
    if (discounts) {
      if (Array.isArray(discounts)) {
        // Validate each discount object
        discountsArray = discounts.filter(discount => {
          return (
            discount &&
            typeof discount === 'object' &&
            typeof discount.planName === 'string' &&
            typeof discount.name === 'string' &&
            typeof discount.percentage === 'number' &&
            discount.percentage >= 0 &&
            discount.percentage <= 100
          );
        });
      } else if (typeof discounts === 'object') {
        // Single discount object validation
        if (
          discounts.planName &&
          discounts.name &&
          typeof discounts.percentage === 'number' &&
          discounts.percentage >= 0 &&
          discounts.percentage <= 100
        ) {
          discountsArray = [discounts];
        }
      }
    }

    await package_.update({
      planName: planName?.trim() || package_.planName,
      enrollmentCharge: enrollmentCharge || package_.enrollmentCharge,
      offerLetterCharge: offerLetterCharge || package_.offerLetterCharge,
      firstYearSalaryPercentage: firstYearSalaryPercentage !== undefined ? firstYearSalaryPercentage : package_.firstYearSalaryPercentage,
      features: featuresArray,
      discounts: discountsArray,
      status: status || package_.status,
      updatedBy: userId
    });

    const updatedPackage = await Packages.findByPk(id, {
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
      message: "Package updated successfully",
      data: updatedPackage
    });
  } catch (error) {
    console.error("Error updating package:", error);
    handleError(error, res);
  }
};

// Delete Package
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package_ = await Packages.findByPk(id);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    await package_.destroy();

    res.status(200).json({
      success: true,
      message: "Package deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    handleError(error, res);
  }
};

// Add Discount to Package
export const addDiscount = async (req, res) => {
  try {
    const { packageId } = req.params;
    const { planName, name, percentage, startDate, startTime, endDate, endTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Validate required fields
    if (!planName || !name || typeof percentage !== 'number' || !startDate || !startTime || !endDate || !endTime) {
      return res.status(400).json({
        success: false,
        message: "All discount fields are required"
      });
    }

    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage must be between 0 and 100"
      });
    }

    // Validate dates
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);
    
    if (startDateTime >= endDateTime) {
      return res.status(400).json({
        success: false,
        message: "End date/time must be after start date/time"
      });
    }

    const package_ = await Packages.findByPk(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    const newDiscount = {
      planName,
      name,
      percentage,
      startDate,
      startTime,
      endDate,
      endTime,
      createdBy: userId,
      createdAt: new Date()
    };

    const currentDiscounts = package_.discounts || [];
    await package_.update({
      discounts: [...currentDiscounts, newDiscount],
      updatedBy: userId
    });

    res.status(201).json({
      success: true,
      message: "Discount added successfully",
      data: newDiscount
    });

  } catch (error) {
    console.error("Error adding discount:", error);
    handleError(error, res);
  }
};

// Remove Discount from Package
export const removeDiscount = async (req, res) => {
  try {
    const { packageId, discountId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const package_ = await Packages.findByPk(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    const currentDiscounts = package_.discounts || [];
    const updatedDiscounts = currentDiscounts.filter((d, index) => index !== parseInt(discountId));

    if (currentDiscounts.length === updatedDiscounts.length) {
      return res.status(404).json({
        success: false,
        message: "Discount not found"
      });
    }

    await package_.update({
      discounts: updatedDiscounts,
      updatedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Discount removed successfully"
    });

  } catch (error) {
    console.error("Error removing discount:", error);
    handleError(error, res);
  }
};

// Get All Discounts for a Package
export const getPackageDiscounts = async (req, res) => {
  try {
    const { packageId } = req.params;

    const package_ = await Packages.findByPk(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    res.status(200).json({
      success: true,
      data: package_.discounts || []
    });

  } catch (error) {
    console.error("Error fetching discounts:", error);
    handleError(error, res);
  }
};

// Update Discount
export const updateDiscount = async (req, res) => {
  try {
    const { packageId, discountId } = req.params;
    const { planName, name, percentage, startDate, startTime, endDate, endTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    const package_ = await Packages.findByPk(packageId);
    if (!package_) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    const currentDiscounts = package_.discounts || [];
    const discountIndex = parseInt(discountId);

    if (discountIndex < 0 || discountIndex >= currentDiscounts.length) {
      return res.status(404).json({
        success: false,
        message: "Discount not found"
      });
    }

    // Validate percentage if provided
    if (percentage !== undefined && (percentage < 0 || percentage > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage must be between 0 and 100"
      });
    }

    // Validate dates if provided
    if (startDate && startTime && endDate && endTime) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      
      if (startDateTime >= endDateTime) {
        return res.status(400).json({
          success: false,
          message: "End date/time must be after start date/time"
        });
      }
    }

    const updatedDiscount = {
      ...currentDiscounts[discountIndex],
      planName: planName || currentDiscounts[discountIndex].planName,
      name: name || currentDiscounts[discountIndex].name,
      percentage: percentage !== undefined ? percentage : currentDiscounts[discountIndex].percentage,
      startDate: startDate || currentDiscounts[discountIndex].startDate,
      startTime: startTime || currentDiscounts[discountIndex].startTime,
      endDate: endDate || currentDiscounts[discountIndex].endDate,
      endTime: endTime || currentDiscounts[discountIndex].endTime,
      updatedBy: userId,
      updatedAt: new Date()
    };

    currentDiscounts[discountIndex] = updatedDiscount;

    await package_.update({
      discounts: currentDiscounts,
      updatedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: updatedDiscount
    });

  } catch (error) {
    console.error("Error updating discount:", error);
    handleError(error, res);
  }
};

// Helper function to handle errors
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
      message: "Package name must be unique"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}; 