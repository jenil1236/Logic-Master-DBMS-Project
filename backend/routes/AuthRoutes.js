import express from "express";
import passport from "passport";
import { registerUser, loginUser, login_fail, logoutUser } from "../controllers/Auth.js";

const router = express.Router();

router

    .post("/register", registerUser)

    // Local login
    .post("/login", loginUser)

    // Google OAuth
    .get("auth/google", passport.authenticate("google", { scope: ["profile", "email"] }))

    .get("/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/login-failure" }),
        (req, res) => {
            // redirect to frontend
            res.redirect("http://localhost:5173");
        }
    )

    // Login failure
    .get("/login-failure", login_fail)

    // Logout
    .get("/logout", logoutUser);

export default router;