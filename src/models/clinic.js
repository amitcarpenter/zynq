import db from "../config/db.js";

//======================================= Auth =========================================

export const get_clinic_by_zynq_user_id = async (zynq_user_id) => {
    try {
        return await db.query(`SELECT * FROM tbl_clinics WHERE zynq_user_id = ?`, [zynq_user_id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};

export const get_zqnq_user_by_email = async (email) => {
    try {
        return await db.query(`SELECT * FROM tbl_zqnq_users WHERE email = ?`, [email]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch user data.");
    }
};

export const get_clinic_by_email = async (email) => {
    try {
        return await db.query(`SELECT * FROM tbl_clinics WHERE email = ?`, [email]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};
