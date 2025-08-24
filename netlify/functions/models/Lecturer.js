// netlify/functions/models/Lecturer.js
import mongoose from "mongoose";

const LecturerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  staffId: { type: String, required: true, unique: true },
  password: { type: String, required: true } // store hashed password
});

export default mongoose.models.Lecturer || mongoose.model("Lecturer", LecturerSchema);

