import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  matricNum: { type: String, required: true, unique: true }, // like staffId
  password: { type: String, required: true }
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

export default Student;
