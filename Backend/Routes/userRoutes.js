import express from "express";
import {
  register,
  login,
  getProfile,
  logout,
  updateOwnStatus,
  getAllUsers,
  getUsersByDepartment,
  deleteUser,
  editUser,
  sendOtp,
  verifyOtp,
  resetPassword,
  updateUserStatus,
  toggleSpecialStatus,
  getSpecialUsers,
  getTeamLeadUsers,
} from "../controllers/userController.js";
import authenticateToken from "../middleware/auth.js";
import { sendPackageDetailsEmail } from "../utils/emailService.js";

const router = express.Router();

// User routes
router.post("/register", register);
router.post("/login", login);
router.get("/all", getAllUsers);
router.get("/special", getSpecialUsers);
router.get("/team-leads", authenticateToken, getTeamLeadUsers);
router.get("/department/:departmentId", getUsersByDepartment);
router.put("/:id", editUser);
router.delete("/:id", deleteUser);
router.get("/profile", getProfile);
router.post("/logout", logout);

// Status update route
router.patch("/:id/status", authenticateToken, updateUserStatus);

// Special status update route
router.patch("/:id/special-status", authenticateToken, toggleSpecialStatus);

// Password reset routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.post(
  "/email/send-package-details",
  authenticateToken,
  async (req, res) => {
    try {
      const { userData, packages } = req.body;
      const result = await sendPackageDetailsEmail(userData, packages);

      if (result) {
        res.json({
          success: true,
          message: "Package details email sent successfully",
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to send email" });
      }
    } catch (error) {
      console.error("Error sending package details email:", error);
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  }
);

export default router;
