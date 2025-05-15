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
