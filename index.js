const express = require("express");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.get("/", async (req, res) => {
  const data = await getAIResponse("Name 3 types of apples");
  return res.json({ message: data.content });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// exports.app = functions.https.onRequest(app);

async function getAIResponse(message) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant who will provide insight on queries passed to you by the user.",
      },
      {
        role: "user",
        content: message,
      },
    ],
  });
  return response.choices[0].message;
}
