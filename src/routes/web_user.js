
import express from 'express';
const router = express.Router();
import * as webControllers from "../controllers/web_users/authController.js";
import { authenticate } from '../middleware/web_user_auth.js';;

router.get("/get_profile", authenticate(['CLINIC','DOCTOR']), webControllers.getProfile);

router.post("/login", webControllers.login_web_user);

export default router;