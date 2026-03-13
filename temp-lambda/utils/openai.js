require('dotenv').config();
const OpenAI = require('openai');

async function callOpenAi(schema, payload, requirements) {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const testPrompt = 'hello world';

  console.log("About to make request...");

  try {
    const userPrompt = `
      You are an AI that evaluates an API payload.

      Schema:
      ${schema}

      Payload:
      ${JSON.stringify(payload)}

      Business Requirements:
      ${requirements}
    `;

    const response = await client.responses.create({
      model: "gpt-5.4",
      input: userPrompt,
    });

    console.log("FULL RESPONSE:", JSON.stringify(response, null, 2));

    const outputText = response.output?.[0]?.content?.[0]?.text ?? '';
    console.log("Output text:", outputText);

    return response;
  } catch(error) {
    console.error("OpenAI error:", err);
  }
  
}

exports.callOpenAi = callOpenAi;