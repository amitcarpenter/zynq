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

export const get_clinic_by_mobile_number = async (mobile_number) => {
    try {
        return await db.query(`SELECT * FROM tbl_clinics WHERE mobile_number = ?`, [mobile_number]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};

export const get_clinic_by_id = async (clinic_id) => {
    try {
        return await db.query(`SELECT * FROM tbl_clinics WHERE clinic_id = ?`, [clinic_id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic data.");
    }
};

export const update_clinic = async (clinicData, clinic_id) => {
    try {
        return await db.query('UPDATE tbl_clinics SET ? WHERE clinic_id = ?', [clinicData, clinic_id]);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic data.");
    }
};

export const update_clinic_location = async (locationData, clinic_id) => {
    try {
        const [existingLocation] = await db.query('SELECT * FROM tbl_clinic_locations WHERE clinic_id = ?', [clinic_id]);
        if (existingLocation) {
            return await db.query('UPDATE tbl_clinic_locations SET ? WHERE clinic_id = ?', [locationData, clinic_id]);
        } else {
            return await db.query('INSERT INTO tbl_clinic_locations SET ?', { ...locationData, clinic_id });
        }
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic location.");
    }
};

export const update_clinic_treatments = async (treatments, clinic_id) => {
    try {
        // First delete existing treatments
        await db.query('DELETE FROM tbl_clinic_treatments WHERE clinic_id = ?', [clinic_id]);
        
        // Then insert new treatments
        const treatmentPromises = treatments.map(treatment_id => {
            return db.query(
                'INSERT INTO tbl_clinic_treatments (clinic_id, treatment_id) VALUES (?, ?)',
                [clinic_id, treatment_id]
            );
        });
        
        return await Promise.all(treatmentPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic treatments.");
    }
};

export const update_clinic_timing = async (timing, clinic_id) => {
    try {
        // First delete existing timing
        await db.query('DELETE FROM tbl_clinic_operation_hours WHERE clinic_id = ?', [clinic_id]);
        
        // Then insert new timing
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timingPromises = daysOfWeek.map(day => {
            if (timing[day] && timing[day].open && timing[day].close) {
                return db.query(
                    'INSERT INTO tbl_clinic_operation_hours (clinic_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)',
                    [clinic_id, day, timing[day].open, timing[day].close]
                );
            }
            return null;
        }).filter(promise => promise !== null);
        
        return await Promise.all(timingPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic timing.");
    }
};

export const validateClinicDoesNotExist = async (zynq_user_id) => {
    const [existingClinic] = await get_clinic_by_zynq_user_id(zynq_user_id);
    if (existingClinic) {
        throw new Error("Clinic already exists.");
    }
};

export const insertClinicData = async (clinicData) => {
    try {
        const result = await db.query('INSERT INTO tbl_clinics SET ?', [clinicData]);
        console.log("result", result);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic data.");
    }
};

export const insertClinicLocation = async (locationData) => {
    try {
        const result = await db.query('INSERT INTO tbl_clinic_locations SET ?', [locationData]);
        return result.insertId;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic location.");
    }
};

export const insertClinicTreatments = async (treatments, clinic_id) => {
    try {
        if (!Array.isArray(treatments)) {
            throw new Error("Treatments must be an array");
        }
        
        const treatmentPromises = treatments.map(treatment_id => {
            return db.query(
                'INSERT INTO tbl_clinic_treatments (clinic_id, treatment_id) VALUES (?, ?)',
                [clinic_id, treatment_id]
            );
        });
        return await Promise.all(treatmentPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic treatments.");
    }
};

export const insertClinicOperationHours = async (timing, clinic_id) => {
    try {

        console.log("timing", timing);
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        const timingPromises = daysOfWeek.map(day => {
            const openTime = timing[day]?.open ?? '';
            const closeTime = timing[day]?.close ?? '';

            // Insert only if open or close time is non-empty string
            if (openTime.trim() !== '' || closeTime.trim() !== '') {
                return db.query(
                    'INSERT INTO tbl_clinic_operation_hours (clinic_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)',
                    [clinic_id, day, openTime, closeTime]
                );
            }
            return null;  // skip insertion if both are empty
        }).filter(Boolean);  // remove null entries

        return await Promise.all(timingPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic timing.");
    }
};


export const insertClinicEquipments = async (equipments, clinic_id) => {
    try {
        const equipmentPromises = equipments.map(equipment_id => {
            return db.query(
                'INSERT INTO tbl_clinic_equipments (clinic_id, equipment_id) VALUES (?, ?)',
                [clinic_id, equipment_id]
            );
        });
        return await Promise.all(equipmentPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic equipments.");
    }
};

export const insertClinicSkinTypes = async (skin_types, clinic_id) => {
    try {
        const skinTypePromises = skin_types.map(skin_type_id => {
            return db.query(
                'INSERT INTO tbl_clinic_skin_types (clinic_id, skin_type_id) VALUES (?, ?)',
                [clinic_id, skin_type_id]
            );
        });
        return await Promise.all(skinTypePromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic skin types.");
    }
};

export const insertClinicSeverityLevels = async (severity_levels, clinic_id) => {
    try {
        const severityLevelPromises = severity_levels.map(severity_level_id => {
            return db.query(
                'INSERT INTO tbl_clinic_severity_levels (clinic_id, severity_level_id) VALUES (?, ?)',
                [clinic_id, severity_level_id]
            );
        });
        return await Promise.all(severityLevelPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic severity levels.");
    }
};

export const insertClinicDocument = async (document_url, clinic_id) => {
    try {
        const [result] = await db.query('INSERT INTO tbl_clinic_documents (clinic_id, document_url) VALUES (?, ?)', [clinic_id, document_url]);
        return result.insertId;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic document.");
    }
};


