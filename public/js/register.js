document
  .getElementById("submitButton")
  .addEventListener("click", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const answer = await fetch(`/checkItem?username=${username}&table=users`);
    const data = await answer.json();
    if (data.exists) {
      return alert(
        "Username is already taken, please try a different user name. "
      );
    }

    if (answer == true) {
      return alert(
        "Username is already taken, please try a different user name. "
      );
    }

    if (!username || !password || !confirmPassword) {
      return alert("Please fill in all fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    document.getElementById("registerForm").submit();
  });
