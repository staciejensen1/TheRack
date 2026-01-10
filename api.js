/*
 * THE RACK - API & Data Functions
 * Version: 2.12.0
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */

// ============ API HELPER ============
function apiCall(action, params) {
  var url = API_URL + "?action=" + action;
  url += "&email=" + encodeURIComponent(state.email);
  url += "&code=" + encodeURIComponent(state.sheetId);
  
  for (var key in params) {
    if (params[key] !== undefined) {
      var value = typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key];
      url += "&" + key + "=" + encodeURIComponent(value);
    }
  }
  
  return fetch(url).then(function(response) { 
    return response.json(); 
  });
}

// ============ LOGIN ============
function handleLogin() {
  var email = document.getElementById("emailInput").value.trim().toLowerCase();
  var code = document.getElementById("accessCodeInput").value.trim();

  if (!email) {
    setStatus("Please enter your email", true);
    return;
  }
  if (!code) {
    setStatus("Please enter your access code", true);
    return;
  }

  setStatus("Logging in...");
  document.getElementById("loginBtn").textContent = "Logging in...";
  document.getElementById("loginBtn").disabled = true;

  if (state.qrPending && state.qrPending.code) {
    code = state.qrPending.code;
  }

  var url = API_URL + "?action=login&email=" + encodeURIComponent(email) + "&code=" + encodeURIComponent(code);
  
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        state.email = email;
        state.sheetId = data.sheetId;
        state.isLoggedIn = true;

        localStorage.setItem("therack_email", email);
        localStorage.setItem("therack_sheet_id", data.sheetId);

        if (state.qrPending && state.qrPending.animal) {
          state.qrPending = { animal: state.qrPending.animal };
        }

        setStatus("Logged in! Loading your data...");
        updateUI();
        loadData();
      } else {
        setStatus(data.error || "Invalid email or access code", true);
      }
    })
    .catch(function(error) {
      setStatus("Error: " + error.message, true);
    })
    .finally(function() {
      document.getElementById("loginBtn").textContent = "Log In";
      document.getElementById("loginBtn").disabled = false;
    });
}

function handleMobileLogin() {
  var email = document.getElementById("mobileEmailInput").value.trim().toLowerCase();
  var code = document.getElementById("mobileAccessCodeInput").value.trim();

  if (!email) {
    setStatus("Please enter your email", true);
    return;
  }
  if (!code) {
    setStatus("Please enter your access code", true);
    return;
  }

  setStatus("Logging in...");
  document.getElementById("mobileLoginBtn").textContent = "Logging in...";
  document.getElementById("mobileLoginBtn").disabled = true;

  if (state.qrPending && state.qrPending.code) {
    code = state.qrPending.code;
  }

  var url = API_URL + "?action=login&email=" + encodeURIComponent(email) + "&code=" + encodeURIComponent(code);
  
  fetch(url)
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        state.email = email;
        state.sheetId = data.sheetId;
        state.isLoggedIn = true;

        localStorage.setItem("therack_email", email);
        localStorage.setItem("therack_sheet_id", data.sheetId);

        if (state.qrPending && state.qrPending.animal) {
          state.qrPending = { animal: state.qrPending.animal };
        }

        setStatus("Logged in! Loading your data...");
        updateUI();
        loadData();
      } else {
        setStatus(data.error || "Invalid email or access code", true);
      }
    })
    .catch(function(error) {
      setStatus("Login failed: " + error.message, true);
    })
    .finally(function() {
      document.getElementById("mobileLoginBtn").textContent = "Log In";
      document.getElementById("mobileLoginBtn").disabled = false;
    });
}

function handleSignOut() {
  state.isLoggedIn = false;
  state.email = "";
  state.sheetId = "";
  state.data = { collection: [], clutch: [], activity: [], archive: [] };
  state.headers = { collection: [], clutch: [], activity: [], archive: [] };

  localStorage.removeItem("therack_email");
  localStorage.removeItem("therack_sheet_id");

  document.getElementById("emailInput").value = "";
  document.getElementById("accessCodeInput").value = "";
  document.getElementById("mobileEmailInput").value = "";
  document.getElementById("mobileAccessCodeInput").value = "";

  updateUI();
  renderCurrentView();
  setStatus("Signed out. Enter your email and access code to log in.");
}

function updateUI() {
  var loginGroup = document.getElementById("loginGroup");
  var connectedGroup = document.getElementById("connectedGroup");
  var mobileLoginGroup = document.getElementById("mobileLoginGroup");
  var mobileSyncBtn = document.getElementById("mobileSyncBtn");
  var mobileUserInfo = document.getElementById("mobileUserInfo");

  if (state.isLoggedIn) {
    loginGroup.classList.add("hidden");
    connectedGroup.classList.remove("hidden");
    mobileLoginGroup.classList.add("hidden");
    mobileSyncBtn.classList.remove("hidden");
    mobileUserInfo.classList.remove("hidden");
    document.getElementById("userEmail").textContent = state.email;
    document.getElementById("mobileUserEmail").textContent = state.email;
  } else {
    loginGroup.classList.remove("hidden");
    connectedGroup.classList.add("hidden");
    mobileLoginGroup.classList.remove("hidden");
    mobileSyncBtn.classList.add("hidden");
    mobileUserInfo.classList.add("hidden");
  }
}

// ============ DATA LOADING ============
function loadData() {
  if (!state.isLoggedIn) { 
    setStatus("Please log in first.", true); 
    return; 
  }

  state.isLoading = true;
  setStatus("Loading data... this may take a few seconds.");

  apiCall('getData', {})
    .then(function(response) {
      if (response.success) {
        var data = response.data;
        
        state.headers = {
          collection: data.collection ? data.collection.headers : [],
          clutch: data.clutch ? data.clutch.headers : [],
          activity: data.activity ? data.activity.headers : [],
          archive: data.archive ? data.archive.headers : []
        };
        
        state.data = {
          collection: data.collection ? data.collection.rows : [],
          clutch: data.clutch ? data.clutch.rows : [],
          activity: data.activity ? data.activity.rows : [],
          archive: data.archive ? data.archive.rows : []
        };

        state.settings = {};
        if (data.settings && data.settings.rows) {
          data.settings.rows.forEach(function(row) {
            var field = row["FIELD"] || row["Field"] || "";
            var value = row["VALUE"] || row["Value"] || "";
            if (field) {
              state.settings[field.toUpperCase()] = value;
            }
          });
        }

        var animalCount = state.data.collection.filter(function(r) {
          return (r.STATUS || "").trim() !== "" || (r["UNIQUE ID"] || "").trim() !== "";
        }).length;
        var clutchCount = state.data.clutch.filter(function(r) {
          return (r.STATUS || "").trim() !== "" || (r["CLUTCH ID"] || "").trim() !== "";
        }).length;
        var activityCount = state.data.activity.filter(function(r) {
          return (r.ACTIVITY || "").trim() !== "" || (r["UNIQUE ID"] || "").trim() !== "";
        }).length;

        setStatus("Loaded " + animalCount + " animals, " + 
                  clutchCount + " clutches, " + 
                  activityCount + " activities");
        
        updateUIWithSettings();
        renderCurrentView();
        
        if (state.qrPending && state.qrPending.animal) {
          handleQRScan(state.qrPending.animal);
          state.qrPending = null;
        }
      } else {
        setStatus(response.error || "Failed to load data", true);
      }
    })
    .catch(function(error) {
      setStatus("Error loading data: " + error.message, true);
    })
    .finally(function() {
      state.isLoading = false;
    });
}

function loadDataQuietly() {
  apiCall('getData', {})
    .then(function(response) {
      if (response.success) {
        var data = response.data;
        state.headers = {
          collection: data.collection ? data.collection.headers : [],
          clutch: data.clutch ? data.clutch.headers : [],
          activity: data.activity ? data.activity.headers : [],
          archive: data.archive ? data.archive.headers : []
        };
        state.data = {
          collection: data.collection ? data.collection.rows : [],
          clutch: data.clutch ? data.clutch.rows : [],
          activity: data.activity ? data.activity.rows : [],
          archive: data.archive ? data.archive.rows : []
        };
        renderCurrentView();
      }
    })
    .catch(function() {
      // Silently fail
    });
}

function updateUIWithSettings() {
  var businessName = state.settings["BUSINESS NAME"];
  if (businessName) {
    var taglineEl = document.querySelector('.tagline-text');
    if (taglineEl) {
      taglineEl.textContent = businessName;
    }
  }
}

function setStatus(msg, isError) {
  var el = document.getElementById("statusText");
  el.textContent = msg;
  el.className = isError ? "text-red-600" : "text-slate-500";
}
