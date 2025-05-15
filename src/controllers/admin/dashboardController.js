import { get_clinics, get_doctors, get_users, get_latest_clinic, get_total_clinic_count } from '../../models/admin.js';
import { handleError, handleSuccess } from '../../utils/responseHandler.js';

export const get_dashboard = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        const offset = (page - 1) * limit;

        const [get_clinic, get_doctor, get_user, latest_clinic, total_clinic_count] = await Promise.all([
            get_clinics(),
            get_doctors(),
            get_users(),
            get_latest_clinic(limit, offset),
            get_total_clinic_count()
        ])

        const data = {
            get_clinics: get_clinic.length,
            get_doctors: get_doctor.length,
            get_users: get_user.length,
            get_earnings: 0,
            latest_clinic: {
                data: latest_clinic,
                pagination: {
                    totalClinic: total_clinic_count,
                    totalPages: Math.ceil(total_clinic_count / limit),
                    currentPage: page,
                    clinicPerPage: limit,
                }
            }
        }

        return handleSuccess(res, 200, "en", "Get dashboard data retriev", data);
    } catch (error) {
        console.error("Failed dashboard:", error);
        return handleError(res, 500, 'en', "INTERNAL_SERVER_ERROR");
    }
};