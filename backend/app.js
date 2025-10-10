// app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import passport from "passport";
// import bcrypt from "bcryptjs";
import cors from "cors";

import setupPassport from "./config/passport.js";
// import pool from "./config/db.js";
// import isAuthenticated from "./middleware.js";

import authRoutes from "./routes/AuthRoutes.js";
import adminRoutes from "./routes/AdminRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173", // your React/Vite frontend
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  }
}));

app.use(passport.initialize());
app.use(passport.session());
setupPassport(passport);

// ----------------- Routes -----------------
app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);



// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
