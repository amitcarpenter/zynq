import Joi from "joi";
import { User } from "../../entities/User";
import { Request, Response } from "express";
import { getRepository, In, Not } from "typeorm";
import { getMessage } from "../../middlewares/i18n";
import { UserReport } from "../../entities/UserReport";
import { calculateDistance } from "../../utils/function";
import { BlockedUser } from "../../entities/BlockedUser";
import { ProfileImage } from "../../entities/ProfileImage";
import { ProfileStuff } from "../../entities/ProfileStuff";
import { Notification } from "../../entities/Notification";
import { FriendRequest } from "../../entities/FriendRequest";
import { DiscoverQuestion } from "../../entities/DiscoverQuestion";
import { sendNotificationUser } from "../../notificaion/firebaseUser";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;


export const find_your_match = async (req, res) => {
    try {
        const user_id = req.user?.user_id;
        const userReportRepo = getRepository(UserReport);
        const userRepository = getRepository(User);
        const profileImagesRepository = getRepository(ProfileImage);
        const ProfileStuffRepository = getRepository(ProfileStuff);
        const blockedUserRepo = getRepository(BlockedUser);


        const user_reports = await userReportRepo.find({ where: { user: { user_id } } });
        const own_personality_profile_percentage = user_reports.length
            ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
            : 0;

        const blockedUsers = await blockedUserRepo.find({
            where: [
                { blocker: { user_id } },
                { blocked: { user_id } }
            ],
            relations: ["blocker", "blocked"]
        });

        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);

        const users = await userRepository.find({
            where: { is_verified: true, is_active: true, user_id: Not(In([user_id, ...blockedUserIds])) }
        });

        if (!users.length) {
            return handleError(res, 404, "Users Not Found");
        }

        const latitude = req.user?.latitude;
        const longitude = req.user?.longitude;

        const final_data = await Promise.all(users.map(async (user) => {
            const user_reports = await userReportRepo.find({ where: { user: { user_id: user.user_id } } });
            const user_personality_profile_percentage = user_reports.length
                ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
                : 0;

            const match_percentage = 100 - Math.abs(Number(own_personality_profile_percentage) - Number(user_personality_profile_percentage));

            let profile_images = await profileImagesRepository.find({ where: { user: { user_id: req.user?.user_id } } })

            let stuff = await ProfileStuffRepository.find({ where: { recipient: { user_id: user?.user_id } } });

            let stuffCount: Record<string, number> = {
                kiss: 0,
                chocolate: 0,
                love: 0,
                flower: 0,
                flirty: 0
            };

            stuff.forEach(({ stuff_name }) => {
                if (stuff_name && stuffCount.hasOwnProperty(stuff_name)) {
                    stuffCount[stuff_name]++;
                }
            });


            let distance = "N/A";
            if (user.latitude && user.longitude && latitude && longitude) {

                distance = calculateDistance(latitude, longitude, user.latitude, user.longitude).toFixed(2) + " km";

            }

            profile_images = await Promise.all(
                profile_images.map(async (profile_image) => {
                    if (profile_image.image && !profile_image.image.startsWith("http")) {
                        profile_image.image = `${APP_URL}${profile_image.image}`;
                    }
                    return { ...profile_image, }
                })
            )

            return {
                ...user,
                profile_image: user.profile_image && !user.profile_image.startsWith("http")
                    ? `${APP_URL}${user.profile_image}`
                    : user.profile_image,
                match_percentage: match_percentage || 0,
                profile_images,
                stuff: stuffCount,
                distance
            };
        }));

        return handleSuccess(res, 200, "Users Retrieved Successfully", final_data);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const send_friend_request = async (req: Request, res: Response) => {
    try {
        let friend_request_schema = Joi.object({
            recipient_id: Joi.number().required(),
        });
        const { error, value } = friend_request_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { recipient_id } = value;

        const userRepository = getRepository(User);
        const FriendRequestRepo = getRepository(FriendRequest);
        const NotificationRepo = getRepository(Notification);

        if (req.user?.user_id == recipient_id) {
            return handleError(res, 400, "You Can Not Send Friend Request Your Self")
        }
        const user_data = await userRepository.findOne({ where: { user_id: recipient_id } });
        if (!user_data) return handleError(res, 404, "Recipient User Not Found");

        const request_data = await FriendRequestRepo.findOne({ where: { requester: { user_id: req.user?.user_id }, recipient: { user_id: recipient_id } } });
        if (!request_data) {
            const newRequest = FriendRequestRepo.create({
                requester: req.user,
                recipient: user_data,
                status: "Pending"
            })
            let saved_request_data = await FriendRequestRepo.save(newRequest);

            let notification_title = `${req.user?.full_name}`;
            let notification_message = `You have a new friend request!`;


            await sendNotificationUser(saved_request_data.recipient.fcm_token, notification_title, notification_message, {})
            let newNotification = NotificationRepo.create({
                recipient: saved_request_data.recipient,
                notification_type: "match",
                sender: req.user,
                notificaton_title: notification_title,
                notification_message: notification_message,
            })
            await NotificationRepo.save(newNotification);
        } else {
            return handleError(res, 400, "You have already sent a request.");
        }


        return handleSuccess(res, 200, "Request sent successfully.");
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const get_request_list = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return handleError(res, 400, "User ID is required.");
        }

        const FriendRequestRepo = getRepository(FriendRequest);

        let request_list = await FriendRequestRepo.find({
            where: { recipient: { user_id }, status: "Pending" },
            relations: ["requester"],
        });

        if (request_list.length == 0) {
            return handleSuccess(res, 200, "Request List Retrieved Successfully", []);
        };

        let final_data = await Promise.all(
            request_list.map((request_user) => {
                if (request_user.requester.profile_image && !request_user.requester.profile_image.startsWith("http")) {
                    request_user.requester.profile_image = `${APP_URL}${request_user.requester.profile_image}`;
                }
                return { ...request_user }
            })

        )
        return handleSuccess(res, 200, "Request List Retrieved Successfully", final_data);
    } catch (error: any) {
        return handleError(res, 500, error.message || "An unexpected error occurred.");
    }
};

export const getFriends = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id;

        const FriendRequestRepository = getRepository(FriendRequest);
        const profileImagesRepository = getRepository(ProfileImage);
        const blockedUserRepo = getRepository(BlockedUser);

        const latitude = req.user?.latitude;
        const longitude = req.user?.longitude;

        const blockedUsers = await blockedUserRepo.find({
            where: [
                { blocker: { user_id } },
                { blocked: { user_id } }
            ],
            relations: ["blocker", "blocked"]
        });

        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);


        const friends = await FriendRequestRepository.find({
            where: [
                { requester: { user_id }, status: "Accepted", recipient: { user_id: Not(In(blockedUserIds)) } },
                { recipient: { user_id }, status: "Accepted", requester: { user_id: Not(In(blockedUserIds)) } }
            ],
            relations: ["requester", "recipient"]
        });

        if (!friends.length) {
            return handleError(res, 404, "No Friends Found");
        }


        let friendsList = await Promise.all(
            friends.map(async (friend) => {

                let friendUser = friend.requester.user_id == user_id ? friend.recipient : friend.requester;

                let profile_images = await profileImagesRepository.find({ where: { user: { user_id: friendUser.user_id } } })

                let distance = "N/A";
                if (friendUser.latitude && friendUser.longitude && latitude && longitude) {
                    distance = calculateDistance(latitude, longitude, friendUser.latitude, friendUser.longitude).toFixed(2) + " km";

                }

                profile_images = await Promise.all(
                    profile_images.map(async (profile_image) => {
                        if (profile_image.image && !profile_image.image.startsWith("http")) {
                            profile_image.image = `${APP_URL}${profile_image.image}`;
                        }
                        return { ...profile_image, }
                    })
                )
                return {
                    friendUser,
                    profile_images,
                    profile_image: friendUser.profile_image && !friendUser.profile_image.startsWith("http")
                        ? `${APP_URL}${friendUser.profile_image}`
                        : friendUser.profile_image,
                    distance
                };
            })
        )

        return handleSuccess(res, 200, "Friends Retrieved Successfully", friendsList);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const accept_reject_request = async (req: Request, res: Response) => {
    try {
        let friend_request_schema = Joi.object({
            request_id: Joi.number().required(),
            request_status: Joi.string().valid("Accepted", "Rejected").required(),
        });
        const { error, value } = friend_request_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { request_id, request_status } = value;

        const FriendRequestRepo = getRepository(FriendRequest);
        const NotificationRepo = getRepository(Notification);

        const request_data = await FriendRequestRepo.findOne({ where: { request_id: request_id }, relations: ["requester"] });

        if (!request_data) {
            return handleError(res, 404, "Request Not Found.");
        } else {
            if (request_status) request_data.status = request_status;
            await FriendRequestRepo.save(request_data);
        }
        let notification_title = `${req.user?.full_name}`;
        let notification_message = `You have a new match!`;


        await sendNotificationUser(request_data.requester.fcm_token, notification_title, notification_message, {})
        let newNotification = NotificationRepo.create({
            recipient: request_data.requester,
            notification_type: "match",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        })
        await NotificationRepo.save(newNotification);

        return handleSuccess(res, 200, `Request ${request_status} Successfully.`);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};