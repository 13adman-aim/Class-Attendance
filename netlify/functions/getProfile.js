// netlify/functions/getProfile.js

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Lecturer from "./models/Lecturer.js";  // ✅ Reuse the Lecturer model

// Connect to MongoDB (reusable connection)
let conn = null;
async function connectDB() {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  });
  return conn;
}

// Utility: JSON response with headers
function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

// Utility: CORS headers
function corsHeaders() {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Extract JWT from Authorization header or cookie
function extractToken(event) {
  // 1. Check Authorization header
  const authHeader = event.headers["authorization"] || event.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // 2. Check cookies
  const cookieHeader = event.headers["cookie"] || event.headers["Cookie"];
  if (cookieHeader) {
    const match = cookieHeader.match(/token=([^;]+)/); // ✅ matches "token=..."
    if (match) return match[1];
  }

  return null;
}

export async function handler(event) {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true }, corsHeaders());
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method Not Allowed" }, corsHeaders());
  }

  try {
    const headers = corsHeaders();
    const token = extractToken(event);

    if (!token) {
      return json(401, { error: "Missing or invalid token" }, headers);
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return json(500, { error: "Server misconfigured: missing JWT_SECRET" }, headers);
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return json(401, { error: "Invalid or expired token" }, headers);
    }

    // Connect to DB
    await connectDB();

    // ✅ Find lecturer by staffId from token
    const lecturer = await Lecturer.findOne({ staffId: decoded.staffId }).select("staffId fullName").lean();
    if (!lecturer) {
      return json(404, { error: "User not found" }, headers);
    }

    return json(200, { staffId: lecturer.staffId, fullName: lecturer.fullName }, headers);
  } catch (err) {
    console.error("/getProfile error", err);
    return json(500, { error: "Internal Server Error" }, corsHeaders());
  }
}
