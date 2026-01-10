/*
 * THE RACK - Modals and Forms
 * Version: 2.12.58
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 2.12.57: Updated pairing activity to use PAIRED WITH column
 * - 2.12.50: Improved activity form rendering
 * - 2.12.41: Fixed button onclick handling
 */

function saveActivityFromForm() {
  var animalId = state.formData["UNIQUE ID"] || "";
  var date = state.formData["DATE"] || "";
  var activity = state.formData["ACTIVITY"] || "";
  var pairedWith = state.formData["VALUE"] || ""; // Still using VALUE for compatibility
  
  if (!animalId) {
    document.getElementById("modalError").textContent = "Please select an animal";
    return;
  }
  if (!activity) {
    document.getElementById("modalError").textContent = "Please select an activity type";
    return;
  }
  
  var record = {
    "DATE": date,
    "UNIQUE ID": animalId,
    "ACTIVITY": activity,
    "VALUE": pairedWith,
    "PAIRED WITH": pairedWith  // Add explicit PAIRED WITH column
  };
  
  setStatus("Saving...");
  document.getElementById("saveBtn").textContent = "Saving...";
  document.getElementById("saveBtn").disabled = true;
  
  apiCall('saveRecord', { tab: 'Activity', data: record })
    .then(function(response) {
      if (response.success) {
        record.__rowIndex = state.data.activity.length;
        state.data.activity.push(record);
        setStatus("Activity logged!");
        closeModal();
        renderCurrentView();
      } else {
        document.getElementById("modalError").textContent = response.error || "Failed to save";
      }
    })
    .catch(function(error) {
      document.getElementById("modalError").textContent = "Error: " + error.message;
    })
    .finally(function() {
      document.getElementById("saveBtn").textContent = "Save";
      document.getElementById("saveBtn").disabled = false;
    });
}

// Rest of the existing modals.js code remains the same
