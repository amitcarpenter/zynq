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
const CLINIC_JWT_SECRET = process.env.CLINIC_JWT_SECRET;


export const login_clinic = async (req, res) => {
    try {
        const schema = Joi.object({
            email: Joi.string().min(5).max(255).email({ tlds: { allow: false } }).lowercase().required(),
            password: Joi.string().min(8).max(15).required(),
            fcmToken: Joi.string().optional().allow("", null)
        });

        let language = 'en';

        const { error, value } = schema.validate(req.body);

        if (error) return joiErrorHandle(res, result.error);

        const { email, password, fcmToken } = value;

        const [existingclinic] = await clinicModels.get_clinic_by_email(email);
        if (!existingclinic) {
            return handleError(res, 400, language, "CLINIC_NOT_FOUND");
        }
        const isPasswordValid = await bcrypt.compare(password, existingclinic.password);
        if (!isPasswordValid) {
            return handleError(res, 400, Msg.INVALID_EMAIL_PASSWORD);
        }
        const token = jwt.sign({ clinic_id: existingclinic.clinic_id, email: existingclinic.email }, CLINIC_JWT_SECRET, {
            expiresIn: JWT_EXPIRY
        });
        let adminId = existingclinic.id
        await updateAdminFcmToken(fcmToken, adminId)
        return res.status(200).json({
            success: true,
            status: 200,
            message: Msg.LOGIN_SUCCESSFUL,
            token: token
        })
    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};

export const render_forgot_password_page = (req, res) => {
    try {
        return res.render("resetPasswordAdmin.ejs");
    } catch (error) {
        return handleError(res, 500, error.message)
    }
};

export const forgot_password = async (req, res) => {
    try {
        const forgotPasswordSchema = Joi.object({
            email: Joi.string().email().required(),
        });
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { email } = value;
        const [admin] = await get_admin_data_by_email(email);
        if (!admin) {
            return handleError(res, 404, Msg.ADMIN_NOT_FOUND);
        }

        if (admin.is_verified === false) {
            return handleError(res, 400, Msg.VERIFY_EMAIL_FIRST);
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        console.log(email);

        const resetTokenExpiry = new Date(Date.now() + 3600000);

        const update_admin_datad = await update_admin_data(resetToken, resetTokenExpiry, email)
        console.log(update_admin_datad, "update_admin_datad");

        const resetLink = `${req.protocol}://${req.get("host")}/api/admin/reset-password?token=${resetToken}`;
        const emailTemplatePath = path.resolve(__dirname, "../views/forgotPasswordAdmin.ejs");
        const emailHtml = await ejs.renderFile(emailTemplatePath, { resetLink, image_logo });
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: emailHtml,
        };
        await sendEmail(emailOptions);
        return handleSuccess(res, 200, Msg.PASSWORD_RESET_LINK_SENT(email));
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const reset_password = async (req, res) => {
    try {
        const resetPasswordSchema = Joi.object({
            token: Joi.string().required(),
            newPassword: Joi.string().min(8).required().messages({
                "string.min": "Password must be at least 8 characters long",
                "any.required": "New password is required",
            }),
        });
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error) {
            return handleError(res, 400, error.details[0].message);
        }
        const { token, newPassword } = value;

        const [admin] = await get_admin_data_by(token)
        if (!admin) {
            return handleError(res, 400, Msg.INVALID_EXPIRED_TOKEN);
        }
        if (admin.show_password === newPassword) {
            return handleError(res, 400, Msg.PASSWORD_CAN_NOT_SAME);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const update_result = await update_admin_data_by(hashedPassword, newPassword, admin.id)

        if (update_result.affectedRows > 0) {
            return handleSuccess(res, 200, Msg.PASSWORD_RESET_SUCCESS);
        } else {
            return handleError(res, 500, Msg.PASSWORD_RESET_FAILED);
        }
    } catch (error) {
        console.error("Error in reset password controller:", error);
        return handleError(res, 500, error.message);
    }
};

export const render_success_reset = (req, res) => {
    return res.render("successReset.ejs")
}

export const getProfile = async (req, res) => {
    try {
        const adminReq = req.admin;
        const [admin] = await get_admin_data_by_id(adminReq.id)
        if (!admin) {
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
