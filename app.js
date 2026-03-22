import { supabase } from "./supabase.js";

const loginBtn = document.getElementById("login-btn");
const googleBtn = document.getElementById("google-btn");
const errorMsg = document.getElementById("error-msg");

// Check if this is a logout redirect
const isLogout = localStorage.getItem("logging_out");
if (isLogout) {
  localStorage.removeItem("logging_out");
  await supabase.auth.signOut();
} else {
  // Only check Google session if not logging out
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    await handleGoogleUser(session.user);
  }
}

// Student ID / Email + Password login
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
    window.location.href = "log-visit.html";
  }
});

// Google login button
googleBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/index.html",
    },
  });

  if (error) {
    showError("Google sign in failed. Please try again.");
    console.error(error);
  }
});

// Handle Google user after redirect
async function handleGoogleUser(googleUser) {
  const email = googleUser.email;

  const { data: student, error } = await supabase
    .from("students")
    .select("student_id, name, email, college, employee_status")
    .eq("email", email)
    .single();

  if (error || !student) {
    localStorage.setItem(
      "google_user",
      JSON.stringify({
        email: googleUser.email,
        name: googleUser.user_metadata?.full_name || "",
        avatar: googleUser.user_metadata?.avatar_url || "",
      }),
    );
    window.location.href = "register.html";
    return;
  }

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", email)
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
    window.location.href = "log-visit.html";
  }
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});
