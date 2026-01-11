/*
 * THE RACK - Collection Import
 * Version: 3.18
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 3.18: Added RECORD_ID support - skips duplicates, updates if data changed
 * - 3.7: Import now generates UNIQUE ID and QR CODE for each record, checks for duplicates
 * - 3.5: Rewrote import to handle Collection CSV format with auto-generated UNIQUE IDs
 * - 2.12.0: Split from monolithic index.html
 */


// ============ COLLECTION IMPORT ============
var importData = [];

function openImportModal() {
  if (!state.isLoggedIn) {
    setStatus("Please log in first", true);
    return;
  }
  resetImport();
  document.getElementById("importModal").classList.remove("hidden");
}

function closeImportModal() {
  document.getElementById("importModal").classList.add("hidden");
  resetImport();
}

function resetImport() {
  importData = [];
  document.getElementById("importStep1").classList.remove("hidden");
  document.getElementById("importStep2").classList.add("hidden");
  document.getElementById("importStep3").classList.add("hidden");
  document.getElementById("importStep4").classList.add("hidden");
  document.getElementById("importFileInput").value = "";
}

function handleImportFile(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    parseImportCSV(text);
  };
  reader.readAsText(file);
}

function parseImportCSV(text) {
  var allRows = [];
  var currentField = "";
  var currentRow = [];
  var inQuotes = false;
  
  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    var nextChar = text[i + 1] || "";
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') i++;
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.length > 1 || currentRow[0]) {
            allRows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
        }
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.length > 1 || currentRow[0]) {
      allRows.push(currentRow);
    }
  }
  
  if (allRows.length < 2) {
    setStatus("CSV file appears to be empty", true);
    return;
  }

  // First row is headers
  var headers = allRows[0];
  console.log("CSV Import Debug:");
  console.log("Total rows found:", allRows.length);
  console.log("Headers:", headers);
  
  // Build column index map from headers
  var colMap = {};
  for (var h = 0; h < headers.length; h++) {
    var headerName = headers[h].toUpperCase().trim();
    colMap[headerName] = h;
  }
  
  console.log("Column map:", colMap);

  importData = [];

  // Parse each row (starting at 1 to skip header)
  for (var i = 1; i < allRows.length; i++) {
    var row = allRows[i];
    if (row.length < 2) continue;
    
    // Skip rows with no animal name
    var animalName = row[colMap["ANIMAL NAME"]] || "";
    if (!animalName.trim()) continue;
    
    // Build record using exact column names from Collection sheet
    var record = {
      "ANIMAL NAME": animalName,
      "SEX": row[colMap["SEX"]] || "",
      "DATE OF BIRTH": row[colMap["DATE OF BIRTH"]] || "",
      "SPECIES": row[colMap["SPECIES"]] || "",
      "GENETIC SUMMARY": row[colMap["GENETIC SUMMARY"]] || "",
      "STATUS": row[colMap["STATUS"]] || "Breeder",
      "WT PURCHASE (G)": row[colMap["WT PURCHASE (G)"]] || "",
      "PURCHASE PRICE": row[colMap["PURCHASE PRICE"]] || "",
      "BREEDER SOURCE": row[colMap["BREEDER SOURCE"]] || "",
      "MANUAL OVERRIDE": row[colMap["MANUAL OVERRIDE"]] || "",
      "NOTES": row[colMap["NOTES"]] || "",
      "CLUTCH ID": row[colMap["CLUTCH ID"]] || "",
      "SIRE": row[colMap["SIRE"]] || "",
      "DAM": row[colMap["DAM"]] || "",
      "HATCH WEIGHT (G)": row[colMap["HATCH WEIGHT (G)"]] || "",
      "HATCH DATE": row[colMap["HATCH DATE"]] || "",
      "LIST PRICE": row[colMap["LIST PRICE"]] || "",
      "SOLD PRICE": row[colMap["SOLD PRICE"]] || "",
      "AMOUNT PAID": row[colMap["AMOUNT PAID"]] || "",
      "SHIPPING FEE": row[colMap["SHIPPING FEE"]] || "",
      "DATE SOLD": row[colMap["DATE SOLD"]] || "",
      "BUYER NAME": row[colMap["BUYER NAME"]] || "",
      "BUYER EMAIL": row[colMap["BUYER EMAIL"]] || "",
      "BUYER ADDRESS": row[colMap["BUYER ADDRESS"]] || "",
      "MANUAL ID": row[colMap["MANUAL ID"]] || "",
      "SHIP DATE": row[colMap["SHIP DATE"]] || ""
    };
    
    importData.push(record);
  }

  if (importData.length === 0) {
    setStatus("No valid animals found in CSV", true);
    return;
  }

  // Show preview
  showImportPreview();
}

function showImportPreview() {
  document.getElementById("importStep1").classList.add("hidden");
  document.getElementById("importStep2").classList.remove("hidden");

  var tbody = document.getElementById("importPreviewBody");
  var html = "";
  var newCount = importData.length;

  importData.forEach(function(animal, index) {
    html += '<tr class="' + (index % 2 === 0 ? 'bg-white' : 'bg-gray-50') + '">';
    html += '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">New</span></td>';
    html += '<td class="px-3 py-2 font-medium">' + escapeHtml(animal["ANIMAL NAME"]) + '</td>';
    html += '<td class="px-3 py-2 mono text-xs">' + escapeHtml(animal["MANUAL OVERRIDE"] || "-") + '</td>';
    html += '<td class="px-3 py-2">' + escapeHtml(animal["SEX"] || "-") + '</td>';
    html += '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs ' + getStatusColor(animal["STATUS"]) + '">' + escapeHtml(animal["STATUS"]) + '</span></td>';
    html += '<td class="px-3 py-2 text-xs max-w-xs truncate">' + escapeHtml(animal["GENETIC SUMMARY"] || "-") + '</td>';
    html += '</tr>';
  });

  document.getElementById("importCount").textContent = newCount + " new";
  tbody.innerHTML = html;
}

function getStatusColor(status) {
  switch((status || "").toLowerCase()) {
    case "listed": return "bg-green-100 text-green-800";
    case "sold": return "bg-blue-100 text-blue-800";
    case "breeder": return "bg-purple-100 text-purple-800";
    case "holdback": return "bg-yellow-100 text-yellow-800";
    case "on hold": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function executeImport() {
  document.getElementById("importStep2").classList.add("hidden");
  document.getElementById("importStep3").classList.remove("hidden");

  var total = importData.length;
  var completed = 0;
  var errors = 0;
  var created = 0;
  var skipped = 0;
  var updated = 0;
  
  // Build a map of existing RECORD_IDs for quick lookup
  var existingRecordIds = {};
  var existingRecords = {};
  (state.data.collection || []).forEach(function(r) {
    var recordId = r["RECORD_ID"];
    if (recordId) {
      existingRecordIds[recordId] = true;
      existingRecords[recordId] = r;
    }
  });
  
  // Track IDs we've generated during this import to avoid duplicates
  var generatedIds = {};

  function generateUniqueIdForImport() {
    var year = new Date().getFullYear();
    var rows = state.data.collection || [];
    var max = 0;
    var re = /^B-(\d{4})-(\d{4})$/i;
    var existingIds = {};
    
    // Check existing records in database
    rows.forEach(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      existingIds[id.toUpperCase()] = true;
      var m = re.exec(id);
      if (m && m[1] === String(year)) {
        var n = parseInt(m[2], 10);
        if (n > max) max = n;
      }
    });
    
    // Also check IDs we've already generated in this import session
    for (var gid in generatedIds) {
      existingIds[gid.toUpperCase()] = true;
      var m = re.exec(gid);
      if (m && m[1] === String(year)) {
        var n = parseInt(m[2], 10);
        if (n > max) max = n;
      }
    }
    
    // Generate next ID and verify it doesn't exist
    var nextNum = max + 1;
    var newId = "B-" + year + "-" + String(nextNum).padStart(4, "0");
    while (existingIds[newId.toUpperCase()] || generatedIds[newId.toUpperCase()]) {
      nextNum++;
      newId = "B-" + year + "-" + String(nextNum).padStart(4, "0");
    }
    
    // Track this ID so we don't reuse it
    generatedIds[newId.toUpperCase()] = true;
    return newId;
  }
  
  // Check if two records have identical data (excluding internal fields)
  function recordsAreIdentical(existing, imported) {
    var keysToCompare = ["ANIMAL NAME", "SEX", "DATE OF BIRTH", "SPECIES", "GENETIC SUMMARY", 
                         "STATUS", "WT PURCHASE (G)", "PURCHASE PRICE", "BREEDER SOURCE", "NOTES"];
    for (var i = 0; i < keysToCompare.length; i++) {
      var key = keysToCompare[i];
      var existVal = String(existing[key] || "").trim();
      var importVal = String(imported[key] || "").trim();
      if (existVal !== importVal) {
        return false;
      }
    }
    return true;
  }

  function importNext() {
    if (completed >= total) {
      // Done
      document.getElementById("importStep3").classList.add("hidden");
      document.getElementById("importStep4").classList.remove("hidden");
      var resultMsg = "Import complete: " + created + " created";
      if (updated > 0) resultMsg += ", " + updated + " updated";
      if (skipped > 0) resultMsg += ", " + skipped + " skipped (identical)";
      if (errors > 0) resultMsg += ", " + errors + " failed";
      document.getElementById("importResult").textContent = resultMsg;
      // Reload data to show new records
      loadData();
      return;
    }

    var animal = importData[completed];
    document.getElementById("importProgress").textContent = 
      "Importing " + (completed + 1) + " of " + total + ": " + animal["ANIMAL NAME"];

    // Check if this record has a RECORD_ID and already exists
    var existingRecordId = animal["RECORD_ID"];
    
    if (existingRecordId && existingRecordIds[existingRecordId]) {
      // Record exists - check if data is identical
      var existingRecord = existingRecords[existingRecordId];
      if (recordsAreIdentical(existingRecord, animal)) {
        // Skip - no changes needed
        skipped++;
        completed++;
        setTimeout(importNext, 50);
        return;
      } else {
        // Update existing record
        apiCall('updateRecord', { 
          tab: 'Collection', 
          rowIndex: existingRecord.__rowIndex,
          data: animal 
        })
          .then(function(response) {
            if (response.success) {
              updated++;
            } else {
              errors++;
              console.error("Failed to update:", animal["ANIMAL NAME"], response.error);
            }
          })
          .catch(function(error) {
            errors++;
            console.error("Error updating:", animal["ANIMAL NAME"], error);
          })
          .finally(function() {
            completed++;
            setTimeout(importNext, 100);
          });
        return;
      }
    }
    
    // New record - generate IDs
    var uniqueId = generateUniqueIdForImport();
    animal["UNIQUE ID"] = uniqueId;
    
    // Generate QR CODE based on UNIQUE ID
    animal["QR CODE"] = "https://app.therackapp.io?code=" + state.sheetId + "&animal=" + uniqueId;
    
    // Generate RECORD_ID for new records
    if (!animal["RECORD_ID"]) {
      animal["RECORD_ID"] = Date.now().toString() + completed;
    }

    // Create new row with generated UNIQUE ID, QR CODE, and RECORD_ID
    apiCall('saveRecord', { tab: 'Collection', data: animal })
      .then(function(response) {
        if (response.success) {
          created++;
          // Add to local state so next ID generation knows about it
          state.data.collection.push(animal);
          // Also track the RECORD_ID
          existingRecordIds[animal["RECORD_ID"]] = true;
          existingRecords[animal["RECORD_ID"]] = animal;
        } else {
          errors++;
          console.error("Failed to import:", animal["ANIMAL NAME"], response.error);
        }
      })
      .catch(function(error) {
        errors++;
        console.error("Error importing:", animal["ANIMAL NAME"], error);
      })
      .finally(function() {
        completed++;
        setTimeout(importNext, 100);
      });
  }

  importNext();
}
