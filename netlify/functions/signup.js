import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Lecturer from "./models/Lecturer.js";

let conn = null;
async function connectDB() {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return conn;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
  }

  try {
    await connectDB();

    const { fullName, staffId, password } = JSON.parse(event.body);

    if (!fullName || !staffId || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "All fields are required" }) };
    }

    const existing = await Lecturer.findOne({ staffId });
    if (existing) {
      return { statusCode: 400, body: JSON.stringify({ message: "StaffID already exists" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lecturer = new Lecturer({ fullName, staffId, password: hashedPassword });
    await lecturer.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Signup successful! You can now login.",
        lecturer: { fullName, staffId }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
}
