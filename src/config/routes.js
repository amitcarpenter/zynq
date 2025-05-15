import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

//==================================== Import Routes ==============================

import api_routes from "../routes/api.js"
import admin_routes from "../routes/admin.js";
import clinic_routes from "../routes/clinic.js";
import web_user_routes from "../routes/web_user.js";


//==================================== configureApp ==============================

const configureApp = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(cors());
  app.use("/api", api_routes);
  app.use("/admin", admin_routes);
  app.use("/clinic", clinic_routes);
  app.use("/web_user", web_user_routes);
  
};

export default configureApp;
