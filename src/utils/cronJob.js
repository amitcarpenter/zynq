const ejs = require("ejs");
const path = require("path");
const moment = require("moment");
const cron = require("node-cron");
const { default: db } = require("../config/db");
const { sendEmail } = require("../services/send_email");
const { generatePassword } = require("./user_helper");


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const image_logo = process.env.LOGO_URL;

let isRunning = false;


const send_clinic_email = async (clinic, isFirstEmail) => {
    try {
        const emailTemplatePath = path.resolve(__dirname, '../../views/invite_email/en.ejs');
        const password = generatePassword(email);
        let email = clinic.email;
        const emailHtml = await ejs.renderFile(emailTemplatePath, { image_logo, email, password });

        const emailOptions = {
            to: email,
            subject: "Verify Your Email Address",
            html: emailHtml,
        };

        await sendEmail(emailOptions);
        console.log(`Email sent to: ${clinic.email}`);

        if (isFirstEmail) {
            await db.query(
                "UPDATE tbl_clinics SET email_sent_at = ?, is_invited = 1 WHERE id = ?",
                [moment().format('YYYY-MM-DD HH:mm:ss'), clinic.clinic_id]
            );
        }

    } catch (err) {
        console.error(`Failed to send email to ${clinic.email}`, err.message);
    }
};


const send_clinic_email_cron = async () => {
    try {
        cron.schedule("0 0 * * *", async () => {
            if (isRunning) {
                console.log("Previous clinic email cron is still running.");
                return;
            }

            isRunning = true;
            console.log("Running clinic email cron...");

            try {
                const clinics = await db.query("SELECT * FROM tbl_clinics WHERE is_invited = 1 AND is_active = 0");

                for (let clinic of clinics) {
                    const lastSentDate = moment(clinic.email_sent_at);
                    const daysSinceLastEmail = moment().diff(lastSentDate, "days");

                    if (daysSinceLastEmail === 0) {
                        await send_clinic_email(clinic, true);
                    } else if (daysSinceLastEmail === 7 || daysSinceLastEmail === 14) {
                        await send_clinic_email(clinic, false);
                    }
                }

            } catch (err) {
                console.error("Error in clinic email cron:", err.message);
            } finally {
                isRunning = false;
            }
        });
    } catch (err) {
        console.error("Error setting up clinic email cron:", err.message);
    }
};


module.exports = { send_clinic_email_cron };
