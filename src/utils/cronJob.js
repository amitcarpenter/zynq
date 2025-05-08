const cron = require("node-cron");
const path = require("path");
const moment = require("moment");
const { sendEmail } = require("../services/send_email");
const { default: db } = require("../config/db");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const image_logo = process.env.LOGO_URL;


let isRunning = false;

const send_clinic_email = async (clinic) => {
    try {
        const emailTemplatePath = path.resolve(__dirname, '../../views/invite_email/en.ejs');
        const emailHtml = await ejs.renderFile(emailTemplatePath, { image_logo });

        const emailOptions = {
            to: clinic.email,
            subject: "Verify Your Email Address",
            html: emailHtml,
        };


        await sendEmail(emailOptions);
        console.log(`Email sent to: ${clinic.email}`);

        await db.query(
            "UPDATE tbl_clinics SET is_invited = 1, email_sent_at = ? WHERE id = ?",
            [moment().format('YYYY-MM-DD HH:mm:ss'), clinic.clinic_id]
        );

    } catch (err) {
        console.error(`Failed to send email to ${clinic.email}`, err.message);
    }
};

const send_clinic_email_cron = async () => {
    try {
        cron.schedule("* * * * * *", async () => {
            if (isRunning) {
                console.log("Previous clinic email cron is still running.");
                return;
            }

            isRunning = true;
            console.log("Running clinic email cron...");

            try {
                const clinics = await db.query("SELECT * FROM tbl_clinics WHERE is_invited = 0 LIMIT 4");
                if (clinics.length > 0) {
                    await Promise.all(
                        clinics.map(async (clinic) => {
                            await send_clinic_email(clinic);
                        })
                    );
                } else {
                    console.log("No new clinics to email.");
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
