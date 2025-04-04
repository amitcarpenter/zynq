import Joi from "joi";
import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { getMessage } from "../../middlewares/i18n";
import { UserReport } from "../../entities/UserReport";
import { DiscoverQuestion } from "../../entities/DiscoverQuestion";
import { handleSuccess, handleError, joiErrorHandle } from "../../utils/responseHandler";


export const getDiscoverQuestionByDiscover = async (req: Request, res: Response) => {
    try {

        const get_question_schema = Joi.object({
            discover_name: Joi.string().required()
        })
        const { error, value } = get_question_schema.validate(req.query)
        if (error) return joiErrorHandle(res, error);

        const { discover_name } = value;
        console.log(discover_name, "discover name ");

        const discoverRepo = getRepository(DiscoverQuestion);

        const question = await discoverRepo.find({ where: { discover_name } });
        if (!question) {
            return handleError(res, 404, "Discover question not found");
        }

        return handleSuccess(res, 200, "Discover question fetched successfully", question);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const discover_question_overview = async (req: Request, res: Response) => {
    try {
        const discoverRepo = getRepository(DiscoverQuestion);

        const result = await discoverRepo
            .createQueryBuilder("discover_question")
            .select("discover_question.discover_name", "discover_name")
            .addSelect("COUNT(*)", "question_count")
            .groupBy("discover_question.discover_name")
            .getRawMany();

        if (!result || result.length === 0) {
            return handleError(res, 404, "No discover questions found");
        }

        return handleSuccess(res, 200, "Discover questions fetched successfully", result);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const is_correct_answer = async (req: Request, res: Response) => {
    try {
        const is_correct_answer_schema = Joi.object({
            question_id: Joi.number().required(),
            answer: Joi.string().required(),
        });

        const { error, value } = is_correct_answer_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { question_id, answer } = value;

        const discoverRepo = getRepository(DiscoverQuestion);

        const question_data = await discoverRepo.findOne({ where: { question_id: question_id } })
        if (!question_data) {
            return handleError(res, 404, "Question Not Found")
        }
        let is_correct = false;
        // if (question_data.correct_answer == answer) {
        //     is_correct = true
        // }

        return handleSuccess(res, 200, "Answer Data ", is_correct);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const submit_question_report = async (req: Request, res: Response) => {
    try {
        const submit_report_schema = Joi.object({
            discover_name: Joi.string().required(),
            total_score: Joi.number().required(),
            total_achieved_score: Joi.number().required(),
        });

        const { error, value } = submit_report_schema.validate(req.body);
        if (error) return joiErrorHandle(res, error);
        const { discover_name, total_score, total_achieved_score } = value;

        const percentage = total_score === 0
            ? 0
            : parseFloat(((total_achieved_score / total_score) * 100).toFixed(2));

        const userReportRepo = getRepository(UserReport)

        const existing_report = await userReportRepo.findOne({ where: { discover_name } })
        if (existing_report) {
            if (total_achieved_score) existing_report.total_achieved_score = total_achieved_score;
            if (total_score) existing_report.total_score = total_score;
            existing_report.percentage = percentage;
            await userReportRepo.save(existing_report);

        } else {

            const newReport = userReportRepo.create({
                discover_name, total_score, total_achieved_score, percentage, user: req.user
            })
            const saved_report = await userReportRepo.save(newReport)
        }
        return handleSuccess(res, 200, "User Report Submitted Successfully");
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

export const get_user_report = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id
        const userReportRepo = getRepository(UserReport)
        const user_report = await userReportRepo.find({ where: { user: { user_id: user_id } }, relations: ["user"] }) || []

        if (user_report.length == 0) {
            return handleError(res, 404, "User Report Not Found")
        }

        let user_report_count = user_report.length
        let total_score = 0;
        await Promise.all(
            user_report.map((report) => {
                total_score += Number(report.percentage)
            })
        )

        let data = {
            personality_profile_percentage: (total_score / user_report_count).toFixed(2),
            user_report
        };

        return handleSuccess(res, 200, "User Report Retrived Successfully", data);
    } catch (error: any) {
        return handleError(res, 500, error.message);
    }
};

