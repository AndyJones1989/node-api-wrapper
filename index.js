const express = require("express");
const OpenAI = require("openai");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(bodyParser.json());

app.post("/", async (req, res) => {
  if (!checkRateLimit(req)) {
    return res.status(429).json({ message: "Rate limit exceeded" });
  }
  writeToRateLimiter(req);
  const reqMessage = req.body.question;
  const data = await getAIResponse(reqMessage);
  return res.json({ message: data.content });
});

app.listen(3000, () => {
  console.log("Server is running on 3000");
});

async function getAIResponse(message) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  if (!message) {
    return { content: "Please provide a message to get a response" };
  }
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

function writeToRateLimiter(req) {
  const requester = req.headers["user-agent"];
  const timestamp = new Date().toISOString();

  const rateLimitPath = path.join(__dirname, "rateLimit.json");
  let rateLimitData = {};
  if (fs.existsSync(rateLimitPath)) {
    const fileContent = fs.readFileSync(rateLimitPath, "utf8");
    if (fileContent) {
      rateLimitData = JSON.parse(fileContent);
    }
  }

  rateLimitData[requester] = timestamp;

  fs.writeFileSync(rateLimitPath, JSON.stringify(rateLimitData, null, 2));
}

function checkRateLimit(req) {
  const requester = req.headers["user-agent"];
  const rateLimitPath = path.join(__dirname, "rateLimit.json");
  let rateLimitData = {};
  if (fs.existsSync(rateLimitPath)) {
    const fileContent = fs.readFileSync(rateLimitPath, "utf8");
    if (fileContent) {
      rateLimitData = JSON.parse(fileContent);
    }
  }

  if (rateLimitData[requester]) {
    const lastRequestTime = new Date(Date.parse(rateLimitData[requester]));
    const currentTime = new Date();
    const diff = currentTime - lastRequestTime;
    if (diff < 30 * 1000) {
      return false;
    }
  }
  return true;
}

// exports.app = functions.https.onRequest(app);
