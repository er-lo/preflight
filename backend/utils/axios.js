const axios = require('axios');

async function sendAnalysisRequest(data) {
  try {
    const aiClient = axios.create({
      baseURL: "http://localhost:4000",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await aiClient.post("/ai", data);

    return response.data;
  } catch (error) {
    console.error("[AI CLIENT] Error calling AI service");

    if (error.response) {
      console.error(error.response.data);
      throw new Error(error.response.data?.message || "AI service error");
    }

    throw new Error("Unable to reach AI service");
  }
};

exports.sendAnalysisRequest = sendAnalysisRequest;