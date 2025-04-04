import Joi from "joi";
import { User } from "../../entities/User";
import { Request, Response } from "express";
import { getRepository, Not } from "typeorm";
import { getMessage } from "../../middlewares/i18n";
import { UserReport } from "../../entities/UserReport";
import { BlockedUser } from "../../entities/BlockedUser";
import { ProfileImage } from "../../entities/ProfileImage";
import { DiscoverQuestion } from "../../entities/DiscoverQuestion";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";


const APP_URL = process.env.APP_URL as string;
const image_logo = process.env.LOGO_URL as string;


export const block_unblock_user = async (req: Request, res: Response) => {
    try {
        let block_unblock_user_schema = Joi.object({
            blocked_id: Joi.number().required(),
            is_blocked: Joi.boolean().required()
        });
        const { error, value } = block_unblock_user_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);

        const { blocked_id, is_blocked } = value;

        const userRepository = getRepository(User);
        const blockUserRepo = getRepository(BlockedUser);

        if (req.user?.user_id == blocked_id) {
            return handleError(res, 400, "You Can Not Block Your Self")
        }

        const user_data = await userRepository.findOne({ where: { user_id: blocked_id } });
        if (!user_data) return handleError(res, 404, "blocked id User Not Found");

        const block_data = await blockUserRepo.findOne({ where: { blocker: { user_id: req.user?.user_id }, blocked: { user_id: blocked_id } } });

        if (!block_data) {
            const newBlock = blockUserRepo.create({
                blocker: req.user,
                blocked: user_data,
                is_blocked: is_blocked
            })
            await blockUserRepo.save(newBlock);
        } else {
            block_data.is_blocked = is_blocked
            await blockUserRepo.save(block_data);
        }

        let response_message = is_blocked == true ? "Blocked" : "Un-Blocked"

        return handleSuccess(res, 200, `Users ${response_message} Successfully`);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};


export const get_block_list = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return handleError(res, 400, "User ID is required.");
        }

        const blockUserRepo = getRepository(BlockedUser);

        let block_list = await blockUserRepo.find({
            where: { blocker: { user_id }, is_blocked: true },
            relations: ["blocked"],
        });

        if (block_list.length == 0) {
            return handleSuccess(res, 200, "Blocked List Retrieved Successfully", []);
        };

        let final_data = await Promise.all(
            block_list.map((block_user) => {
                if (block_user.blocked.profile_image && !block_user.blocked.profile_image.startsWith("http")) {
                    block_user.blocked.profile_image = `${APP_URL}${block_user.blocked.profile_image}`;
                }
                return { ...block_user }
            })

        )
        return handleSuccess(res, 200, "Blocked List Retrieved Successfully", final_data);
    } catch (error: any) {
        return handleError(res, 500, error.message || "An unexpected error occurred.");
    }
};


