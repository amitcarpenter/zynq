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

const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;

export const addPersonalInformation = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).max(255).required(),
            phone: Joi.string().min(3).max(255).required(),
        });

        const language = 'en';

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        let filename = '';
        if(req.file){
            filename = req.file.filename
        }
        console.log("req.user",req.user)
        const zynqUserId = req.user.id

        const [result] = await doctorModels.add_personal_details(zynqUserId,value.name, value.phone,filename);

        if (result.insertId) {
            return handleSuccess(res, 201, language, "DOCTOR_PERSONAL_DETAILS_ADDED", result.insertId);
        } else {
            return handleError(res, 500, 'Failed to add education.');
        }
    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};