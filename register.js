import { supabase } from "./supabase.js";

const googleUser = JSON.parse(localStorage.getItem("google_user"));

if (!googleUser) {
  window.location.href = "index.html";
}

const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

document.getElementById("google-name").textContent =
  googleUser.name || "Google User";
document.getElementById("google-email").textContent = googleUser.email;

const avatarEl = document.getElementById("google-avatar");
if (googleUser.avatar) {
  avatarEl.innerHTML = `<img src="${googleUser.avatar}" alt="avatar" />`;
} else {
  const initials = googleUser.name
    ? googleUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";
  avatarEl.textContent = initials;
}

document.getElementById("full-name").value = googleUser.name || "";

document.getElementById("back-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("google_user");
  window.location.href = "index.html";
});

document.getElementById("register-btn").addEventListener("click", async () => {
  errorMsg.classList.add("hidden");
  successMsg.classList.add("hidden");

  const name = document.getElementById("full-name").value.trim();
  const studentId = document.getElementById("student-id").value.trim();
  const college = document.getElementById("college").value;
  const employeeStatus = document.getElementById("employee-status").value;

  if (!name || !studentId || !college || !employeeStatus) {
    errorMsg.textContent = "Please fill in all fields.";
    errorMsg.classList.remove("hidden");
    return;
  }

  const registerBtn = document.getElementById("register-btn");
  registerBtn.disabled = true;
  registerBtn.textContent = "Registering...";

  const { data: existing } = await supabase
    .from("students")
    .select("student_id")
    .eq("student_id", studentId)
    .single();

  if (existing) {
    errorMsg.textContent =
      "Student ID already exists. Please use a different one.";
    errorMsg.classList.remove("hidden");
    registerBtn.disabled = false;
    registerBtn.textContent = "Complete Registration";
    return;
  }

  const { error: insertError } = await supabase.from("students").insert({
    student_id: studentId,
    name: name,
    email: googleUser.email,
    college: college,
    employee_status: employeeStatus,
    password: "google_oauth",
  });

  if (insertError) {
    errorMsg.textContent = "Registration failed. Please try again.";
    errorMsg.classList.remove("hidden");
    registerBtn.disabled = false;
    registerBtn.textContent = "Complete Registration";
    console.error(insertError);
    return;
  }

  const { error: roleError } = await supabase.from("user_roles").insert({
    email: googleUser.email,
    role: "student",
  });

  if (roleError) {
    console.error(roleError);
  }

  localStorage.setItem(
    "neu_user",
    JSON.stringify({
      student_id: studentId,
      name: name,
      email: googleUser.email,
      college: college,
      employee_status: employeeStatus,
      role: "student",
    }),
  );

  localStorage.removeItem("google_user");

  successMsg.textContent = "Registration successful! Redirecting...";
  successMsg.classList.remove("hidden");

  setTimeout(() => {
    window.location.href = "log-visit.html";
  }, 1500);
});
