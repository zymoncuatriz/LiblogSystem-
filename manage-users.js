import { supabase } from "./supabase.js";

const user = JSON.parse(localStorage.getItem("neu_user"));

if (!user) {
  window.location.href = "admin-login.html";
}

if (user.role !== "admin") {
  window.location.href = "index.html";
}

document.getElementById("admin-name").textContent = user.name.split(" ")[0];

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  document.getElementById("dark-toggle").textContent = "☀️";
}

document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("admin_logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "admin-login.html";
});

let allUsers = [];
let selectedUserId = null;
let selectedUserName = null;

async function loadUsers() {
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  allUsers = students;
  renderTable(students);
}

function renderTable(students) {
  const tbody = document.getElementById("users-table");

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="empty-msg">No users found.</td></tr>';
    return;
  }

  tbody.innerHTML = students
    .map(
      (s) => `
    <tr>
      <td>${s.student_id}</td>
      <td>${s.name}</td>
      <td>${s.email}</td>
      <td>${s.college}</td>
      <td>
        <span class="status-badge ${s.status === "blocked" ? "status-blocked" : "status-active"}">
          ${s.status === "blocked" ? "🚫 Blocked" : "✅ Active"}
        </span>
      </td>
      <td>${s.employee_status}</td>
      <td>
        <div class="actions-cell">
          ${
            s.status === "blocked"
              ? `<button class="btn-action btn-unblock" onclick="toggleBlock('${s.student_id}', 'active')">Unblock</button>`
              : `<button class="btn-action btn-block" onclick="toggleBlock('${s.student_id}', 'blocked')">Block</button>`
          }
          <button class="btn-action btn-reset" onclick="openResetModal('${s.student_id}', '${s.name}')">Reset PW</button>
          <button class="btn-action btn-delete" onclick="openDeleteModal('${s.student_id}', '${s.name}')">Delete</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

window.toggleBlock = async (studentId, newStatus) => {
  const { error } = await supabase
    .from("students")
    .update({ status: newStatus })
    .eq("student_id", studentId);

  if (error) {
    console.error(error);
    return;
  }

  await loadUsers();
};

window.openResetModal = (studentId, name) => {
  selectedUserId = studentId;
  selectedUserName = name;
  document.getElementById("reset-user-name").textContent = name;
  document.getElementById("reset-password").value = "";
  document.getElementById("reset-error").classList.add("hidden");
  document.getElementById("reset-modal").classList.remove("hidden");
};

window.openDeleteModal = (studentId, name) => {
  selectedUserId = studentId;
  selectedUserName = name;
  document.getElementById("delete-user-name").textContent = name;
  document.getElementById("delete-modal").classList.remove("hidden");
};

document.getElementById("search-input").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();
  const filtered = allUsers.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.student_id.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query),
  );
  renderTable(filtered);
});

document.getElementById("add-user-btn").addEventListener("click", () => {
  document.getElementById("add-name").value = "";
  document.getElementById("add-student-id").value = "";
  document.getElementById("add-email").value = "";
  document.getElementById("add-password").value = "";
  document.getElementById("add-college").value = "";
  document.getElementById("add-status").value = "Student";
  document.getElementById("add-error").classList.add("hidden");
  document.getElementById("add-modal").classList.remove("hidden");
});

document.getElementById("close-add-modal").addEventListener("click", () => {
  document.getElementById("add-modal").classList.add("hidden");
});

document.getElementById("cancel-add").addEventListener("click", () => {
  document.getElementById("add-modal").classList.add("hidden");
});

document.getElementById("confirm-add").addEventListener("click", async () => {
  const name = document.getElementById("add-name").value.trim();
  const studentId = document.getElementById("add-student-id").value.trim();
  const email = document.getElementById("add-email").value.trim();
  const password = document.getElementById("add-password").value.trim();
  const college = document.getElementById("add-college").value;
  const employeeStatus = document.getElementById("add-status").value;
  const addError = document.getElementById("add-error");

  if (
    !name ||
    !studentId ||
    !email ||
    !password ||
    !college ||
    !employeeStatus
  ) {
    addError.textContent = "Please fill in all fields.";
    addError.classList.remove("hidden");
    return;
  }

  const { data: existing } = await supabase
    .from("students")
    .select("student_id")
    .eq("student_id", studentId)
    .single();

  if (existing) {
    addError.textContent = "Student ID already exists.";
    addError.classList.remove("hidden");
    return;
  }

  const { data: hashData, error: hashError } = await supabase.rpc(
    "hash_password",
    { input_password: password },
  );

  if (hashError) {
    addError.textContent = "Error hashing password.";
    addError.classList.remove("hidden");
    return;
  }

  const { error: insertError } = await supabase.from("students").insert({
    student_id: studentId,
    name: name,
    email: email,
    college: college,
    password: hashData,
    employee_status: employeeStatus,
    status: "active",
  });

  if (insertError) {
    addError.textContent = "Failed to add user. Try again.";
    addError.classList.remove("hidden");
    return;
  }

  await supabase.from("user_roles").insert({ email: email, role: "student" });

  document.getElementById("add-modal").classList.add("hidden");
  await loadUsers();
});

document.getElementById("close-reset-modal").addEventListener("click", () => {
  document.getElementById("reset-modal").classList.add("hidden");
});

document.getElementById("cancel-reset").addEventListener("click", () => {
  document.getElementById("reset-modal").classList.add("hidden");
});

document.getElementById("confirm-reset").addEventListener("click", async () => {
  const newPassword = document.getElementById("reset-password").value.trim();
  const resetError = document.getElementById("reset-error");

  if (!newPassword) {
    resetError.textContent = "Please enter a new password.";
    resetError.classList.remove("hidden");
    return;
  }

  const { data: hashData, error: hashError } = await supabase.rpc(
    "hash_password",
    { input_password: newPassword },
  );

  if (hashError) {
    resetError.textContent = "Error hashing password.";
    resetError.classList.remove("hidden");
    return;
  }

  const { error } = await supabase
    .from("students")
    .update({ password: hashData })
    .eq("student_id", selectedUserId);

  if (error) {
    resetError.textContent = "Failed to reset password.";
    resetError.classList.remove("hidden");
    return;
  }

  document.getElementById("reset-modal").classList.add("hidden");
  await loadUsers();
});

document.getElementById("close-delete-modal").addEventListener("click", () => {
  document.getElementById("delete-modal").classList.add("hidden");
});

document.getElementById("cancel-delete").addEventListener("click", () => {
  document.getElementById("delete-modal").classList.add("hidden");
});

document
  .getElementById("confirm-delete")
  .addEventListener("click", async () => {
    await supabase
      .from("library_visits")
      .delete()
      .eq("student_id", selectedUserId);

    await supabase
      .from("user_roles")
      .delete()
      .eq(
        "email",
        allUsers.find((u) => u.student_id === selectedUserId)?.email,
      );

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("student_id", selectedUserId);

    if (error) {
      console.error(error);
      return;
    }

    document.getElementById("delete-modal").classList.add("hidden");
    await loadUsers();
  });

loadUsers();

document.getElementById("logout-btn").addEventListener("click", async () => {
  localStorage.removeItem("neu_user");
  localStorage.setItem("logging_out", "true");
  await supabase.auth.signOut();
  window.location.href = "index.html";
});
