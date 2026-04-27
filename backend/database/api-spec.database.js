const dbClient = require('./database.client');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { log } = require('../utils/log');

const { DB_CREATE, DB_RETRIEVE } = LOG_PREFIXES;

async function createOpenApiFromCurlJob({ curl, expectedRequestBody, expectedResponseBody, endpointSummary }) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO openapi_from_curl_jobs (
        status,
        curl,
        expected_request_body_json,
        expected_response_body_json,
        endpoint_summary
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING job_id
    `;

    const values = [
      JOB_STATUS.PENDING,
      curl,
      expectedRequestBody ?? null,
      expectedResponseBody ?? null,
      endpointSummary ?? null,
    ];

    const result = await client.query(query, values);
    if (result.rows.length) {
      log(DB_CREATE, `OpenAPI-from-cURL job inserted with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function retrieveOpenApiFromCurlJob(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      SELECT *
      FROM openapi_from_curl_jobs
      WHERE job_id = $1
    `;
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_RETRIEVE, `OpenAPI-from-cURL job retrieved with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_RETRIEVE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function retrieveOpenApiFromCurlResult(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      SELECT *
      FROM openapi_from_curl_results
      WHERE job_id = $1
    `;
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_RETRIEVE, `OpenAPI-from-cURL result retrieved with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_RETRIEVE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

exports.createOpenApiFromCurlJob = createOpenApiFromCurlJob;
exports.retrieveOpenApiFromCurlJob = retrieveOpenApiFromCurlJob;
exports.retrieveOpenApiFromCurlResult = retrieveOpenApiFromCurlResult;

