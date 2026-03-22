import { supabase } from "./supabase.js";

const user = JSON.parse(localStorage.getItem("neu_user"));

if (!user) {
  window.location.href = "index.html";
}

if (user.role === "admin") {
  window.location.href = "admin.html";
}

const initials = user.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .substring(0, 2)
  .toUpperCase();

document.getElementById("user-avatar").textContent = initials;
document.getElementById("user-name-top").textContent = user.name.split(" ")[0];
document.getElementById("welcome-msg").textContent = "Welcome to NEU Library!";
document.getElementById("user-info").textContent =
  `${user.name} · ${user.college} · ${user.employee_status}`;
document.getElementById("user-college").textContent = user.college;

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  document.getElementById("dark-toggle").textContent = "☀️";
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("neu_user");
  window.location.href = "index.html";
});

async function loadVisits() {
  const { data: visits, error } = await supabase
    .from("library_visits")
    .select("*")
    .eq("student_id", user.student_id)
    .order("visit_date", { ascending: false })
    .order("visit_time", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  document.getElementById("total-visits").textContent = visits.length;

  if (visits.length > 0) {
    document.getElementById("last-visit").textContent = visits[0].visit_date;
  } else {
    document.getElementById("last-visit").textContent = "No visits yet";
  }

  updateTable(visits);
}

function updateTable(visits) {
  const tbody = document.getElementById("visits-table");

  if (visits.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-msg">No visits recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = visits
    .map(
      (v, index) => `
    <tr class="fade-in">
      <td>${index + 1}</td>
      <td>
        <span class="reason-pill">${v.reason || "—"}</span>
      </td>
      <td>${v.visit_date}</td>
      <td>${v.visit_time}</td>
    </tr>
  `,
    )
    .join("");
}

loadVisits();
document.getElementById("search-input").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  const rows = document.querySelectorAll("#visits-table tr");

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
});
document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});
