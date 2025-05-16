import express from 'express';
const router = express.Router();

//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/admin/authController.js"
import * as dashboardControllers from "../controllers/admin/dashboardController.js";
import * as userControllers from "../controllers/admin/userController.js";
import * as clinicControllers from "../controllers/admin/clinicController.js";
import * as doctorControllers from "../controllers/admin/doctorController.js";
import { upload } from '../services/multer.js';
import { authenticate } from '../middleware/web_user_auth.js';

//==================================== Authentication ==============================
router.post('/login', authControllers.login);
router.post('/forgot-password', authControllers.forgotPassword);
router.get('/reset-password/:token', authControllers.renderResetPasswordPage);
router.post('/reset-password', authControllers.resetPassword);
router.get('/success-change', authControllers.successChange);
router.get('/get-profile', authenticate, authControllers.successChange);

//==================================== Dashboard ==============================
router.get('/get-dashboard', dashboardControllers.get_dashboard);

//==================================== User Managment ==============================
router.get('/get-users-managment', userControllers.get_users_managment);
router.post('/update-user-status', userControllers.update_user_status);

//==================================== Clinic Managment ==============================
router.post('/import-clinics-from-CSV', upload.single("file"), clinicControllers.import_clinics_from_CSV);
router.get('/get-clinic-managment', clinicControllers.get_clinic_managment);

//==================================== Doctor Managment ==============================
router.get('/get-dcotors-managment', doctorControllers.get_dcotors_managment);

export default router;
