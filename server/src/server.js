require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`MediFlow server running on http://localhost:${PORT}`);
  });
};

start();
