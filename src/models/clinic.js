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
        const severityLevelPromises = severity_levels.map(severity_id => {
            return db.query(
                'INSERT INTO tbl_clinic_severity_levels (clinic_id, severity_id) VALUES (?, ?)',
                [clinic_id, severity_id]
            );
        });
        return await Promise.all(severityLevelPromises);
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic severity levels.");
    }
};

export const insertClinicDocuments = async (clinic_id, certification_type_id, document_type, file_url) => {
    try {
        const result = await db.query('INSERT INTO tbl_clinic_documents (clinic_id, certification_type_id, document_type, file_url) VALUES (?, ?, ?, ?)', [clinic_id, certification_type_id, document_type, file_url]);
        return result.insertId;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert clinic document.");
    }
};

export const getAllTreatments = async () => {
    try {
        const treatments = await db.query('SELECT * FROM tbl_treatments');
        return treatments;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch treatments.");
    }
};

export const getClinicTreatments = async (clinic_id) => {
    try {
        const treatments = await db.query('SELECT t.* FROM tbl_treatments t ' +
            'INNER JOIN tbl_clinic_treatments ct ON t.treatment_id = ct.treatment_id ' +
            'WHERE ct.clinic_id = ?', [clinic_id]);
        return treatments;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch treatments.");
    }
};

export const getClinicOperationHours = async (clinic_id) => {
    try {
        const operationHours = await db.query('SELECT * FROM tbl_clinic_operation_hours WHERE clinic_id = ?', [clinic_id]);
        return operationHours;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch operation hours.");
    }
};

export const getClinicEquipments = async (clinic_id) => {
    try {
        const equipments = await db.query('SELECT e.* FROM tbl_equipments e ' +
            'INNER JOIN tbl_clinic_equipments ce ON e.equipment_id = ce.equipment_id ' +
            'WHERE ce.clinic_id = ?', [clinic_id]);
        return equipments;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch equipments.");
    }
};

export const getClinicSkinTypes = async (clinic_id) => {
    try {
        const skinTypes = await db.query('SELECT s.* FROM tbl_skin_types s ' +
            'INNER JOIN tbl_clinic_skin_types cst ON s.skin_type_id = cst.skin_type_id ' +
            'WHERE cst.clinic_id = ?', [clinic_id]);
        return skinTypes;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch skin types.");
    }
};

export const getClinicSeverityLevels = async (clinic_id) => {
    try {
        const severityLevels = await db.query('SELECT sl.* FROM tbl_severity_levels sl ' +
            'INNER JOIN tbl_clinic_severity_levels csl ON sl.severity_level_id = csl.severity_id ' +
            'WHERE csl.clinic_id = ?', [clinic_id]);
        return severityLevels;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch severity levels.");
    }
};

export const getClinicDocuments = async (clinic_id) => {
    try {
        const documents = await db.query('SELECT * FROM tbl_clinic_documents WHERE clinic_id = ?', [clinic_id]);
        return documents;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch documents.");
    }
};

export const getClinicLocation = async (clinic_id) => {
    try {
        const location = await db.query('SELECT * FROM tbl_clinic_locations WHERE clinic_id = ?', [clinic_id]);
        return location;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch location.");
    }
};

export const getClinicProfile = async (clinic_id) => {
    try {
        const clinic = await db.query('SELECT * FROM tbl_clinics WHERE clinic_id = ?', [clinic_id]);
        return clinic;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch clinic profile.");
    }
};

export const getAllClinicEquipments = async () => {
    try {
        const equipments = await db.query('SELECT * FROM tbl_equipments');
        return equipments;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch equipments.");
    }
};

export const getAllRoles = async () => {
    try {
        const roles = await db.query('SELECT * FROM tbl_roles');
        return roles;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch roles.");
    }
};

export const getAllSkinTypes = async () => {
    try {
        const skinTypes = await db.query('SELECT * FROM tbl_skin_types');
        return skinTypes;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch skin types.");
    }
};

export const getAllSeverityLevels = async () => {
    try {
        const severityLevels = await db.query('SELECT * FROM tbl_severity_levels');
        return severityLevels;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch severity levels.");
    }
};

export const getCertificateType = async () => {
    try {
        const documents = await db.query('SELECT * FROM tbl_certification_type WHERE file_name IS NOT NULL');
        return documents;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch certificate type.");
    }
};

export const updateClinicData = async (clinicData, clinic_id) => {
    try {
        const result = await db.query('UPDATE tbl_clinics SET ? WHERE clinic_id = ?', [clinicData, clinic_id]);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic data.");
    }
};

export const updateClinicLocation = async (locationData, clinic_id) => {
    try {
        const result = await db.query('UPDATE tbl_clinic_locations SET ? WHERE clinic_id = ?', [locationData, clinic_id]);
        return result;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic location.");
    }
};

export const updateClinicTreatments = async (treatments, clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinic_treatments WHERE clinic_id = ?', [clinic_id]);
        if (!treatments || treatments.length === 0) return;
        const values = treatments.map(treatment_id => [clinic_id, treatment_id]);
        await db.query('INSERT INTO tbl_clinic_treatments (clinic_id, treatment_id) VALUES ?', [values]);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic treatments.");
    }
};

export const updateClinicOperationHours = async (clinic_timing, clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinic_operation_hours WHERE clinic_id = ?', [clinic_id]);
        const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const timingPromises = daysOfWeek.map(day => {
            const openTime = clinic_timing[day]?.open ?? '';
            const closeTime = clinic_timing[day]?.close ?? '';

            if (openTime.trim() !== '' || closeTime.trim() !== '') {
                return db.query(
                    'INSERT INTO tbl_clinic_operation_hours (clinic_id, day_of_week, open_time, close_time) VALUES (?, ?, ?, ?)',
                    [clinic_id, day, openTime, closeTime]
                );
            }
            return null;
        }).filter(Boolean);
        return await Promise.all(timingPromises);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic operation hours.");
    }
};

export const updateClinicEquipments = async (equipments, clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinic_equipments WHERE clinic_id = ?', [clinic_id]);
        if (!equipments || equipments.length === 0) return;
        const values = equipments.map(equipment_id => [clinic_id, equipment_id]);
        await db.query('INSERT INTO tbl_clinic_equipments (clinic_id, equipment_id) VALUES ?', [values]);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic equipments.");
    }
};

export const updateClinicSkinTypes = async (skin_types, clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinic_skin_types WHERE clinic_id = ?', [clinic_id]);
        if (!skin_types || skin_types.length === 0) return;
        const values = skin_types.map(skin_type_id => [clinic_id, skin_type_id]);
        await db.query('INSERT INTO tbl_clinic_skin_types (clinic_id, skin_type_id) VALUES ?', [values]);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic skin types.");
    }
};

export const updateClinicSeverityLevels = async (severity_levels, clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinic_severity_levels WHERE clinic_id = ?', [clinic_id]);
        if (!severity_levels || severity_levels.length === 0) return;
        const values = severity_levels.map(severity_id => [clinic_id, severity_id]);
        await db.query('INSERT INTO tbl_clinic_severity_levels (clinic_id, severity_id) VALUES ?', [values]);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic severity levels.");
    }
};

export const updateClinicDocuments = async (clinic_id, certification_type_id, document_type, file_url) => {
    try {
        const result = await db.query('UPDATE tbl_clinic_documents SET file_url = ? WHERE clinic_id = ? AND certification_type_id = ? AND document_type = ?', [file_url, clinic_id, certification_type_id, document_type]);
        return result;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update clinic documents.");
    }
};

export const deleteClinicData = async (clinic_id) => {
    try {
        await db.query('DELETE FROM tbl_clinics WHERE clinic_id = ?', [clinic_id]);
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to delete clinic data.");
    }
};

export const getCertificateTypeByFileName = async (file_name) => {
    try {
        const documents = await db.query('SELECT * FROM tbl_certification_type WHERE file_name = ?', [file_name]);
        return documents;
    }
    catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to fetch certificate type.");
    }
};

