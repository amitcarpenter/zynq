import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from '@prisma/client';
import { handleError } from "../utils/responseHandler.js";

const prisma = new PrismaClient();


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
        console.log(decodedToken.mobile_number, "User Connected");

        const user = await prisma.user.findUnique({
            where: {
                user_id: decodedToken.user_id,
            },
        });
        if (!user) {
            return handleError(res, 404, "User Not Found")
        }
        req.user = user;
        next();
    } catch (error) {
        return handleError(res, 500, error.message)
    }
};


