import { supabase } from "./supabase.js";

const loginBtn = document.getElementById("login-btn");
const errorMsg = document.getElementById("error-msg");

loginBtn.addEventListener("click", async () => {
  const identifier = document.getElementById("identifier").value.trim();
  const password = document.getElementById("password").value.trim();

  errorMsg.classList.add("hidden");
  errorMsg.textContent = "";

  if (!identifier || !password) {
    showError("Please fill in all fields.");
    return;
  }

  const isEmail = identifier.includes("@");

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_id, name, email, password, college, employee_status")
    .eq(isEmail ? "email" : "student_id", identifier)
    .single();

  if (studentError || !student) {
    showError("Account not found.");
    return;
  }

  const { data: verified, error: verifyError } = await supabase.rpc(
    "verify_password",
    {
      input_password: password,
      hashed_password: student.password,
    },
  );

  if (verifyError || !verified) {
    showError("Invalid credentials. Please try again.");
    return;
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", student.email)
    .single();

  const role = roleData?.role || "student";

  localStorage.setItem(
    "neu_user",
    JSON.stringify({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      college: student.college,
      employee_status: student.employee_status,
      role: role,
    }),
  );

  if (role === "admin") {
    window.location.href = "admin.html";
  } else {
    window.location.href = "user.html";
  }
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
