require('dotenv').config();
const OpenAI = require('openai');

async function callOpenAi(prompt) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log("About to make request...");

  try {

    console.log("User prompt:", prompt);

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: prompt,
    });

    const outputText = response.output?.[0]?.content?.[0]?.text ?? '';
    console.log("Output text:", outputText);

    return response;
  } catch(error) {
    console.error("OpenAI error:", error);
    throw error;
  }
  
}

exports.callOpenAi = callOpenAi;