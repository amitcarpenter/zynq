import db from "../../config/db.js";


export const insert_form_data = async (
    describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration
) => {
    try {
        const query = `INSERT INTO tbl_form_service 
            ( describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const values = [
            describe_of_land, treatment_plant_details, treatment_plant_status, land_application_area, tests_to_be_completed_every_service, annual_testing, service_procedure, owners_details, service_technician_details, declaration
        ];

        const result = await db.query(query, values);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to insert form data.");
    }
};

export const update_form_data_in_db = async (
    describe_of_land,
    treatment_plant_details,
    treatment_plant_status,
    land_application_area,
    tests_to_be_completed_every_service,
    annual_testing,
    service_procedure,
    owners_details,
    service_technician_details,
    declaration,
    form_service_id
) => {
    try {
        const query = `UPDATE tbl_form_service SET 
            describe_of_land = ?, 
            treatment_plant_details = ?, 
            treatment_plant_status = ?, 
            land_application_area = ?, 
            tests_to_be_completed_every_service = ?, 
            annual_testing = ?, 
            service_procedure = ?, 
            owners_details = ?, 
            service_technician_details = ?, 
            declaration = ? 
        WHERE form_service_id = ?`;

        const values = [
            describe_of_land,
            treatment_plant_details,
            treatment_plant_status,
            land_application_area,
            tests_to_be_completed_every_service,
            annual_testing,
            service_procedure,
            owners_details,
            service_technician_details,
            declaration,
            form_service_id
        ];

        const result = await db.query(query, values);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update form data.");
    }
};

export const get_form_data = async () => {
    try {
        const query = `SELECT *  FROM tbl_form_service ORDER BY created_at DESC`;
        const result = await db.query(query);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update storage data.");
    }
};

export const get_form_data_by_id = async (form_service_id) => {
    try {
        const query = `SELECT *  FROM tbl_form_service WHERE form_service_id = ? `;
        const result = await db.query(query, [form_service_id]);
        return result;
    } catch (error) {
        console.error("Database Error:", error.message);
        throw new Error("Failed to update storage data.");
    }
};






