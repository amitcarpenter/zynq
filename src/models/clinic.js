import db from "../config/db.js";

//======================================= Auth =========================================

export const get_clinic_by_clinic_id = async (clinic_id) => {
    try {
        return await db.query(`SELECT * FROM tbl_clinics WHERE clinic_id = ?`, [clinic_id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
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
