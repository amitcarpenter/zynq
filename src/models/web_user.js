import db from "../config/db.js";

//======================================= Auth =========================================

export const get_web_user_by_id = async (id) => {
    try {
        return await db.query(`SELECT
            u.*, 
            r.role AS role_name
        FROM
            tbl_zqnq_users u
        JOIN
            tbl_roles r ON u.role_id = r.id
        WHERE
            u.id = ?`, [id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};

export const get_web_user_by_email = async (email) => {
    try {
        return await db.query(`SELECT
            u.*, 
            r.role AS role_name
        FROM
            tbl_zqnq_users u
        JOIN
            tbl_roles r ON u.role_id = r.id
        WHERE
            u.email = ?`, [email]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};


export const update_reset_token = async (reset_token, reset_token_expiry, email) => {
    try {
        return await db.query(`UPDATE tbl_zqnq_users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?`, [reset_token, reset_token_expiry, email]);
    } catch (error) {
        console.error("Database Error:", error.message);

    }
}