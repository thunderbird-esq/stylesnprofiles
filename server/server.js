require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiProxyRouter = require('./routes/apiProxy');
const resourceNavigatorRouter = require('./routes/resourceNavigator');
const db = require('./db'); // Import db to ensure pool is created

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Allow requests from the React client
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// API Routes
// Path 1: The NASA proxy
app.use('/api/nasa', apiProxyRouter);
// Path 1: The database API for saved items/searches
app.use('/api/resources', resourceNavigatorRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NASA System 6 Server running on http://localhost:${PORT}`);
});