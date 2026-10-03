'use strict';
require('dotenv').config();
const { createApp } = require('./app');
const { startReportScheduler } = require('./jobs/reportScheduler');

const PORT = process.env.PORT || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Nourish API listening on :${PORT} (${process.env.NODE_ENV || 'development'})`);
  if (process.env.GROQ_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(`AI Provider: Groq Active (${process.env.GROQ_MODEL || 'openai/gpt-oss-120b'} | Vision: ${process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'})`);
  } else if (process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(`AI Provider: Anthropic Active (${process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'})`);
  } else {
    // eslint-disable-next-line no-console
    console.warn('Neither GROQ_API_KEY nor ANTHROPIC_API_KEY is set — AI endpoints will return 503 until configured.');
  }
  startReportScheduler();
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));

module.exports = server;
