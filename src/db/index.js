
import { Dbname } from "../constants.js";
import mongoose from "mongoose";

import { configDotenv } from "dotenv";
configDotenv({ path: "./.env" });



const connectdb = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${Dbname}`);
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ DB connection error:", error);
    process.exit(1); // Gracefully exit if DB connection fails
  }
};

export default connectdb;
