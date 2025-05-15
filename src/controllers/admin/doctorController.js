import * as adminModels from "../../models/admin.js";
import { handleError, handleSuccess } from "../../utils/responseHandler.js";

export const get_dcotors_managment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        const { doctors, total } = await adminModels.get_doctors_management(limit, offset, search);

        if (doctors) {
            doctors.forEach(element => {
                element.profile_image = element.profile_image_url == null ? null : process.env.LOGO_URL + `${element.profile_image_url}`;
            });
        }

        const data = {
            doctors: doctors,
            pagination: {
                totalDoctors: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                doctorsPerPage: limit,
            }
        };

        return handleSuccess(res, 200, 'en', "Fetch doctor management successfully", data);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};