const express = require('express');

const brevo = require("@getbrevo/brevo");

const { CleanerModel, AdminModel, ToiletModel } = require("../Models/ToiletModel.js");
//const AdminModel = require("./Models/ToiletModel.js");
//const ToiletModel= require("./Models/ToiletModel.js");
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const registerController = async (req, res) => {
    console.log("registerController call");
    try {
        console.log(req.body);
        if (!req.body.email || !req.body.password || !req.body.name || !req.body.role) {
            console.log("aii feield required");
            res.status(400).send({ sucess: false, message: "All feilds of register is required" });
        }
        const existingUser = await CleanerModel.findOne({ email: req.body.email });
        const existingAdmin = await AdminModel.findOne({ email: req.body.email });

        if (existingAdmin || existingUser) {
            res.status(200).send({ sucess: true, message: "User or admin already exist" });

        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        req.body.password = hashPassword;
        const role = req.body.role;
        if (role == "admin") {
            const newAdmin = new AdminModel(req.body);
            await newAdmin.save();

        } else {
            const newUser = new CleanerModel(req.body);
            await newUser.save();
        }
        res.status(200).send({ sucess: true, message: "Register sucessfully" });
    } catch (error) {
        console.log("error in registration", error);

        res.status(500).send({ sucess: false, message: "Register controller error" });
    }
}

const loginController = async (req, res) => {
    try {
        const user = await CleanerModel.findOne({ email: req.body.email });
        const admin = await AdminModel.findOne({ email: req.body.email });

        if (!user && !admin) {
            return res.status(200).send({ sucess: false, message: "User not found" });
        }

        if (user) {
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) {
                res.status(200).send({ sucess: false, message: "Email or Password id incorrect" });
            } else {
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
                    expiresIn: "1d",
                });
                res.status(200).send({
                    sucess: true, message: "Login sucessful", token, cust: {
                        id: user.id,
                        role: "cleaner",
                        email: user.email,
                    }
                })
            }

        } else {
            const isMatch = await bcrypt.compare(req.body.password, admin.password);
            if (!isMatch) {
                res.status(200).send({ sucess: false, message: "Email or Password id incorrect" });
            } else {
                const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, {
                    expiresIn: "1d",
                });
                res.status(200).send({
                    sucess: true, message: "Login sucessful", token, cust: {
                        id: admin.id,
                        role: "admin",
                        email: admin.email,
                    }
                })
            }
        }
    } catch (error) {
        console.log("error in loginController", error);
        res.status(500).send({ sucess: false, message: "Error in login controller" });
    }
}

const newToilet = async (req, res) => {
    try {
        console.log(req.body);
        const { cleanerEmail, adminEmail } = req.body;
        if (!cleanerEmail || !adminEmail) {
            res.status(400).send({ sucess: false, message: "email of cleaner and admin is required" })
        } else {

            const newToilet = new ToiletModel(req.body);
            newToilet.status = "new Toilet";
            await newToilet.save();
            const updatedAdmin = await AdminModel.findOneAndUpdate(
                { email: adminEmail },
                { $push: { toilets: newToilet._id } },
                { new: true }
            );

            const updatedCleaner = await CleanerModel.findOneAndUpdate(
                { email: cleanerEmail },
                { $push: { toilets: newToilet._id } },
                { new: true }
            );

            if (!updatedAdmin) {
                console.warn("⚠️ No admin found with email:", adminEmail);
            }
            if (!updatedCleaner) {
                console.warn("⚠️ No cleaner found with email:", cleanerEmail);
            }
            res.status(200).send({ sucess: true, message: "new toilet added" })

        }
    } catch (error) {
        console.log("error in newToilet", error);
        res.status(500).send({ sucess: false, message: "internal server error" })
    }
}

const getData = async (req, res) => {
    const { Id, role } = req.query;

    if (!Id) {
        return res.status(400).send({ success: false, message: "ID is required" });
    }

    try {
        if (role === "admin") {
            const admin = await AdminModel.findById(Id).populate("toilets");

            if (!admin) {
                return res.status(404).send({ success: false, message: "Admin not found" });
            }

            if (!admin.toilets.length) {
                return res.status(404).send({ success: false, message: "No toilets assigned to this admin" });
            }

            return res.status(200).json(admin.toilets);

        } else if (role === "cleaner") {
            const cleaner = await CleanerModel.findById(Id).populate("toilets");

            if (!cleaner) {
                return res.status(404).send({ success: false, message: "Cleaner not found" });
            }

            if (!cleaner.toilets.length) {
                return res.status(404).send({ success: false, message: "No toilets assigned to this cleaner" });
            }

            return res.status(200).json(cleaner.toilets);

        } else {
            return res.status(400).send({ success: false, message: "Invalid role" });
        }

    } catch (error) {
        console.log("error in getData:", error);
        return res.status(500).send({ success: false, message: "Internal server error" });
    }
};

const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  "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" // your API key
);

const toiletStatus = async (req, res) => {
  try {
    const { toiletId, gasValue } = req.body;
    console.log("toilet id and gas value", req.body);

    const toilet = await ToiletModel.findById(toiletId);
    if (!toilet) {
      return res.status(404).json({ success: false, message: "Toilet not found" });
    }

    if (gasValue > 500) {
      toilet.status = "required cleaning";
      toilet.timestamp = Date.now();

      const to = toilet.cleanerEmail;
      const subject = "Toilet Cleaning Required";
      const text = `High odour detected at Toilet ID: ${toiletId}. Gas Value: ${gasValue}`;

      // Send email using Brevo
      (async () => {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = `<p>${text}</p>`;
        sendSmtpEmail.sender = { name: "CleanTrack", email: "foodappoint@gmail.com" }; // replace with your verified Brevo sender email
        sendSmtpEmail.to = [{ email: to }];

        try {
          const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
          console.log("✅ Email sent successfully to:", to, data);
        } catch (emailErr) {
          console.error("❌ Email sending failed:", emailErr);
        }
      })();
    } else {
      if (toilet.status === "required cleaning") {
        toilet.status = "cleaned";
        toilet.timestamp = Date.now();
      }
    }

    await toilet.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};
const get = (req, res) => {
    console.log("get is ycalled")
    res.status(200).json({ success: true, message: "get record 5" })
}
module.exports = {
    loginController,
    registerController,
    newToilet,
    getData,
    toiletStatus,
    get,
}
