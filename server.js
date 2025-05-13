import express from "express"
import mongoose from "mongoose"
import session from "express-session"
import path from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

// Routes
import authRoutes from "./routes/auth.js"
import studentRoutes from "./routes/student.js"
import teacherRoutes from "./routes/teacher.js"
import adminRoutes from "./routes/admin.js"
import courseRoutes from "./routes/course.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/course_management")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }, // 1 hour
  }),
)

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next()
  }
  res.redirect("/login.html")
}

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === "admin") {
    return next()
  }
  res.status(403).send("Access denied")
}

const isTeacher = (req, res, next) => {
  if (req.session.user && (req.session.user.role === "teacher" || req.session.user.role === "admin")) {
    return next()
  }
  res.status(403).send("Access denied")
}

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/student", isAuthenticated, studentRoutes)
app.use("/api/teacher", isAuthenticated, isTeacher, teacherRoutes)
app.use("/api/admin", isAuthenticated, isAdmin, adminRoutes)
app.use("/api/courses", isAuthenticated, courseRoutes)

// Serve HTML pages based on role
app.get("/dashboard", isAuthenticated, (req, res) => {
  const role = req.session.user.role
  if (role === "admin") {
    res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
  } else if (role === "teacher") {
    res.sendFile(path.join(__dirname, "public", "teacher-dashboard.html"));
  } else {
    res.sendFile(path.join(__dirname, "public", "student-dashboard.html"));
  }
})

// Catch-all route to redirect to login if not authenticated
app.get("*", (req, res, next) => {
  if (req.path === "/login.html" || req.path === "/register.html" || req.path.startsWith("/public/")) {
    return next()
  }
  if (!req.session.user) {
    return res.redirect("/login.html")
  }
  next()
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Visit http://localhost:${PORT} to access the application`)
})
