import express from "express"
import Course from "../models/Course.js"
import Assignment from "../models/Assignment.js"
import Enrollment from "../models/Enrollment.js"

const router = express.Router()

// Get course details
router.get("/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.session.user.id
    const userRole = req.session.user.role

    const course = await Course.findById(courseId).populate("teacher", "fullName username")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if user has access to this course
    if (userRole === "admin" || course.teacher._id.toString() === userId) {
      return res.json(course)
    }

    // If student, check if enrolled
    if (userRole === "student") {
      const enrollment = await Enrollment.findOne({
        student: userId,
        course: courseId,
      })

      if (!enrollment) {
        return res.status(403).json({ message: "Not enrolled in this course" })
      }

      return res.json(course)
    }

    res.status(403).json({ message: "Access denied" })
  } catch (error) {
    console.error("Error fetching course:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course assignments
router.get("/:courseId/assignments", async (req, res) => {
  try {
    const { courseId } = req.params
    const userId = req.session.user.id
    const userRole = req.session.user.role

    // Check if user has access to this course
    if (userRole !== "admin") {
      const course = await Course.findById(courseId)

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      if (userRole === "teacher" && course.teacher.toString() !== userId) {
        return res.status(403).json({ message: "Not authorized to view this course" })
      }

      if (userRole === "student") {
        const enrollment = await Enrollment.findOne({
          student: userId,
          course: courseId,
        })

        if (!enrollment) {
          return res.status(403).json({ message: "Not enrolled in this course" })
        }
      }
    }

    const assignments = await Assignment.find({ course: courseId })

    res.json(assignments)
  } catch (error) {
    console.error("Error fetching assignments:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
