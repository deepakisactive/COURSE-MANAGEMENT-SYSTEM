document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  fetch("/api/auth/me")
    .then((response) => {
      if (response.ok) {
        // Redirect to dashboard if already logged in
        window.location.href = "/dashboard"
      }
    })
    .catch((error) => console.error("Error checking auth status:", error))

  // Login form handler
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("username").value
      const password = document.getElementById("password").value
      const messageElement = document.getElementById("login-message")

      fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Login successful") {
            messageElement.textContent = "Login successful! Redirecting..."
            messageElement.className = "message success"

            // Redirect to dashboard after successful login
            setTimeout(() => {
              window.location.href = "/dashboard"
            }, 1000)
          } else {
            messageElement.textContent = data.message || "Login failed"
            messageElement.className = "message error"
          }
        })
        .catch((error) => {
          console.error("Login error:", error)
          messageElement.textContent = "An error occurred. Please try again."
          messageElement.className = "message error"
        })
    })
  }

  // Registration form handler
  const registerForm = document.getElementById("register-form")
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const fullName = document.getElementById("fullName").value
      const username = document.getElementById("username").value
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const role = document.getElementById("role").value
      const messageElement = document.getElementById("register-message")

      fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, username, email, password, role }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "User registered successfully") {
            messageElement.textContent = "Registration successful! Redirecting to login..."
            messageElement.className = "message success"

            // Redirect to login page after successful registration
            setTimeout(() => {
              window.location.href = "/login.html"
            }, 2000)
          } else {
            messageElement.textContent = data.message || "Registration failed"
            messageElement.className = "message error"
          }
        })
        .catch((error) => {
          console.error("Registration error:", error)
          messageElement.textContent = "An error occurred. Please try again."
          messageElement.className = "message error"
        })
    })
  }
})
