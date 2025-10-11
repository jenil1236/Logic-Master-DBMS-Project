import express from "express";
const router = express.Router();

import {isAuthenticated} from "../middlewares.js";
import { getSubmission, postSubmission } from "../controllers/Submission.js";

router.get("/:id", isAuthenticated, getSubmission)

.post("/:id", isAuthenticated, postSubmission);

export default router;