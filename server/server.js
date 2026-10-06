const app = require('./app');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const connectWithRetry = async () => {
  let retryDelay = 5000;
  while (true) {
    if (await connectDB()) return;
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    retryDelay = Math.min(retryDelay * 2, 60000);
  }
};

connectWithRetry();
