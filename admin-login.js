import { supabase } from "./supabase.js";

const googleBtn = document.getElementById("google-btn");
const errorMsg = document.getElementById("error-msg");

const isLogout = localStorage.getItem("admin_logging_out");
if (isLogout) {
  localStorage.removeItem("admin_logging_out");
  await supabase.auth.signOut();
} else {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    await handleAdminGoogle(session.user);
  }
}

googleBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/admin-login.html",
    },
  });
  if (error) {
    showError("Google sign in failed. Please try again.");
    console.error(error);
  }
});

async function handleAdminGoogle(googleUser) {
  const email = googleUser.email;

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("email", email)
    .single();

  if (roleError || !roleData) {
    await supabase.auth.signOut();
    showError("No account found for this email.");
    return;
  }

  if (roleData.role !== "admin") {
    await supabase.auth.signOut();
    showError("Access denied. This portal is for admins only.");
    return;
  }

  const { data: student } = await supabase
    .from("students")
    .select("student_id, name, email, college, employee_status")
    .eq("email", email)
    .single();

  localStorage.setItem(
    "neu_user",
    JSON.stringify({
      student_id: student?.student_id || "ADMIN",
      name: student?.name || googleUser.user_metadata?.full_name || "Admin",
      email: email,
      college: student?.college || "Administration",
      employee_status: student?.employee_status || "Staff",
      role: "admin",
    }),
  );

  window.location.href = "admin.html";
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}
