import mongoose from "mongoose"

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  fileUrl: String,
  grade: {
    type: Number,
    default: null,
  },
  feedback: String,
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  gradedAt: Date,
})

export default mongoose.model("Submission", submissionSchema)
