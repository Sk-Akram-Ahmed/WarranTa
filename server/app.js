const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const warrantyRoutes = require('./src/routes/warranty.routes');
const fileRoutes = require('./src/routes/file.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

app.use(helmet());

const clientOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
  clientOrigins.add('http://localhost:5173');
  clientOrigins.add('http://127.0.0.1:5173');
}

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, !origin || clientOrigins.has(origin));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/files', fileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

module.exports = app;
