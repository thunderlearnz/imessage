import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.DB_CONNECTION_URL;
    if (!mongoURI) {
      console.log("no mongouri found");
      throw new Error("No mongoURI found");
      process.exit(1);
    }
    const connection = await mongoose.connect(mongoURI);
  } catch (err) {
    console.log("the error is ", err);
    throw new Error("Coulnot conect to the db");
    process.exit(1);
  }
};

export default connectDB;
