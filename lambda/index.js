require('dotenv').config();

async function handler(event) {
  console.log(`ENVIRONMENT: ${process.env.NODE_ENVIRONMENT}`);
  console.log(`EVENT: ${event}`);

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello World!'),
  }

  return response;
}

exports.handler = handler();