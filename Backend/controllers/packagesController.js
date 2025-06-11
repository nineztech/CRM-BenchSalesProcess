import Packages from "../models/packagesModel.js";
import User from "../models/userModel.js";

// Add Package
export const addPackage = async (req, res) => {
  try {
    const { planName, enrollmentCharge, offerLetterCharge, features, discounts } = req.body;
    const userId = req.user?.id;

    if (!planName || !enrollmentCharge || !offerLetterCharge) {
      return res.status(400).json({
        success: false,
        message: "Plan name, enrollment charge, and offer letter charge are required"
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
        discountsArray = discounts;
      } else {
        discountsArray = [discounts];
      }
    }

    const newPackage = await Packages.create({
      planName: planName.trim(),
      enrollmentCharge,
      offerLetterCharge,
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
    const { planName, enrollmentCharge, offerLetterCharge, features, discounts, status } = req.body;
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
        discountsArray = discounts;
      } else {
        discountsArray = [discounts];
      }
    }

    await package_.update({
      planName: planName?.trim() || package_.planName,
      enrollmentCharge: enrollmentCharge || package_.enrollmentCharge,
      offerLetterCharge: offerLetterCharge || package_.offerLetterCharge,
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