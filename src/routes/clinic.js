import express from 'express';
import { upload } from '../services/aws.s3.js';
import { authenticateUser } from '../middleware/auth.js';
import { uploadFile, uploadMultipleFiles } from '../services/multer.js';


//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/clinic/authController.js";



const router = express.Router();


//==================================== AUTH ==============================



export default router;
