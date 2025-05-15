import Joi from "joi";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import * as apiModels from "../../models/api.js";
import * as adminModels from "../../models/admin.js";
import { sendEmail } from "../../services/send_email.js";
import { generateAccessToken } from "../../utils/user_helper.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const login = async (req, res) => {
    try {
        const loginSchema = Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            fcm_token: Joi.string().required()
        });

        const { error, value } = loginSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { email, password, fcm_token } = value;

        const findEmail = await adminModels.findEmail(email);
        if (!findEmail) return handleError(res, 404, "en", "USER_NOT_FOUND_OR_INVALID_EMAIL");

        const user = findEmail[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return handleError(res, 401, "en", "INVALID_CREDENTIALS");

        const token = generateAccessToken({ id: user.admin_id });

        await adminModels.updateData(user.admin_id, token, fcm_token);

        return handleSuccess(res, 200, "en", "LOGIN_SUCCESS", {
            token,
            user: {
                id: user.admin_id,
                name: user.full_name,
                email: user.email
            },
        });
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const forgetSchema = Joi.object({
            email: Joi.string().email().required()
        });

        const { error, value } = forgetSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { email } = value;

        const userResult = await adminModels.findEmail(email);
        if (!userResult || userResult.length === 0) return handleError(res, 404, 'en', 'USER_NOT_FOUND_OR_INVALID_EMAIL');

        const user = userResult[0];

        const token = generateAccessToken({ id: user.admin_id });

        await adminModels.updateData(user.admin_id, token, user.fcm_token);

        const resetLink = process.env.LOCAL_APP_URL + `admin/reset-password/${token}`;

        const html = await ejs.renderFile(path.join(__dirname, "../../views/resetPasswordAdmin.ejs"), { resetLink });

        await sendEmail({
            to: email,
            subject: "Reset Your Password",
            html,
        });

        return handleSuccess(res, 200, "en", "RESET_LINK_SENT_IN_EMAIL");
    } catch (error) {
        console.error(error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};

export const renderResetPasswordPage = async (req, res) => {
    const forgetSchema = Joi.object({
        token: Joi.string().required()
    });

    const { error, value } = forgetSchema.validate(req.params);
    if (error) return joiErrorHandle(res, error);

    const { token } = value;

    res.render("forgetPasswordAdmin.ejs", { token });
};

export const resetPassword = async (req, res) => {
    const { token, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
        return res.send("Passwords do not match.");
    }

    const result = await db.query(
        "SELECT * FROM tbl_admin WHERE reset_token = ? AND reset_token_expiry > NOW()",
        [token]
    );

    if (!result || result[0].length === 0) {
        return res.send("Invalid or expired token.");
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
        "UPDATE tbl_admin SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?",
        [hashedPassword, token]
    );

    res.send("Password reset successful. You can now login.");
};

export const login_with_mobile = async (req, res) => {
    try {
        const sendOtpSchema = Joi.object({
            mobile_number: Joi.string().required(),
            language: Joi.string().valid('sv', 'en').optional().allow("", null),
        });

        const { error, value } = sendOtpSchema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { mobile_number, language } = value;
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        let [user] = await apiModels.get_user_by_mobile_number(mobile_number);

        if (!user) {
            await apiModels.create_user(mobile_number, otp, language);
            [user] = await apiModels.get_user_by_mobile_number(mobile_number);
        }

        if (user && !user.is_active) {
            return handleError(res, 400, language, 'ADMIN_DEACTIVATION');
        }

        let user_data = {
            otp, language
        }

        await apiModels.update_user(user_data, user.user_id);
        return handleSuccess(res, 200, language, "VERIFICATION_OTP", otp);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};