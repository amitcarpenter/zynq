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


