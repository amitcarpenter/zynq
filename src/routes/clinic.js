import express from 'express';
import { upload } from '../services/aws.s3.js';
import { authenticate } from '../middleware/web_user_auth.js';
import { uploadDynamicClinicFiles } from '../services/clinic_multer.js';
import * as clinicModels from '../models/clinic.js';

//==================================== Import Controllers ==============================
import * as authControllers from "../controllers/clinic/authController.js";


const router = express.Router();


const getFieldsFn = async (req) => {
    const certificationType = await clinicModels.getCertificateType();
    if (certificationType.length === 0) {
        return [];
    }
    const dynamicFields = certificationType.map(type => ({
        name: type.file_name ? type.file_name.toLowerCase() : '',
        maxCount: 10
    }));
    dynamicFields.push({ name: 'logo', maxCount: 1 });
    return dynamicFields;
};

//==================================== AUTH ==============================
router.get("/get-profile", authenticate(['CLINIC', 'DOCTOR']), authControllers.getProfile);
router.post("/onboard-clinic", authenticate(['CLINIC']), uploadDynamicClinicFiles(getFieldsFn), authControllers.onboardClinic);
router.post("/update-clinic", authenticate(['CLINIC']), uploadDynamicClinicFiles(getFieldsFn), authControllers.updateClinic);


//==================================== Get Data For Onboarding ==============================
router.get("/get-treatments", authControllers.getAllTreatments);
router.get("/get-equipments", authControllers.getClinicEquipments);
router.get("/get-skin-types", authControllers.getClinicSkinTypes);
router.get("/get-severity-levels", authControllers.getClinicSeverityLevels);
router.get("/get-certificate-type", authControllers.getCertificateType);




//==================================== Roles ==============================
router.get("/get-roles", authControllers.getAllRoles);


// router.get("/get-skin-types", authenticate(['CLINIC', 'DOCTOR']), authControllers.getClinicSkinTypes);
// router.get("/get-severity-levels", authenticate(['CLINIC', 'DOCTOR']), authControllers.getClinicSeverityLevels);
// router.get("/get-documents", authenticate(['CLINIC', 'DOCTOR']), authControllers.getClinicDocuments);
// router.get("/get-location", authenticate(['CLINIC', 'DOCTOR']), authControllers.getClinicLocation);



export default router;
