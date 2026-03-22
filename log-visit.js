import { supabase } from "./supabase.js";

const user = JSON.parse(localStorage.getItem("neu_user"));

if (!user) {
  window.location.href = "index.html";
}

if (user.role === "admin") {
  window.location.href = "admin.html";
}

document.getElementById("student-name").textContent = `Welcome, ${user.name}`;

let selectedReason = null;

const reasonBtns = document.querySelectorAll(".reason-btn");
const submitBtn = document.getElementById("submit-btn");
const errorMsg = document.getElementById("error-msg");
const successMsg = document.getElementById("success-msg");

reasonBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    reasonBtns.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedReason = btn.dataset.reason;
    submitBtn.disabled = false;
  });
});

submitBtn.addEventListener("click", async () => {
  errorMsg.classList.add("hidden");
  successMsg.classList.add("hidden");

  if (!selectedReason) {
    errorMsg.textContent = "Please select a reason for your visit.";
    errorMsg.classList.remove("hidden");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Logging visit...";

  const { error } = await supabase.from("library_visits").insert({
    student_id: user.student_id,
    reason: selectedReason,
    visit_date: new Date().toISOString().split("T")[0],
    visit_time: new Date().toTimeString().split(" ")[0],
  });

  if (error) {
    errorMsg.textContent = "Something went wrong. Please try again.";
    errorMsg.classList.remove("hidden");
    submitBtn.disabled = false;
    submitBtn.textContent = "Log Visit";
    return;
  }

  successMsg.textContent = `Visit logged successfully! Reason: ${selectedReason}`;
  successMsg.classList.remove("hidden");

  reasonBtns.forEach((b) => b.classList.remove("selected"));
  selectedReason = null;
  submitBtn.textContent = "Log Visit";

  setTimeout(() => {
    window.location.href = "user.html";
  }, 1500);
});

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("neu_user");
  window.location.href = "index.html";
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});
