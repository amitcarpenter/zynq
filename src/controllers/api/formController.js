import path from 'path';
import Joi from 'joi';
import ejs from 'ejs';
import dotenv from 'dotenv';
import axios from "axios";
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import Msg from '../../utils/message.js';
import { sendEmail } from '../../services/send_email.js';
import { handleError, handleSuccess, joiErrorHandle } from '../../utils/responseHandler.js';
import { get_form_data, get_form_data_by_id, insert_form_data, update_form_data_in_db } from '../../models/api/form.js';



const saltRounds = process.env.SALT_ROUNDS;
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = process.env.JWT_EXPIRY
const image_logo = process.env.LOGO_URL
const APP_URL = process.env.APP_URL


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();


export const add_form_data = async (req, res) => {
    try {
        const schema = Joi.object({
            describe_of_land: Joi.any().optional().allow("", null),
            treatment_plant_details: Joi.any().optional().allow("", null),
            treatment_plant_status: Joi.any().optional().allow("", null),
            land_application_area: Joi.any().optional().allow("", null),
            tests_to_be_completed_every_service: Joi.any().optional().allow("", null),
            annual_testing: Joi.any().optional().allow("", null),
            service_procedure: Joi.any().optional().allow("", null),
            owners_details: Joi.any().optional().allow("", null),
            service_technician_details: Joi.any().optional().allow("", null),
            declaration: Joi.any().optional().allow("", null),
        });
        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration } = value



        await insert_form_data(describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration)


        return handleSuccess(res, 200, Msg.FORM_DATA_ADDED)
    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};

export const update_form_data = async (req, res) => {
    try {
        const schema = Joi.object({
            form_service_id: Joi.number().required(),
            describe_of_land: Joi.any().optional().allow("", null),
            treatment_plant_details: Joi.any().optional().allow("", null),
            treatment_plant_status: Joi.any().optional().allow("", null),
            land_application_area: Joi.any().optional().allow("", null),
            tests_to_be_completed_every_service: Joi.any().optional().allow("", null),
            annual_testing: Joi.any().optional().allow("", null),
            service_procedure: Joi.any().optional().allow("", null),
            owners_details: Joi.any().optional().allow("", null),
            service_technician_details: Joi.any().optional().allow("", null),
            declaration: Joi.any().optional().allow("", null),
        });
        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration, form_service_id } = value



        const [form_data] = await get_form_data_by_id(form_service_id)
        if (!form_data) {
            return handleError(res, 404, Msg.FORM_DATA_NOT_FOUND)
        } else {
            await update_form_data_in_db(describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration, form_service_id)
        }

        return handleSuccess(res, 200, Msg.FORM_DATA_UPDATED)
    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};

export const get_form_data_api = async (req, res) => {
    try {
        let form_data = await get_form_data()
        return handleSuccess(res, 200, Msg.GET_FORM_DATA, form_data)
    } catch (error) {
        console.error(error);
        return handleError(res, 500, error.message);
    }
};