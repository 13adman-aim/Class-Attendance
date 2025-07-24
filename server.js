// server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const lecturerRoutes = require('./routes/Lecturer'); // ✅ Lecturer route import

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/qr-attendance-backend")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Student Sign Up Route
app.post("/api/signup", async (req, res) => {
  const { FullName, MatricNum, Password } = req.body;
  try {
    const existingUser = await User.findOne({ MatricNum });
    if (existingUser) {
      return res.status(400).json({ message: "Matric number already registered" });
    }

    const newUser = new User({ FullName, MatricNum, Password });
    await newUser.save();
    res.json({ message: "Signup successful" });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Student Login Route
app.post("/api/login", async (req, res) => {
  const { MatricNum, Password } = req.body;
  try {
    const user = await User.findOne({ MatricNum, Password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ✅ Connect lecturer signup/login routes
app.use('/api/lecturer', lecturerRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
