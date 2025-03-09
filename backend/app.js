// backend/app.js
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./utils/db'); // Adjusted path to your db.js file
const simulationRoutes = require('./routes/simulation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB using our db utility
connectDB()
  .then(() => console.log('MongoDB connection established successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/simulate', simulationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
