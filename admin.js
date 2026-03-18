import { supabase } from "./supabase.js";

const user = JSON.parse(localStorage.getItem("neu_user"));

if (!user) {
  window.location.href = "index.html";
}

if (user.role !== "admin") {
  window.location.href = "user.html";
}

document.getElementById("admin-name").textContent = user.name.split(" ")[0];

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  document.getElementById("dark-toggle").textContent = "☀️";
}

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.removeItem("neu_user");
  window.location.href = "index.html";
});

const dateFilter = document.getElementById("date-filter");
dateFilter.addEventListener("change", () => {
  const isCustom = dateFilter.value === "custom";
  document.getElementById("custom-range").style.display = isCustom
    ? "flex"
    : "none";
  document.getElementById("custom-range-to").style.display = isCustom
    ? "flex"
    : "none";
});

let chartPerDay = null;
let chartByReason = null;
let chartByCollege = null;
let chartByType = null;

async function loadVisitors() {
  const dateValue = dateFilter.value;
  const reason = document.getElementById("reason-filter").value;
  const college = document.getElementById("college-filter").value;
  const employeeFilter = document.getElementById("employee-filter").value;

  let query = supabase
    .from("library_visits")
    .select(
      `
      visit_id,
      reason,
      visit_date,
      visit_time,
      students (
        name,
        student_id,
        college,
        employee_status
      )
    `,
    )
    .order("visit_date", { ascending: false });

  const now = new Date();
  if (dateValue === "today") {
    const today = new Date().toISOString().split("T")[0];
    query = query.eq("visit_date", today);
  } else if (dateValue === "week") {
    const weekAgo = new Date(now.setDate(now.getDate() - 7))
      .toISOString()
      .split("T")[0];
    query = query.gte("visit_date", weekAgo);
  } else if (dateValue === "custom") {
    const from = document.getElementById("date-from").value;
    const to = document.getElementById("date-to").value;
    if (from) query = query.gte("visit_date", from);
    if (to) query = query.lte("visit_date", to);
  }

  if (reason) query = query.eq("reason", reason);

  const { data: visits, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  let filtered = visits;

  if (college) {
    filtered = filtered.filter((v) => v.students?.college === college);
  }

  if (employeeFilter === "employee") {
    filtered = filtered.filter(
      (v) =>
        v.students?.employee_status === "Faculty" ||
        v.students?.employee_status === "Staff",
    );
  } else if (employeeFilter === "student") {
    filtered = filtered.filter(
      (v) => v.students?.employee_status === "Student",
    );
  }

  updateStats(filtered);
  updateCharts(filtered);
  updateTable(filtered);
}

function updateStats(visits) {
  const total = visits.length;
  const employees = visits.filter(
    (v) =>
      v.students?.employee_status === "Faculty" ||
      v.students?.employee_status === "Staff",
  ).length;
  const students = total - employees;

  const reasonCount = {};
  visits.forEach((v) => {
    if (v.reason) reasonCount[v.reason] = (reasonCount[v.reason] || 0) + 1;
  });
  const topReason = Object.entries(reasonCount).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("total-visitors").textContent = total;
  document.getElementById("total-students").textContent = students;
  document.getElementById("total-employees").textContent = employees;
  document.getElementById("top-reason").textContent = topReason
    ? topReason[0]
    : "—";
}

function updateCharts(visits) {
  const perDayCount = {};
  visits.forEach((v) => {
    const date = v.visit_date;
    perDayCount[date] = (perDayCount[date] || 0) + 1;
  });
  const sortedDays = Object.keys(perDayCount).sort();

  const reasonCount = {};
  visits.forEach((v) => {
    if (v.reason) reasonCount[v.reason] = (reasonCount[v.reason] || 0) + 1;
  });

  const collegeCount = {};
  visits.forEach((v) => {
    const col = v.students?.college || "Unknown";
    collegeCount[col] = (collegeCount[col] || 0) + 1;
  });

  const employees = visits.filter(
    (v) =>
      v.students?.employee_status === "Faculty" ||
      v.students?.employee_status === "Staff",
  ).length;
  const students = visits.length - employees;

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#94a3b8" : "#64748b";

  const chartDefaults = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: tickColor,
          font: { family: "Plus Jakarta Sans", size: 12 },
        },
      },
    },
  };

  if (chartPerDay) chartPerDay.destroy();
  if (chartByReason) chartByReason.destroy();
  if (chartByCollege) chartByCollege.destroy();
  if (chartByType) chartByType.destroy();

  chartPerDay = new Chart(document.getElementById("chart-per-day"), {
    type: "bar",
    data: {
      labels: sortedDays,
      datasets: [
        {
          label: "Visitors",
          data: sortedDays.map((d) => perDayCount[d]),
          backgroundColor: "#c8102e",
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: tickColor },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor },
        },
      },
    },
  });

  chartByReason = new Chart(document.getElementById("chart-by-reason"), {
    type: "bar",
    data: {
      labels: Object.keys(reasonCount),
      datasets: [
        {
          label: "Visits",
          data: Object.values(reasonCount),
          backgroundColor: [
            "#c8102e",
            "#1e1b4b",
            "#2563eb",
            "#16a34a",
            "#d97706",
          ],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: tickColor },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: tickColor },
          grid: { color: gridColor },
        },
      },
    },
  });

  chartByCollege = new Chart(document.getElementById("chart-by-college"), {
    type: "pie",
    data: {
      labels: Object.keys(collegeCount),
      datasets: [
        {
          data: Object.values(collegeCount),
          backgroundColor: [
            "#c8102e",
            "#1e1b4b",
            "#2563eb",
            "#16a34a",
            "#d97706",
            "#7c3aed",
          ],
          borderWidth: 2,
          borderColor: isDark ? "#1e293b" : "#ffffff",
        },
      ],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          position: "bottom",
          labels: {
            color: tickColor,
            font: { family: "Plus Jakarta Sans", size: 11 },
            padding: 16,
          },
        },
      },
    },
  });

  chartByType = new Chart(document.getElementById("chart-by-type"), {
    type: "doughnut",
    data: {
      labels: ["Students", "Employees"],
      datasets: [
        {
          data: [students, employees],
          backgroundColor: ["#c8102e", "#1e1b4b"],
          borderWidth: 2,
          borderColor: isDark ? "#1e293b" : "#ffffff",
        },
      ],
    },
    options: {
      ...chartDefaults,
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          position: "bottom",
          labels: {
            color: tickColor,
            font: { family: "Plus Jakarta Sans", size: 11 },
            padding: 16,
          },
        },
      },
    },
  });
}

function updateTable(visits) {
  const tbody = document.getElementById("visitors-table");

  if (visits.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-msg">No visitors found.</td></tr>';
    return;
  }

  tbody.innerHTML = visits
    .map(
      (v) => `
    <tr class="fade-in">
      <td>${v.students?.name || "—"}</td>
      <td>${v.students?.student_id || "—"}</td>
      <td>${v.students?.college || "—"}</td>
      <td><span class="reason-pill">${v.reason || "—"}</span></td>
      <td><span class="type-pill ${v.students?.employee_status === "Student" ? "pill-student" : "pill-employee"}">${v.students?.employee_status || "—"}</span></td>
      <td>${v.visit_date}</td>
      <td>${v.visit_time}</td>
    </tr>
  `,
    )
    .join("");
}

document.getElementById("apply-btn").addEventListener("click", loadVisitors);

loadVisitors();
