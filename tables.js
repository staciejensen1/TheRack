/*
 * THE RACK - Tables & Filters
 * Version: 2.12.57
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 2.12.57: Enhanced Pairings table column rendering based on specific requirements
 * - 2.12.50: Added search and filter bar to Pairings tab
 * - 2.12.41: Fixed button onclick closures using IIFE pattern, added debug logging
 * - 2.12.0: Split from monolithic index.html
 */

// ============ TABLE ============
function renderTable() {
  var columns = getColumns();
  var rows = getFilteredRows();
  var showHatch = state.activeTab === "clutches";
  var showSale = state.activeTab === "hatchlings";

  // Render stats cards for this view
  renderTableStats();
  
  // Show/hide filter bars based on tab
  var filterBar = document.getElementById("filterBar");
  var salesFilterBar = document.getElementById("salesFilterBar");
  var clutchesFilterBar = document.getElementById("clutchesFilterBar");
  var sheetKey = getSheetKey(state.activeTab);
  
  // Hide ALL filter bars first
  filterBar.classList.add("hidden");
  salesFilterBar.classList.add("hidden");
  if (clutchesFilterBar) clutchesFilterBar.classList.add("hidden");
  
  // Show only the appropriate filter bar for current tab
  if (state.activeTab === "clutches") {
    if (clutchesFilterBar) clutchesFilterBar.classList.remove("hidden");
    var clutchSearchInput = document.getElementById("clutchSearchInput");
    if (clutchSearchInput) clutchSearchInput.value = state.filters.search || "";
  } else if (state.activeTab === "sales") {
    salesFilterBar.classList.remove("hidden");
    populateSalesYearFilter();
    var salesSearchInput = document.getElementById("salesSearchInput");
    if (salesSearchInput) salesSearchInput.value = state.filters.search || "";
  } else if (sheetKey === "collection") {
    // Collection, Hatchlings tabs
    filterBar.classList.remove("hidden");
    populateSpeciesFilter();
    var searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = state.filters.search || "";
  } else if (state.activeTab === "activity" || state.activeTab === "pairings") {
    filterBar.classList.remove("hidden");
    var searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = state.filters.search || "";
  }
  // For archive and other tabs, all filter bars stay hidden
  
  // Show alert filter badge if active
  var alertFilterDisplay = document.getElementById("alertFilterDisplay");
  var alertFilterLabel = document.getElementById("alertFilterLabel");
  if (alertFilterDisplay && state.filters.alertFilter) {
    var label = ALERT_FILTER_LABELS[state.filters.alertFilter] || state.filters.alertFilter;
    alertFilterLabel.textContent = label;
    alertFilterDisplay.classList.remove("hidden");
  } else if (alertFilterDisplay) {
    alertFilterDisplay.classList.add("hidden");
  }

  // Header
  var headerRow = document.getElementById("tableHead").querySelector("tr");
  headerRow.innerHTML = "";
  
  // Actions header FIRST
  var actionTh = document.createElement("th");
  actionTh.className = "px-3 py-3 text-left font-semibold text-slate-600 bg-slate-50 whitespace-nowrap text-sm sticky left-0 z-10";
  actionTh.textContent = "Actions";
  headerRow.appendChild(actionTh);
  
  columns.forEach(function(col) {
    var th = document.createElement("th");
    th.className = "px-3 py-3 text-left font-semibold text-slate-600 bg-slate-50 whitespace-nowrap text-sm";
    th.textContent = col;
    headerRow.appendChild(th);
  });

  // Body
  var tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  
  if (!rows.length) {
    var tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="' + (columns.length + 1) + '" class="px-4 py-12 text-center text-slate-500">No data</td>';
    tbody.appendChild(tr);
    return;
  }

  rows.forEach(function(row) {
    var tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";
    
    // Actions column FIRST
    var actionTd = document.createElement("td");
    actionTd.className = "px-3 py-3 text-slate-700 whitespace-nowrap text-sm sticky left-0 bg-white z-10";
    
    // Edit button
    var editBtn = document.createElement("button");
    editBtn.className = "px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 mr-1";
    editBtn.textContent = "Edit";
    editBtn.onclick = (function(displayIndex) {
      return function() { 
        handleEdit(displayIndex); 
      };
    })(window._displayedRows.length - 1);
    actionTd.appendChild(editBtn);
    
    tr.appendChild(actionTd);
    
    // Data columns
    columns.forEach(function(col, colIdx) {
      var td = document.createElement("td");
      td.className = "px-3 py-3 text-slate-700 whitespace-nowrap text-sm";
      
      // Special handling for Pairings view columns
      if (state.activeTab === "pairings") {
        if (col === "SIRE") {
          // Get the animal name for the Sire
          var sireId = row["UNIQUE ID"] || "";
          var sireName = getAnimalNameById(sireId);
          td.textContent = sireId ? (sireName ? sireName + " | " + sireId : sireId) : "--";
        }
        else if (col === "DAM") {
          // Use the Paired With field for Dam column
          var pairedWith = row["PAIRED WITH"] || row["VALUE"] || "--";
          td.textContent = pairedWith;
        }
        // Format date columns nicely
        else if (col.toUpperCase().includes("DATE") && row[col]) {
          var dateVal = parseDate(row[col]);
          if (dateVal) {
            td.textContent = (dateVal.getMonth() + 1) + "/" + dateVal.getDate() + "/" + dateVal.getFullYear();
          } else {
            td.textContent = row[col] || "--";
          }
        } 
        else {
          td.textContent = row[col] || "--";
        }
      }
      else {
        // Default rendering for other tabs
        // Format date columns nicely
        if (col.toUpperCase().includes("DATE") && row[col]) {
          var dateVal = parseDate(row[col]);
          if (dateVal) {
            td.textContent = (dateVal.getMonth() + 1) + "/" + dateVal.getDate() + "/" + dateVal.getFullYear();
          } else {
            td.textContent = row[col] || "--";
          }
        } 
        else {
          td.textContent = row[col] || "--";
        }
      }
      
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
