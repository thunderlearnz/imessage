import express from "express";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import { clerkMiddleware } from "@clerk/express";
import fs from "fs";
import path from "path";
import job from "./lib/cron.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public");

app.use(express.json());
// app.use(cors());
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  return res.status(200).json({ ok: true });
});

app.post("/api/webhooks/clerk", (req, res, next) => {
  console.log("the req is ", req.body);
  return res.json(req.body);
});

const startServer = async () => {
  try {
    // if the public directory exists, serve the static files
    // this is for the production build
    if (fs.existsSync(publicDir)) {
      app.use(express.static(publicDir));

      app.get("/{*any}", (req, res, next) => {
        res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
      });
    }

    await connectDB();
    console.log("DB connectred");

    app.listen(PORT, () => {
      console.log("listening to port ", PORT);

      if (process.env.NODE_ENV === "production") job.start();
    });
  } catch (err) {
    console.error("The error is ", err);
  }
};

startServer();
