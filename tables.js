/*
 * THE RACK - Tables & Filters
 * Version: 2.12.55
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 2.12.55: Updated Pairings view column rendering
 * - 2.12.50: Added search and filter bar to Pairings tab
 * - 2.12.41: Fixed button onclick closures using IIFE pattern, added debug logging
 * - 2.12.0: Split from monolithic index.html
 */

// Rest of the existing tables.js code remains the same
function renderTable() {
  var columns = getColumns();
  var rows = getFilteredRows();
  var showHatch = state.activeTab === "clutches";
  var showSale = state.activeTab === "hatchlings";

  // Render stats cards for this view
  renderTableStats();
  
  // ... [existing code remains unchanged]

  // Specific column rendering section
  columns.forEach(function(col, colIdx) {
    var td = document.createElement("td");
    td.className = "px-3 py-3 text-slate-700 whitespace-nowrap text-sm";
    
    // Special handling for Pairings view - SIRE maps to UNIQUE ID, DAM maps to VALUE
    if (state.activeTab === "pairings" && col === "SIRE") {
      // Get the animal name for the UNIQUE ID
      var sireId = row["UNIQUE ID"] || "";
      var sireName = getAnimalNameById(sireId);
      td.textContent = sireName ? sireName + " | " + sireId : sireId || "--";
    }
    else if (state.activeTab === "pairings" && col === "DAM") {
      // VALUE contains the paired animal (could be "Name | ID" format already)
      var damValue = row["VALUE"] || "";
      td.textContent = damValue || "--";
    }
    
    // ... [rest of the existing column rendering code]
  });

  // ... [rest of the existing renderTable function]
}

// Remaining code from the original tables.js file stays the same
