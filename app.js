import fs from "fs";
import http from "http"
import path from 'path';
import https from "https";
import dotenv from "dotenv";
import express from "express";
import db from "./src/config/db.js";
import { fileURLToPath } from 'url';
import configureApp from "./src/config/routes.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()
const app = express();


const PORT = process.env.PORT;
const APP_URL = process.env.APP_URL;
const EXPRESS_SESSION_SECRET = process.env.EXPRESS_SESSION_SECRET;


app.use('/', express.static(path.join(__dirname, 'src/uploads')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));


configureApp(app);

app.get("/", (req, res) => {
  return res.send("krakka project here")
});

// const sslOptions = {
//   ca: fs.readFileSync("/var/www/html/ssl/ca_bundle.crt"),
//   key: fs.readFileSync("/var/www/html/ssl/private.key"),
//   cert: fs.readFileSync("/var/www/html/ssl/certificate.crt"),
// };
// // Create HTTPS server
// const httpsServer = https.createServer(sslOptions, app);

// httpsServer.listen(PORT, () => {
//   console.log(`Server is working on ${APP_URL}`);
// })

app.listen(PORT, () => {
  console.log(`Server is working on ${APP_URL}`);
});



