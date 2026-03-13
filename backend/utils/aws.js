const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { log } = require('../utils/log');
const { LOG_PREFIXES } = require('../constants/constants');
const { sendAnalysisRequest } = require('./axios');

const { LAMBDA_INVOKE } = LOG_PREFIXES;

async function lambdaInvoker(id, schema, payload, requirements) {
  if (process.env.NODE_ENVIRONMENT.includes('dev')) {
    // TODO: wipe this dev code. I am using this to mimic a request to the lambda
    // this will be making an axios request to a second server that will act as my lambda during testing
    const unencodedPayload = {
      schema,
      payload,
      requirements,
    };

    log(LAMBDA_INVOKE, 'Sending a mimic request to express server to test AI.');
    log(LAMBDA_INVOKE, `Lambda Payload: ${JSON.stringify(unencodedPayload)}`);

    const aiResult = await sendAnalysisRequest({
      jobId: id,
      schema,
      payload,
      requirements,
    });

    log(LAMBDA_INVOKE, `Result from express: ${JSON.stringify(aiResult)}`);
    // return true for local testing.
    return true;
  }

  try {
    const config = {};
    const client = new LambdaClient(config);

    // create the payload event to be sent to the lambda
    const unencodedPayload = {
      schema,
      payload,
      requirements,
    };

    log(LAMBDA_INVOKE, `Lambda Payload: ${JSON.stringify(unencodedPayload)}`);

    // lambda docs state the payload has to be encoded
    const lambdaPayload = TextEncoder.encode(unencodedPayload);

    // creating the input to create our command
    const input = {
      FunctionName: 'preflightCompute',
      InvocationType: 'Event',
      Payload: lambdaPayload,
    }

    // create command and send command to the client to kick off the lambda
    const command = new InvokeCommand(input);
    const response = await client.send(command);

    // since we are doing this asynchronously we expect a 202 response
    if (response.StatusCode != 202) {
      throw new Error('There was an issue with invoking the lambda.')
    }

    return true;
  } catch (error) {
    log(LAMBDA_INVOKE, `Error: ${error.message}`);
    return false;
  }
}

exports.lambdaInvoker = lambdaInvoker;