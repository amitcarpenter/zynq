import db from "../config/db.js";


export const get_doctor_by_zynquser_id = async (zynqUserId) => {
    try {
        return await db.query(`SELECT * FROM tbl_doctor WHERE zynq_user_id = ?`, [zynqUserId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch doctor by zynq user ID.");
    }
};

export const add_personal_details = async (zynqUserId, name, phone, profile_image) => {
    try {
        return await db.query(`INSERT INTO tbl_doctor (zynq_user_id, name, phone, profile_image) VALUES (?, ?, ?, ?)`, [zynqUserId, name, phone, profile_image]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to add doctor personal details.");
    }
};

export const create_doctor_profile = async (userId) => {
    try {
        return await db.query(`INSERT INTO tbl_doctor (user_id) VALUES (?)`, [userId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to create doctor profile.");
    }
};

export const add_education = async (doctorId, institute, degree, startDate, endDate) => {
    try {
        return await db.query(`INSERT INTO tbl_education (doctor_id, institute, degree, start_date, end_date) VALUES (?, ?, ?, ?, ?)`, [doctorId, institute, degree, startDate, endDate]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to add education.");
    }
};

export const update_education = async (educationId, institute, degree, startDate, endDate) => {
    try {
        return await db.query(`UPDATE tbl_education SET institute = ?, degree = ?, start_date = ?, end_date = ? WHERE education_id = ?`, [institute, degree, startDate, endDate, educationId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update education.");
    }
};

export const delete_education = async (educationId) => {
    try {
        return await db.query(`DELETE FROM tbl_education WHERE education_id = ?`, [educationId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to delete education.");
    }
};

export const get_doctor_education = async (doctorId) => {
    try {
        return await db.query(`SELECT * FROM tbl_education WHERE doctor_id = ?`, [doctorId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's education.");
    }
};

export const add_experience = async (doctorId, organization, designation, startDate, endDate) => {
    try {
        return await db.query(`INSERT INTO tbl_experience (doctor_id, organization, designation, start_date, end_date) VALUES (?, ?, ?, ?, ?)`, [doctorId, organization, designation, startDate, endDate]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to add experience.");
    }
};

export const update_experience = async (experienceId, organization, designation, startDate, endDate) => {
    try {
        return await db.query(`UPDATE tbl_experience SET organization = ?, designation = ?, start_date = ?, end_date = ? WHERE experience_id = ?`, [organization, designation, startDate, endDate, experienceId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update experience.");
    }
};

export const delete_experience = async (experienceId) => {
    try {
        return await db.query(`DELETE FROM tbl_experience WHERE experience_id = ?`, [experienceId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to delete experience.");
    }
};

export const get_doctor_experience = async (doctorId) => {
    try {
        return await db.query(`SELECT * FROM tbl_experience WHERE doctor_id = ?`, [doctorId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's experience.");
    }
};

export const update_doctor_services = async (doctorId, serviceIds) => {
    try {
        // Clear existing services
        await db.query(`DELETE FROM tbl_doctor_service WHERE doctor_id = ?`, [doctorId]);
        // Add new services
        const values = serviceIds.map(serviceId => [doctorId, serviceId]);
        if (values.length > 0) {
            return await db.query(`INSERT INTO tbl_doctor_service (doctor_id, service_id) VALUES ?`, [values]);
        }
        return null;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update doctor's services.");
    }
};

export const get_all_services = async () => {
    try {
        return await db.query(`SELECT * FROM tbl_service`);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get all services.");
    }
};

export const update_doctor_skin_types = async (doctorId, skinTypeIds) => {
    try {
        await db.query(`DELETE FROM tbl_doctor_skin_type WHERE doctor_id = ?`, [doctorId]);
        const values = skinTypeIds.map(skinTypeId => [doctorId, skinTypeId]);
        if (values.length > 0) {
            return await db.query(`INSERT INTO tbl_doctor_skin_type (doctor_id, skin_type_id) VALUES ?`, [values]);
        }
        return null;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update doctor's skin types.");
    }
};

export const get_all_skin_types = async () => {
    try {
        return await db.query(`SELECT * FROM tbl_skin_type`);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get all skin types.");
    }
};

export const update_doctor_severity_levels = async (doctorId, severityLevelIds) => {
    try {
        await db.query(`DELETE FROM tbl_doctor_severity_level WHERE doctor_id = ?`, [doctorId]);
        const values = severityLevelIds.map(severityLevelId => [doctorId, severityLevelId]);
        if (values.length > 0) {
            return await db.query(`INSERT INTO tbl_doctor_severity_level (doctor_id, severity_level_id) VALUES ?`, [values]);
        }
        return null;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update doctor's severity levels.");
    }
};

export const get_all_severity_levels = async () => {
    try {
        return await db.query(`SELECT * FROM tbl_severity_level`);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get all severity levels.");
    }
};

export const update_consultation_fee = async (doctorId, feePerSession, currency, sessionDurationMinutes) => {
    try {
        const [existingFee] = await db.query(`SELECT * FROM tbl_consultation_fee WHERE doctor_id = ?`, [doctorId]);
        if (existingFee.length > 0) {
            return await db.query(`UPDATE tbl_consultation_fee SET fee_per_session = ?, currency = ?, session_duration_minutes = ? WHERE doctor_id = ?`, [feePerSession, currency, sessionDurationMinutes, doctorId]);
        } else {
            return await db.query(`INSERT INTO tbl_consultation_fee (doctor_id, fee_per_session, currency, session_duration_minutes) VALUES (?, ?, ?, ?)`, [doctorId, feePerSession, currency, sessionDurationMinutes]);
        }
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update consultation fee.");
    }
};

export const get_doctor_consultation_fee = async (doctorId) => {
    try {
        const [fee] = await db.query(`SELECT * FROM tbl_consultation_fee WHERE doctor_id = ?`, [doctorId]);
        return fee[0];
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's consultation fee.");
    }
};

export const update_availability = async (doctorId, availabilityData) => {
    try {
        // Clear existing availability
        await db.query(`DELETE FROM tbl_availability WHERE doctor_id = ?`, [doctorId]);
        // Add new availability entries
        const values = availabilityData.map(avail => [doctorId, avail.day_of_week, avail.start_time, avail.end_time]);
        if (values.length > 0) {
            return await db.query(`INSERT INTO tbl_availability (doctor_id, day_of_week, start_time, end_time) VALUES ?`, [values]);
        }
        return null;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update availability.");
    }
};

export const get_doctor_availability = async (doctorId) => {
    try {
        return await db.query(`SELECT * FROM tbl_availability WHERE doctor_id = ?`, [doctorId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's availability.");
    }
};

export const add_certification = async (doctorId, certificationTypeId, uploadPath, issueDate, expiryDate, issuingAuthority) => {
    try {
        return await db.query(`INSERT INTO tbl_doctor_certification (doctor_id, certification_type_id, upload_path, issue_date, expiry_date, issuing_authority) VALUES (?, ?, ?, ?, ?, ?)`, [doctorId, certificationTypeId, uploadPath, issueDate, expiryDate, issuingAuthority]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to add certification.");
    }
};

export const get_doctor_certifications = async (doctorId) => {
    try {
        return await db.query(`
            SELECT
                dc.*,
                ct.name AS certification_name
            FROM
                tbl_doctor_certification dc
            JOIN
                tbl_certification_type ct ON dc.certification_type_id = ct.certification_type_id
            WHERE
                dc.doctor_id = ?
        `, [doctorId]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's certifications.");
    }
};

export const get_all_certification_types = async () => {
    try {
        return await db.query(`SELECT * FROM tbl_certification_type`);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get all certification types.");
    }
};

export const get_doctor_profile = async (doctorId) => {
    try {
        const [doctor] = await db.query(`SELECT * FROM tbl_doctor WHERE doctor_id = ?`, [doctorId]);
        const education = await get_doctor_education(doctorId);
        const experience = await get_doctor_experience(doctorId);
        const [services] = await db.query(`
            SELECT s.name FROM tbl_doctor_service ds
            JOIN tbl_service s ON ds.service_id = s.service_id
            WHERE ds.doctor_id = ?
        `, [doctorId]);
        const [skinTypes] = await db.query(`
            SELECT st.name FROM tbl_doctor_skin_type dst
            JOIN tbl_skin_type st ON dst.skin_type_id = st.skin_type_id
            WHERE dst.doctor_id = ?
        `, [doctorId]);
        const [severityLevels] = await db.query(`
            SELECT sl.name FROM tbl_doctor_severity_level dsl
            JOIN tbl_severity_level sl ON dsl.severity_level_id = sl.severity_level_id
            WHERE dsl.doctor_id = ?
        `, [doctorId]);
        const availability = await get_doctor_availability(doctorId);
        const consultationFee = await get_doctor_consultation_fee(doctorId);
        const certifications = await get_doctor_certifications(doctorId);

        return {
            doctor: doctor[0] || null,
            education: education[0] || [],
            experience: experience[0] || [],
            services: services.map(s => s.name) || [],
            skinTypes: skinTypes.map(st => st.name) || [],
            severityLevels: severityLevels.map(sl => sl.name) || [],
            availability: availability[0] || [],
            consultationFee: consultationFee || null,
            certifications: certifications[0] || []
        };
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to get doctor's complete profile.");
    }
};