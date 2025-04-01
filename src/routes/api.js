import express from 'express';
import { uploadFile } from '../services/uploadImage.js';
import { authenticateUser } from '../middleware/auth.js';


//==================================== Import Controllers ==============================
import * as authController from "../controllers/api/authController.js";
import * as formControllers from "../controllers/api/formController.js";


const router = express.Router();


//==================================== AUTH ==============================
router.post('/register', authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post('/login', authController.login);
router.post('/social-login', authController.social_login);
router.get('/profile', authenticateUser, authController.getProfile);
router.post('/forgot-password', authController.forgot_password);
router.get('/reset-password', authController.render_forgot_password_page);
router.get('/success-reset', authController.render_success_reset);
router.post('/reset-password', authController.reset_password);
router.post('/change-password', authenticateUser, authController.changePassword);
router.post('/update-profile', authenticateUser, uploadFile, authController.updateProfile);


//==================================== Form Data ==============================
router.post('/add-form-data', formControllers.add_form_data);
router.post('/update-form-data', formControllers.update_form_data);
router.get('/get-form-data', formControllers.get_form_data_api);






export default router;
