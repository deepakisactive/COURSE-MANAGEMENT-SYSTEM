import express from "express"
import Course from "../models/Course.js"
import Assignment from "../models/Assignment.js"
import Submission from "../models/Submission.js"
import Enrollment from "../models/Enrollment.js"

const router = express.Router()

// Create a new course
router.post("/courses", async (req, res) => {
  try {
    const { title, description } = req.body
    const teacherId = req.session.user.id

    const course = new Course({
      title,
      description,
      teacher: teacherId,
      isApproved: req.session.user.role === "admin", // Auto-approve if admin
    })

    await course.save()

    res.status(201).json({ message: "Course created successfully", course })
  } catch (error) {
    console.error("Course creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get teacher's courses
router.get("/courses", async (req, res) => {
  try {
    const teacherId = req.session.user.id

    const courses = await Course.find({ teacher: teacherId })

    res.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add material to course
router.post("/courses/:courseId/materials", async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, content, fileUrl } = req.body
    const teacherId = req.session.user.id

    // Check if teacher owns the course
    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
    })

    if (!course) {
      return res.status(403).json({ message: "Not authorized to modify this course" })
    }

    course.materials.push({
      title,
      content,
      fileUrl,
    })

    await course.save()

    res.status(201).json({ message: "Material added successfully" })
  } catch (error) {
    console.error("Error adding material:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create assignment
router.post("/courses/:courseId/assignments", async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, description, dueDate, totalPoints } = req.body
    const teacherId = req.session.user.id

    // Check if teacher owns the course
    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
    })

    if (!course) {
      return res.status(403).json({ message: "Not authorized to modify this course" })
    }

    const assignment = new Assignment({
      title,
      description,
      course: courseId,
      dueDate,
      totalPoints,
    })

    await assignment.save()

    res.status(201).json({ message: "Assignment created successfully", assignment })
  } catch (error) {
    console.error("Assignment creation error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get submissions for an assignment
router.get("/assignments/:assignmentId/submissions", async (req, res) => {
  try {
    const { assignmentId } = req.params
    const teacherId = req.session.user.id

    // Check if teacher owns the assignment
    const assignment = await Assignment.findById(assignmentId).populate("course")

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" })
    }

    if (assignment.course.teacher.toString() !== teacherId && req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view these submissions" })
    }

    const submissions = await Submission.find({ assignment: assignmentId }).populate("student", "fullName username")

    res.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Grade submission
router.post("/submissions/:submissionId/grade", async (req, res) => {
  try {
    const { submissionId } = req.params
    const { grade, feedback } = req.body
    const teacherId = req.session.user.id

    // Find submission
    const submission = await Submission.findById(submissionId).populate({
      path: "assignment",
      populate: {
        path: "course",
      },
    })

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" })
    }

    // Check if teacher owns the course
    if (submission.assignment.course.teacher.toString() !== teacherId && req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to grade this submission" })
    }

    // Update submission
    submission.grade = grade
    submission.feedback = feedback
    submission.gradedAt = Date.now()

    await submission.save()

    res.json({ message: "Submission graded successfully" })
  } catch (error) {
    console.error("Grading error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get students enrolled in a course
router.get("/courses/:courseId/students", async (req, res) => {
  try {
    const { courseId } = req.params
    const teacherId = req.session.user.id

    // Check if teacher owns the course
    const course = await Course.findOne({
      _id: courseId,
      teacher: teacherId,
    })

    if (!course && req.session.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this course" })
    }

    const enrollments = await Enrollment.find({ course: courseId }).populate("student", "fullName username email")

    const students = enrollments.map((enrollment) => enrollment.student)

    res.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
