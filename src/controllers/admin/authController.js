import Joi from "joi";
import ejs, { name } from 'ejs';
import path from "path";
import crypto from "crypto";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { IUser } from "../../models/User";
import { User } from "../../entities/User";
import { IAdmin } from "../../models/Admin";
import { Admin } from "../../entities/Admin";
import { Request, Response } from "express";
import { getRepository, MoreThan } from "typeorm";
import { sendEmail } from "../../services/send_email.js";
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler";
import { getMessage } from "../../middlewares/i18n";


dotenv.config();

const APP_URL = process.env.APP_URL as string;
const image_logo = process.env.LOGO_URL as string;

const generateVerificationLink = (token: string, baseUrl: string) => {
  return `${baseUrl}/admin/verify-email?token=${token}`;
};

const generateAccessToken = (payload: {
  adminId: number;
  email: string;
}) => {
  const JWT_SECRET = process.env.JWT_SECRET as string;
  const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const register_admin = async (req: Request, res: Response) => {
  try {
    const registerSchema = Joi.object({
      name: Joi.string().required(),
      mobile_number: Joi.string().required().allow(""),
      email: Joi.string().required(),
      password: Joi.string().min(8).required(),
    });
    const { error, value } = registerSchema.validate(req.body);
    if (error) return joiErrorHandle(res, error);

    const { name, password, mobile_number, email } = value;
    const adminRepository = getRepository(Admin);

    const existEmail = await adminRepository.findOne({ where: { email } });
    if (existEmail) return handleError(res, 400,  getMessage("en", "EMAIL_ALREADY"));
  
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = adminRepository.create({
      name: name,
      mobile_number: mobile_number,
      email: email,
      password: hashedPassword,
      show_password: password,
      is_verified: true
    });

    await adminRepository.save(newAdmin);
    return handleSuccess(res, 201, getMessage("en", "ADMIN_CREATED"));
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const tokenSchema = Joi.object({
      token: Joi.string().required()
    })
    const { error, value } = tokenSchema.validate(req.query)
    if (error) return joiErrorHandle(res, error);
    const { token } = value

    console.log(token)

    const adminRepository = getRepository(Admin);
    const admin = await adminRepository.findOne({
      where: {
        verify_token: token,
        verify_token_expiry: MoreThan(new Date())
      }
    });

    if (!admin) {
      return res.render("sessionExpire.ejs")
    }
    admin.is_verified = true;
    admin.verify_token = null;
    admin.verify_token_expiry = null;
    await adminRepository.save(admin);

    return res.render("successRegister.ejs")
  } catch (error: any) {
    console.error('Error in verifyEmail:', error);
    return handleError(res, 500, error.message);
  }
};

export const login_admin = async (req: Request, res: Response) => {
  try {
    const loginSchema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
    });
    const { error, value } = loginSchema.validate(req.body);
    if (error) return joiErrorHandle(res, error);
    const { email, password } = value;
    const adminRepository = getRepository(Admin);
    const admin = await adminRepository.findOneBy({ email });
    
    if (!admin) return handleError(res, 404, getMessage("en", "ADMIN_NOT_FOUND"));
    let language = admin.language

    if (admin.is_verified == false) return handleError(res, 400, getMessage(language, "VERIFY_EMAIL_FIRST"));
  
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return handleError(res, 400, getMessage(language , "INVALID_CREDENTIAL"));
   
    const payload = { adminId: admin.admin_id, email: admin.email };
    const token = generateAccessToken(payload);
    admin.jwt_token = token;
    await adminRepository.save(admin);
    return handleSuccess(res, 200,getMessage(language , ""), token)
  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};

export const render_forgot_password_page = (req: Request, res: Response) => {
  try {
    return res.render("resetPasswordAdmin.ejs");
  } catch (error: any) {
    return handleError(res, 500, error.message)
  }
};

export const forgot_password = async (req: Request, res: Response) => {
  try {

    const forgotPasswordSchema = Joi.object({
      email: Joi.string().email().required(),
    });
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) return joiErrorHandle(res, error);
    const { email } = value;
    const adminRepository = getRepository(Admin)
    const admin = await adminRepository.findOneBy({ email });
    if (!admin) {
      return handleError(res, 404, "Admin Not Found")
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = new Date(Date.now() + 3600000);

    if (admin.is_verified == false) {
      return handleError(res, 400, "Please Verify your email first")
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);
    admin.reset_password_token = resetToken;
    admin.reset_password_token_expiry = resetTokenExpiry;
    await adminRepository.save(admin);
    const resetLink = `${req.protocol}://${req.get("host")}/admin/reset-password?token=${resetToken}`;
    const emailTemplatePath = path.resolve(__dirname, '../../views/forgotPassword.ejs');
    const emailHtml = await ejs.renderFile(emailTemplatePath, { resetLink, image_logo });
    const emailOptions = {
      to: email,
      subject: "Password Reset Request",
      html: emailHtml,
    };
    await sendEmail(emailOptions);
    return handleSuccess(res, 200, `Password reset link sent to your email (${email}).`);
  } catch (error: any) {
    console.error("Error in forgot password controller:", error);
    return handleError(res, 500, error.message);
  }
};

export const reset_password = async (req: Request, res: Response) => {
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
    const adminRepository = getRepository(Admin);
    const admin = await adminRepository.findOne({
      where: {
        reset_password_token: token,
        reset_password_token_expiry: MoreThan(new Date()),
      },
    });
    if (!admin) {
      return handleError(res, 400, "Invalid or expired token")
    }

    if (admin.show_password == newPassword) {
      return handleError(res, 400, "Password cannot be the same as the previous password.");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    admin.password = hashedPassword;
    admin.show_password = newPassword;
    admin.reset_password_token = null;
    admin.reset_password_token_expiry = null;
    await adminRepository.save(admin);
    return handleSuccess(res, 200, "Password reset successfully.",)
  } catch (error: any) {
    console.error("Error in reset password controller:", error);
    return handleError(res, 500, error.message);
  }
};

export const render_success_register = (req: Request, res: Response) => {
  return res.render("successRegister.ejs")
}

export const render_success_reset = (req: Request, res: Response) => {
  return res.render("successReset.ejs")
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const admin_req = req.admin as IAdmin;
    const adminRepository = getRepository(Admin);
    const admin = await adminRepository.findOneBy({ admin_id: admin_req.admin_id });
    if (!admin) {
      return handleError(res, 404, "Admin Not Found")
    }
    if (admin.profile_image && !admin.profile_image.startsWith("http")) {
      admin.profile_image = `${APP_URL}${admin.profile_image}`;
    }
    return handleSuccess(res, 200, "Admin profile fetched successfully", admin);
  } catch (error: any) {
    return handleError(res, 500, error.message)
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const updateProfileSchema = Joi.object({
      name: Joi.string().required(),
      mobile_number: Joi.string().required(),
    });

    console.log(req.body)
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return joiErrorHandle(res, error)
    const { name, mobile_number } = value;
    const admin_req = req.admin as IAdmin;
    const adminRepository = getRepository(Admin);

    const admin = await adminRepository.findOne({ where: { admin_id: admin_req.admin_id } });
    if (!admin) {
      return handleError(res, 404, "Admin Not Found")
    }
    if (name) admin.name = name;
    if (mobile_number) admin.mobile_number = mobile_number;
    if (req.file) {
      let profile_image = "";
      profile_image = req.file.filename;
      admin.profile_image = profile_image;
    }
    await adminRepository.save(admin);
    return handleSuccess(res, 200, "Profile updated successfully");

  } catch (error: any) {
    return handleError(res, 500, error.message);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    });
    const { error } = changePasswordSchema.validate(req.body);
    if (error) return joiErrorHandle(res, error)
    const admin_req = req.admin as IAdmin;
    const { currentPassword, newPassword } = req.body;
    const adminRepository = getRepository(Admin);

    const admin = await adminRepository.findOneBy({ admin_id: admin_req.admin_id });
    if (!admin) {
      return handleError(res, 404, "Admin Not Found")
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return handleError(res, 400, "Current password is incorrect")
    }
    if (admin.show_password == newPassword) {
      return handleError(res, 400, "Password cannot be the same as the previous password.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.show_password = newPassword;
    await adminRepository.save(admin);
    return handleSuccess(res, 200, "Password changed successfully")
  } catch (error: any) {
    return handleError(res, 500, error.message)
  }
};

// // Dashboard details
// export const dashboard_details = async (req: Request, res: Response) => {
//   try {
//     const user_req = req.user as IUser;
//     const carBookingRepository = getRepository(CarBooking);
//     const userRepository = getRepository(User);

//     const completedPayments = await carBookingRepository.find({ where: { is_completed: true } });
//     console.log(completedPayments, "######################")
//     let totalRevenue = completedPayments.reduce((acc, booking) => acc + (Number(booking.total_cost) || 0), 0);

//     const pending_rides = await carBookingRepository.count({ where: { is_completed: false, is_booked: true, is_cancelled: false } });

//     const active_rides = await carBookingRepository.count({ where: { is_completed: false, is_booked: true, booking_status: "In Progress" } });

//     const userCount = (await userRepository.count({}));

//     let data = {
//       totalRevenue: totalRevenue || 0,
//       pending_rides: pending_rides || 0,
//       active_rides: active_rides || 0,
//       userCount: userCount || 0,
//     };

//     return handleSuccess(res, 200, "Dashboard Data Retrieved Successfully", data);
//   } catch (error: any) {
//     return handleSuccess(res, 500, error.message);
//   }
// };
