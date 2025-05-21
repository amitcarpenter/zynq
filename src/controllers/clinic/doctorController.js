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
import { generateAccessToken, generatePassword, generateVerificationLink } from "../../utils/user_helper.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;

export const sendDoctorInvitation = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().email().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return joiErrorHandle(error, res);
        }

        const { email } = value;

        const [existingUser] = await webModels.get_web_user_by_email(email);
        if (existingUser) {
            return handleError(res, 400, 'en', "EMAIL_ALREADY_EXISTS");
        }

        const roles = await clinicModels.getAllRoles();
        const doctorRole = roles.find(role => role.role === 'DOCTOR');
        if (!doctorRole) {
            return handleError(res, 404, 'en', "DOCTOR_ROLE_NOT_FOUND");
        }

        const password = generatePassword(email);
        const hashedPassword = await bcrypt.hash(password, 10);

        const doctorData = {
            email,
            password: hashedPassword,
            show_password: password,
            role_id: doctorRole.id,
            created_at: new Date(),
        };

        await webModels.create_web_user(doctorData);

        const [newWebUser] = await webModels.get_web_user_by_email(email);

        const doctorTableData = {
            zynq_user_id: newWebUser.id,
            created_at: new Date(),
        };
        await clinicModels.create_doctor(doctorTableData);

        const [newDoctor] = await clinicModels.get_doctor_by_zynq_user_id(newWebUser.id);

        // Map doctor to clinic
        const clinicMapData = {
            doctor_id: newDoctor.doctor_id,
            clinic_id: req.user.clinicData.clinic_id,
            assigned_at: new Date()
        };
        await clinicModels.create_doctor_clinic_map(clinicMapData);


        const emailTemplatePath = path.resolve(__dirname, "../../views/doctor_invite/en.ejs");
        const emailHtml = await ejs.renderFile(emailTemplatePath, {
            email,
            password,
            image_logo
        });

        const emailOptions = {
            to: email,
            subject: "Doctor Invitation",
            html: emailHtml
        };

        await sendEmail(emailOptions);
        return handleSuccess(res, 200, 'en', "INVITATION_SENT_SUCCESSFULLY");

    } catch (error) {
        console.error("Error sending doctor invitation:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const getAllDoctors = async (req, res) => {
    try {
        const clinic_id = req.user.clinicData.clinic_id;
        const doctors = await clinicModels.get_all_doctors_by_clinic_id(clinic_id);
        if (!doctors || doctors.length === 0) {
            return handleSuccess(res, 200, 'en', "DOCTORS_FETCHED_SUCCESSFULLY", []);
        }
        // Get additional doctor data for each doctor
        for (const doctor of doctors) {
            // Get doctor availability
            const availability = await clinicModels.getDoctorAvailability(doctor.doctor_id);
            doctor.availability = availability || null;

            // Get doctor certifications
            const certifications = await clinicModels.getDoctorCertifications(doctor.doctor_id);
            certifications.forEach(certification => {
                if (certification.upload_path && !certification.upload_path.startsWith('http')) {
                    certification.upload_path = `${APP_URL}/doctors/certifications/${certification.upload_path}`;
                }
            });
            doctor.certifications = certifications || [];


            // Get doctor education history
            const education = await clinicModels.getDoctorEducation(doctor.doctor_id);
            doctor.education = education || [];

            // Get doctor work experience
            const experience = await clinicModels.getDoctorExperience(doctor.doctor_id);
            doctor.experience = experience || [];

            // Get doctor reviews
            const reviews = await clinicModels.getDoctorReviews(doctor.doctor_id);
            doctor.reviews = reviews || [];

            // Get doctor severity levels
            const severityLevels = await clinicModels.getDoctorSeverityLevels(doctor.doctor_id);
            doctor.severity_levels = severityLevels || [];

            // Get doctor skin types
            const skinTypes = await clinicModels.getDoctorSkinTypes(doctor.doctor_id);
            doctor.skin_types = skinTypes || [];

            // Get doctor treatments
            const treatments = await clinicModels.getDoctorTreatments(doctor.doctor_id);
            doctor.treatments = treatments || [];
        }
        doctors.forEach(doctor => {
            if (doctor.profile_image && !doctor.profile_image.startsWith('http')) {
                doctor.profile_image = `${APP_URL}doctor/profile_images/${doctor.profile_image}`;
            }
        });

        return handleSuccess(res, 200, 'en', "DOCTORS_FETCHED_SUCCESSFULLY", doctors);

    } catch (error) {
        console.error("Error fetching doctors:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const unlinkDoctor = async (req, res) => {
    try {
        const schema = Joi.object({
            doctor_id: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return joiErrorHandle(error, res);
        }
        const { doctor_id } = value;

        const clinic_id = req.user.clinicData.clinic_id;


        // Check if doctor exists and is linked to this clinic
        const [doctor] = await clinicModels.get_mapping_data_by_doctor_id(doctor_id);
        if (!doctor) {
            return handleError(res, 404, 'en', "DOCTOR_NOT_FOUND_OR_NOT_LINKED");
        }

       
             await clinicModels.delete_doctor_clinic_map(doctor_id);

        return handleSuccess(res, 200, 'en', "DOCTOR_UNLINKED_SUCCESSFULLY");

    } catch (error) {
        console.error("Error unlinking doctor:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

