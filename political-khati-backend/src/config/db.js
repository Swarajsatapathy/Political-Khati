import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    const databaseName =
      process.env.MONGO_DB_NAME || "political-khati";

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing from environment variables"
      );
    }

    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(mongoUri, {
      dbName: databaseName,
    });

    console.log(
      `✅ MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
    );
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;