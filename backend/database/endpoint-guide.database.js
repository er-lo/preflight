const dbClient = require('./database.client');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants');
const { log } = require('../utils/log');

const { DB_CREATE, DB_RETRIEVE } = LOG_PREFIXES;

async function createEndpointGuideJob({ openApiFormat, openApiSpec, dataGoal, extraContext }) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO endpoint_guide_jobs (
        status,
        openapi_format,
        openapi_spec,
        data_goal,
        extra_context
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING job_id
    `;

    const values = [
      JOB_STATUS.PENDING,
      openApiFormat,
      openApiSpec,
      dataGoal,
      extraContext ?? null,
    ];

    const result = await client.query(query, values);
    if (result.rows.length) {
      log(DB_CREATE, `Endpoint-guide job inserted with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_CREATE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function retrieveEndpointGuideJob(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      SELECT *
      FROM endpoint_guide_jobs
      WHERE job_id = $1
    `;
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_RETRIEVE, `Endpoint-guide job retrieved with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_RETRIEVE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

async function retrieveEndpointGuideResult(jobId) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try {
    const query = `
      SELECT *
      FROM endpoint_guide_results
      WHERE job_id = $1
    `;
    const result = await client.query(query, [jobId]);
    if (result.rows.length) {
      log(DB_RETRIEVE, `Endpoint-guide result retrieved with id: ${result.rows[0].job_id}`);
    }
    return result.rows[0] ?? null;
  } catch (error) {
    log(DB_RETRIEVE, `Error: ${error.message}`);
    return null;
  } finally {
    await client.release();
  }
}

exports.createEndpointGuideJob = createEndpointGuideJob;
exports.retrieveEndpointGuideJob = retrieveEndpointGuideJob;
exports.retrieveEndpointGuideResult = retrieveEndpointGuideResult;

