import * as adminModels from "../../models/admin.js"

export const get_users_managment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";

        const offset = (page - 1) * limit;

        const { users, total } = await adminModels.get_users_managment(limit, offset, search);

        const data = {
            users: users,
            pagination: {
                totalUsers: users.length,
                totalPages: Math.ceil(users.length / limit),
                currentPage: page,
                subadminPerPage: limit,
            }
        }

        return handleSuccess(res, 200, 'en', "Fetch user management successfully", data);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};