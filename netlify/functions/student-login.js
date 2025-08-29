import mongoose from "mongoose";
import jwt from "jsonwebtoken";
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

    const { matricNum, password } = JSON.parse(event.body);

    if (!matricNum || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Matric Num and password are required" }) };
    }

    const student = await Student.findOne({ matricNum });
    if (!student) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid Matric Num or password" }) };
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return { statusCode: 400, body: JSON.stringify({ message: "Invalid Matric Num or password" }) };
    }

    const token = jwt.sign(
      { sub: student._id, matricNum: student.matricNum },
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
        student: { fullName: student.fullName, matricNum: student.matricNum }
      })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: "Server error", error: err.message }) };
  }
}
