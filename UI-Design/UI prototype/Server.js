import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/ask", async (req, res) => {
  const { topic } = req.body;

  const basePrompt = `
  You are a teacher providing multiple choice questions to students.
  Generate 8 questions on the following topic, this is should be in a valid JSON format with the following keys:
  - 'questionID'
  - 'question'
  - 'answers'
  - 'correctAns'

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

  // Stream response back to frontend
  res.setHeader("Content-Type", "text/plain");

  ollamaRes.body.on("data", chunk => {
    const str = chunk.toString();
    try {
      const json = JSON.parse(str);
      res.write(json.response || "");
    } catch {
      res.write(str);
    }
  });

  ollamaRes.body.on("end", () => res.end());
});

app.listen(3000, () =>
  console.log("Backend running at http://localhost:3000")
);
