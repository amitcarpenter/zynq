import jwt from "jsonwebtoken";
import { handleError } from "../utils/responseHandler.js";
import express from "express";
import dotenv from "dotenv";
import { get_admin_data_by_id, get_user_data_by_id } from "../models/api/auth.js";


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;


export const authenticateUser = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return handleError(res, 401, "Unauthorized: No token provided")
        }
        const tokenParts = authorizationHeader.split(' ');
        if (tokenParts[0] !== 'Bearer' || tokenParts[1] === 'null' || !tokenParts[1]) {
            return handleError(res, 401, "Unauthorized: Invalid or missing token");
        }
        const token = tokenParts[1];
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return handleError(res, 401, "Unauthorized: Invalid token");
        }
        console.log(decodedToken.email, "User Connected");
        console.log(decodedToken, "decocde token");
        const [user] = await get_user_data_by_id(decodedToken.user_id)
        if (!user) {
            return handleError(res, 404, "User Not Found")
        }
        req.user = user;
        next();
    } catch (error) {
        return handleError(res, 500, error.message)
    }
};


