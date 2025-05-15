import express from 'express';
import { upload } from '../services/aws.s3.js';
import { authenticateUser } from '../middleware/auth.js';
import { uploadFile, uploadMultipleFiles } from '../services/multer.js';
import { authenticate } from '../middleware/web_user_auth.js';


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/clinic/authController.js";



const router = express.Router();


//==================================== AUTH ==============================
router.get("/get-profile",authenticate(['CLINIC','DOCTOR']), authControllers.getProfile);
router.post("/update-profile", authControllers.updateProfile);
router.post("/change-password", authControllers.changePassword);


export default router;
