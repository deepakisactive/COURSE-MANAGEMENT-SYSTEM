import express from "express"
import User from "../models/User.js"
import Course from "../models/Course.js"
import Assignment from "../models/Assignment.js"
import Submission from "../models/Submission.js"
import Enrollment from "../models/Enrollment.js"

const router = express.Router()

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user role
router.put("/users/:userId/role", async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" })
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ message: "User role updated", user })
  } catch (error) {
    console.error("Error updating user role:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user
router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params

    // Don't allow deleting self
    if (userId === req.session.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" })
    }

    await User.findByIdAndDelete(userId)

    // Clean up related data
    await Course.deleteMany({ teacher: userId })
    await Enrollment.deleteMany({ student: userId })
    await Submission.deleteMany({ student: userId })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all courses (including unapproved)
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().populate("teacher", "fullName username")

    res.json(courses)
  } catch (error) {
    console.error("Error fetching courses:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Approve/reject course
router.put("/courses/:courseId/approval", async (req, res) => {
  try {
    const { courseId } = req.params
    const { isApproved } = req.body

    const course = await Course.findByIdAndUpdate(courseId, { isApproved }, { new: true })

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json({
      message: isApproved ? "Course approved" : "Course rejected",
      course,
    })
  } catch (error) {
    console.error("Error updating course approval:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete course
router.delete("/courses/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params

    await Course.findByIdAndDelete(courseId)

    // Clean up related data
    await Assignment.deleteMany({ course: courseId })
    await Enrollment.deleteMany({ course: courseId })

    // Find and delete submissions for assignments in this course
    const assignments = await Assignment.find({ course: courseId })
    const assignmentIds = assignments.map((assignment) => assignment._id)
    await Submission.deleteMany({ assignment: { $in: assignmentIds } })

    res.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get system analytics
router.get("/analytics", async (req, res) => {
  try {
    const userCount = await User.countDocuments()
    const studentCount = await User.countDocuments({ role: "student" })
    const teacherCount = await User.countDocuments({ role: "teacher" })
    const adminCount = await User.countDocuments({ role: "admin" })

    const courseCount = await Course.countDocuments()
    const approvedCourseCount = await Course.countDocuments({ isApproved: true })
    const pendingCourseCount = await Course.countDocuments({ isApproved: false })

    const assignmentCount = await Assignment.countDocuments()
    const submissionCount = await Submission.countDocuments()
    const gradedSubmissionCount = await Submission.countDocuments({ grade: { $ne: null } })

    const enrollmentCount = await Enrollment.countDocuments()

    res.json({
      users: {
        total: userCount,
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
      },
      courses: {
        total: courseCount,
        approved: approvedCourseCount,
        pending: pendingCourseCount,
      },
      assignments: assignmentCount,
      submissions: {
        total: submissionCount,
        graded: gradedSubmissionCount,
        pending: submissionCount - gradedSubmissionCount,
      },
      enrollments: enrollmentCount,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
