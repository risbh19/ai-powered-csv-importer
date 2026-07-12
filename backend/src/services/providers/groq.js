const { buildPrompt } = require("./prompt");
const { parseModelJson } = require("./parseModelJson");

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function generate(headers, batch, batchStartIndex) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to backend/.env (see .env.example), or switch AI_PROVIDER."
    );
  }

  const prompt = buildPrompt(headers, batch, batchStartIndex);

  let res;
  try {
    res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });
  } catch (err) {
    throw new Error(`Could not reach the Groq API: ${err.message}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Groq API error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq response did not contain any message content");
  }

  return parseModelJson(text);
}

module.exports = { generate, name: "groq" };
