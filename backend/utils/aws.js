const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

async function lambdaInvoker(schema, payload, requirements){
  if (process.env.NODE_ENVIRONMENT.includes('dev')) {
    // return true for local testing.
    return true;
  }

  try{
    const config = {};
    const client = new LambdaClient(config);

    const unencodedPayload = {
      schema,
      payload,
      requirements,
    }

    const lambdaPayload = TextEncoder.encode(unencodedPayload);

    const input = {
      FunctionName: 'preflightCompute',
      InvocationType: 'Event',
      Payload: lambdaPayload,
    }

    const command = new InvokeCommand(input);
    const response = await client.send(command);

    if(response.StatusCode != 202) {
      throw new Error('There was an issue with invoking the lambda.')
    }

    return true;
  } catch(error) {
    console.log(error);
    return false;
  }
}

exports.lambdaInvoker = lambdaInvoker;