import { supabase } from "./supabase.js";

const user = JSON.parse(localStorage.getItem("neu_user"));

if (!user) {
  window.location.href = "index.html";
}

if (user.role === "admin") {
  window.location.href = "admin.html";
}

document.getElementById("welcome-msg").textContent = "Welcome to NEU Library!";
document.getElementById("user-info").textContent =
  `${user.name} | ${user.college} | ${user.employee_status}`;
document.getElementById("user-college").textContent = user.college;

document.getElementById("log-visit-btn").addEventListener("click", () => {
  window.location.href = "log-visit.html";
});

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
    const last = visits[0];
    document.getElementById("last-visit").textContent = last.visit_date;
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
    <tr>
      <td>${index + 1}</td>
      <td>${v.reason || "—"}</td>
      <td>${v.visit_date}</td>
      <td>${v.visit_time}</td>
    </tr>
  `,
    )
    .join("");
}

loadVisits();
