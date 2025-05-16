
import express from 'express';
const router = express.Router();
import * as doctorController from "../controllers/doctor/profileController.js";
import { authenticate } from '../middleware/web_user_auth.js';
import { uploadCertificationFieldsTo, uploadFileTo } from '../services/doctor_multer.js';
;

router.get("/get_profile", authenticate(['CLINIC','DOCTOR']), doctorController.getDoctorProfile);

router.post("/add_personal_info",authenticate(['DOCTOR']), uploadFileTo('profile_images'),doctorController.addPersonalInformation);

const uploadVariousFields = uploadCertificationFieldsTo([
    { name: 'medical_council', maxCount: 1, subfolder: 'certifications' },
    { name: 'deramatology_board', maxCount: 1, subfolder: 'certifications' },
    { name: 'laser_safety', maxCount: 1, subfolder: 'certifications' },
]);

router.post('/add_education_experience',authenticate(['DOCTOR']), uploadVariousFields, doctorController.addEducationAndExperienceInformation);

router.post('/add_expertise',authenticate(['DOCTOR']), doctorController.addExpertise);

router.post('/update_fee_availability',authenticate(['DOCTOR']), doctorController.updateConsultationFeeAndAvailability);


export default router;