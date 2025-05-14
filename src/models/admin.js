import db from "../config/db.js";


//======================================= Clinic =========================================
export const insert_clinic = async (clinic) => {
    try {
        return await db.query(
            `INSERT INTO tbl_clinics 
            (clinic_name, org_number, email, mobile_number, address, onboarding_token, is_invited) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                clinic.clinic_name,
                clinic.org_number,
                clinic.email,
                clinic.mobile_number,
                clinic.address,
                clinic.token,
                false
            ]
        );
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic data.");
    }
};


//======================================= Dashboard =========================================

export const get_clinics = async () => {
    try {
        return await db.query('SELECT * FROM `tbl_clinics`;');
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get dashboard clinic data.");
    }
};

export const get_doctors = async () => {
    try {
        return await db.query('SELECT * FROM `tbl_doctors`');
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get dashboard doctor data.");
    }
};

export const get_users = async () => {
    try {
        return await db.query('SELECT * FROM `tbl_users` WHERE is_active = true;');
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get dashboard users data.");
    }
};

export const get_latest_clinic = async () => {
    try {
        return await db.query('SELECT * FROM `tbl_clinics` ORDER BY clinic_id DESC;')
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get dashboard latest data.");
    }
};

//======================================= User Managment =========================================
export const get_users_managment = async (limit, offset, search) => {
    const users = await db.query('SELECT tbl_users.*, COUNT(tbl_face_scan_results.face_scan_result_id) AS total_ai_scan_done FROM tbl_users LEFT JOIN tbl_face_scan_results ON tbl_face_scan_results.user_id = tbl_users.user_id WHERE tbl_users.is_verified = true AND (tbl_users.full_name LIKE ? OR tbl_users.email LIKE ?) GROUP BY tbl_users.user_id ORDER BY tbl_users.created_at DESC LIMIT ? OFFSET ?', [`%${search}%`, `%${search}%`, limit, offset]);

    const total = await db.query(`SELECT COUNT(*) AS total FROM tbl_users WHERE full_name LIKE ? OR email LIKE ?`, [`%${search}%`, `%${search}%`]
    );

    return { users, total };
};

//======================================= Clinic Managment =========================================

export const get_clinic_managment = async (limit, offset, search) => {
    const users = await db.query('SELECT * FROM `tbl_clinics` ORDER BY tbl_clinics.created_at DESC LIMIT ? OFFSET ?', [limit, offset]);

    const total = await db.query(`SELECT COUNT(*) AS total FROM tbl_clinics`);

    return { users, total };
};

//======================================= Doctor Managment =========================================