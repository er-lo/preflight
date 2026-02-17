const dbClient = require('./database.client');
const { JOB_STATUS, LOG_PREFIXES } = require('../constants/constants')

async function retrieveAnalysisStatus(id) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try{
    const query = `
      SELECT *
      FROM analysis_jobs
      WHERE job_id = $1
    `;

    const values = [id];

    const result = await client.query(query, values);

    // TODO: update log
    if (result.rows.length) {
      console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Analysis job was inserted in the DB with id: ${result.rows[0].job_id}`);
    }

    return result.rows[0];

  } catch (error) {
    console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Error: ${error.message}`)
    return null;
  } finally {
    await client.release();
  }
}

async function retrieveAnalysisResult(id) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try{
    const query = `
      SELECT *
      FROM analysis_results
      WHERE job_id = $1
    `;

    const values = [id];

    const result = await client.query(query, values);

    // TODO: update log
    if (result.rows.length) {
      console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Analysis job was inserted in the DB with id: ${result.rows[0].job_id}`);
    }

    return result.rows[0];

  } catch (error) {
    console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Error: ${error.message}`)
    return null;
  } finally {
    await client.release();
  }
}

async function createAnalysisRecord(schema, payload, requirements) {
  const pool = await dbClient.getPostgresPool();
  const client = await pool.connect();

  try{
    const query = `
      INSERT INTO analysis_jobs (status, schema, request_payload, internal_requirements)
      VALUES ($1, $2, $3, $4)
      RETURNING job_id
    `;

    const values = [JOB_STATUS.PENDING, schema, payload, requirements];

    const result = await client.query(query, values);

    if (result.rows.length) {
      console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Analysis job was inserted in the DB with id: ${result.rows[0].job_id}`);
    }

    return result.rows[0];

  } catch (error) {
    console.log(`${LOG_PREFIXES.CREATE_ANALYSIS_DB} Error: ${error.message}`)
    return null;
  } finally {
    await client.release();
  }
}

exports.retrieveAnalysisStatus = retrieveAnalysisStatus;
exports.retrieveAnalysisResult = retrieveAnalysisResult;
exports.createAnalysisRecord = createAnalysisRecord;
