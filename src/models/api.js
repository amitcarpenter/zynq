import db from "../../config/db.js";

export const get_admin_data_by_email = async (email) => {
    try {
        return await db.query(`SELECT * FROM tbl_admin WHERE email = ?`, [email]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch user data.");
    }
};
