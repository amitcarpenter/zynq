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


export const getProfile = async (req, res) => {
    try {
        console.log("req.user", req.user);

        const clinicReq = req.user;
        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(clinicReq.id)
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND");
        }
        if (clinic.profile_image && !clinic.profile_image.startsWith("http")) {
            clinic.profile_image = `${APP_URL}${clinic.profile_image}`;
        }
        return handleSuccess(res, 200, "en", "CLINIC_PROFILE_FETCHED", clinic);
    } catch (error) {
        console.error("Error in getProfile:", error);
        return handleError(res, 500, "en", error.message);
    }
};

const handleFileUploads = (files) => {
    const uploadedFiles = {};
    if (files && files.clinic_document) {
        uploadedFiles.clinic_document = files.clinic_document[0];
    }
    return uploadedFiles;
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

const buildClinicData = ({ zynq_user_id, clinic_name, org_number, email, mobile_number, address, fee_range, website_url, clinic_description }) => {
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
        clinic_description
    };
    data.profile_completion_percentage = Math.round(calculateProfileCompletion(data));
    return data;
};

const uploadFile = async (file) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    const filePath = path.join(uploadPath, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
};

export const onboardClinic = async (req, res) => {
    try {

        const daySchema = Joi.any({
            open: Joi.string().allow('').required(),
            close: Joi.string().allow('').required()
        });

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
            clinic_timing: Joi.any({
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

        const { error, value } = clinicSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, "en", error.details[0].message);
        }

        const {
            zynq_user_id, clinic_name, org_number, email, mobile_number,
            address, street_address, city, state, zip_code, latitude, longitude,
            treatments, clinic_timing, website_url, clinic_description,
            equipments, skin_types, severity_levels, fee_range, language
        } = value;

        await clinicModels.validateClinicDoesNotExist(zynq_user_id);

        const uploadedFiles = handleFileUploads(req.files);

        const clinicData = buildClinicData({
            zynq_user_id, clinic_name, org_number, email, mobile_number,
            address, fee_range, website_url, clinic_description, language
        });

        await clinicModels.insertClinicData(clinicData);
        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(zynq_user_id);
        const clinic_id = clinic.clinic_id;

        await clinicModels.insertClinicLocation({
            clinic_id, street_address, city, state,
            zip_code, latitude, longitude
        });

        console.log("treatments", treatments);
        await Promise.all([
            clinicModels.insertClinicTreatments(treatments, clinic_id),
            clinicModels.insertClinicOperationHours(clinic_timing, clinic_id),
            // clinicModels.insertClinicEquipments(equipments, clinic_id),
            // clinicModels.insertClinicSkinTypes(skin_types, clinic_id), 
            // clinicModels.insertClinicSeverityLevels(severity_levels, clinic_id)
        ]);

        // if (uploadedFiles.clinic_document) {
        //     const document_url = await uploadFile(uploadedFiles.clinic_document);
        //     await clinicModels.insertClinicDocument(clinic_id, document_url);
        // }

        return handleSuccess(res, 201, "en", "CLINIC_ONBOARDED_SUCCESSFULLY");
    }
    catch (error) {
        console.error("Error in onboardClinic:", error);
        return handleError(res, 500, "en", error.message);
    }


};



