document.addEventListener("DOMContentLoaded", () => {
  // Helper functions (assuming these are defined elsewhere or in a shared file)
  function formatDate(dateString) {
    const date = new Date(dateString)
    const options = { year: "numeric", month: "long", day: "numeric" }
    return date.toLocaleDateString(undefined, options)
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString)
    const options = { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric" }
    return date.toLocaleDateString(undefined, options)
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.add("show")
      modal.style.display = "block"
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId)
    if (modal) {
      modal.classList.remove("show")
      modal.style.display = "none"
    }
  }
  // Load teacher's courses
  function loadTeacherCourses() {
    const coursesList = document.getElementById("my-courses-list")

    fetch("/api/teacher/courses")
      .then((response) => response.json())
      .then((courses) => {
        if (courses.length === 0) {
          coursesList.innerHTML = "<p>You have not created any courses yet.</p>"
          return
        }

        let html = ""
        courses.forEach((course) => {
          html += `
            <div class="course-card">
              <h3>${course.title}</h3>
              <div class="status ${course.isApproved ? "approved" : "pending"}">
                ${course.isApproved ? "Approved" : "Pending Approval"}
              </div>
              <div class="description">${course.description}</div>
              <div class="actions">
                <button class="btn btn-primary view-course-btn" data-id="${course._id}">Manage Course</button>
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
        console.error("Error loading courses:", error)
        coursesList.innerHTML = '<p class="error">Failed to load courses. Please try again later.</p>'
      })
  }

  // Load courses for dropdowns
  function loadCoursesForDropdowns() {
    fetch("/api/teacher/courses")
      .then((response) => response.json())
      .then((courses) => {
        const assignmentCourseSelect = document.getElementById("assignment-course-select")
        const submissionCourseSelect = document.getElementById("submission-course-select")
        const studentsCourseSelect = document.getElementById("students-course-select")

        let options = '<option value="">Select a course</option>'
        courses.forEach((course) => {
          options += `<option value="${course._id}">${course.title}</option>`
        })

        if (assignmentCourseSelect) assignmentCourseSelect.innerHTML = options
        if (submissionCourseSelect) submissionCourseSelect.innerHTML = options
        if (studentsCourseSelect) studentsCourseSelect.innerHTML = options
      })
      .catch((error) => {
        console.error("Error loading courses for dropdowns:", error)
      })
  }

  // View course details
  function viewCourseDetails(courseId) {
    fetch(`/api/courses/${courseId}`)
      .then((response) => response.json())
      .then((course) => {
        document.getElementById("course-details-title").textContent = course.title
        document.getElementById("course-details-description").textContent = course.description
        document.getElementById("course-approval-status").textContent = course.isApproved
          ? "Approved"
          : "Pending Approval"
        document.getElementById("course-approval-status").className = course.isApproved ? "approved" : "pending"
        document.getElementById("course-id").value = course._id

        const materialsList = document.getElementById("course-materials-list")

        if (course.materials && course.materials.length > 0) {
          let html = '<ul class="materials-list">'
          course.materials.forEach((material) => {
            html += `
              <li class="material-item">
                <h4>${material.title}</h4>
                <p>${material.content}</p>
                ${material.fileUrl ? `<a href="${material.fileUrl}" target="_blank" class="btn btn-outline">Download</a>` : ""}
                <div class="material-meta">Added: ${formatDate(material.uploadedAt)}</div>
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

  // Create a new course
  function createCourse(title, description) {
    fetch("/api/teacher/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.course) {
          const messageElement = document.getElementById("create-course-message")
          messageElement.textContent = "Course created successfully!"
          messageElement.className = "message success"

          // Clear form
          document.getElementById("course-title").value = ""
          document.getElementById("course-description").value = ""

          // Reload courses
          loadTeacherCourses()
          loadCoursesForDropdowns()

          // Clear message after a delay
          setTimeout(() => {
            messageElement.textContent = ""
            messageElement.className = "message"
          }, 3000)
        } else {
          const messageElement = document.getElementById("create-course-message")
          messageElement.textContent = data.message || "Failed to create course."
          messageElement.className = "message error"
        }
      })
      .catch((error) => {
        console.error("Course creation error:", error)
        const messageElement = document.getElementById("create-course-message")
        messageElement.textContent = "An error occurred. Please try again."
        messageElement.className = "message error"
      })
  }

  // Add material to course
  function addMaterial(courseId, title, content) {
    fetch(`/api/teacher/courses/${courseId}/materials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Material added successfully") {
          alert("Material added successfully!")

          // Reload course details
          viewCourseDetails(courseId)

          // Clear form
          document.getElementById("material-title").value = ""
          document.getElementById("material-content").value = ""
        } else {
          alert(data.message || "Failed to add material.")
        }
      })
      .catch((error) => {
        console.error("Error adding material:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Load assignments for a course
  function loadAssignments(courseId) {
    const assignmentsList = document.getElementById("assignments-list")
    const createAssignmentBtn = document.getElementById("create-assignment-btn")

    if (!courseId) {
      assignmentsList.innerHTML = '<p class="select-prompt">Please select a course to view assignments</p>'
      createAssignmentBtn.disabled = true
      return
    }

    createAssignmentBtn.disabled = false
    assignmentsList.innerHTML = '<p class="loading">Loading assignments...</p>'

    fetch(`/api/courses/${courseId}/assignments`)
      .then((response) => response.json())
      .then((assignments) => {
        if (assignments.length === 0) {
          assignmentsList.innerHTML = "<p>No assignments created for this course yet.</p>"
          return
        }

        let html = ""
        assignments.forEach((assignment) => {
          html += `
            <div class="assignment-card">
              <h3>${assignment.title}</h3>
              <div class="due-date">Due: ${formatDateTime(assignment.dueDate)}</div>
              <div class="points">Points: ${assignment.totalPoints}</div>
              <p>${assignment.description}</p>
              <div class="actions">
                <button class="btn btn-primary view-submissions-btn" data-id="${assignment._id}" data-course="${courseId}">View Submissions</button>
              </div>
            </div>
          `
        })

        assignmentsList.innerHTML = html

        // Add event listeners to view submissions buttons
        document.querySelectorAll(".view-submissions-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const assignmentId = this.getAttribute("data-id")
            const courseId = this.getAttribute("data-course")

            // Switch to submissions tab
            document.querySelector('.nav-link[data-section="submissions"]').click()

            // Select the course and assignment in the dropdowns
            const courseSelect = document.getElementById("submission-course-select")
            courseSelect.value = courseId

            // Trigger change event to load assignments dropdown
            const courseEvent = new Event("change")
            courseSelect.dispatchEvent(courseEvent)

            // We need to wait for the assignments to load before selecting
            setTimeout(() => {
              const assignmentSelect = document.getElementById("submission-assignment-select")
              assignmentSelect.value = assignmentId

              // Trigger change event to load submissions
              const assignmentEvent = new Event("change")
              assignmentSelect.dispatchEvent(assignmentEvent)
            }, 500)
          })
        })
      })
      .catch((error) => {
        console.error("Error loading assignments:", error)
        assignmentsList.innerHTML = '<p class="error">Failed to load assignments. Please try again later.</p>'
      })
  }

  // Create a new assignment
  function createAssignment(courseId, title, description, dueDate, totalPoints) {
    fetch(`/api/teacher/courses/${courseId}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description, dueDate, totalPoints }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.assignment) {
          alert("Assignment created successfully!")
          closeModal("create-assignment-modal")

          // Reload assignments
          loadAssignments(courseId)

          // Clear form
          document.getElementById("assignment-title").value = ""
          document.getElementById("assignment-description").value = ""
          document.getElementById("assignment-due-date").value = ""
          document.getElementById("assignment-points").value = "100"
        } else {
          alert(data.message || "Failed to create assignment.")
        }
      })
      .catch((error) => {
        console.error("Assignment creation error:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Load assignments dropdown for submissions
  function loadAssignmentsDropdown(courseId) {
    const assignmentSelect = document.getElementById("submission-assignment-select")
    const assignmentSelector = document.querySelector(".assignment-selector")

    if (!courseId) {
      assignmentSelector.style.display = "none"
      return
    }

    assignmentSelector.style.display = "block"
    assignmentSelect.innerHTML = '<option value="">Loading assignments...</option>'

    fetch(`/api/courses/${courseId}/assignments`)
      .then((response) => response.json())
      .then((assignments) => {
        if (assignments.length === 0) {
          assignmentSelect.innerHTML = '<option value="">No assignments available</option>'
          return
        }

        let options = '<option value="">Select an assignment</option>'
        assignments.forEach((assignment) => {
          options += `<option value="${assignment._id}">${assignment.title}</option>`
        })

        assignmentSelect.innerHTML = options
      })
      .catch((error) => {
        console.error("Error loading assignments dropdown:", error)
        assignmentSelect.innerHTML = '<option value="">Failed to load assignments</option>'
      })
  }

  // Load submissions for an assignment
  function loadSubmissions(assignmentId) {
    const submissionsList = document.getElementById("submissions-list")

    if (!assignmentId) {
      submissionsList.innerHTML = '<p class="select-prompt">Please select an assignment to view submissions</p>'
      return
    }

    submissionsList.innerHTML = '<p class="loading">Loading submissions...</p>'

    fetch(`/api/teacher/assignments/${assignmentId}/submissions`)
      .then((response) => response.json())
      .then((submissions) => {
        if (submissions.length === 0) {
          submissionsList.innerHTML = "<p>No submissions received for this assignment yet.</p>"
          return
        }

        let html = ""
        submissions.forEach((submission) => {
          html += `
            <div class="submission-card">
              <h3>Student: ${submission.student.fullName}</h3>
              <div class="submitted">Submitted: ${formatDateTime(submission.submittedAt)}</div>
              <div class="grade-status">
                ${submission.grade !== null ? `Graded: ${submission.grade} points` : "Not graded yet"}
              </div>
              <div class="actions">
                <button class="btn btn-primary grade-submission-btn" data-id="${submission._id}" data-student="${submission.student.fullName}" data-content="${encodeURIComponent(submission.content)}" data-grade="${submission.grade || ""}" data-feedback="${encodeURIComponent(submission.feedback || "")}">
                  ${submission.grade !== null ? "Update Grade" : "Grade Submission"}
                </button>
              </div>
            </div>
          `
        })

        submissionsList.innerHTML = html

        // Add event listeners to grade submission buttons
        document.querySelectorAll(".grade-submission-btn").forEach((button) => {
          button.addEventListener("click", function () {
            const submissionId = this.getAttribute("data-id")
            const studentName = this.getAttribute("data-student")
            const content = decodeURIComponent(this.getAttribute("data-content"))
            const grade = this.getAttribute("data-grade")
            const feedback = decodeURIComponent(this.getAttribute("data-feedback"))

            openGradeModal(submissionId, studentName, content, grade, feedback)
          })
        })
      })
      .catch((error) => {
        console.error("Error loading submissions:", error)
        submissionsList.innerHTML = '<p class="error">Failed to load submissions. Please try again later.</p>'
      })
  }

  // Open grade submission modal
  function openGradeModal(submissionId, studentName, content, grade, feedback) {
    document.getElementById("submission-id").value = submissionId
    document.getElementById("submission-student").textContent = studentName
    document.getElementById("submission-content").innerHTML = content
    document.getElementById("grade").value = grade
    document.getElementById("feedback").value = feedback

    openModal("grade-submission-modal")
  }

  // Grade submission
  function gradeSubmission(submissionId, grade, feedback) {
    fetch(`/api/teacher/submissions/${submissionId}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grade, feedback }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Submission graded successfully") {
          alert("Submission graded successfully!")
          closeModal("grade-submission-modal")

          // Reload submissions for the current assignment
          const assignmentId = document.getElementById("submission-assignment-select").value
          loadSubmissions(assignmentId)
        } else {
          alert(data.message || "Failed to grade submission.")
        }
      })
      .catch((error) => {
        console.error("Grading error:", error)
        alert("An error occurred. Please try again.")
      })
  }

  // Load students enrolled in a course
  function loadStudents(courseId) {
    const studentsList = document.getElementById("students-list")

    if (!courseId) {
      studentsList.innerHTML = '<p class="select-prompt">Please select a course to view enrolled students</p>'
      return
    }

    studentsList.innerHTML = '<p class="loading">Loading students...</p>'

    fetch(`/api/teacher/courses/${courseId}/students`)
      .then((response) => response.json())
      .then((students) => {
        if (students.length === 0) {
          studentsList.innerHTML = "<p>No students enrolled in this course yet.</p>"
          return
        }

        let html =
          '<div class="table-container"><table class="data-table"><thead><tr><th>Name</th><th>Username</th><th>Email</th></tr></thead><tbody>'

        students.forEach((student) => {
          html += `
            <tr>
              <td>${student.fullName}</td>
              <td>${student.username}</td>
              <td>${student.email}</td>
            </tr>
          `
        })

        html += "</tbody></table></div>"
        studentsList.innerHTML = html
      })
      .catch((error) => {
        console.error("Error loading students:", error)
        studentsList.innerHTML = '<p class="error">Failed to load students. Please try again later.</p>'
      })
  }

  // Event listeners

  // Create course form
  const createCourseForm = document.getElementById("create-course-form")
  if (createCourseForm) {
    createCourseForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("course-title").value
      const description = document.getElementById("course-description").value

      createCourse(title, description)
    })
  }

  // Add material form
  const addMaterialForm = document.getElementById("add-material-form")
  if (addMaterialForm) {
    addMaterialForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const courseId = document.getElementById("course-id").value
      const title = document.getElementById("material-title").value
      const content = document.getElementById("material-content").value

      addMaterial(courseId, title, content)
    })
  }

  // Course selection for assignments
  const assignmentCourseSelect = document.getElementById("assignment-course-select")
  if (assignmentCourseSelect) {
    assignmentCourseSelect.addEventListener("change", function () {
      const courseId = this.value
      loadAssignments(courseId)

      // Update the create assignment button to include the course ID
      const createAssignmentBtn = document.getElementById("create-assignment-btn")
      if (createAssignmentBtn) {
        createAssignmentBtn.setAttribute("data-course-id", courseId)
      }
    })
  }

  // Create assignment button
  const createAssignmentBtn = document.getElementById("create-assignment-btn")
  if (createAssignmentBtn) {
    createAssignmentBtn.addEventListener("click", function () {
      const courseId = this.getAttribute("data-course-id")
      document.getElementById("assignment-course-id").value = courseId

      // Set default due date (7 days from now)
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      document.getElementById("assignment-due-date").value = dueDate.toISOString().slice(0, 16)

      openModal("create-assignment-modal")
    })
  }

  // Create assignment form
  const createAssignmentForm = document.getElementById("create-assignment-form")
  if (createAssignmentForm) {
    createAssignmentForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const courseId = document.getElementById("assignment-course-id").value
      const title = document.getElementById("assignment-title").value
      const description = document.getElementById("assignment-description").value
      const dueDate = document.getElementById("assignment-due-date").value
      const totalPoints = document.getElementById("assignment-points").value

      createAssignment(courseId, title, description, dueDate, totalPoints)
    })
  }

  // Course selection for submissions
  const submissionCourseSelect = document.getElementById("submission-course-select")
  if (submissionCourseSelect) {
    submissionCourseSelect.addEventListener("change", function () {
      const courseId = this.value
      loadAssignmentsDropdown(courseId)

      // Reset submissions list
      document.getElementById("submissions-list").innerHTML =
        '<p class="select-prompt">Please select an assignment to view submissions</p>'
    })
  }

  // Assignment selection for submissions
  const submissionAssignmentSelect = document.getElementById("submission-assignment-select")
  if (submissionAssignmentSelect) {
    submissionAssignmentSelect.addEventListener("change", function () {
      const assignmentId = this.value
      loadSubmissions(assignmentId)
    })
  }

  // Grade submission form
  const gradeForm = document.getElementById("grade-form")
  if (gradeForm) {
    gradeForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const submissionId = document.getElementById("submission-id").value
      const grade = document.getElementById("grade").value
      const feedback = document.getElementById("feedback").value

      gradeSubmission(submissionId, grade, feedback)
    })
  }

  // Course selection for students
  const studentsCourseSelect = document.getElementById("students-course-select")
  if (studentsCourseSelect) {
    studentsCourseSelect.addEventListener("change", function () {
      const courseId = this.value
      loadStudents(courseId)
    })
  }

  // Initialize
  loadTeacherCourses()
  loadCoursesForDropdowns()
})
