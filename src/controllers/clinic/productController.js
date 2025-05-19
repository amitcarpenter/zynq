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



export const addProduct = async (req, res) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            price: Joi.number().required(),
            short_description: Joi.string().optional().allow('', null),
            full_description: Joi.string().optional().allow('', null),
            feature_text: Joi.string().optional().allow('', null),
            size_label: Joi.string().optional().allow('', null),
            benefit_text: Joi.string().optional().allow('', null),
            how_to_use: Joi.string().optional().allow('', null),
            ingredients: Joi.string().optional().allow('', null),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return joiErrorHandle(error, res);
        }

        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(req.user.id);
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND");
        }

        if (req.files.length > 0) {
            const image_url = req.files[0].filename;
            value.image_url = image_url;
        }

        const productData = {
            clinic_id: clinic.clinic_id,
            ...value
        };

        await clinicModels.insertProduct(productData);

        return handleSuccess(res, 201, "en", "PRODUCT_ADDED_SUCCESSFULLY");

    } catch (error) {
        console.error("Error in addProduct:", error);
        return handleError(res, 500, "en", "INTERNAL_SERVER_ERROR");
    }
};


export const getAllProducts = async (req, res) => {
    try {
        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(req.user.id);
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND");
            }   

        const products = await clinicModels.get_all_products(clinic.clinic_id);

        if (products.length === 0) {
            return handleError(res, 404, "en", "NO_PRODUCTS_FOUND");
        }
        products.forEach(product => {
            if(product.image_url && !product.image_url.startsWith('http')) {
                product.image_url = APP_URL + '/clinic/product_image/' + product.image_url;
            }
        });

        return handleSuccess(res, 200, "en", "PRODUCTS_FETCHED_SUCCESSFULLY", products);
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        return handleError(res, 500, "en", "INTERNAL_SERVER_ERROR");
    }
};

export const updateProduct = async (req, res) => {
    try {
        const schema = Joi.object({
            product_id: Joi.string().required(),
            name: Joi.string().optional().allow('', null),
            price: Joi.number().optional().allow('', null),
            short_description: Joi.string().optional().allow('', null),
            full_description: Joi.string().optional().allow('', null),
            feature_text: Joi.string().optional().allow('', null),
            size_label: Joi.string().optional().allow('', null),
            benefit_text: Joi.string().optional().allow('', null),
            how_to_use: Joi.string().optional().allow('', null),
            ingredients: Joi.string().optional().allow('', null),
        });

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
   

        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(req.user.id);
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND"); 
        }

        const [product] = await clinicModels.get_product_by_id(value.product_id);
        if (!product) {
            return handleError(res, 404, "en", "PRODUCT_NOT_FOUND");
        }       

        if(req.files.length > 0) {
            const image_url = req.files[0].filename;
            value.image_url = image_url;
        }

        await clinicModels.updateProduct(value, product.product_id);

        return handleSuccess(res, 200, "en", "PRODUCT_UPDATED_SUCCESSFULLY");       
    } catch (error) {
        console.error("Error in updateProduct:", error);
        return handleError(res, 500, "en", "INTERNAL_SERVER_ERROR");
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const schema = Joi.object({
            product_id: Joi.string().required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const [clinic] = await clinicModels.get_clinic_by_zynq_user_id(req.user.id);
        if (!clinic) {
            return handleError(res, 404, "en", "CLINIC_NOT_FOUND");
        }       

        const [product] = await clinicModels.get_product_by_id(value.product_id);
        if (!product) {
            return handleError(res, 404, "en", "PRODUCT_NOT_FOUND");
        }

        await clinicModels.deleteProduct(value.product_id);

        return handleSuccess(res, 200, "en", "PRODUCT_DELETED_SUCCESSFULLY");
        
    } catch (error) {
        
    }
}
