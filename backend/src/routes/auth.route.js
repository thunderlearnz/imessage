import express from "express";
import { checkUser } from "../controller/auth.controller.js";
const router = express.Router();


router.get("/check",checkUser)

export default router;