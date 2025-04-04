import Joi from "joi";
import { User } from "../../entities/User";
import { Request, Response } from "express";
import { getRepository, Not } from "typeorm";
import { getMessage } from "../../middlewares/i18n";
import { UserReport } from "../../entities/UserReport";
import { BlockedUser } from "../../entities/BlockedUser";
import { ProfileImage } from "../../entities/ProfileImage";
import { Notification } from "../../entities/Notification";
import { DiscoverQuestion } from "../../entities/DiscoverQuestion";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;
const image_logo = process.env.LOGO_URL as string;


export const get_user_notification = async (req: Request, res: Response) => {
    try {
        const notificationRepository = getRepository(Notification);

        const user_id = req.user?.user_id;
        const notifications = await notificationRepository.find({
            where: { recipient: { user_id }, },
            relations: ["recipient", "sender"],
            order: { created_at: "DESC" }
        });

        if (!notifications) {
            return handleError(res, 404, "Notification Not Found")
        }

        let final_data = await Promise.all(
            notifications.map(async (notification) => {
                if (notification.recipient) {
                    if (notification.recipient.profile_image) {
                        notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image} `
                    }
                }
                if (notification.sender) {
                    if (notification.sender.profile_image) {
                        notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image} `
                    }
                }


                return { ...notification }
            })
        )

        await notificationRepository.update(
            { recipient: { user_id: user_id } },
            { is_user_notification_read: true }
        );

        return handleSuccess(res, 200, "Notification retrieved successfully", final_data);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};