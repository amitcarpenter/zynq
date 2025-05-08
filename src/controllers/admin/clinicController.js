import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import xlsx from 'xlsx';
import { generateToken } from '../../utils/user_helper.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';
import { insert_clinic } from '../../models/admin.js';


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

    if (!filePath) {
        return handleError(res, 400, 'en', "CSV_REQUIRED");
    }

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
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};