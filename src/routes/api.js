import express from 'express';
import { uploadFile, uploadMultipleFiles } from '../services/uploadImage.js';
import { authenticateUser } from '../middleware/auth.js';


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/api/authController.js";


const router = express.Router();


//==================================== AUTH ==============================
router.post("/login-with-mobile", authControllers.login_with_mobile);
router.post("/login-with-otp", authControllers.login_with_otp);
router.get("/profile", authenticateUser, authControllers.getProfile);
router.post("/profile/update", authenticateUser, uploadFile, authControllers.updateProfile);
router.delete("/delete-account", authenticateUser, authControllers.deleteAccount);
router.get("/privacy-policy", authControllers.render_privacy_policy);
router.get("/terms-and-conditions", authControllers.render_terms_and_condition);




export default router;
