/*
 * THE RACK - Main App
 * Version: 2.12.0
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */

// ============ INITIALIZATION ============
function init() {
  document.getElementById("versionTag").textContent = "v" + VERSION;
  
  var urlParams = new URLSearchParams(window.location.search);
  var qrCode = urlParams.get('code');
  var qrAnimal = urlParams.get('animal');
  
  if (qrCode && qrAnimal) {
    window.history.replaceState({}, document.title, window.location.pathname);
    
    if (state.sheetId === qrCode && state.email) {
      state.isLoggedIn = true;
      state.qrPending = { animal: qrAnimal };
      updateUI();
      setStatus("QR scanned! Loading data...");
      loadData();
    } else {
      state.qrPending = { code: qrCode, animal: qrAnimal };
      updateUI();
      setStatus("QR scanned for " + qrAnimal + ". Please log in to record activity.");
    }
  } else if (state.email && state.sheetId) {
    state.isLoggedIn = true;
    updateUI();
    setStatus("Welcome back! Loading your data...");
    loadData();
  } else {
    updateUI();
    setStatus("Enter your email and access code to log in.");
  }

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("mobileLoginBtn").addEventListener("click", handleMobileLogin);
  document.getElementById("signOutBtn").addEventListener("click", handleSignOut);

  renderNavTabs();
}

// ============ MOBILE MENU ============
function toggleMobileMenu() {
  var menu = document.getElementById("mobileMenu");
  var overlay = document.getElementById("mobileMenuOverlay");
  var isOpen = !menu.classList.contains("-translate-x-full");
  
  if (isOpen) {
    menu.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  } else {
    menu.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

// ============ NAVIGATION ============
var navHistory = [];

function renderNavTabs() {
  var tabs = [
    { key: "dashboard", label: "Dashboard" },
    { key: "collection", label: "Collection" },
    { key: "clutches", label: "Clutches" },
    { key: "pairings", label: "Pairings" },
    { key: "hatchlings", label: "Hatchlings" },
    { key: "sales", label: "Sales" },
    { key: "activity", label: "Activity" }
  ];
  
  var nav = document.getElementById("navTabs");
  nav.innerHTML = "";
  tabs.forEach(function(tab) {
    var btn = document.createElement("button");
    btn.textContent = tab.label;
    btn.className = "px-3 py-2 text-sm rounded-lg font-medium text-left " + 
      (state.activeTab === tab.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100");
    btn.onclick = function() { navigateTo(tab.key); };
    nav.appendChild(btn);
  });

  var mobileNav = document.getElementById("mobileNavTabs");
  mobileNav.innerHTML = "";
  tabs.forEach(function(tab) {
    var btn = document.createElement("button");
    btn.textContent = tab.label;
    btn.className = "px-3 py-2 text-sm rounded-lg font-medium text-left " + 
      (state.activeTab === tab.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100");
    btn.onclick = function() { navigateTo(tab.key); toggleMobileMenu(); };
    mobileNav.appendChild(btn);
  });
}

function navigateTo(tab) {
  if (state.activeTab !== tab) {
    navHistory.push(state.activeTab);
    state.activeTab = tab;
    renderNavTabs();
    renderCurrentView();
  }
}

function goBack() {
  if (navHistory.length > 0) {
    state.activeTab = navHistory.pop();
    renderNavTabs();
    renderCurrentView();
  }
}

function renderCurrentView() {
  var titles = {
    dashboard: "Dashboard",
    collection: "Collection",
    clutches: "Clutches",
    pairings: "Pairings",
    hatchlings: "Hatchlings",
    sales: "Sales",
    activity: "Activity",
    archive: "Archive"
  };
  document.getElementById("pageTitle").textContent = titles[state.activeTab] || state.activeTab;
  var isDash = state.activeTab === "dashboard";
  var isArchive = state.activeTab === "archive";
  document.getElementById("dashboardView").classList.toggle("hidden", !isDash);
  document.getElementById("tableView").classList.toggle("hidden", isDash || isArchive);
  document.getElementById("addBtn").classList.toggle("hidden", isDash || isArchive || state.activeTab === "pairings");
  
  if (isDash || isArchive) {
    document.getElementById("filterBar").classList.add("hidden");
    document.getElementById("tableStatsView").classList.add("hidden");
    document.getElementById("tableStatsView").innerHTML = '';
  }
  
  document.getElementById("backBtn").classList.toggle("hidden", navHistory.length === 0);
  
  if (isDash) renderDashboard();
  else if (isArchive) renderArchiveView();
  else renderTable();
}

// ============ UTILITY FUNCTIONS ============
function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function parseDate(v) {
  if (!v) return null;
  var d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function getYearFromDate(rawDate) {
  if (!rawDate) return null;
  var d = parseDate(rawDate);
  if (d) return d.getFullYear();
  var str = String(rawDate);
  var match = str.match(/\b(19|20)\d{2}\b/);
  if (match) return parseInt(match[0], 10);
  return null;
}

function formatDateForInput(val) {
  if (!val) return "";
  var d = parseDate(val);
  if (!d) return val;
  var year = d.getFullYear();
  var month = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return year + "-" + month + "-" + day;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  var d = parseDate(dateStr);
  if (!d) return dateStr;
  return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
}

function colLetter(n) {
  var s = "";
  n++;
  while (n > 0) {
    var m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function getAnimalNameById(uniqueId) {
  if (!uniqueId) return "";
  var animal = state.data.collection.find(function(r) {
    return r["UNIQUE ID"] === uniqueId || r["MANUAL OVERRIDE"] === uniqueId;
  });
  if (animal) {
    var name = animal["ANIMAL NAME"] || "";
    return name ? name + " | " + uniqueId : uniqueId;
  }
  return uniqueId;
}

function getSheetKey(tab) {
  if (tab === "clutches" || tab === "pairings") return "clutch";
  if (tab === "hatchlings" || tab === "sales" || tab === "collection") return "collection";
  if (tab === "activity") return "activity";
  return "collection";
}

function openAddForCurrentTab() {
  var formMap = {
    "collection": "collection",
    "clutches": "clutch",
    "hatchlings": "hatchling",
    "sales": "hatchling",
    "activity": "activity"
  };
  var formType = formMap[state.activeTab] || "collection";
  openAddModal(formType);
}
