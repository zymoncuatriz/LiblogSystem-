import { supabase } from "./supabase.js";

const googleBtn = document.getElementById("google-btn");
const errorMsg = document.getElementById("error-msg");

const isLogout = localStorage.getItem("logging_out");
if (isLogout) {
  localStorage.removeItem("logging_out");
  await supabase.auth.signOut();
} else {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    await handleGoogleUser(session.user);
  }
}

googleBtn.addEventListener("click", async () => {
  errorMsg.classList.add("hidden");
  googleBtn.disabled = true;
  googleBtn.textContent = "Redirecting to Google...";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/index.html",
    },
  });

  if (error) {
    showError("Google sign in failed. Please try again.");
    googleBtn.disabled = false;
    googleBtn.textContent = "Sign in with Google";
    console.error(error);
  }
});

async function handleGoogleUser(googleUser) {
  const email = googleUser.email;

  const { data: student, error } = await supabase
    .from("students")
    .select("student_id, name, email, college, employee_status, status")
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

  if (student.status === "blocked") {
    await supabase.auth.signOut();
    showError("Your account has been suspended. Please contact admin.");
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
