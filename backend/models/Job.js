const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        company: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            default: ""
        },

        requiredSkills: {
            type: [String],
            default: []
        },

        experience: {
            type: String,
            default: ""
        },

        location: {
            type: String,
            default: ""
        },

        jobType: {
            type: String,
            default: "Full Time"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Job", jobSchema);