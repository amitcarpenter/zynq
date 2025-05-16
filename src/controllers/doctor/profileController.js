import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import * as doctorModels from "../../models/doctor.js";
import { sendEmail } from "../../services/send_email.js";
import { generateAccessToken, generateVerificationLink } from "../../utils/user_helper.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";
import twilio from 'twilio';


dotenv.config();

//const APP_URL = process.env.APP_URL;
const APP_URL = process.env.LOCAL_APP_URL;
const image_logo = process.env.LOGO_URL;

export const addPersonalInformation = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(255).required(),
            phone: Joi.string().min(3).max(255).required(),
            age: Joi.string().min(3).max(255).required(),
            address: Joi.string().min(3).max(255).required(),
            gender: Joi.string().min(3).max(255).required(),
        });
        let language = 'en';

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        let filename = '';
        if (req.file) {
            filename = req.file.filename
        }
        console.log("req.user", req.user)
        const zynqUserId = req.user.id

        console.log("value", value)

        const result = await doctorModels.add_personal_details(zynqUserId, value.name, value.phone, value.age, value.address, value.gender, filename);
        console.log("result", result)
        if (result.affectedRows) {
            return handleSuccess(res, 201, language, "DOCTOR_PERSONAL_DETAILS_ADDED", result.affectedRows);
        } else {
            return handleError(res, 500, language, 'FAILED_TO_ADD_PERSONAL_DETAILS');
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const addEducationAndExperienceInformation = async (req, res) => {
    try {
        const schema = Joi.object({
            education: Joi.string().required(),   // will be JSON
            experience: Joi.string().required(), // will be JSON
        });

        let language = 'en';

        const payload = {
            education: req.body.education,
            experience: req.body.experience
        };

        const { error, value } = schema.validate(payload);
        if (error) return joiErrorHandle(res, error);

        const doctorId = req.user.doctorData.doctor_id;

        const educationList = JSON.parse(value.education);
        const experienceList = JSON.parse(value.experience);

        const files = req.files;
        for (const key in files) {
            const certType = await doctorModels.get_certification_type_by_filename(key)

            if (certType.length > 0) {
                const certification_type_id = certType[0].certification_type_id;

                for (const file of files[key]) {
                    console.log("file>>>>>>>", file)
                    await doctorModels.add_certification(doctorId, certification_type_id, file.filename)
                }
            }
        }

        // Save Education
        for (let edu of educationList) {
            await doctorModels.add_education(
                doctorId,
                edu.institute,
                edu.degree,
                edu.start_year,
                edu.end_year,

            );
        }

        // Save Experience
        for (let exp of experienceList) {
            await doctorModels.add_experience(
                doctorId,
                exp.organization,
                exp.designation,
                exp.start_date,
                exp.end_date
            );
        }

        return handleSuccess(res, 201, language, "DOCTOR_PROFILE_INFO_ADDED", {});
    } catch (error) {
        console.error(error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const addExpertise = async (req, res) => {
    try {
        const schema = Joi.object({
            treatment_ids: Joi.string().required(),
            skin_type_ids: Joi.string().required(),
            severity_levels_ids: Joi.string().required(),
        });

        let language = 'en';
        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const doctorId = req.user.doctorData.doctor_id;

        const treatmentIds = value.treatment_ids.split(',').map(id => id.trim());
        const skinTypeIds = value.skin_type_ids.split(',').map(id => id.trim());
        const severityLevelIds = value.severity_levels_ids.split(',').map(id => id.trim());

        // Call model functions to update each expertise
        await doctorModels.update_doctor_treatments(doctorId, treatmentIds);
        await doctorModels.update_doctor_skin_types(doctorId, skinTypeIds);
        await doctorModels.update_doctor_severity_levels(doctorId, severityLevelIds);

        return handleSuccess(res, 200, language, "EXPERTISE_UPDATED", {});
    } catch (error) {
        console.error(error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const updateConsultationFeeAndAvailability = async (req, res) => {
    try {
        const schema = Joi.object({
            fee_per_session: Joi.number().positive().required(),
            currency: Joi.string().min(1).max(10).default('INR'),
            session_duration: Joi.string().required(),
            availability: Joi.array().items(
                Joi.object({
                    day_of_week: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
                    start_time: Joi.string().required(),
                    end_time: Joi.string().required(),
                })
            ).required(),
        });
        const language = 'en'
        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const doctorId = req.user.doctorData.doctor_id;
        await doctorModels.update_consultation_fee(doctorId, value.fee_per_session, value.currency, value.session_duration);
        await doctorModels.update_availability(doctorId, value.availability);
      return handleSuccess(res, 200, language, "FEE_AVAILABILITY_UPDATED", {});
    } catch (error) {
        console.error(error);
          return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const getDoctorProfile = async (req, res) => {
    try {
        const language = 'en';
        const doctorId = req.user.doctorData.doctor_id; // Assuming doctorId is available in req.user

        const profileData = await doctorModels.get_doctor_profile(doctorId);

        // Apply URL prefix to profile image if it doesn't start with http
        if (profileData && profileData.profile_image && !profileData.profile_image.startsWith("http")) {
            profileData.profile_image = `${APP_URL}doctor/profile_images/${profileData.profile_image}`;
        }
        console.log("profileData.certifications",profileData.certifications)
        // Apply URL prefix to certification paths if they don't start with http
        if (profileData.certifications && Array.isArray(profileData.certifications)) {
            profileData.certifications.forEach(certification => {
                if (certification.upload_path && !certification.upload_path.startsWith("http")) {
                    certification.upload_path = `${APP_URL}doctor/certifications/${certification.upload_path}`;
                }
            });
        }

        return handleSuccess(res, 200, language, "DOCTOR_PROFILE_RETRIEVED", profileData);
    } catch (error) {
        console.error(error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};
