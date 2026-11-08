document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("error-message");

  const DEMO_NAME = "admin";
  const DEMO_PASS = "admin123";

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const enteredUsername = usernameInput.value.trim();
      const enteredPassword = passwordInput.value;

      // Validate credentials
      if (enteredUsername !== DEMO_NAME || enteredPassword !== DEMO_PASS) {
        errorMessage.style.display = "block";
      } else {
        errorMessage.style.display = "none";
        // Redirect to inventory management index page
        window.location.href = "/admin/inventory.html";
      }
    });

    // Hide error alert when user begins typing again
    usernameInput.addEventListener("input", function () {
      errorMessage.style.display = "none";
    });

    passwordInput.addEventListener("input", function () {
      errorMessage.style.display = "none";
    });
  }
});
