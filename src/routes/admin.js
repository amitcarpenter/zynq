import express from 'express';


//==================================== Import Controllers ==============================
import * as clinicControllers from "../controllers/admin/clinicController.js";
import { upload } from '../services/multer.js';


const router = express.Router();

router.post('/import-clinics-from-CSV', upload.single("file"), clinicControllers.import_clinics_from_CSV);


export default router;
