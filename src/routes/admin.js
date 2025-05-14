import express from 'express';
const router = express.Router();


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/admin/authController.js"
import * as dashboardControllers from "../controllers/admin/dashboardController.js";
import * as userControllers from "../controllers/admin/userController.js";
import * as clinicControllers from "../controllers/admin/clinicController.js";
import * as doctorControllers from "../controllers/admin/doctorController.js";


import { upload } from '../services/multer.js';


//==================================== Dashboard ==============================
router.get('/get-dashboard', dashboardControllers.get_dashboard);


//==================================== User Managment ==============================
router.get('/get-users-managment', userControllers.get_users_managment);


//==================================== Clinic Managment ==============================
router.post('/import-clinics-from-CSV', upload.single("file"), clinicControllers.import_clinics_from_CSV);
router.get('/get-clinic-managment', clinicControllers.get_clinic_managment);

//==================================== Driver Managment ==============================

export default router;
