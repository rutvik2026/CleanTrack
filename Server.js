// server.js
const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const connectDb = require("./DB/Db.js"); 
const Toilet = require("./Models/ToiletModel.js");
const { toiletStatus, registerController, loginController, newToilet, getData, get } = require("./Controller/Controller.js");


dotenv.config();


(async () => {
  await connectDb();
})();

const app = express();
app.use(cors({
    origin: "https://clean-track-frontend.vercel.app",
    credentials: true, 
}));
app.use(bodyParser.json());
app.post("/api/register",registerController);
app.post("/api/login",loginController);
app.post("/api/newtoilet",newToilet);
app.post("/api/toilet",toiletStatus );
app.get("/api/getData",getData);
app.get("/api/get",get);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
