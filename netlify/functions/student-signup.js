import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "./models/Student.js";

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

    const { fullName, matricNo, password } = JSON.parse(event.body);

    if (!fullName || !matricNo || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "All fields are required" }) };
    }

    const existing = await Student.findOne({ matricNo });
    if (existing) {
      return { statusCode: 400, body: JSON.stringify({ message: "Matric No already exists" }) };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = new Student({ fullName, matricNo, password: hashedPassword });
    await student.save();

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Signup successful! You can now login.",
        student: { fullName, matricNo }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
}
