import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

//Send request to Model
app.post("/api/ask", async (req, res) => {
    const { topic } = req.body;

    //Prompt outline for request
    const basePrompt = `
    You are a teacher providing multiple choice questions to students.
    Generate 8 questions on the following topic, this should be in a valid JSON format using the following question template:
    {
    "0": {
        "question": "Question text here",
        "answers": [
        "Answer 1",
        "Answer 2",
        "Answer 3",
        "Answer 4"
        ],
        "correctAns": "The correct answer text here"
    },
    "1": {
        "question": "Question text here",
        "answers": [
        "Answer 1",
        "Answer 2",
        "Answer 3",
        "Answer 4"
        ],
        "correctAns": "The correct answer text here"
    }
    // continue with all questions in the same object
    }

    Rules:
    - Do not wrap each question inside a separate array or object.
    - Use a single JSON object containing all questions keyed by their IDs ("0" to "7").
    - Each question must have four 'answers' and a 'correctAns'.
    - Question IDs start at 0 and increment by 1.
    - Only output valid JSON; no extra text.

    Topic: ${topic}
    `.trim();

    const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "gemma3:1b",
            prompt: basePrompt
        })
    });

    let fullResponse = "";
    res.setHeader("Content-Type", "text/plain");

    ollamaRes.body.on("data", chunk => {
        const str = chunk.toString();

        try {
            const json = JSON.parse(str);          
            fullResponse += json.response;
        } catch {
        }
    });

    //At the end of the responce:
    ollamaRes.body.on("end", () => {

        const cleaned = fullResponse
            .replace(/\\n/g, "\n")
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        // Optional: remove leading/trailing text outside the first { ... }
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) {
            console.error("Could not find JSON object in response.");
            return;
        }

        const jsonString = cleaned.slice(firstBrace, lastBrace + 1);

        try {
            const jsonData = JSON.parse(jsonString);

            res.setHeader("Content-Type", "application/json");
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=questions.json"
            );

            res.send(JSON.stringify(jsonData, null, 2));

        } catch (err) {
            console.error("Failed to parse JSON:", err);
        }
    });
});

app.listen(3000, () =>
    console.log("Backend running at http://localhost:3000")
);