require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const { initMailer } = require('./src/config/mailer');
const initReminderCron = require('./src/jobs/reminderCron');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initMailer();
  initReminderCron();

  app.listen(PORT, () => {
    console.log(`[Warranty Server] Running on http://localhost:${PORT}`);
  });
};

startServer();
