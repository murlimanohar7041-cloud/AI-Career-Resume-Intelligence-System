const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());


// ===============================
// ROUTES
// ===============================

app.use("/api/auth", authRoutes);
app.use("/api/resume", resumeRoutes);


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
    res.json({
        message: "AI Career & Resume Intelligence System API is running 🚀"
    });
});


// ===============================
// MONGODB
// ===============================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {

        console.log("MongoDB Connected Successfully ✅");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} 🚀`);
        });

    })
    .catch((error) => {

        console.error("MongoDB Connection Failed ❌");
        console.error(error.message);

    });