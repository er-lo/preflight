const axios = require('axios');
const { URL } = require('url');
const { SignatureV4 } = require('@aws-sdk/signature-v4');
const { HttpRequest } = require('@aws-sdk/protocol-http');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { Sha256 } = require('@aws-crypto/sha256-js');
const { log } = require('../utils/log');
const { LOG_PREFIXES } = require('../constants/constants');
const { sendAnalysisRequest } = require('./axios');

const { LAMBDA_INVOKE } = LOG_PREFIXES;

async function lambdaInvoker(jobId, jobType, body) {
  if ((process.env.NODE_ENVIRONMENT || '').includes('dev')) {
    // keeping this to show how I was testing locally
    // this will be making an axios request to a second server that will act as my lambda during testing
    const unencodedPayload = { jobId, jobType, ...body };

    log(LAMBDA_INVOKE, 'Sending a mimic request to express server to test AI.');
    log(LAMBDA_INVOKE, `Lambda Payload: ${JSON.stringify(unencodedPayload)}`);

    const aiResult = await sendAnalysisRequest(unencodedPayload);

    log(LAMBDA_INVOKE, `Result from express: ${JSON.stringify(aiResult)}`);
    // return true for local testing.
    return true;
  }

  try {
    // this had to be changed from the original invoke lambda code.
    // the original code was using the aws sdk to invoke the lambda function.
    // this was causing issues with the lambda function not being able to call openai.
    // this was due to the api gateway timeout being too short.
    // the new code is using axios to make a request to the lambda function.

    const functionUrl = process.env.LAMBDA_FUNCTION_URL;
    if (!functionUrl) {
      throw new Error('Missing required env var: LAMBDA_FUNCTION_URL');
    }

    const region = process.env.AWS_REGION || 'us-east-2';

    // create the payload event to be sent to the lambda
    const unencodedPayload = { jobId, jobType, ...body };

    log(LAMBDA_INVOKE, `Lambda Payload: ${JSON.stringify(unencodedPayload)}`);

    const bodyJson = JSON.stringify(unencodedPayload);

    const url = new URL(functionUrl);
    const requestToSign = new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      method: 'POST',
      path: `${url.pathname}${url.search}`,
      headers: {
        host: url.hostname,
        'content-type': 'application/json',
      },
      body: bodyJson,
    });

    const signer = new SignatureV4({
      credentials: defaultProvider(),
      service: 'lambda',
      region,
      sha256: Sha256,
    });

    const signedRequest = await signer.sign(requestToSign);

    axios.request({
      url: functionUrl,
      method: signedRequest.method,
      headers: signedRequest.headers,
      data: bodyJson,
      timeout: 1500,
      maxRedirects: 0,
      validateStatus: () => true,
      responseType: 'text',
    })
    .then((res) => {
      log(LAMBDA_INVOKE, `Function URL responded with status ${res.status}`);
      if (res.status >= 400) {
        const errType = res.headers?.['x-amzn-errortype'];
        log(LAMBDA_INVOKE, `Error details: x-amzn-errortype=${errType || 'n/a'} body=${res.data}`);
      }
    })
    .catch((err) => {
      log(LAMBDA_INVOKE, `Function URL request error: ${err.message}`);
    });

    return true;
  } catch (error) {
    log(LAMBDA_INVOKE, `Error: ${error.message}`);
    return false;
  }
}

exports.lambdaInvoker = lambdaInvoker;