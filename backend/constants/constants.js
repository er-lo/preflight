exports.LOG_PREFIXES = Object.freeze({
  SERVER_START: '[SERVER START]',
  DB_INIT: '[DB INITIALIZATION]',
});

exports.JOB_STATUS = Object.freeze({
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
});

exports.RISK_LEVEL = Object.freeze({
  NONE: 'NONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
});