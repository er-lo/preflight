require('dotenv').config();
const OpenAI = require('openai');

async function callOpenAi(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const err = new Error('Missing OPENAI_API_KEY.');
    err.code = 'MISSING_OPENAI_API_KEY';
    throw err;
  }

  const client = new OpenAI({
    apiKey
  });

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.4',
    input: prompt,
  });

  return response;
}

exports.callOpenAi = callOpenAi;

