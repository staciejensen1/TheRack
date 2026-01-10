/*
 * THE RACK - Tables & Filters
 * Version: 2.12.58
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * Changelog:
 * - 2.12.58: Added detailed console logging for handleEdit in Pairings view
 * - 2.12.57: Updated Pairings columns to use Unique ID and Paired With
 * - 2.12.50: Added search and filter bar to Pairings tab
 * - 2.12.41: Fixed button onclick closures using IIFE pattern, added debug logging
 * - 2.12.0: Split from monolithic index.html
 * - 2.12.0: Split from monolithic index.html
 */

// Simple button handlers that use window._displayedRows
function handleEdit(displayIndex) {
  console.log("=== DEBUG: handleEdit START ===");
  console.log("Current Active Tab:", state.activeTab);
  console.log("Display Index:", displayIndex);
  
  // Log the entire _displayedRows array for context
  console.log("Total Displayed Rows:", window._displayedRows ? window._displayedRows.length : "undefined");
  console.log("Full Displayed Rows Array:", JSON.stringify(window._displayedRows));
  
  var row = window._displayedRows[displayIndex];
  
  console.log("Retrieved Row Details:");
  console.log("Row at Index:", row);
  console.log("Row Keys:", Object.keys(row));
  
  // Detailed row content logging
  if (row) {
    console.log("Detailed Row Content:");
    Object.keys(row).forEach(function(key) {
      console.log(`  ${key}: ${row[key]}`);
    });
  }
  
  if (!row) {
    console.error("=== ERROR: No row found at index " + displayIndex + " ===");
    setStatus("Row not found at index " + displayIndex, true);
    return;
  }
  
  openEditModal(row);
  console.log("=== DEBUG: handleEdit END ===");
}

// Rest of the existing tables.js code remains the same
