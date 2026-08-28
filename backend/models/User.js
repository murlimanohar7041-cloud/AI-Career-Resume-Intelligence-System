const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            default: ""
        },

        googleId: {
            type: String,
            default: ""
        },

        profilePicture: {
            type: String,
            default: ""
        },

        careerGoal: {
            type: String,
            default: ""
        },

        skills: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);