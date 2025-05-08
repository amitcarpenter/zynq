import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import base64url from 'base64url';
import { handleError, handleSuccess } from '../utils/responseHandler.js';


export const generateRandomString = async (length) => {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

export const generateVerificationLink = (token, baseUrl) => {
    return `${baseUrl}/api/verify-email?token=${token}`;
};

export const generateAccessToken = (payload) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRY = process.env.JWT_EXPIRY;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const generateToken = () => {
    return Math.random().toString(36).substr(2, 12);
}
