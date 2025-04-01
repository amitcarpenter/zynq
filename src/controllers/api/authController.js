import path from 'path';
import Joi from 'joi';
import ejs from 'ejs';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import Msg from '../../utils/message.js';
import { sendEmail } from '../../services/send_email.js';
import { handleError, handleSuccess, joiErrorHandle } from '../../utils/responseHandler.js';
import { get_admin_data_by, get_admin_data_by_email, get_admin_data_by_id, update_admin_data, update_admin_data_by, update_admin_password, update_admin_profile } from '../../models/api/auth.js';
import { insert_user_data } from '../../models/api/auth.js';
import { get_user_by_token } from '../../models/api/auth.js';
import { update_user_token_data } from '../../models/api/auth.js';
import { get_user_data_by_email } from '../../models/api/auth.js';
import { get_user_data_by_id } from '../../models/api/auth.js';
import { update_user_profile } from '../../models/api/auth.js';
import { update_user_data } from '../../models/api/auth.js';
import { get_user_data_by } from '../../models/api/auth.js';
import { update_user_data_by } from '../../models/api/auth.js';
import { update_user_password } from '../../models/api/auth.js';


const saltRounds = process.env.SALT_ROUNDS;
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = process.env.JWT_EXPIRY
const image_logo = process.env.LOGO_URL
const APP_URL = process.env.APP_URL


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();




export const generateVerificationLink = (token, baseUrl) => {
    return `${baseUrl}/api/verify-email?token=${token}`;
};


//======================================= Auth ============================================
export const register = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            mobile_number: Joi.string().required(),
            email: Joi.string().min(5).max(255).email({ tlds: { allow: false } }).lowercase().required(),
            password: Joi.string().min(8).max(15).required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { name, email, password, mobile_number } = value;

        const [existingUser] = await get_user_data_by_email(email);
        if (existingUser) {
            return handleError(res, 400, Msg.EMAIL_ALREADY_EXIST);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 3600000);

        const userId = await insert_user_data({ name, email, password: hashedPassword, show_password: password, verifyToken, verifyTokenExpiry, mobile_number });


        if (!userId) {
            return handleError(res, 500, Msg.REGISTRATION_FAILED);
        }

        const baseUrl = req.protocol + '://' + req.get('host');
        const verificationLink = generateVerificationLink(verifyToken, baseUrl);
        const emailTemplatePath = path.resolve(__dirname, "../../views/verifyAccount.ejs");
        const emailHtml = await ejs.renderFile(emailTemplatePath, { verificationLink, image_logo });
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: emailHtml,
        };
        await sendEmail(emailOptions);


        return handleSuccess(res, 200, Msg.REGISTRATION_SUCCESSFUL)

    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};


export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        console.log(token)
        if (typeof token !== 'string') {
            return handleError(res, 400, "Invalid token.");
        }
        let time_now = new Date()

        const [user] = await get_user_by_token(token, time_now)

        if (!user) {
            return res.render("sessionExpire.ejs")
        }
        const update_user = await update_user_token_data(user.user_id)
        return res.render("successRegister.ejs")
    } catch (error) {
        console.error('Error in verifyEmail:', error);
        return handleError(res, 500, error.message);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const schema = Joi.object({
            email: Joi.string().min(5).max(255).email({ tlds: { allow: false } }).lowercase().required(),
            password: Joi.string().min(8).max(15).required()
        });
        const result = schema.validate(req.body);
        if (result.error) return joiErrorHandle(res, result.error);
        const [existingUser] = await get_user_data_by_email(email);
        if (!existingUser) {
            console.log("here the user email ");

            return handleError(res, 400, Msg.INVALID_EMAIL_PASSWORD);
        }
        const isPasswordValid = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordValid) {
            console.log("here password");

            return handleError(res, 400, Msg.INVALID_EMAIL_PASSWORD);
        }
        const token = jwt.sign({ user_id: existingUser.user_id, email: existingUser.email }, JWT_SECRET, {
            expiresIn: JWT_EXPIRY
        });

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

export const social_login = async (req, res) => {
    try {
        const { email, name } = req.body;
        const schema = Joi.object({
            email: Joi.string().min(5).max(255).email({ tlds: { allow: false } }).lowercase().required(),
            name: Joi.string().required(),
        });
        const result = schema.validate(req.body);
        if (result.error) return joiErrorHandle(res, result.error);

        let hashedPassword = null;
        let password = null;
        let verifyToken = null;
        let verifyTokenExpiry = null;
        let mobile_number = null;

        let token = null

        const [existingUser] = await get_user_data_by_email(email);
        if (!existingUser) {
            const insert = await insert_user_data({ name, email, password: hashedPassword, show_password: password, verifyToken, verifyTokenExpiry, mobile_number });

            console.log(insert.insertId, "new_user");

            const [user] = await get_user_data_by_id(insert.insertId)

            token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, {
                expiresIn: JWT_EXPIRY
            });
        } else {
            token = jwt.sign({ user_id: existingUser.user_id, email: existingUser.email }, JWT_SECRET, {
                expiresIn: JWT_EXPIRY
            });
        }

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
        return res.render("resetPassword.ejs");
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
        if (error) return joiErrorHandle(res, error);
        const { email } = value;
        const [user] = await get_user_data_by_email(email);
        if (!user) {
            return handleError(res, 404, Msg.USER_NOT_FOUND);
        }

        if (user.is_verified === false) {
            return handleError(res, 400, Msg.VERIFY_EMAIL_FIRST);
        }
        const resetToken = crypto.randomBytes(32).toString("hex");

        const resetTokenExpiry = new Date(Date.now() + 3600000);

        const update_admin_datad = await update_user_data(resetToken, resetTokenExpiry, email)

        const resetLink = `${req.protocol}://${req.get("host")}/api/reset-password?token=${resetToken}`;
        const emailTemplatePath = path.resolve(__dirname, "../../views/forgotPassword.ejs");
        const emailHtml = await ejs.renderFile(emailTemplatePath, { resetLink, image_logo });
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: emailHtml,
        };
        await sendEmail(emailOptions);
        return handleSuccess(res, 200, Msg.PASSWORD_RESET_LINK_SENT(email));
    } catch (error) {
        console.log(error);

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
        if (error) return joiErrorHandle(res, error);
        const { token, newPassword } = value;

        const [user] = await get_user_data_by(token)
        if (!user) {
            return handleError(res, 400, Msg.INVALID_EXPIRED_TOKEN);
        }

        if (user.show_password === newPassword) {
            return handleError(res, 400, Msg.PASSWORD_CAN_NOT_SAME);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const update_result = await update_user_data_by(hashedPassword, newPassword, user.user_id)
        console.log(update_result, "update result api ");

        return handleSuccess(res, 200, Msg.PASSWORD_RESET_SUCCESS);

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
        const userReq = req.user;
        const [user] = await get_user_data_by_id(userReq.user_id)
        if (!user) {
            return handleError(res, 404, Msg.USER_NOT_FOUND);
        }
        if (user.profile_image && !user.profile_image.startsWith("http")) {
            user.profile_image = `${APP_URL}${user.profile_image}`;
        }

        return handleSuccess(res, 200, Msg.USER_PROFILE_FETCHED, user);
    } catch (error) {
        console.error("Error in getProfile:", error);
        return handleError(res, 500, error.message);
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updateProfileSchema = Joi.object({
            name: Joi.string().required(),
            mobile_number: Joi.string().required(),
        });

        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { name, mobile_number } = value;
        const userReq = req.user;
        const [user] = await get_user_data_by_id(userReq.user_id)
        if (!user) {
            return handleError(res, 404, Msg.USER_NOT_FOUND);
        }
        let profile_image = user.profile_image;
        if (req.file) {
            profile_image = req.file.filename;
        }
        const update_profile = await update_user_profile(name, profile_image, mobile_number, userReq.user_id)

        return handleSuccess(res, 200, "Profile updated successfully");
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const changePasswordSchema = Joi.object({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().required(),
        });

        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);


        const user = req.user;
        if (!user) {
            return handleError(res, 404, Msg.USER_NOT_FOUND);
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return handleError(res, 400, Msg.CURRENT_PASSWORD_INCORRECT);
        }

        if (user.show_password === newPassword) {
            return handleError(res, 400, Msg.PASSWORD_CAN_NOT_BE_SAME);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);


        const update_admin = await update_user_password(hashedPassword, newPassword, user.email)

        return handleSuccess(res, 200, Msg.PASSWORD_CHANGED_SUCCESSFULLY);
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};