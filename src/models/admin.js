import db from "../config/db.js";

//======================================= Admin =========================================

export const findEmail = async (email) => {
    try {
        return await db.query('SELECT * FROM `tbl_admin` WHERE email = ?', [email]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get admin data.");
    }
};

export const updateData = async (admin_id, token, fcm_token) => {
    try {
        return await db.query('UPDATE `tbl_admin` SET jwt_token = ?, fcm_token = ? WHERE admin_id = ?', [token, fcm_token, admin_id]);
    } catch (error) {
        console.error("Update Error:", error.message);
        throw new Error("Failed to update admin token.");
    }
};

export const findById = async (admin_id) => {
    try {
        return await db.query('SELECT * FROM `tbl_admin` WHERE admin_id = ?', [admin_id])
    } catch (error) {
        console.error("Update Error:", error.message);
        throw new Error("Failed to update admin token.");
    }
};

export const updatePassword = async (admin_id, password) => {
    try {
        return await db.query('UPDATE `tbl_admin` SET password = ? WHERE admin_id = ?', [password, admin_id]);
    } catch (error) {
        console.error("Update Error:", error.message);
        throw new Error("Failed to update password.");
    }
}

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

export const get_latest_clinic = async (limit, offset) => {
    try {
        return await db.query('SELECT clinic_id, clinic_name, address, DATE_FORMAT(created_at, "%M %d, %Y") AS date_joined, profile_completion_percentage AS onboarding_progress FROM `tbl_clinics` ORDER BY created_at DESC LIMIT ? OFFSET ?;', [limit, offset])
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get dashboard latest data.");
    }
};

export const get_total_clinic_count = async () => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) AS total FROM `tbl_clinics`');

        return rows.total;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get total clinic count.");
    }
};

//======================================= User Managment =========================================
export const get_users_managment = async (limit, offset, search) => {
    try {
        const users = await db.query(`
        SELECT tbl_users.*, COUNT(tbl_face_scan_results.face_scan_result_id) AS total_ai_scan_done 
        FROM tbl_users 
        LEFT JOIN tbl_face_scan_results ON tbl_face_scan_results.user_id = tbl_users.user_id 
        WHERE tbl_users.is_verified = true AND (tbl_users.full_name LIKE ? OR tbl_users.email LIKE ?) 
        GROUP BY tbl_users.user_id 
        ORDER BY tbl_users.created_at DESC 
        LIMIT ? OFFSET ?
    `, [`%${search}%`, `%${search}%`, limit, offset]);

        const [countResult] = await db.query(`
        SELECT COUNT(*) AS total 
        FROM tbl_users 
        WHERE is_verified = true AND (full_name LIKE ? OR email LIKE ?)
    `, [`%${search}%`, `%${search}%`]);

        return { users, total: countResult.total };
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get user latest data.");
    }
};

export const update_user_status = async (user_id, is_active) => {
    try {
        return await db.query('UPDATE `tbl_users` SET `is_active`= "' + is_active + '" WHERE user_id = "' + user_id + '"')
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update user status.");
    }
};

//======================================= Clinic Managment =========================================

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

export const get_clinic_managment = async (limit, offset, search) => {
    try {
        const searchQuery = `%${search}%`;

        const users = await db.query(
            `SELECT * FROM tbl_clinics 
         WHERE clinic_name LIKE ? OR email LIKE ? OR mobile_number LIKE ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, searchQuery, limit, offset]
        );

        const totalResult = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_clinics 
         WHERE clinic_name LIKE ? OR email LIKE ? OR mobile_number LIKE ?`,
            [searchQuery, searchQuery, searchQuery]
        );

        const total = totalResult[0]?.total || 0;

        return { users, total };
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get clinic latest data.");
    }
};

//======================================= Doctor Managment =========================================

export const get_doctors_management = async (limit, offset, search) => {
    try {
        const searchQuery = `%${search}%`;

        const doctors = await db.query(
            `SELECT * FROM tbl_doctors 
         WHERE name LIKE ? OR email LIKE ? OR specialization LIKE ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
            [searchQuery, searchQuery, searchQuery, limit, offset]
        );

        const totalResult = await db.query(
            `SELECT COUNT(*) AS total FROM tbl_doctors 
         WHERE name LIKE ? OR email LIKE ? OR specialization LIKE ?`,
            [searchQuery, searchQuery, searchQuery]
        );

        const total = totalResult[0]?.total || 0;

        return { doctors, total };
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor latest data.");
    }
};