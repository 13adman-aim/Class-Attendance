import mongoose from "mongoose";
import jwt from "jsonwebtoken";
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

    const { staffId, password } = JSON.parse(event.body);

    if (!staffId || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "StaffID and password are required" }) };
    }

    const lecturer = await Lecturer.findOne({ staffId });
    if (!lecturer) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid StaffID or password" }) };
    }

    const isMatch = await bcrypt.compare(password, lecturer.password);
    if (!isMatch) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid StaffID or password" }) };
    }

    const token = jwt.sign(
      { sub: lecturer._id, staffId: lecturer.staffId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; Max-Age=3600`
      },
      body: JSON.stringify({
        message: "Login successful!",
        lecturer: { fullName: lecturer.fullName, staffId: lecturer.staffId }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
}
