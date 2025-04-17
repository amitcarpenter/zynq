import db from "../config/db.js";

//======================================= Auth =========================================

export const get_user_by_user_id = async (user_id) => {
    try {
        return await db.query(`SELECT * FROM tbl_users WHERE user_id = ?`, [user_id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch user data.");
    }
};

export const get_user_by_mobile_number = async (mobile_number) => {
    try {
        return await db.query(`SELECT * FROM tbl_users WHERE mobile_number = ?`, [mobile_number]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch user data.");
    }
};

export const create_user = async (mobile_number, otp = '', language) => {
    try {
        const userData = {
            mobile_number,
            otp,
            language,
            is_verified: 0,
            is_active: 1
        };
        return await db.query(`INSERT INTO tbl_users SET ?`, userData);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to create user.");
    }
};

export const update_user = async (user_data, user_id) => {
    try {
        return await db.query(
            `UPDATE tbl_users SET ? WHERE user_id = ?`,
            [user_data, user_id]
        );
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update user.");
    }
};

export const delete_user = async (user_id) => {
    try {
        return await db.query(
            `DELETE FROM tbl_users WHERE user_id = ?`,
            [user_id]
        );
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to delete user.");
    }
};


//======================================= Ai Prompt =========================================
export const get_prompt_data = async (prompt_type) => {
    try {
        return await db.query(`SELECT * FROM tbl_aiprompt WHERE prompt_type = ?`, [prompt_type]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch prompt data.");
    }
};

export const create_prompt = async (promptData) => {
    try {
        return await db.query(`INSERT INTO  tbl_aiprompt SET ?`, promptData);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to create prompt.");
    }
};

export const update_prompt = async (prompt_data, prompt_type) => {
    try {
        return await db.query(
            `UPDATE tbl_aiprompt SET ? WHERE prompt_type = ?`,
            [prompt_data, prompt_type]
        );
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update prompt.");
    }
};