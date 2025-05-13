import express from "express"
import Course from "../models/Course.js"
import Assignment from "../models/Assignment.js"
import Submission from "../models/Submission.js"
import Enrollment from "../models/Enrollment.js"

const router = express.Router()

// Get all available courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find({ isApproved: true })
      .populate("teacher", "fullName")
      .select("title description teacher")

    res.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Enroll in a course
router.post("/enroll", async (req, res) => {
  try {
    const { courseId } = req.body
    const studentId = req.session.user.id

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    })

    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" })
    }

    // Create new enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: courseId,
    })

    await enrollment.save()

    res.status(201).json({ message: "Enrolled successfully" })
  } catch (error) {
    console.error("Enrollment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get enrolled courses
router.get("/my-courses", async (req, res) => {
  try {
    const studentId = req.session.user.id

    const enrollments = await Enrollment.find({ student: studentId }).populate({
      path: "course",
      select: "title description teacher materials",
      populate: {
        path: "teacher",
        select: "fullName",
      },
    })

    const courses = enrollments.map((enrollment) => enrollment.course)

    res.json(courses)
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get assignments for a course
router.get("/course/:courseId/assignments", async (req, res) => {
  try {
    const { courseId } = req.params
    const studentId = req.session.user.id

    // Check if enrolled
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    })

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled in this course" })
    }

    const assignments = await Assignment.find({ course: courseId })

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await Submission.findOne({
          assignment: assignment._id,
          student: studentId,
        })

        return {
          ...assignment.toObject(),
          submitted: !!submission,
          submission: submission || null,
        }
      }),
    )

    res.json(assignmentsWithStatus)
  } catch (error) {
    console.error("Error fetching assignments:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Submit assignment
router.post("/submit-assignment", async (req, res) => {
  try {
    const { assignmentId, content, fileUrl } = req.body
    const studentId = req.session.user.id

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId)
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    // Check if enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: assignment.course,
    })

    if (!enrollment) {
      return res.status(403).json({ message: "Not enrolled in this course" })
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({
      assignment: assignmentId,
      student: studentId,
    })

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.content = content
      if (fileUrl) existingSubmission.fileUrl = fileUrl
      existingSubmission.submittedAt = Date.now()

      await existingSubmission.save()

      return res.json({ message: "Submission updated successfully" })
    }

    // Create new submission
    const submission = new Submission({
      assignment: assignmentId,
      student: studentId,
      content,
      fileUrl,
    })

    await submission.save()

    res.status(201).json({ message: "Assignment submitted successfully" })
  } catch (error) {
    console.error("Submission error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get grades and feedback
router.get("/grades", async (req, res) => {
  try {
    const studentId = req.session.user.id

    const submissions = await Submission.find({ student: studentId }).populate({
      path: "assignment",
      select: "title totalPoints course",
      populate: {
        path: "course",
        select: "title",
      },
    })

    res.json(submissions)
  } catch (error) {
    console.error("Error fetching grades:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
