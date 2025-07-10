document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('jobForm');
  const formSection = document.getElementById('jobFormSection');
  const jobsList = document.getElementById('jobsList');
  const locationFilter = document.getElementById('locationFilter');
  const workTypeFilter = document.getElementById('workTypeFilter');
  const API_URL = 'http://localhost:5000/api/jobs';

  function updateRoleBasedUI() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      localStorage.setItem("userRole", role);
      if (formSection) {
        formSection.style.display = role === "farmer" ? "block" : "none";
      }
    } catch (err) {
      console.error("Token decode error:", err);
      if (formSection) formSection.style.display = "none";
    }
  }
  updateRoleBasedUI();

  async function loadJobs() {
    try {
      const res = await fetch(API_URL);
      const jobs = await res.json();
      const selectedLocation = locationFilter?.value;
      const selectedWorkType = workTypeFilter?.value;
      populateFilterOptions(jobs);

      const filteredJobs = jobs.filter(job => {
        return (!selectedLocation || job.location === selectedLocation) &&
               (!selectedWorkType || job.workType === selectedWorkType);
      });

      if (jobsList) {
        jobsList.innerHTML = '';

        if (filteredJobs.length === 0) {
          jobsList.innerHTML = '<p>📭 No matching jobs found.</p>';
          return;
        }

        const userRole = localStorage.getItem("userRole") || "";
        const userEmail = localStorage.getItem("userEmail") || "";

        filteredJobs.forEach(job => {
          const jobCard = document.createElement('div');
          jobCard.className = 'job-card';

          let alreadyApplied = false;
          if (job.applicants?.some(app => app.email === userEmail)) {
            alreadyApplied = true;
          }

          let actionButton = '';
          if (userRole === "farmer") {
            actionButton = `
              <button class="editBtn" data-id="${job._id}">✏️ Edit</button>
              <button class="deleteBtn" data-id="${job._id}">🗑️ Delete</button>
            `;
          } else if (userRole === "laborer") {
            actionButton = alreadyApplied
              ? `<button disabled>✅ Applied</button>`
              : `<button class="applyBtn" data-id="${job._id}">📩 Apply</button>`;
          }
            
          jobCard.innerHTML = `
            <strong>${job.farmerName}</strong><br>
            <div style="margin: 6px 0;">
              📍 <b>${job.location}</b> &nbsp; | &nbsp; 🧑‍🌾 <b>${job.workType}</b><br>
              🗓️ <b>${job.date}</b> &nbsp; | &nbsp; 💰 <b>₹${job.wage}</b>
              👥 Applicants: <b>${job.applicants?.length || 0}</b>
            </div>
            ${actionButton}
          `;
          let acceptedStatus = '';
          if (userRole === "laborer") {
            const app = job.applicants?.find(a => a.email === userEmail);
            if (app?.accepted) {
              acceptedStatus = '<div class="accepted-status">✅ You were accepted!</div>';
            }
          }
          jobCard.innerHTML += acceptedStatus;

          // ✅ Show applicant contacts to farmers
          if (userRole === "farmer" && job.applicants.length > 0) {
            const applicantList = document.createElement('div');
            applicantList.innerHTML = `
              <div class="applicant-list">
                <strong>📋 Applicants:</strong>
                <ul>
                  ${job.applicants.map(app => `
                    <li>
                      📧 ${app.email} | 📞 ${app.contact} 
                      ${app.accepted ? "✅ Accepted" : `<button class="acceptBtn" data-id="${job._id}" data-email="${app.email}">Accept</button>`}
                    </li>
                  `).join('')}
                </ul>
              </div>
            `;
            jobCard.appendChild(applicantList);
          }
          jobsList.appendChild(jobCard);
        });
        let editingJobId = null;
            document.querySelectorAll('.editBtn').forEach(button => {
            button.addEventListener('click', async () => {
              const id = button.dataset.id;
              editingJobId = id;

              try {
                const res = await fetch(`${API_URL}/${id}`);
                const job = await res.json();

                document.getElementById("editLocation").value = job.location;
                document.getElementById("editWorkType").value = job.workType;
                document.getElementById("editDate").value = job.date;
                document.getElementById("editWage").value = job.wage;
                document.getElementById("editModal").style.display = "block";
              } catch (err) {
                alert("❌ Failed to load job for editing.");
                console.error(err);
              }
            });
          });

          document.getElementById("editForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const token = localStorage.getItem("token");

            const updatedJob = {
              location: document.getElementById("editLocation").value,
              workType: document.getElementById("editWorkType").value,
              date: document.getElementById("editDate").value,
              wage: parseInt(document.getElementById("editWage").value)
            };

            try {
              const res = await fetch(`${API_URL}/${editingJobId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + token
                },
                body: JSON.stringify(updatedJob)
              });

              if (res.ok) {
                alert("✅ Job updated successfully!");
                document.getElementById("editModal").style.display = "none";
                loadJobs();
              } else {
                const data = await res.json();
                alert("❌ Update failed: " + data.error);
              }
            } catch (err) {
              console.error("❌ Update error:", err);
              alert("❌ Server error while updating.");
            }
          });


        document.querySelectorAll('.deleteBtn').forEach(button => {
          button.addEventListener('click', async () => {
            const confirmDelete = confirm("Are you sure you want to delete this job?");
            if (!confirmDelete) return;

           const id = button.dataset.id;
            const token = localStorage.getItem("token");

            try {
              const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              });

              if (res.ok) {
                alert('🗑️ Job deleted');
                loadJobs();
              } else {
                const err = await res.json();
                alert('❌ Failed to delete job: ' + err.error);
              }
            } catch (err) {
              alert('❌ Server error');
              console.error(err);
            }
          });
        });

        document.querySelectorAll('.applyBtn').forEach(button => {
          button.addEventListener('click', async () => {
            const jobId = button.dataset.id;
            const token = localStorage.getItem("token");

            try {
              const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token
                }
              });

              const data = await res.json();
              if (res.ok) {
                alert("✅ Application submitted successfully!");
                loadJobs();
              } else {
                alert("❌ " + data.error);
              }
            } catch (err) {
              alert("❌ Server error");
              console.error(err);
            }
          });
        });
        document.querySelectorAll('.acceptBtn').forEach(button => {
        button.addEventListener('click', async () => {
          const jobId = button.dataset.id;
          const email = button.dataset.email;
          const token = localStorage.getItem("token");

          try {
            const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (res.ok) {
              alert("✅ Laborer accepted!");
              loadJobs(); // Refresh job list
            } else {
              alert("❌ " + data.error);
            }
          } catch (err) {
            alert("❌ Server error");
            console.error(err);
          }
        });
      });

      }
    } catch (error) {
      if (jobsList) {
        jobsList.innerHTML = '<p style="color:red;">❌ Failed to load jobs.</p>';
      }
      console.error(error);
    }
  }

  function populateFilterOptions(jobs) {
    if (!locationFilter || !workTypeFilter) return;
    const locations = [...new Set(jobs.map(job => job.location))];
    const workTypes = [...new Set(jobs.map(job => job.workType))];
    locationFilter.innerHTML = '<option value="">Filter by Location</option>';
    locations.forEach(loc => {
      locationFilter.innerHTML += `<option value="${loc}">${loc}</option>`;
    });
    workTypeFilter.innerHTML = '<option value="">Filter by Work Type</option>';
    workTypes.forEach(type => {
      workTypeFilter.innerHTML += `<option value="${type}">${type}</option>`;
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const job = {
        farmerName: form.farmerName.value,
        location: form.location.value,
        workType: form.workType.value,
        date: form.date.value,
        wage: parseInt(form.wage.value)
      };
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(job)
        });
        if (!res.ok) {
          const errorData = await res.json();
          alert('❌ Error: ' + errorData.error);
          return;
        }
        alert('✅ Job posted successfully!');
        form.reset();
        loadJobs();
        const scrollTarget = document.getElementById('jobs-section');
        if (scrollTarget) {
          window.scrollTo({ top: scrollTarget.offsetTop, behavior: 'smooth' });
        }
      } catch (error) {
        alert('❌ Failed to post job. Check server connection.');
        console.error(error);
      }
    });
  }

  if (locationFilter) locationFilter.addEventListener('change', loadJobs);
  if (workTypeFilter) workTypeFilter.addEventListener('change', loadJobs);
  if (jobsList) {
    jobsList.innerHTML = '<p>🔄 Loading jobs...</p>';
    loadJobs();
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("userRole", data.user.role);
          localStorage.setItem("userEmail", data.user.email);
          document.getElementById("loginMsg").textContent = "✅ Login successful!";
          window.location.href = "index.html";
          updateAuthUI();
          updateRoleBasedUI();
        } else {
          document.getElementById("loginMsg").textContent = "❌ Login failed!";
          console.error("Login response missing user:", data);
        }
      } catch (err) {
        console.error("Login error:", err);
      }
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value;
      const password = document.getElementById("signupPassword").value;
      const role = document.getElementById("signupRole").value;
      const contact = document.getElementById("signupContact").value;
      try {
        const res = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role, contact })
        });
        const data = await res.json();
        if (res.ok) {
          document.getElementById("signupMsg").textContent = "✅ Signup successful. You can now log in.";
        } else {
          document.getElementById("signupMsg").textContent = "❌ " + (data.error || "Signup failed.");
        }
      } catch (err) {
        console.error("Signup error:", err);
        document.getElementById("signupMsg").textContent = "❌ Server error. Try again.";
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");

  function updateAuthUI() {
    const token = localStorage.getItem("token");
    const userInfoDiv = document.getElementById("userInfo");
    const jobFormSection = document.getElementById("jobFormSection");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const email = payload.email;
        const role = payload.role;
        if (userInfoDiv) userInfoDiv.textContent = `👋 Welcome, ${email} (${role})`;
        if (logoutBtn) logoutBtn.style.display = "block";
        if (jobFormSection) jobFormSection.style.display = role === "farmer" ? "block" : "none";
      } catch (err) {
        console.error("❌ Token decoding error:", err);
      }
    } else {
      if (userInfoDiv) userInfoDiv.textContent = '';
      if (logoutBtn) logoutBtn.style.display = "none";
      if (jobFormSection) jobFormSection.style.display = "none";
    }
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      alert("🚪 Logged out successfully!");
      updateAuthUI();
      updateRoleBasedUI();
      window.location.href = "login.html";
    });
  }

  updateAuthUI();

  const userRoleDisplay = document.getElementById("userRoleDisplay");
  if (userRoleDisplay) {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRoleDisplay.textContent = `🔐 Role: ${payload.role}`;
      } else {
        userRoleDisplay.textContent = '';
      }
    } catch (err) {
      userRoleDisplay.textContent = '';
      console.error("Role display error:", err);
    }
  }

  updateRoleBasedUI();
});
