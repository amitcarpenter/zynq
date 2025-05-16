
import express from 'express';
const router = express.Router();
import * as doctorController from "../controllers/doctor/profileController.js";
import { authenticate } from '../middleware/web_user_auth.js';
import { uploadFileTo } from '../services/doctor_multer.js';
;

// router.get("/get_profile", authenticate(['CLINIC','DOCTOR']), webControllers.getProfile);

router.post("/add_personal_info",authenticate(['DOCTOR']), uploadFileTo('profile_images'),doctorController.addPersonalInformation);

export default router;