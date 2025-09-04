const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const signupRoutes = require('./routes/signup');
const updateRoutes = require('./routes/update');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',        
    'http://localhost:3000',           
    'http://127.0.0.1:5173',          
    'https://timeline99.vercel.app'    
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'Content-Type', 
    'Accept',
    'Authorization',
    'X-Requested-With'
  ]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/signup', signupRoutes);
app.use('/api/update', updateRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
