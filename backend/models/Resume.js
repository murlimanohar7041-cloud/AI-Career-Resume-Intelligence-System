const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        fileName: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        extractedText: {
            type: String,
            default: ""
        },

        skills: {
            type: [String],
            default: []
        },

        education: {
            type: [String],
            default: []
        },

        experience: {
            type: [String],
            default: []
        },

        projects: {
            type: [String],
            default: []
        },

        certifications: {
            type: [String],
            default: []
        },

        resumeScore: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);