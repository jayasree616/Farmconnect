require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Routes
const jobRoutes = require('./routes/jobs');
const authRoutes = require('./routes/auth');

const app = express();

// CORS configuration
// Allow requests from GitHub Pages frontend and localhost (for development)
app.use(cors({
  origin: [
    'https://jayasree616.github.io', // Production frontend
    'http://127.0.0.1:5500',          // Local development frontend (Live Server)
    'http://localhost:5500'           // Alternative localhost port
  ],
  credentials: true
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('🌿 FarmConnect API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
