// Common JavaScript functions used across all dashboard pages

// Format date to a readable string
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

// Format date and time to a readable string
function formatDateTime(dateString) {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Date(dateString).toLocaleString(undefined, options)
}

// Handle navigation between dashboard sections
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link")
  const sections = document.querySelectorAll(".dashboard-section")

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      // Remove active class from all links and sections
      navLinks.forEach((l) => l.classList.remove("active"))
      sections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked link
      this.classList.add("active")

      // Show corresponding section
      const sectionId = this.getAttribute("data-section") + "-section"
      document.getElementById(sectionId).classList.add("active")
    })
  })
}

// Handle logout
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      fetch("/api/auth/logout")
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Logged out successfully") {
            window.location.href = "/login.html"
          }
        })
        .catch((error) => console.error("Logout error:", error))
    })
  }
}

// Get current user info
function getCurrentUser() {
  return fetch("/api/auth/me")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Not authenticated")
      }
      return response.json()
    })
    .then((data) => data.user)
    .catch((error) => {
      console.error("Error getting current user:", error)
      window.location.href = "/login.html"
      return null
    })
}

// Display user info in the header
function displayUserInfo() {
  getCurrentUser().then((user) => {
    if (user) {
      const userNameElement = document.getElementById("user-name")
      if (userNameElement) {
        userNameElement.textContent = `${user.fullName} (${user.role})`
      }
    }
  })
}

// Open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
  }
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"
  }
}

// Setup modal close buttons
function setupModals() {
  const closeButtons = document.querySelectorAll(".close-modal")
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      modal.style.display = "none"
    })
  })

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })
}

// Initialize common functionality
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation()
  setupLogout()
  displayUserInfo()
  setupModals()
})
