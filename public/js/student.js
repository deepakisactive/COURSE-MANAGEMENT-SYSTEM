document.addEventListener("DOMContentLoaded", () => {
  // Helper function to open a modal
  function openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("show")
      modal.style.display = "block"
      document.body.classList.add("modal-open") // Prevent scrolling when modal is open
    }
  }

  // Helper function to close a modal
  function closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove("show")
      modal.style.display = "none"
      document.body.classList.remove("modal-open") // Re-enable scrolling
    }
  }

  // Helper function to format date and time
  function formatDateTime(dateString) {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  // Load enrolled courses
  function loadEnrolledCourses() {
    const coursesList = document.getElementById("my-courses-list")

    fetch("/api/student/my-courses")
      .then((response) => response.json())
      .then((courses) => {
        if (courses.length === 0) {
          coursesList.innerHTML = "<p>You are not enrolled in any courses yet.</p>"
          return
        }

        let html = ""
        courses.forEach((course) => {
          html += `
            <div class="course-card">
              <h3>${course.title}</h3>
              <div class="teacher">Teacher: ${course.teacher.fullName}</div>
              <div class="description">${course.description}</div>
              <div class="actions">
                <button class="btn btn-primary view-course-btn" data-id="${course._id}">View Details</button>
                <button class="btn btn-secondary view-assignments-btn" data-id="${course._id}">Assignments</button>
              </div>
            </div>
          `
        })

        coursesList.innerHTML = html

        // Add event listeners to view course buttons
        document.querySelectorAll(".view-course-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const courseId = this.getAttribute("data-id")
            viewCourseDetails(courseId)
          })
        })

        // Add event listeners to view assignments buttons
        document.querySelectorAll(".view-assignments-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const courseId = this.getAttribute("data-id")

            // Switch to assignments tab
            document.querySelector('.nav-link[data-section="assignments"]').click()

            // Select the course in the dropdown
            const courseSelect = document.getElementById("assignment-course-select")
            courseSelect.value = courseId

            // Trigger change event to load assignments
            const event = new Event("change")
            courseSelect.dispatchEvent(event)
          })
        })
      })
      .catch((error) => {
        console.error("Error loading enrolled courses:", error)
        coursesList.innerHTML = '<p class="error">Failed to load courses. Please try again later.</p>'
      })
  }

  // Load available courses
  function loadAvailableCourses() {
    const coursesList = document.getElementById("available-courses-list")

    fetch("/api/student/courses")
      .then((response) => response.json())
      .then((courses) => {
        if (courses.length === 0) {
          coursesList.innerHTML = "<p>No courses available for enrollment.</p>"
          return
        }

        let html = ""
        courses.forEach((course) => {
          html += `
            <div class="course-card">
              <h3>${course.title}</h3>
              <div class="teacher">Teacher: ${course.teacher.fullName}</div>
              <div class="description">${course.description}</div>
              <div class="actions">
                <button class="btn btn-primary enroll-btn" data-id="${course._id}">Enroll</button>
              </div>
            </div>
          `
        })

        coursesList.innerHTML = html

        // Add event listeners to enroll buttons
        document.querySelectorAll(".enroll-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const courseId = this.getAttribute("data-id")
            enrollInCourse(courseId)
          })
        })
      })
      .catch((error) => {
        console.error("Error loading available courses:", error)
        coursesList.innerHTML = '<p class="error">Failed to load courses. Please try again later.</p>'
      })
  }

  // Enroll in a course
  function enrollInCourse(courseId) {
    fetch("/api/student/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ courseId }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Enrolled successfully") {
          alert("Successfully enrolled in the course!")

          // Reload both course lists
          loadEnrolledCourses()
          loadAvailableCourses()

          // Update course dropdown in assignments section
          loadEnrolledCoursesForDropdown()
        } else {
          alert(data.message || "Failed to enroll in the course.")
        }
      })
      .catch((error) => {
        console.error("Enrollment error:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // View course details
  function viewCourseDetails(courseId) {
    fetch(`/api/courses/${courseId}`)
      .then((response) => response.json())
      .then((course) => {
        document.getElementById("course-details-title").textContent = course.title
        document.getElementById("course-details-description").textContent = course.description

        const materialsList = document.getElementById("course-materials-list")

        if (course.materials && course.materials.length > 0) {
          let html = '<ul class="materials-list">'
          course.materials.forEach((material) => {
            html += `
              <li class="material-item">
                <h4>${material.title}</h4>
                <p>${material.content}</p>
                ${material.fileUrl ? `<a href="${material.fileUrl}" target="_blank" class="btn btn-outline">Download</a>` : ""}
              </li>
            `
          })
          html += "</ul>"
          materialsList.innerHTML = html
        } else {
          materialsList.innerHTML = "<p>No materials available for this course yet.</p>"
        }

        openModal("course-details-modal")
      })
      .catch((error) => {
        console.error("Error loading course details:", error)
        alert("Failed to load course details. Please try again later.")
      })
  }

  // Load enrolled courses for dropdown
  function loadEnrolledCoursesForDropdown() {
    const courseSelect = document.getElementById("assignment-course-select")

    fetch("/api/student/my-courses")
      .then((response) => response.json())
      .then((courses) => {
        let options = '<option value="">Select a course</option>'
        courses.forEach((course) => {
          options += `<option value="${course._id}">${course.title}</option>`
        })

        courseSelect.innerHTML = options
      })
      .catch((error) => {
        console.error("Error loading courses for dropdown:", error)
        courseSelect.innerHTML = '<option value="">Failed to load courses</option>'
      })
  }

  // Load assignments for a course
  function loadAssignments(courseId) {
    const assignmentsList = document.getElementById("assignments-list")

    if (!courseId) {
      assignmentsList.innerHTML = '<p class="select-prompt">Please select a course to view assignments</p>'
      return
    }

    assignmentsList.innerHTML = '<p class="loading">Loading assignments...</p>'

    fetch(`/api/student/course/${courseId}/assignments`)
      .then((response) => response.json())
      .then((assignments) => {
        if (assignments.length === 0) {
          assignmentsList.innerHTML = "<p>No assignments available for this course.</p>"
          return
        }

        let html = ""
        assignments.forEach((assignment) => {
          const dueDate = new Date(assignment.dueDate)
          const isOverdue = dueDate < new Date()
          const isSubmitted = assignment.submitted

          html += `
            <div class="assignment-card">
              <h3>${assignment.title}</h3>
              <div class="due-date">Due: ${formatDateTime(assignment.dueDate)}</div>
              <div class="points">Points: ${assignment.totalPoints}</div>
              <div class="status ${isSubmitted ? "submitted" : "not-submitted"}">
                ${isSubmitted ? "Submitted" : isOverdue ? "Overdue" : "Not Submitted"}
              </div>
              <p>${assignment.description}</p>
              <div class="actions">
                ${
                  isSubmitted
                    ? `<button class="btn btn-secondary view-submission-btn" data-id="${assignment._id}" data-submission="${assignment.submission._id}">View Submission</button>`
                    : `<button class="btn btn-primary submit-assignment-btn" data-id="${assignment._id}">Submit</button>`
                }
              </div>
            </div>
          `
        })

        assignmentsList.innerHTML = html

        // Add event listeners to submit buttons
        document.querySelectorAll(".submit-assignment-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const assignmentId = this.getAttribute("data-id")
            openSubmissionModal(assignmentId)
          })
        })

        // Add event listeners to view submission buttons
        document.querySelectorAll(".view-submission-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const assignmentId = this.getAttribute("data-id")
            const submissionId = this.getAttribute("data-submission")
            viewSubmission(assignmentId, submissionId)
          })
        })
      })
      .catch((error) => {
        console.error("Error loading assignments:", error)
        assignmentsList.innerHTML = '<p class="error">Failed to load assignments. Please try again later.</p>'
      })
  }

  // Open submission modal
  function openSubmissionModal(assignmentId) {
    document.getElementById("assignment-id").value = assignmentId
    document.getElementById("submission-content").value = ""
    openModal("submission-modal")
  }

  // View submission
  function viewSubmission(assignmentId, submissionId) {
    // This would typically fetch the submission details from the server
    // For simplicity, we'll just show the submission modal with the existing data
    openSubmissionModal(assignmentId)
  }

  // Submit assignment
  function submitAssignment(assignmentId, content) {
    fetch("/api/student/submit-assignment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignmentId,
        content,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message.includes("submitted successfully") || data.message.includes("updated successfully")) {
          alert("Assignment submitted successfully!")
          closeModal("submission-modal")

          // Reload assignments for the current course
          const courseId = document.getElementById("assignment-course-select").value
          loadAssignments(courseId)
        } else {
          alert(data.message || "Failed to submit assignment.")
        }
      })
      .catch((error) => {
        console.error("Submission error:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Load grades
  function loadGrades() {
    const gradesList = document.getElementById("grades-list")

    fetch("/api/student/grades")
      .then((response) => response.json())
      .then((submissions) => {
        if (submissions.length === 0) {
          gradesList.innerHTML = "<p>No graded assignments yet.</p>"
          return
        }

        let html = ""
        submissions.forEach((submission) => {
          html += `
            <div class="grade-card">
              <h3>${submission.assignment.title}</h3>
              <div class="course">Course: ${submission.assignment.course.title}</div>
              <div class="grade">
                ${
                  submission.grade !== null
                    ? `Grade: ${submission.grade}/${submission.assignment.totalPoints} (${Math.round((submission.grade / submission.assignment.totalPoints) * 100)}%)`
                    : "Not graded yet"
                }
              </div>
              <div class="submitted">Submitted: ${formatDateTime(submission.submittedAt)}</div>
              ${
                submission.feedback
                  ? `<div class="feedback">
                  <h4>Feedback:</h4>
                  <p>${submission.feedback}</p>
                </div>`
                  : ""
              }
            </div>
          `
        })

        gradesList.innerHTML = html
      })
      .catch((error) => {
        console.error("Error loading grades:", error)
        gradesList.innerHTML = '<p class="error">Failed to load grades. Please try again later.</p>'
      })
  }

  // Event listeners

  // Course selection for assignments
  const assignmentCourseSelect = document.getElementById("assignment-course-select")
  if (assignmentCourseSelect) {
    assignmentCourseSelect.addEventListener("change", function () {
      const courseId = this.value
      loadAssignments(courseId)
    })
  }

  // Assignment submission form
  const submissionForm = document.getElementById("submission-form")
  if (submissionForm) {
    submissionForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const assignmentId = document.getElementById("assignment-id").value
      const content = document.getElementById("submission-content").value

      submitAssignment(assignmentId, content)
    })
  }

  // Initialize
  loadEnrolledCourses()
  loadAvailableCourses()
  loadEnrolledCoursesForDropdown()
  loadGrades()
})
