import Joi from "joi";
import ejs from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client';
import { sendEmail } from "../../services/send_email.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";
import { generateAccessToken } from "../../utils/user_helper.js";


const prisma = new PrismaClient();

dotenv.config();

const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;


export const login_with_mobile = async (req, res) => {
    try {
        const sendOtpSchema = Joi.object({
            mobile_number: Joi.string().required(),
            language: Joi.string().valid('sv', 'en').optional().allow("", null),
        });

        const { error, value } = sendOtpSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { mobile_number, language } = value;

        let user = await prisma.user.findUnique({
            where: { mobile_number },
        });


        if (!user) {
            user = await prisma.user.create({
                data: {
                    mobile_number,
                    otp: "",
                    language: language,
                    is_verified: false,
                    is_active: true,
                },
            });
        }

        if (!user.is_active) {
            return handleError(res, 400, language, 'ADMIN_DEACTIVATION');
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: { otp, language },
        });
        return handleSuccess(res, 200, language, "VERIFICATION_OTP", otp);
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const login_with_otp = async (req, res) => {
    try {
        const loginOtpSchema = Joi.object({
            mobile_number: Joi.string().required(),
            otp: Joi.string().length(4).required(),
            language: Joi.string().valid("en", "sv").optional().allow("", null),
        });

        const { error, value } = loginOtpSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { mobile_number, otp, language } = value;

        let user = await prisma.user.findUnique({
            where: { mobile_number },
        });

        if (!user) {
            return handleError(res, 404, language, "USER_NOT_FOUND");
        }

        if (user.otp !== otp) {
            return handleError(res, 400, language, "INVALID_OTP");
        }

        const payload = { user_id: user.user_id, mobile_number: user.mobile_number };
        const token = generateAccessToken(payload);
        await prisma.user.update({
            where: { user_id: user.user_id },
            data: { otp, jwt_token: token, otp: "", is_verified: true },
        });
        return handleSuccess(res, 200, language, "LOGIN_SUCCESSFUL", token);
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = req.user;
        const language = req.user?.language;
        if (user.profile_image && !user.profile_image.startsWith("http")) {
            user.profile_image = `${APP_URL}${user.profile_image}`;
        }
        return handleSuccess(res, 200, language, "USER_PROFILE", user);
    } catch (error) {
        return handleError(res, 500, 'en', error.message)
    }
};

export const updateProfile = async (req, res) => {
    try {
        const updateProfileSchema = Joi.object({
            full_name: Joi.string().optional().allow("", null),
            gender: Joi.string().valid("Male", "Female", "Other").optional().allow("", null),
            age: Joi.number().optional().allow("", null),
            is_push_notification_on: Joi.boolean().optional().allow("", null),
            is_location_on: Joi.boolean().optional().allow("", null),
            fcm_token: Joi.string().optional().allow("", null),
        });

        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const user = req.user;
        const language = req.user?.language;

        const { full_name, gender, age, is_push_notification_on, is_location_on, fcm_token } = value;


        let profile_image = user.profile_image;
        if (req.file) {
            profile_image = req.file.filename;
            user.profile_image = profile_image;
        }

        await prisma.user.update({
            where: { user_id: user.user_id },
            data: { profile_image, age, full_name, gender, fcm_token, is_push_notification_on, is_location_on }
        })

        return handleSuccess(res, 200, language, "PROFILE_UPDATED");

    } catch (error) {
        return handleError(res, 'en', 500, error.message);
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return handleError(res, 400, "User ID is required.");
        }

        const user = await userRepository.findOne({ where: { user_id } });

        if (!user) {
            return handleError(res, 404, "User Account not found.");
        }

        await userRepository.delete(user_id);

        return handleSuccess(res, 200, "Account deleted successfully.");
    } catch (error) {
        return handleError(res, 500, error.message);
    }
};

export const render_terms_and_condition = (req, res) => {
    try {
        const schema = Joi.object({
            language: Joi.string().valid('en', 'sv').required()
        })
        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { language = 'en' } = value
        if (language == 'en') {
            return res.render("terms_and_condition_en.ejs");

        }
        if (language == 'sv') {
            return res.render("terms_and_condition_sv.ejs");
        }
    } catch (error) {
        console.error("Error rendering forgot password page:", error);
        return handleError(res, 500, "An error occurred while rendering the page")
    }
};

export const render_privacy_policy = (req, res) => {
    try {
        return res.render("privacy_policy.ejs");
    } catch (error) {
        console.error("Error rendering forgot password page:", error);
        return handleError(res, 500, "An error occurred while rendering the page")
    }
};

//==================================================================================================


export const register_with_email = async (req, res) => {
    try {
        const registerSchema = Joi.object({
            full_name: Joi.string().required(),
            email: Joi.string().required(),
            mobile_number: Joi.string().required(),
            password: Joi.string().min(8).required(),
            is_push_notification_on: Joi.boolean().required(),
        });
        const { error, value } = registerSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { full_name, password, email, is_push_notification_on, mobile_number } = value;
        let lower_email = email.toLowerCase();
        const userRepository = getRepository(User);

        const existEmail = await userRepository.findOne({ where: { email: lower_email } });
        if (existEmail) {
            return handleError(res, 400, "Email already exists.");
        }

        const existMobile = await userRepository.findOne({ where: { mobile_number: mobile_number } });
        if (existMobile) {
            return handleError(res, 400, "Mobile Number Already Exists.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 3600000);

        const newUser = userRepository.create({
            full_name: full_name,
            mobile_number: mobile_number,
            email: lower_email,
            password: hashedPassword,
            show_password: password,
            verify_token: verifyToken,
            verify_token_expiry: verifyTokenExpiry,
            is_push_notification_on: is_push_notification_on,
        });

        const baseUrl = req.protocol + '://' + req.get('host');
        const verificationLink = generateVerificationLink(verifyToken, baseUrl);
        const emailTemplatePath = path.resolve(__dirname, '../../views/verifyAccount.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { verificationLink, image_logo });

        const emailOptions = {
            to: lower_email,
            subject: "Verify Your Email Address",
            html: emailHtml,
        };

        await sendEmail(emailOptions);

        await userRepository.save(newUser);
        return handleSuccess(res, 201, `Verification link sent successfully to your email (${lower_email}). Please verify your account.`);
    } catch (error) {
        console.error('Error in register:', error);
        return handleError(res, 500, error.message);
    }
};