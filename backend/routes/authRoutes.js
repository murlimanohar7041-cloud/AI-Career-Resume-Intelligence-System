const express = require("express");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

// Google OAuth Client
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);


// ===============================
// GOOGLE LOGIN
// ===============================

router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required"
            });
        }

        // Verify Google ID Token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        const googleId = payload.sub;
        const name = payload.name || "Google User";
        const email = payload.email;
        const profilePicture = payload.picture || "";

        if (!email) {
            return res.status(400).json({
                message: "Google account email not found"
            });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        // Create new user
        if (!user) {

            user = await User.create({
                name,
                email,
                googleId,
                profilePicture
            });

        } else {

            // Update Google information
            user.googleId = googleId;
            user.profilePicture = profilePicture;

            await user.save();
        }

        res.json({
            message: "Google Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {

        console.error("Google Login Error:", error);

        res.status(500).json({
            message: "Google Login failed",
            error: error.message
        });
    }
});


// ===============================
// REGISTER
// ===============================

router.post("/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const user = await User.create({
            name,
            email,
            password
        });

        res.status(201).json({
            message: "Registration successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Registration Error:", error);

        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});


// ===============================
// LOGIN
// ===============================

router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {

            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture || ""
            }
        });

    } catch (error) {

        console.error("Login Error:", error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});


module.exports = router;