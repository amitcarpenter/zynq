import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import * as clinicModels from "../../models/clinic.js";
import * as userModels from "../../models/api.js";
import { sendEmail } from "../../services/send_email.js";
import { generateAccessToken, generatePassword, generateVerificationLink } from "../../utils/user_helper.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;



export const get_all_clinics = async (req, res) => {
    try {
        const clinics = await userModels.getAllClinics();
        if (!clinics || clinics.length === 0) {
            return handleError(res, 404, 'en', "NO_CLINICS_FOUND");
        }
        clinics.forEach(async (clinic) => {
            // Get all related clinic data using separate model functions
            const [clinicLocation] = await clinicModels.getClinicLocation(clinic.clinic_id);
            clinic.location = clinicLocation;

            const treatments = await clinicModels.getClinicTreatments(clinic.clinic_id);
            clinic.treatments = treatments;

            const operationHours = await clinicModels.getClinicOperationHours(clinic.clinic_id);
            clinic.operation_hours = operationHours;

            const equipments = await clinicModels.getClinicEquipments(clinic.clinic_id);
            clinic.equipments = equipments;

            const skinTypes = await clinicModels.getClinicSkinTypes(clinic.clinic_id);
            clinic.skin_types = skinTypes;

            const severityLevels = await clinicModels.getClinicSeverityLevels(clinic.clinic_id);
            clinic.severity_levels = severityLevels;

            const documents = await clinicModels.getClinicDocuments(clinic.clinic_id);
            documents.forEach(document => {
                if (document.file_url && !document.file_url.startsWith("http")) {
                    document.file_url = `${APP_URL}${document.file_url}`;
                }
            });
            clinic.documents = documents;


            if (clinic.clinic_logo && !clinic.clinic_logo.startsWith("http")) {
                clinic.clinic_logo = `${APP_URL}${clinic.clinic_logo}`;
            }
        });
        return handleSuccess(res, 200, language, "CLINIC_PROFILE_FETCHED", clinics);

    } catch (error) {
        console.error("Error fetching doctors:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};
