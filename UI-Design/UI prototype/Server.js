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
        "questionID": 0,
        "question": "What is the answer to this question?",
        "answers": [
          "Answer1",
          "Answer2",
          "Answer3",
          "Answer4"
        ],
        "correctAns": "Answer3"
    },

    Rules:
    - there are four 'answers' with the corresponding 'correctAns' highlighting which one is true
    - a 'questionID' is provided for each question and starts at 0

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
            const text = json.response || "";
            res.write(text);
            fullResponse += text;
        } catch {
            res.write(str);
            fullResponse += str;
        }
    });

    //At the end of the responce:
    ollamaRes.body.on("end", () => {
        res.end();

        const cleaned = fullResponse
            .replace(/\\n/g, "\n")
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

        const match = cleaned.match(/\[[\s\S]*\]/);

        if (!match) {
            console.error("Could not find full JSON array.");
            return;
        }

        const jsonString = match[0];

        //Saves output to JSON file in website directory:
        try {
            const jsonData = JSON.parse(jsonString);
            fs.writeFileSync("questions.json", JSON.stringify(jsonData, null, 2));
            console.log("Saved JSON to questions.json");
        } catch (err) {
            console.error("Failed to parse JSON:", err);
            console.error("Extracted JSON was:", jsonString);
        }
    });
});

app.listen(3000, () =>
    console.log("Backend running at http://localhost:3000")
);