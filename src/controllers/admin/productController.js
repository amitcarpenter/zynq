import * as adminModels from "../../models/admin.js";
import { handleError, handleSuccess } from "../../utils/responseHandler.js";

export const get_products_managment = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const search = req.query.search || "";

        const offset = (limit && page) ? (page - 1) * limit : undefined;

        const { products, total } = await adminModels.get_products_management(limit, offset, search);

        if (products) {
            products.forEach(product => {
                product.product_image = product.image_url != null
                    ? `${process.env.APP_URL}products/images/${product.image_url}`
                    : null;
            });
        }

        const data = {
            products,
            ...(limit && page && {
                pagination: {
                    totalProducts: total,
                    totalPages: Math.ceil(total / limit),
                    currentPage: page,
                    productsPerPage: limit,
                }
            })
        };

        return handleSuccess(res, 200, 'en', "Fetch product management successfully", data);
    } catch (error) {
        console.error("internal E", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR " + error.message);
    }
};