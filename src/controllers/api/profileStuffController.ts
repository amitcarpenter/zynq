import Joi from "joi";
import { User } from "../../entities/User";
import { Request, Response } from "express";
import { getRepository, Not } from "typeorm";
import { getMessage } from "../../middlewares/i18n";
import { UserReport } from "../../entities/UserReport";
import { ProfileImage } from "../../entities/ProfileImage";
import { FriendRequest } from "../../entities/FriendRequest";
import { Notification } from "../../entities/Notification";
import { ProfileStuff } from "../../entities/ProfileStuff";
import { DiscoverQuestion } from "../../entities/DiscoverQuestion";
import { sendNotificationUser } from "../../notificaion/firebaseUser";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;
const image_logo = process.env.LOGO_URL as string;



export const send_stuff_to_user = async (req: Request, res: Response) => {
    try {
        let send_stuff_to_user_schema = Joi.object({
            recipient_id: Joi.number().required(),
            stuff_name: Joi.string().valid("kiss", "chocolate", "love", "flower", "flirty").required(),
        });
        const { error, value } = send_stuff_to_user_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { recipient_id, stuff_name } = value;

        const userRepository = getRepository(User);
        const ProfileStuffRepo = getRepository(ProfileStuff);
        const NotificationRepo = getRepository(Notification);

        const user_data = await userRepository.findOne({ where: { user_id: recipient_id } });
        if (!user_data) return handleError(res, 404, "Recipient User Not Found");

        const stuff_data = await ProfileStuffRepo.findOne({ where: { recipient: { user_id: recipient_id }, sender: { user_id: req.user?.user_id } } });

        if (!stuff_data) {
            const newStuff = ProfileStuffRepo.create({
                stuff_name: stuff_name,
                recipient: user_data,
                sender: req.user
            })
            await ProfileStuffRepo.save(newStuff);
        } else {
            if (stuff_name) stuff_data.stuff_name = stuff_name;
        }

        let notification_title = `${req.user?.full_name}`;
        let notification_message = `You Have new ${stuff_name} stuff`;

        await sendNotificationUser(user_data.fcm_token, notification_title, notification_message, {})
        let newNotification = NotificationRepo.create({
            recipient: user_data,
            notification_type: "stuff",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        })
        await NotificationRepo.save(newNotification);

        return handleSuccess(res, 200, "Stuff sent successfully.");
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const get_stuff_list_user = async (req: Request, res: Response) => {
    try {
        let send_stuff_to_user_schema = Joi.object({
            user_id: Joi.number().required(),
        });
        const { error, value } = send_stuff_to_user_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { user_id } = value;

        const ProfileStuffRepo = getRepository(ProfileStuff);

        let request_list = await ProfileStuffRepo.find({
            where: { recipient: { user_id }, }
        });

        if (request_list.length === 0) {
            return handleSuccess(res, 200, "Request List Retrieved Successfully", {});
        }

        let stuffCount: Record<string, number> = {};

        request_list.forEach((request) => {
            const { stuff_name } = request;
            if (stuff_name) {
                stuffCount[stuff_name] = (stuffCount[stuff_name] || 0) + 1;
            }
        });

        return handleSuccess(res, 200, "Request List Retrieved Successfully", stuffCount);
    } catch (error: any) {
        return handleError(res, 500, error.message || "An unexpected error occurred.");
    }
};

