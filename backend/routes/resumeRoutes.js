
const express = require("express");
const multer = require("multer");
const { createWorker } = require("tesseract.js");
const { pdf } = require("pdf-to-img");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

// ======================================================
// GEMINI AI
// ======================================================

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash"
});

// ======================================================
// MULTER
// ======================================================

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// ======================================================
// OCR FUNCTION
// ======================================================

async function extractTextFromImage(buffer) {
    console.log("OCR started...");

    const worker = await createWorker("eng");

    const result = await worker.recognize(buffer);

    const text = result.data.text;

    await worker.terminate();

    console.log("OCR completed.");

    return text;
}

// ======================================================
// AI RESUME ANALYSIS
// ======================================================

async function analyzeResumeWithAI(resumeText) {
    console.log("🤖 Gemini AI analysis started...");

    const prompt = `
You are an expert AI Career and Resume Intelligence system.

Analyze the following resume carefully.

Your job is to identify the candidate's actual career field,
technical and professional skills, suitable career paths,
skill gaps, and a personalized learning roadmap.

IMPORTANT:

- Do NOT assume the candidate is a software developer.
- Identify the field from the actual resume.
- If the resume is Digital Marketing, give a Digital Marketing roadmap.
- If the resume is Data Science, give a Data Science roadmap.
- If the resume is Finance, give a Finance roadmap.
- If the resume is HR, give an HR roadmap.
- If the resume is Sales, give a Sales roadmap.
- If the resume is any other field, create a roadmap specifically for that field.
- Do not give programming, DSA or algorithms unless they are genuinely relevant to the candidate's field/career.
- Use only information supported by the resume when describing current skills.
- You may recommend skills that are missing but relevant to the recommended career.

Return ONLY valid JSON.

JSON format:

{
  "field": "Detected career field",
  "summary": "Short professional summary",
  "skills": [
    "skill 1",
    "skill 2"
  ],
  "careers": [
    "career 1",
    "career 2",
    "career 3"
  ],
  "skillGap": [
    "missing skill 1",
    "missing skill 2"
  ],
  "roadmap": [
    {
      "step": 1,
      "title": "Step title",
      "skills": [
        "skill"
      ],
      "description": "What the candidate should learn"
    }
  ],
  "interviewTopics": [
    "topic 1",
    "topic 2",
    "topic 3"
  ]
}

Resume:

${resumeText}
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    console.log("🤖 Gemini response received.");

    const cleanedResponse = response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error("Gemini JSON parsing failed:");
        console.error(response);

        throw new Error(
            "AI returned an invalid analysis format."
        );
    }
}

// ======================================================
// ML CAREER PREDICTION
// ======================================================

function predictCareerWithML(skills) {
    return new Promise((resolve, reject) => {

        if (!skills || !skills.length) {
            resolve(null);
            return;
        }

        const skillsText = Array.isArray(skills)
            ? skills.join(" ")
            : String(skills);

        console.log("🧠 Sending skills to ML model:");
        console.log(skillsText);

        // Project root -> ml -> predict.py
        const pythonScript = path.join(
            __dirname,
            "..",
            "..",
            "ml",
            "predict.py"
        );

        console.log(
            "🐍 Running ML:",
            pythonScript
        );

        const pythonProcess = spawn(
            "py",
            [pythonScript, skillsText],
            {
                cwd: path.join(
                __dirname,
                "..",
                "..",
                "ml"
                )
            }
        );

        pythonProcess.on("error", (error) => {
            console.error("🐍 Python process error:", error.message);
            reject(error);
        });

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on(
            "data",
            (data) => {
                output += data.toString();
            }
        );

        pythonProcess.stderr.on(
            "data",
            (data) => {
                errorOutput += data.toString();
            }
        );

        pythonProcess.on(
            "close",
            (code) => {

                console.log(
                    "🐍 ML process finished. Code:",
                    code
                );

                if (errorOutput) {
                    console.error(
                        "ML Error:",
                        errorOutput
                    );
                }

                if (code !== 0) {
                    reject(
                        new Error(
                            "ML prediction process failed."
                        )
                    );
                    return;
                }

                try {

                    // predict.py may print:
                    // 🤖 Career Prediction Model Loaded Successfully!
                    // {"success":true,"career":"Data Scientist"}

                    const lines = output
                        .trim()
                        .split(/\r?\n/);

                    const jsonLine =
                        lines
                            .reverse()
                            .find(
                                line =>
                                    line.trim().startsWith("{")
                            );

                    if (!jsonLine) {
                        throw new Error(
                            "ML did not return valid JSON."
                        );
                    }

                    const result =
                        JSON.parse(jsonLine);

                    if (
                        !result.success
                    ) {
                        throw new Error(
                            result.message ||
                            "Career prediction failed."
                        );
                    }

                    console.log(
                        "🎯 ML Predicted Career:",
                        result.career
                    );

                    resolve(
                        result.career
                    );

                } catch (error) {

                    console.error(
                        "ML JSON parsing error:",
                        error
                    );

                    reject(error);
                }
            }
        );
    });
}

// ======================================================
// RESUME ANALYZER
// ======================================================

router.post(
    "/analyze",
    upload.single("resume"),
    async (req, res) => {

        try {

            // ==================================================
            // CHECK FILE
            // ==================================================

            if (!req.file) {

                return res.status(400).json({
                    message:
                        "Please upload a resume"
                });
            }

            let text = "";

            // ==================================================
            // PDF
            // ==================================================

            if (
                req.file.mimetype ===
                "application/pdf"
            ) {

                console.log(
                    "PDF detected..."
                );

                console.log(
                    "Starting PDF OCR..."
                );

                const document =
                    await pdf(
                        req.file.buffer
                    );

                let pageNumber = 0;

                for await (
                    const page of document
                ) {

                    pageNumber++;

                    console.log(
                        `OCR processing page ${pageNumber}...`
                    );

                    const pageText =
                        await extractTextFromImage(
                            page
                        );

                    text +=
                        "\n" + pageText;
                }

                console.log(
                    "PDF OCR completed."
                );
            }

            // ==================================================
            // JPG / PNG
            // ==================================================

            else if (
                req.file.mimetype ===
                    "image/jpeg" ||
                req.file.mimetype ===
                    "image/png" ||
                req.file.mimetype ===
                    "image/jpg"
            ) {

                console.log(
                    "Image detected..."
                );

                text =
                    await extractTextFromImage(
                        req.file.buffer
                    );
            }

            // ==================================================
            // INVALID FILE
            // ==================================================

            else {

                return res.status(400).json({
                    message:
                        "Only PDF, JPG and PNG files are supported."
                });
            }

            // ==================================================
            // CHECK TEXT
            // ==================================================

            if (!text.trim()) {

                return res.status(400).json({
                    message:
                        "Could not read text from this resume."
                });
            }

            console.log(
                "Resume text extracted successfully."
            );

            console.log(
                "EXTRACTED RESUME TEXT:"
            );

            console.log(text);

            // ==================================================
            // GEMINI ANALYSIS
            // ==================================================

            const aiAnalysis =
                await analyzeResumeWithAI(
                    text
                );

            console.log(
                "✅ AI resume analysis completed."
            );

            // ==================================================
            // ML CAREER PREDICTION
            // ==================================================

            let mlCareer = null;

            try {

                mlCareer =
                    await predictCareerWithML(
                        aiAnalysis.skills || []
                    );

            } catch (mlError) {

                console.error(
                    "⚠️ ML prediction failed:",
                    mlError.message
                );

                // Gemini result will still work
                mlCareer = null;
            }

            // ==================================================
            // FINAL RESPONSE
            // ==================================================

            res.json({

                message:
                    "Resume analyzed successfully",

                score:
                    calculateScore(
                        aiAnalysis.skills
                    ),

                field:
                    aiAnalysis.field,

                summary:
                    aiAnalysis.summary,

                skills:
                    aiAnalysis.skills || [],

                missingSkills:
                    aiAnalysis.skillGap || [],

                careers:
                    aiAnalysis.careers || [],

                roadmap:
                    aiAnalysis.roadmap || [],

                interviewTopics:
                    aiAnalysis.interviewTopics || [],

                // ============================================
                // ML RESULT
                // ============================================

                mlCareer:
                    mlCareer

            });

        } catch (error) {

            console.error(
                "Resume Analysis Error:",
                error
            );

            res.status(500).json({

                message:
                    "Resume analysis failed",

                error:
                    error.message
            });
        }
    }
);

// ======================================================
// SCORE
// ======================================================

function calculateScore(skills) {

    if (
        !skills ||
        !skills.length
    ) {
        return 0;
    }

    const maxScore = 15;

    let score =
        Math.round(
            (skills.length / maxScore) *
            100
        );

    if (score > 100) {
        score = 100;
    }

    return score;
}

// ======================================================
// EXPORT
// ======================================================

module.exports = router;
