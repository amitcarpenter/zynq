import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import * as clinicModels from "../../models/clinic.js";
import * as webModels from "../../models/web_user.js";
import { sendEmail } from "../../services/send_email.js";
import { generateAccessToken, generateVerificationLink } from "../../utils/user_helper.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";
import twilio from 'twilio';


dotenv.config();

const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const WEB_JWT_SECRET = process.env.WEB_JWT_SECRET;


const daySchema = Joi.object({
    open: Joi.string().allow('').required(),
    close: Joi.string().allow('').required()
});


export const getProfile = async (req, res) => {
    try {
        const language = req.user.language;
        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(req.user.id)
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND");
        }
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
        return handleSuccess(res, 200, language, "CLINIC_PROFILE_FETCHED", clinic);
    } catch (error) {
        console.error("Error in getProfile:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

const calculateProfileCompletion = (data) => {
    const fields = [
        'zynq_user_id', 'clinic_name', 'org_number', 'email',
        'mobile_number', 'address', 'fee_range', 'website_url',
        'clinic_description'
    ];
    const percentPerField = 100 / fields.length;
    return fields.reduce((total, field) =>
        total + (data[field] ? percentPerField : 0), 0);
};

const buildClinicData = ({ zynq_user_id, clinic_name, org_number, email, mobile_number, address, fee_range, website_url, clinic_description, clinic_logo }) => {
    const data = {
        zynq_user_id,
        clinic_name,
        org_number,
        email,
        mobile_number,
        address,
        is_invited: 0,
        is_active: 1,
        onboarding_token: null,
        email_sent_count: 0,
        fee_range,
        website_url,
        clinic_description,
        clinic_logo
    };
    data.profile_completion_percentage = Math.round(calculateProfileCompletion(data));
    return data;
};

export const onboardClinic = async (req, res) => {
    try {
        const clinicSchema = Joi.object({
            zynq_user_id: Joi.string().required(),
            clinic_name: Joi.string().required(),
            clinic_description: Joi.string().required(),
            org_number: Joi.string().required(),
            email: Joi.string().email().required(),
            language: Joi.string().valid('en', 'sv').required(),
            mobile_number: Joi.string().required(),
            address: Joi.string().required(),
            street_address: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            zip_code: Joi.string().required(),
            latitude: Joi.number().required(),
            longitude: Joi.number().required(),
            website_url: Joi.string().uri(),
            fee_range: Joi.string().required(),
            treatments: Joi.array().items(Joi.string()).required(),
            clinic_timing: Joi.object({
                monday: daySchema.required(),
                tuesday: daySchema.required(),
                wednesday: daySchema.required(),
                thursday: daySchema.required(),
                friday: daySchema.required(),
                saturday: daySchema.required(),
                sunday: daySchema.required(),
            }).optional(),
            equipments: Joi.array().items(Joi.string()).required(),
            skin_types: Joi.array().items(Joi.string()).required(),
            severity_levels: Joi.array().items(Joi.string()).required(),
        });

        if (typeof req.body.clinic_timing === 'string') {
            try {
                req.body.clinic_timing = JSON.parse(req.body.clinic_timing);
            } catch (err) {
                return handleError(res, 400, "en", "Invalid JSON for clinic_timing");
            }
        }

        const { error, value } = clinicSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        let {
            zynq_user_id, clinic_name, org_number, email, mobile_number,
            address, street_address, city, state, zip_code, latitude, longitude,
            treatments, clinic_timing, website_url, clinic_description,
            equipments, skin_types, severity_levels, fee_range, language
        } = value;

        language = language || "en";

        await clinicModels.validateClinicDoesNotExist(zynq_user_id);

        const uploadedFiles = req.files;
        const clinic_logo = uploadedFiles.logo?.[0]?.filename;

        await clinicModels.validateClinicDoesNotExist(zynq_user_id);

        const clinicData = buildClinicData({
            zynq_user_id, clinic_name, org_number, email, mobile_number,
            address, fee_range, website_url, clinic_description, language,
            clinic_logo
        });


        await clinicModels.insertClinicData(clinicData);
        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(zynq_user_id);
        const clinic_id = clinic.clinic_id;


        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(async (file) => {
                const [certificationType] = await clinicModels.getCertificateTypeByFileName(file.fieldname);
                let certification_type_id = certificationType ? certificationType.certification_type_id : null;
                if (certification_type_id) {
                    const fileName = file.filename;
                    await clinicModels.insertClinicDocuments(clinic_id, certification_type_id, file.fieldname, fileName);
                }
            });
        }

        await clinicModels.insertClinicLocation({
            clinic_id, street_address, city, state,
            zip_code, latitude, longitude
        });

        await Promise.all([
            clinicModels.insertClinicTreatments(treatments, clinic_id),
            clinicModels.insertClinicOperationHours(clinic_timing, clinic_id),
            clinicModels.insertClinicEquipments(equipments, clinic_id),
            clinicModels.insertClinicSkinTypes(skin_types, clinic_id),
            clinicModels.insertClinicSeverityLevels(severity_levels, clinic_id)
        ]);

        return handleSuccess(res, 201, language, "CLINIC_ONBOARDED_SUCCESSFULLY");
    }
    catch (error) {
        console.error("Error in onboardClinic:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }


};

export const updateClinic = async (req, res) => {
    try {
        const schema = Joi.object({
            clinic_name: Joi.string().optional(),
            org_number: Joi.string().optional(),
            email: Joi.string().email().optional(),
            mobile_number: Joi.string().optional(),
            address: Joi.string().optional(),
            fee_range: Joi.string().optional(),
            website_url: Joi.string().uri().allow('').optional(),
            clinic_description: Joi.string().allow('').optional(),
            street_address: Joi.string().optional(),
            city: Joi.string().optional(),
            state: Joi.string().optional(),
            zip_code: Joi.string().optional(),
            latitude: Joi.number().optional(),
            longitude: Joi.number().optional(),
            treatments: Joi.array().items(Joi.string()).optional(),
            clinic_timing: Joi.object({
                monday: daySchema.required(),
                tuesday: daySchema.required(),
                wednesday: daySchema.required(),
                thursday: daySchema.required(),
                friday: daySchema.required(),
                saturday: daySchema.required(),
                sunday: daySchema.required(),
            }).optional(),
            equipments: Joi.array().items(Joi.string()).optional(),
            skin_types: Joi.array().items(Joi.string()).optional(),
            severity_levels: Joi.array().items(Joi.string()).optional(),
            language: Joi.string().valid('en', 'sv').optional()
        });

        if (typeof req.body.clinic_timing === 'string') {
            try {
                req.body.clinic_timing = JSON.parse(req.body.clinic_timing);
            } catch (err) {
                return handleError(res, 400, "en", "INVALID_JSON_FOR_CLINIC_TIMING");
            }
        }

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);


        const {
            clinic_name, org_number, email, mobile_number,
            address, fee_range, website_url, clinic_description,
            street_address, city, state, zip_code, latitude, longitude,
            treatments, clinic_timing, equipments, skin_types, severity_levels, language
        } = value;

        const uploadedFiles = req.files;
        const logoFile = uploadedFiles.find(file => file.fieldname === 'logo');
        const clinic_logo = logoFile?.filename;


        const zynq_user_id = req.user.id;

        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(zynq_user_id);
        if (!clinic) {
            return handleError(res, 404, language, "CLINIC_NOT_FOUND");
        }

        const clinic_id = clinic.clinic_id;

        const clinicData = buildClinicData({
            zynq_user_id, clinic_name, org_number, email, mobile_number,
            address, fee_range, website_url, clinic_description, language,
            clinic_logo
        });

        await clinicModels.updateClinicData(clinicData, clinic_id);

        await clinicModels.updateClinicLocation({
            clinic_id, street_address, city, state,
            zip_code, latitude, longitude
        });

        await Promise.all([
            clinicModels.updateClinicTreatments(treatments, clinic_id),
            clinicModels.updateClinicOperationHours(clinic_timing, clinic_id),
            clinicModels.updateClinicEquipments(equipments, clinic_id),
            clinicModels.updateClinicSkinTypes(skin_types, clinic_id),
            clinicModels.updateClinicSeverityLevels(severity_levels, clinic_id)
        ]);

        if (uploadedFiles.length > 0) {
            uploadedFiles.forEach(async (file) => {
                const [certificationType] = await clinicModels.getCertificateTypeByFileName(file.fieldname);
                let certification_type_id = certificationType ? certificationType.certification_type_id : null;
                if (certification_type_id) {
                    const fileName = file.filename;
                    await clinicModels.updateClinicDocuments(clinic_id, certification_type_id, file.fieldname, fileName);
                }
            });
        }

        return handleSuccess(res, 200, language, "CLINIC_PROFILE_UPDATED_SUCCESSFULLY");
    }
    catch (error) {
        console.error("Error in updateClinic:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getAllTreatments = async (req, res) => {
    try {
        const language = "en";
        const treatments = await clinicModels.getAllTreatments();
        if (!treatments.length) {
            return handleError(res, 404, language, "NO_TREATMENTS_FOUND");
        }
        return handleSuccess(res, 200, language, "TREATMENTS_FETCHED_SUCCESSFULLY", treatments);
    }
    catch (error) {
        console.error("Error in getAllTreatments:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getClinicEquipments = async (req, res) => {
    try {
        const language = "en";
        const equipments = await clinicModels.getAllClinicEquipments();
        if (!equipments.length) {
            return handleError(res, 404, language, "NO_EQUIPMENTS_FOUND");
        }
        return handleSuccess(res, 200, language, "EQUIPMENTS_FETCHED_SUCCESSFULLY", equipments);
    }
    catch (error) {
        console.error("Error in getClinicEquipments:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getAllRoles = async (req, res) => {
    try {
        const language = "en";
        const roles = await clinicModels.getAllRoles();
        if (!roles.length) {
            return handleError(res, 404, language, "NO_ROLES_FOUND");
        }
        return handleSuccess(res, 200, language, "ROLES_FETCHED_SUCCESSFULLY", roles);
    }
    catch (error) {
        console.error("Error in getAllRoles:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getClinicSkinTypes = async (req, res) => {
    try {
        const language = "en";
        const skinTypes = await clinicModels.getAllSkinTypes();
        if (!skinTypes.length) {
            return handleError(res, 404, language, "NO_SKIN_TYPES_FOUND");
        }
        return handleSuccess(res, 200, language, "SKIN_TYPES_FETCHED_SUCCESSFULLY", skinTypes);
    }
    catch (error) {
        console.error("Error in getClinicSkinTypes:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getClinicSeverityLevels = async (req, res) => {
    try {
        const language = "en";
        const severityLevels = await clinicModels.getAllSeverityLevels();
        if (!severityLevels.length) {
            return handleError(res, 404, language, "NO_SEVERITY_LEVELS_FOUND");
        }
        return handleSuccess(res, 200, language, "SEVERITY_LEVELS_FETCHED_SUCCESSFULLY", severityLevels);
    }
    catch (error) {
        console.error("Error in getClinicSeverityLevels:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
};

export const getCertificateType = async (req, res) => {
    try {
        const language = "en";
        const documents = await clinicModels.getCertificateType();
        if (!documents.length) {
            return handleError(res, 404, language, "NO_CERTIFICATE_TYPE_FOUND");
        }
        return handleSuccess(res, 200, language, "CERTIFICATE_TYPE_FETCHED_SUCCESSFULLY", documents);
    }
    catch (error) {
        console.error("Error in getCertificateType:", error);
        return handleError(res, 500, "en", 'INTERNAL_SERVER_ERROR');
    }
}