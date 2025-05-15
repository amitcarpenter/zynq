import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken"
import * as clinicModels from "../../models/clinic.js";
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
        const [clinic] = await clinicModels.get_clinic_by_clinic_id(clinicReq.id)
        if (!clinic) {
            return handleError(res, 404, Msg.ADMIN_NOT_FOUND);
        }
        if (admin.profile_image && !admin.profile_image.startsWith("http")) {
            admin.profile_image = `${APP_URL}${admin.profile_image}`;
        }
        return handleSuccess(res, 200, Msg.ADMIN_PROFILE_FETCHED, admin);
    } catch (error) {
        console.error("Error in getProfile:", error);
        return handleError(res, 500, error.message);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updateProfileSchema = Joi.object({
            full_name: Joi.string().required(),
            mobile_number: Joi.string().required(),
        });

        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }

        const { full_name, mobile_number } = value;
        const adminReq = req.admin;
        const [admin] = await get_admin_data_by_id(adminReq.id)
        if (!admin) {
            return handleError(res, 404, Msg.ADMIN_NOT_FOUND);
        }
        let profile_image = admin.profile_image;
        if (req.file) {
            profile_image = req.file.filename;
        }
        console.log(profile_image);


        const update_profile = await update_admin_profile(full_name, profile_image, mobile_number, adminReq.id)

        return handleSuccess(res, 200, "Profile updated successfully");
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return handleError(res, 400, Msg.CUREENT_NEW_REQUIERED);
        }
        const admin = req.admin;
        if (!admin) {
            return handleError(res, 404, Msg.ADMIN_NOT_FOUND);
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return handleError(res, 400, Msg.CURRENT_PASSWORD_INCORRECT);
        }

        if (admin.show_password === newPassword) {
            return handleError(res, 400, Msg.PASSWORD_CAN_NOT_BE_SAME);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);


        const update_admin = await update_admin_password(hashedPassword, newPassword, admin.id)

        return handleSuccess(res, 200, Msg.PASSWORD_CHANGED_SUCCESSFULLY);
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};
