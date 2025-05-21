import fs from 'fs';
import Joi from "joi";
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { generateToken } from '../../utils/user_helper.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { insert_clinic } from '../../models/admin.js';
import * as adminModels from "../../models/admin.js";

// export const import_clinics_from_CSV = async (req, res) => {
//     const filePath = req.file?.path;

//     if (!filePath) {
//         return handleError(res, 400, 'en', "CSV_REQUIRED");
//     }

//     const clinics = [];
//     fs.createReadStream(filePath)
//         .pipe(csv())
//         .on('data', (row) => {
//             console.log(row, "row data");

//             clinics.push({
//                 clinic_name: row.clinic_name || '',
//                 org_number: row.org_number || '',
//                 email: row.email || '',
//                 mobile_number: row.mobile_number || '',
//                 address: row.address || '',
//                 token: generateToken()
//             });
//         })
//         .on('end', async () => {
//             try {
//                 // for (const clinic of clinics) {
//                 //     await insert_clinic(clinic);
//                 // }
//                 // fs.unlinkSync(filePath);
//                 // return handleSuccess(res, 200, 'en', "CLINIC_IMPORT");

//             } catch (error) {
//                 console.error('Import failed:', error);
//                 return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
//             }
//         });
// };


export const import_clinics_from_CSV = async (req, res) => {
    const filePath = req.file?.path;

    if (!filePath) return handleError(res, 400, 'en', "CSV_REQUIRED");

    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const clinicData = xlsx.utils.sheet_to_json(sheet);

        const clinics = clinicData.map(row => ({
            clinic_name: row.clinic_name || '',
            org_number: row.org_number || '',
            email: row.email || '',
            mobile_number: row.mobile_number || '',
            address: row.address || '',
            token: generateToken()
        }));

        for (const clinic of clinics) {
            await insert_clinic(clinic);
        }

        fs.unlinkSync(filePath);
        return handleSuccess(res, 200, 'en', "CLINIC_IMPORT");

    } catch (error) {
        console.error("Import failed:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};

export const add_clinic_managment = async (req, res) => {
    try {
        const schema = Joi.object({
            json_data: Joi.string().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { json_data } = value;

        const clinic = JSON.parse(json_data);
        for (const ele of clinic) {
            const findRole = await adminModels.findRole('CLINIC')
            if (!findRole) return handleError(res, 404, 'en', "Not find role");
            const data = {
                email: ele['Email'],
                role_id: findRole[0].id
            }
            const findEmail = await adminModels.findClinicEmail(ele['Email'])
            if (findEmail) {
                await adminModels.addZynqUsers(data);
                const findEmailResponse = await adminModels.findClinicEmail(ele['Email']);
                if (findEmailResponse) {
                    const data = {
                        zynq_user_id: findEmailResponse[0].id,
                        clinic_name: ele['Clinic Name'],
                        org_number: ele['Swedish Organization Number'],
                        mobile_number: ele['Contact Number'],
                        address: ele['Address']
                    }
                    await adminModels.addClinic(data);
                    const findClinicByClinicId = await adminModels.findClinicByClinicUserId(findEmailResponse[0].id);
                    if (findClinicByClinicId.lenght > 0) {

                    }
                }
            }
        }
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};

export const get_clinic_managment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        const { users, total } = await adminModels.get_clinic_managment(limit, offset, search);

        const data = {
            users: users,
            pagination: {
                totalUsers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                clinicsPerPage: limit,
            }
        }

        return handleSuccess(res, 200, 'en', "Fetch clinic management successfully", data);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};