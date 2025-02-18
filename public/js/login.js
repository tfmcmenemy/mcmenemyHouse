document.getElementById("submitButton").addEventListener("click", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    return alert("Please fill in all fields");
  }

  document.getElementById("registerForm").submit();
});
