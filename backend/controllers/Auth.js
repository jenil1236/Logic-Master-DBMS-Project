import bcrypt from "bcryptjs";
import passport from "passport";
import pool from "../config/db.js";

export const registerUser = async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        await pool.execute(
            "INSERT INTO user (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashed]
        );
        res.send({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Error registering user" });
    }
}

export const loginUser = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).send({ error: "Invalid credentials" });
        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.send({ message: "Logged in successfully", user });
        });
    })(req, res, next);
}

export const login_fail = (req, res) => {
    res.status(401).send({ error: "Login failed" });
}

export const logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.send({ message: "Logged out successfully" });
    });
}