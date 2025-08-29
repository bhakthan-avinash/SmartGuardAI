// Helper: Toasts
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const id = "t" + Date.now();
  const bg = type === "success" ? "bg-success" :
             type === "danger"  ? "bg-danger"  :
             type === "warning" ? "bg-warning text-dark" : "bg-primary";
  const el = document.createElement("div");
  el.className = `toast align-items-center text-white ${bg} border-0`;
  el.id = id;
  el.setAttribute("role","alert");
  el.setAttribute("aria-live","assertive");
  el.setAttribute("aria-atomic","true");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(el);
  new bootstrap.Toast(el, { delay: 2500 }).show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

// Sidebar toggle
document.getElementById("sidebarToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar")?.classList.toggle("show");
});

// Global search (simple highlight filter across visible tables)
document.getElementById("globalSearch")?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll("table tbody tr").forEach(tr => {
    const text = tr.innerText.toLowerCase();
    tr.style.display = text.includes(q) ? "" : "none";
  });
});

// Metrics calculation
function updateMetrics() {
  // Teachers
  const teacherRows = document.querySelectorAll("#teachersTable tbody tr");
  document.getElementById("total-teachers").innerText = teacherRows.length;

  // Pending approvals
  const pendingRows = document.querySelectorAll("#teacherApprovalTable tbody tr");
  document.getElementById("pending-teacher-approvals").innerText = pendingRows.length;

  // Students (from attendance table unique student roll no, OR set manually if you have a separate list)
  // For now, count unique roll numbers from attendance + fine tables combined
  const rolls = new Set();
  document.querySelectorAll("#attendanceTable tbody tr td:nth-child(4)").forEach(td => rolls.add(td.innerText.trim()));
  document.querySelectorAll("#fineTable tbody tr td:nth-child(1)").forEach(td => rolls.add(td.innerText.trim()));
  document.getElementById("total-students").innerText = rolls.size;

  // Fines total (₹ currency)
  let total = 0;
  document.querySelectorAll("#fineTable tbody tr td:nth-child(5)").forEach(td => {
    const v = td.innerText.replace(/[^\d]/g, "");
    total += Number(v || 0);
  });
  document.getElementById("total-fines").innerText = "₹" + total;
}

// Attendance percentage = Present / (Present + Late + Absent)
function computeAttendancePercent() {
  let present = 0, total = 0;
  document.querySelectorAll("#attendanceTable tbody tr td:nth-child(6)").forEach(td => {
    const txt = td.innerText.trim().toLowerCase();
    if (!txt) return;
    total++;
    if (txt.includes("present")) present++;
  });
  const percent = total ? Math.round((present / total) * 100) : 0;
  // Put it inside the first metric subtitle to match screenshot style (or add your own card)
  // Here we append to card footer text
  const card = document.querySelector(".gradient-yellow .card-body") || document;
  let badge = document.getElementById("att-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.id = "att-badge";
    badge.className = "small mt-1";
    card?.appendChild(badge);
  }
  badge.innerHTML = `<span class="badge text-bg-secondary"><i class="bi bi-clipboard2-check me-1"></i>Attendance: ${percent}%</span>`;
}

// Approve teacher -> move row from approval table to teachers table
function wireApprovalActions() {
  const approvalTable = document.querySelector("#teacherApprovalTable tbody");
  const teachersTable = document.querySelector("#teachersTable tbody");

  approvalTable.addEventListener("click", (e) => {
    const btn = e.target.closest(".approve-btn");
    const del = e.target.closest(".delete-approval-btn");
    if (!btn && !del) return;

    const row = e.target.closest("tr");
    if (btn) {
      const [id, name, email, dept] = Array.from(row.children).slice(0,4).map(td => td.innerText.trim());
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${id}</td>
        <td>${name}</td>
        <td>${email}</td>
        <td>${dept}</td>
        <td><span class="badge bg-success">Active</span></td>
        <td><button class="btn btn-danger btn-sm delete-teacher-btn"><i class="bi bi-trash3"></i></button></td>
      `;
      teachersTable.appendChild(tr);
      row.remove();
      showToast(`Approved ${name}`);
      updateMetrics();
    }
    if (del) {
      const name = row.children[1]?.innerText ?? "Teacher";
      row.remove();
      showToast(`Deleted pending record for ${name}`, "warning");
      updateMetrics();
    }
  });
}

// Delete teacher
function wireTeacherDelete() {
  const tbody = document.querySelector("#teachersTable tbody");
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".delete-teacher-btn");
    if (!btn) return;
    const tr = btn.closest("tr");
    const name = tr.children[1]?.innerText || "Teacher";
    tr.remove();
    showToast(`Removed ${name}`, "danger");
    updateMetrics();
  });

  // Add demo button for quick testing
  document.getElementById("addDummyTeacher")?.addEventListener("click", () => {
    const n = tbody.children.length + 1001;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>T${n}</td>
      <td>New Teacher ${n}</td>
      <td>new${n}@email.com</td>
      <td>Computer Science</td>
      <td><span class="badge bg-success">Active</span></td>
      <td><button class="btn btn-danger btn-sm delete-teacher-btn"><i class="bi bi-trash3"></i></button></td>
    `;
    tbody.appendChild(tr);
    updateMetrics();
    showToast("Demo teacher added");
  });
}

// Export: Excel
function exportTableToExcel(tableID, filename = "") {
  const table = document.getElementById(tableID);
  if (!table) return;
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  const date = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, `${filename}_${date}.xlsx`);
}

// Export: PDF
function exportTableToPDF(tableID, filename = "") {
  const { jsPDF } = window.jspdf;
  const table = document.getElementById(tableID);
  if (!table) return;

  // Build rows/headers
  const rows = [];
  for (let i = 0; i < table.rows.length; i++) {
    const row = [];
    for (let j = 0; j < table.rows[i].cells.length; j++) {
      row.push(table.rows[i].cells[j].innerText);
    }
    rows.push(row);
  }
  const head = [rows[0]];
  const body = rows.slice(1);

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.autoTable({ head, body, styles: { fontSize: 9 } });
  const date = new Date().toISOString().slice(0,10);
  doc.save(`${filename}_${date}.pdf`);
}

// Profile form
document.getElementById("profileForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const result = document.getElementById("profileUpdateResult");
  result.innerHTML = '<span class="text-success">Profile updated successfully!</span>';
  showToast("Profile updated");
});

// Initial boot
document.addEventListener("DOMContentLoaded", () => {
  wireApprovalActions();
  wireTeacherDelete();
  updateMetrics();
  computeAttendancePercent();
});



document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.querySelector("#sidebarToggle");

  // Sidebar toggle
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("show");
    });
  }

  // Active menu link
  document.querySelectorAll(".sidebar .nav-link").forEach(link => {
    link.addEventListener("click", function() {
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Metric card hover
  document.querySelectorAll(".metric-card").forEach(card => {
    card.addEventListener("mouseenter", () => card.style.transform = "translateY(-5px)");
    card.addEventListener("mouseleave", () => card.style.transform = "translateY(0)");
  });
});
  



// Attendance Trend
new Chart(ctx1, {
  type: 'line',
  data: {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat'],
    datasets: [{
      label: 'Attendance %',
      data: [98, 95, 97, 92, 99, 96],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#6366f1',
      pointRadius: 5
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  }
});

// Fine Status
new Chart(ctx2, {
  type: 'doughnut',
  data: {
    labels: ['Paid', 'Unpaid'],
    datasets: [{
      data: [1, 1],
      backgroundColor: ['#22c55e','#ef4444'],
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 18, padding: 15 }
      }
    },
    cutout: '70%' // sleek donut look
  }
});
