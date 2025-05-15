import Joi from "joi";
import * as adminModels from "../../models/admin.js"
import { handleError, handleSuccess, joiErrorHandle } from "../../utils/responseHandler.js";

export const get_users_managment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        const { users, total } = await adminModels.get_users_managment(limit, offset, search);

        if (users) {
            users.forEach(element => {
                element.profile_image = element.profile_image == null ? null : process.env.LOGO_URL + `${element.profile_image}`;
            });
        }

        const data = {
            users,
            pagination: {
                totalUsers: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                usersPerPage: limit,
            }
        };

        return handleSuccess(res, 200, 'en', "Fetch user management successfully", data);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};

export const update_user_status = async (req, res) => {
    try {
        const schema = Joi.object({
            user_id: Joi.string().required(),
            is_active: Joi.number().required().allow(1, 2)
        });

        const { error, value } = schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { user_id, is_active } = value;

        const updateResponse = await adminModels.update_user_status(user_id, is_active);

        return handleSuccess(res, 200, 'en', "Update status successfully", updateResponse);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};