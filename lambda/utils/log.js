const { LOG_PREFIXES } = require('../constants/constants');

const maxTagLength = Math.max(
  ...Object.values(LOG_PREFIXES).map(tag => tag.length)
);

const TAG_WIDTH = maxTagLength + 2;

function formatLog(tag, message) {
  const formattedTag = `${tag}`.padEnd(TAG_WIDTH, ' ');
  return `${formattedTag} ${message}`;
}

function log(tag, message) {
  console.log(formatLog(tag, message));
}

exports.log = log;