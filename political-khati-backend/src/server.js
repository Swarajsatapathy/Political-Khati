import "./config/env.js";

import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(
        `🚀 Political Khati backend running on port ${PORT}`
      );

      if (process.env.NODE_ENV !== "production") {
        console.log(`Local URL: http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    process.exit(1);
  }
};

startServer();