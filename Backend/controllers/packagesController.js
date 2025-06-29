import Packages from "../models/packagesModel.js";
import User from "../models/userModel.js";

// Add Package
export const addPackage = async (req, res) => {
  try {
    const { 
      planName, 
      initialPrice,
      enrollmentCharge, 
      offerLetterCharge, 
      firstYearSalaryPercentage, 
      features, 
      discounts 
    } = req.body;
    const userId = req.user?.id;

    // Strict validation for required fields
    if (!planName || initialPrice === undefined || initialPrice === null || initialPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Plan name and initial price (greater than 0) are required"
      });
    }

    if (!enrollmentCharge || !offerLetterCharge) {
      return res.status(400).json({
        success: false,
        message: "Enrollment charge and offer letter charge are required"
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
        message: "Package with this name already exists"
      });
    }

    const newPackage = await Packages.create({
      planName: planName.trim(),
      initialPrice: Number(initialPrice),
      enrollmentCharge: Number(enrollmentCharge),
      offerLetterCharge: Number(offerLetterCharge),
      firstYearSalaryPercentage: Number(firstYearSalaryPercentage) || 0,
      features: features || [],
      discounts: discounts || [],
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
    
    const packageData = await Packages.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    res.status(200).json({
      success: true,
      data: packageData
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
    const { 
      planName, 
      initialPrice,
      enrollmentCharge, 
      offerLetterCharge, 
      firstYearSalaryPercentage, 
      features, 
      discounts,
      status 
    } = req.body;
    const userId = req.user?.id;

    const packageData = await Packages.findByPk(id);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    // Validate initialPrice and enrollmentCharge
    const newInitialPrice = initialPrice !== undefined ? Number(initialPrice) : packageData.initialPrice;
    const newEnrollmentCharge = enrollmentCharge !== undefined ? Number(enrollmentCharge) : packageData.enrollmentCharge;

    if (newInitialPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Initial price must be greater than 0"
      });
    }

    if (newEnrollmentCharge <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enrollment charge must be greater than 0"
      });
    }

    if (newInitialPrice < newEnrollmentCharge) {
      return res.status(400).json({
        success: false,
        message: "Initial price must be greater than or equal to enrollment charge"
      });
    }

    // Check if plan name is being changed and if it already exists
    if (planName && planName.trim() !== packageData.planName) {
      const existingPackage = await Packages.findOne({
        where: { planName: planName.trim() }
      });

      if (existingPackage) {
        return res.status(409).json({
          success: false,
          message: "Package with this name already exists"
        });
      }
    }

    // Validate firstYearSalaryPercentage
    if (firstYearSalaryPercentage !== undefined) {
      const newPercentage = Number(firstYearSalaryPercentage);
      if (newPercentage < 0 || newPercentage > 100) {
        return res.status(400).json({
          success: false,
          message: "First year salary percentage must be between 0 and 100"
        });
      }
    }

    // Update the package
    await packageData.update({
      planName: planName?.trim() || packageData.planName,
      initialPrice: newInitialPrice,
      enrollmentCharge: newEnrollmentCharge,
      offerLetterCharge: offerLetterCharge !== undefined ? Number(offerLetterCharge) : packageData.offerLetterCharge,
      firstYearSalaryPercentage: firstYearSalaryPercentage !== undefined ? Number(firstYearSalaryPercentage) : packageData.firstYearSalaryPercentage,
      features: features || packageData.features,
      discounts: discounts || packageData.discounts,
      status: status || packageData.status,
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
    
    const packageData = await Packages.findByPk(id);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
    }

    await packageData.destroy();

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
    const { name, percentage, startDate, startTime, endDate, endTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Validate required fields
    if (!name || typeof percentage !== 'number' || !startDate || !startTime || !endDate || !endTime) {
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

    // Get current discounts
    const currentDiscounts = package_.discounts || [];

    // Generate a unique ID for the new discount
    const newDiscountId = Date.now().toString();

    // Create new discount
    const newDiscount = {
      id: newDiscountId,
      name,
      percentage,
      startDate,
      startTime,
      endDate,
      endTime,
      createdBy: userId,
      createdAt: new Date()
    };

    // Calculate new discounted price
    let totalDiscountPercentage = 0;
    [...currentDiscounts, newDiscount].forEach(discount => {
      totalDiscountPercentage += discount.percentage;
    });

    // Calculate discounted price (subtract all discounts from enrollment charge)
    const enrollmentCharge = parseFloat(package_.enrollmentCharge);
    const discountAmount = (enrollmentCharge * totalDiscountPercentage) / 100;
    const newDiscountedPrice = Math.max(0, enrollmentCharge - discountAmount);

    // Update package with new discount and discounted price
    await package_.update({
      discounts: [...currentDiscounts, newDiscount],
      discountedPrice: newDiscountedPrice,
      updatedBy: userId
    });

    // Fetch the updated package with all its relations
    const updatedPackage = await Packages.findByPk(packageId, {
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
      message: "Discount added successfully",
      data: {
        discount: newDiscount,
        package: updatedPackage
      }
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
    const { name, percentage } = req.body;
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
    const discountIndex = currentDiscounts.findIndex(d => d.id === discountId);

    if (discountIndex === -1) {
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

    // Create updated discount object
    const updatedDiscount = {
      ...currentDiscounts[discountIndex],
      name: name || currentDiscounts[discountIndex].name,
      percentage: percentage !== undefined ? percentage : currentDiscounts[discountIndex].percentage,
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Update the discount in the array
    currentDiscounts[discountIndex] = updatedDiscount;

    // Calculate new discounted price
    let totalDiscountPercentage = 0;
    currentDiscounts.forEach(discount => {
      totalDiscountPercentage += discount.percentage;
    });

    // Calculate discounted price (subtract all discounts from enrollment charge)
    const enrollmentCharge = parseFloat(package_.enrollmentCharge);
    const discountAmount = (enrollmentCharge * totalDiscountPercentage) / 100;
    const newDiscountedPrice = Math.max(0, enrollmentCharge - discountAmount);

    // Update package with new discounts array and discounted price
    const updatedPackage = await package_.update({
      discounts: currentDiscounts,
      discountedPrice: newDiscountedPrice,
      updatedBy: userId
    });

    // Force a reload of the package to ensure we have the latest data
    await package_.reload();

    // Fetch the updated package with all its relations
    const refreshedPackage = await Packages.findByPk(packageId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstname', 'lastname', 'email']
        }
      ]
    });

    // Verify the update was successful
    if (!refreshedPackage.discounts || 
        !refreshedPackage.discounts.some(d => 
          d.id === discountId && 
          d.name === updatedDiscount.name && 
          d.percentage === updatedDiscount.percentage
        )) {
      // If update wasn't successful, try one more time with a direct update
      await Packages.update(
        {
          discounts: currentDiscounts,
          discountedPrice: newDiscountedPrice,
          updatedBy: userId
        },
        {
          where: { id: packageId }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Discount updated successfully",
      data: {
        discount: updatedDiscount,
        package: {
          id: refreshedPackage.id,
          planName: refreshedPackage.planName,
          initialPrice: refreshedPackage.initialPrice,
          discountedPrice: newDiscountedPrice,
          totalDiscountPercentage,
          discounts: refreshedPackage.discounts
        }
      }
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