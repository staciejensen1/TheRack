/*
 * THE RACK - MorphMarket Import
 * Version: 2.12.58
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */


// ============ MORPHMARKET IMPORT ============
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
  // Use a robust CSV parser that handles:
  // 1. Multi-line fields in quotes
  // 2. Commas inside quoted fields
  // 3. Escaped quotes ("" inside fields)
  
  var allRows = [];
  var currentField = "";
  var currentRow = [];
  var inQuotes = false;
  
  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    var nextChar = text[i + 1] || "";
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote - add one quote and skip next
        currentField += '"';
        i++;
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false;
      } else {
        // Regular character inside quotes (including newlines)
        currentField += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true;
      } else if (char === ',') {
        // Field separator
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === '\r' || char === '\n') {
        // Row separator
        if (char === '\r' && nextChar === '\n') i++; // Skip \r\n pair
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
  // Don't forget last field/row
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
  console.log("Headers count:", headers.length);
  console.log("Headers:", headers.slice(30, 35)); // Show columns around Last_Update
  
  // Find column indices
  var cols = {
    category: headers.indexOf('Category*'),
    title: headers.indexOf('Title*'),
    animalId: headers.indexOf('Animal_Id*'),
    sex: headers.indexOf('Sex'),
    dob: headers.indexOf('Dob'),
    weight: headers.indexOf('Weight'),
    traits: headers.indexOf('Traits'),
    state: headers.indexOf('State'),
    price: headers.indexOf('Price'),
    photoUrls: headers.indexOf('Photo_Urls'),
    desc: headers.indexOf('Desc'),
    origin: headers.indexOf('Origin'),
    sires: headers.indexOf('Sires**'),
    dams: headers.indexOf('Dams**'),
    privateNotes: headers.indexOf('Private_Notes'),
    groupId: headers.indexOf('Group_Id'),
    lastUpdate: headers.indexOf('Last_Update**')
  };
  
  console.log("Last_Update** index:", cols.lastUpdate);

  importData = [];

  // Parse each row (starting at 1 to skip header)
  for (var i = 1; i < allRows.length; i++) {
    var row = allRows[i];
    if (row.length < 5) continue;
    
    // Debug first row
    if (i === 1) {
      console.log("First data row column count:", row.length);
      console.log("State value:", row[cols.state]);
      console.log("Last_Update value:", row[cols.lastUpdate]);
    }

    var mmState = (row[cols.state] || "").toLowerCase();
    var status = "Breeder";
    if (mmState === "for sale") status = "Listed";
    else if (mmState === "sold") status = "Sold";

    var price = parseFloat(row[cols.price]) || 0;
    var purchasePrice = "";
    var listPrice = "";
    var soldPrice = "";
    var soldDate = "";

    if (status === "Sold") {
      soldPrice = price;
      // Use Last_Update as sold date (format: "2026/01/04 18:10:54 -0500")
      var lastUpdate = row[cols.lastUpdate] || "";
      if (lastUpdate) {
        // Parse the date part (before the time)
        var datePart = lastUpdate.split(' ')[0];
        if (datePart) {
          // Convert from YYYY/MM/DD to MM/DD/YYYY
          var parts = datePart.split('/');
          if (parts.length === 3) {
            soldDate = parts[1] + '/' + parts[2] + '/' + parts[0];
          } else {
            soldDate = datePart;
          }
        }
      }
    } else if (status === "Listed") {
      listPrice = price;
    } else {
      purchasePrice = price;
    }

    // Parse sex
    var sex = (row[cols.sex] || "").toLowerCase();
    if (sex === "female" || sex === "f") sex = "Female";
    else if (sex === "male" || sex === "m") sex = "Male";
    else sex = "Unknown";

    // Parse DOB - MorphMarket uses various formats
    // If it's just a year (4 digits), prepend 01/01/
    var dob = (row[cols.dob] || "").trim();
    if (dob && /^\d{4}$/.test(dob)) {
      dob = "01/01/" + dob;
    }
    
    // Get first photo URL only
    var photoUrls = row[cols.photoUrls] || "";
    var firstPhoto = photoUrls.split(' ')[0] || "";

    // Extract sire/dam names (format: "Name (M)(#ID)")
    var sireRaw = row[cols.sires] || "";
    var damRaw = row[cols.dams] || "";
    var sire = sireRaw.split(' (')[0] || "";
    var dam = damRaw.split(' (')[0] || "";

    // Combine notes
    var notes = row[cols.desc] || "";
    var privateNotes = row[cols.privateNotes] || "";
    if (privateNotes) {
      notes = notes ? notes + "\n\n" + privateNotes : privateNotes;
    }

    importData.push({
      "ANIMAL NAME": row[cols.title] || "",
      "MANUAL OVERRIDE": row[cols.animalId] || "",
      "SPECIES": row[cols.category] || "",
      "SEX": sex,
      "DATE OF BIRTH": dob,
      "WT PURCHASE (G)": row[cols.weight] || "",
      "GENETIC SUMMARY": row[cols.traits] || "",
      "STATUS": status,
      "PURCHASE PRICE": purchasePrice,
      "LIST PRICE": listPrice,
      "SOLD PRICE": soldPrice,
      "DATE SOLD": soldDate,
      "NOTES": notes,
      "BREEDER SOURCE": row[cols.origin] || "",
      "SIRE": sire,
      "DAM": dam,
      "CLUTCH ID": row[cols.groupId] || ""
    });
  }

  if (importData.length === 0) {
    setStatus("No valid animals found in CSV", true);
    return;
  }

  // Show preview
  showImportPreview();
}

function parseCSVLine(line) {
  var result = [];
  var current = "";
  var inQuotes = false;
  
  for (var i = 0; i < line.length; i++) {
    var char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function showImportPreview() {
  document.getElementById("importStep1").classList.add("hidden");
  document.getElementById("importStep2").classList.remove("hidden");

  var tbody = document.getElementById("importPreviewBody");
  var html = "";
  var newCount = 0;
  var updateCount = 0;

  importData.forEach(function(animal, index) {
    // Check if this is an update or new
    var manualId = animal["MANUAL OVERRIDE"];
    var isUpdate = false;
    
    if (manualId) {
      isUpdate = state.data.collection.some(function(r) {
        return r["MANUAL OVERRIDE"] === manualId;
      });
    }

    if (isUpdate) {
      updateCount++;
    } else {
      newCount++;
    }

    var actionBadge = isUpdate 
      ? '<span class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Update</span>'
      : '<span class="px-2 py-1 rounded text-xs bg-green-100 text-green-800">New</span>';

    html += '<tr class="' + (index % 2 === 0 ? 'bg-white' : 'bg-gray-50') + '">';
    html += '<td class="px-3 py-2">' + actionBadge + '</td>';
    html += '<td class="px-3 py-2 font-medium">' + escapeHtml(animal["ANIMAL NAME"]) + '</td>';
    html += '<td class="px-3 py-2 mono text-xs">' + escapeHtml(animal["MANUAL OVERRIDE"]) + '</td>';
    html += '<td class="px-3 py-2">' + animal["SEX"] + '</td>';
    html += '<td class="px-3 py-2"><span class="px-2 py-1 rounded text-xs ' + getStatusColor(animal["STATUS"]) + '">' + animal["STATUS"] + '</span></td>';
    html += '<td class="px-3 py-2 text-xs max-w-xs truncate">' + escapeHtml(animal["GENETIC SUMMARY"]) + '</td>';
    html += '</tr>';
  });

  document.getElementById("importCount").textContent = newCount + " new, " + updateCount + " updates";
  tbody.innerHTML = html;
}

function getStatusColor(status) {
  switch(status) {
    case "Listed": return "bg-green-100 text-green-800";
    case "Sold": return "bg-blue-100 text-blue-800";
    case "Breeder": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function executeImport() {
  document.getElementById("importStep2").classList.add("hidden");
  document.getElementById("importStep3").classList.remove("hidden");

  var total = importData.length;
  var completed = 0;
  var errors = 0;
  var updated = 0;
  var created = 0;

  function importNext() {
    if (completed >= total) {
      // Done
      document.getElementById("importStep3").classList.add("hidden");
      document.getElementById("importStep4").classList.remove("hidden");
      document.getElementById("importResult").textContent = 
        "Import complete: " + created + " new, " + updated + " updated." + 
        (errors > 0 ? " " + errors + " failed." : "");
      return;
    }

    var animal = importData[completed];
    document.getElementById("importProgress").textContent = 
      "Importing " + (completed + 1) + " of " + total + "...";

    // Check for existing animal by MANUAL OVERRIDE
    var manualId = animal["MANUAL OVERRIDE"];
    var existingRow = null;
    
    if (manualId) {
      existingRow = state.data.collection.find(function(r) {
        return r["MANUAL OVERRIDE"] === manualId;
      });
    }

    if (existingRow && existingRow.__rowIndex !== undefined) {
      // Update existing row
      apiCall('updateRecord', { tab: 'Collection', rowIndex: existingRow.__rowIndex, data: animal })
        .then(function(response) {
          if (response.success) {
            updated++;
            // Update local data
            Object.assign(existingRow, animal);
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
    } else {
      // Create new row
      apiCall('saveRecord', { tab: 'Collection', data: animal })
        .then(function(response) {
          if (response.success) {
            created++;
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
  }

  importNext();
}

