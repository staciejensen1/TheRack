/*
 * THE RACK - QR Activity Handling
 * Version: 2.12.0
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */


// ============ QR CODE HANDLING ============
function handleQRScan(animalId) {
  // Find the animal in collection
  var animal = state.data.collection.find(function(r) {
    return r["UNIQUE ID"] === animalId;
  });
  
  if (!animal) {
    setStatus("Animal " + animalId + " not found in your collection.", true);
    return;
  }
  
  // Open activity modal pre-filled for this animal
  openActivityForAnimal(animal);
}

function openActivityForAnimal(animal) {
  state.modalMode = "add";
  state.modalTab = "activity";
  state.editRowIndex = null;
  state.formData = {
    "DATE": new Date().toISOString().split('T')[0],
    "UNIQUE ID": animal["UNIQUE ID"]
  };
  
  renderActivityModalForQR(animal);
  document.getElementById("modal").classList.remove("hidden");
}

// Quick Activity modal - called from + Activity button on tables
function openQuickActivityModal(row) {
  // For clutches, we need to handle differently - log activity for the clutch
  if (state.activeTab === "clutches") {
    // For clutches, open a note activity with the clutch ID
    state.modalMode = "add";
    state.modalTab = "activity";
    state.editRowIndex = null;
    state.formData = {
      "DATE": new Date().toISOString().split('T')[0],
      "UNIQUE ID": row["CLUTCH ID"] || ""
    };
    
    var clutchInfo = {
      "ANIMAL NAME": "Clutch: " + (row["CLUTCH ID"] || "Unknown"),
      "UNIQUE ID": row["CLUTCH ID"] || ""
    };
    renderActivityModalForQR(clutchInfo, true); // true = isClutch
    document.getElementById("modal").classList.remove("hidden");
  } else {
    // For collection/hatchlings, use the existing function
    openActivityForAnimal(row);
  }
}

function renderActivityModalForQR(animal, isClutch) {
  var animalName = animal["ANIMAL NAME"] || animal["UNIQUE ID"];
  var animalId = animal["UNIQUE ID"];
  
  document.getElementById("modalTitle").textContent = isClutch ? "Log Clutch Activity" : "Log Activity";
  
  var html = '<div class="space-y-4">';
  
  // Animal/Clutch info banner
  html += '<div class="bg-gray-100 rounded-xl p-3 mb-4">';
  html += '<div class="font-bold text-gray-900">' + animalName + '</div>';
  html += '<div class="text-sm text-gray-500 mono">' + animalId + '</div>';
  html += '</div>';
  
  // Date (default today)
  html += '<div>';
  html += '<label class="block text-sm font-medium text-gray-700 mb-1">Date</label>';
  html += '<input type="date" id="field_DATE" value="' + state.formData["DATE"] + '" class="w-full px-3 py-2 border border-gray-300 rounded-xl">';
  html += '</div>';
  
  // Activity type - big buttons for quick tap
  html += '<div>';
  html += '<label class="block text-sm font-medium text-gray-700 mb-2">Activity</label>';
  html += '<div class="grid grid-cols-2 gap-2">';
  
  // Different activities for clutches vs animals
  var quickActivities;
  if (isClutch) {
    quickActivities = ["Hatched", "Clutch Went Bad", "Note"];
  } else {
    // Row 1: Feeding
    quickActivities = [
      "Took Meal", "Refused Meal",
      // Row 2: General
      "Shed", "Weight",
      // Row 3: Breeding
      "Paired", "Lock",
      // Row 4: Female specific
      "Ovulation", "Pre Lay Shed",
      // Row 5: Other
      "Note", "Health Hold"
    ];
  }
  
  quickActivities.forEach(function(act) {
    var selected = state.formData["ACTIVITY"] === act ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200";
    html += '<button type="button" onclick="selectQRActivity(\'' + act + '\')" class="qr-activity-btn px-4 py-3 rounded-xl font-medium text-sm ' + selected + '">' + act + '</button>';
  });
  
  html += '</div>';
  html += '</div>';
  
  // Value field (for weight, notes, etc)
  var showValueField = state.formData["ACTIVITY"] === "Weight" || 
                       state.formData["ACTIVITY"] === "Note" || 
                       state.formData["ACTIVITY"] === "Hatched" || 
                       state.formData["ACTIVITY"] === "Clutch Went Bad" ||
                       state.formData["ACTIVITY"] === "Health Hold" ||
                       state.formData["ACTIVITY"] === "Ovulation";
  html += '<div id="qrValueField" class="' + (showValueField ? "" : "hidden") + '">';
  html += '<label class="block text-sm font-medium text-gray-700 mb-1" id="qrValueLabel">Value</label>';
  html += '<input type="text" id="field_VALUE" value="' + (state.formData["VALUE"] || "") + '" class="w-full px-3 py-2 border border-gray-300 rounded-xl" placeholder="Enter value...">';
  html += '</div>';
  
  // Paired With field (for Paired/Lock activities)
  var showPairedField = state.formData["ACTIVITY"] === "Paired" || state.formData["ACTIVITY"] === "Lock";
  var qrPairedValue = state.formData["PAIRED_WITH"] || "";
  html += '<div id="qrPairedField" class="' + (showPairedField ? "" : "hidden") + '">';
  html += '<label class="block text-sm font-medium text-gray-700 mb-2">Paired With</label>';
  html += '<div class="relative">';
  html += '<input type="text" id="qrPairedSearch" placeholder="Type to search..." ';
  html += 'oninput="filterQRPairedAnimals(this.value)" ';
  html += 'class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:border-gray-400 focus:outline-none">';
  // Get list of breeders
  var breeders = state.data.collection.filter(function(r) {
    var st = (r.STATUS || "").toLowerCase();
    return st === "breeder" || st === "holdback" || st === "on loan";
  });
  html += '<div id="qrPairedList" class="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl bg-white ' + (qrPairedValue ? 'hidden' : '') + '">';
  breeders.forEach(function(b) {
    var bName = b["ANIMAL NAME"] || "";
    var bId = b["UNIQUE ID"] || "";
    var label = bName ? bName + " | " + bId : bId;
    html += '<div onclick="selectQRPairedAnimal(\'' + escapeHtml(label).replace(/'/g, "\\'") + '\')" ';
    html += 'class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0">';
    html += '<span class="font-medium">' + escapeHtml(bName || bId) + '</span>';
    if (bName && bId) html += ' <span class="text-gray-400 text-xs">' + escapeHtml(bId) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';
  
  // Show selected paired animal
  if (qrPairedValue) {
    html += '<div id="qrSelectedPairedDisplay" class="mt-2 px-3 py-2 bg-gray-900 text-white rounded-xl flex items-center justify-between text-sm">';
    html += '<span class="font-medium">' + escapeHtml(qrPairedValue) + '</span>';
    html += '<button type="button" onclick="clearQRPairedAnimal()" class="text-gray-400 hover:text-white text-lg">&times;</button>';
    html += '</div>';
  }
  html += '</div>';
  
  html += '</div>';
  
  document.getElementById("modalBody").innerHTML = html;
  
  // Update save button
  document.getElementById("saveBtn").onclick = saveQRActivity;
}

function selectQRActivity(activity) {
  state.formData["ACTIVITY"] = activity;
  
  // Update button styles
  document.querySelectorAll('.qr-activity-btn').forEach(function(btn) {
    if (btn.textContent === activity) {
      btn.className = 'qr-activity-btn px-4 py-3 rounded-xl font-medium text-sm bg-gray-900 text-white';
    } else {
      btn.className = 'qr-activity-btn px-4 py-3 rounded-xl font-medium text-sm bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  });
  
  // Show/hide value field
  var valueField = document.getElementById('qrValueField');
  var valueLabel = document.getElementById('qrValueLabel');
  var pairedField = document.getElementById('qrPairedField');
  
  // Hide paired field by default
  if (pairedField) pairedField.classList.add('hidden');
  
  if (activity === "Weight") {
    valueField.classList.remove('hidden');
    valueLabel.textContent = "Weight (g)";
  } else if (activity === "Note" || activity === "Health Hold") {
    valueField.classList.remove('hidden');
    valueLabel.textContent = "Notes";
  } else if (activity === "Hatched") {
    valueField.classList.remove('hidden');
    valueLabel.textContent = "# Hatched";
  } else if (activity === "Clutch Went Bad") {
    valueField.classList.remove('hidden');
    valueLabel.textContent = "Reason (optional)";
  } else if (activity === "Ovulation") {
    valueField.classList.remove('hidden');
    valueLabel.textContent = "Follicle Size (mm)";
  } else if (activity === "Paired" || activity === "Lock") {
    valueField.classList.add('hidden');
    if (pairedField) pairedField.classList.remove('hidden');
  } else {
    valueField.classList.add('hidden');
  }
}

function filterQRPairedAnimals(search) {
  var list = document.getElementById("qrPairedList");
  if (!list) return;
  var items = list.getElementsByTagName("div");
  var searchLower = search.toLowerCase();
  var anyVisible = false;
  
  for (var i = 0; i < items.length; i++) {
    var text = items[i].textContent.toLowerCase();
    if (text.indexOf(searchLower) >= 0) {
      items[i].style.display = "";
      anyVisible = true;
    } else {
      items[i].style.display = "none";
    }
  }
  
  list.classList.toggle("hidden", !anyVisible && !search);
}

function selectQRPairedAnimal(label) {
  state.formData["PAIRED_WITH"] = label;
  // Re-render the form to show the selected chip
  var animal = state.data.collection.find(function(r) {
    return r["UNIQUE ID"] === state.formData["UNIQUE ID"];
  });
  if (animal) {
    renderActivityModalForQR(animal, false);
  }
}

function clearQRPairedAnimal() {
  state.formData["PAIRED_WITH"] = "";
  var animal = state.data.collection.find(function(r) {
    return r["UNIQUE ID"] === state.formData["UNIQUE ID"];
  });
  if (animal) {
    renderActivityModalForQR(animal, false);
  }
}

function saveQRActivity() {
  var date = document.getElementById("field_DATE").value;
  var activity = state.formData["ACTIVITY"];
  var value = document.getElementById("field_VALUE") ? document.getElementById("field_VALUE").value : "";
  var pairedWith = state.formData["PAIRED_WITH"] || "";
  
  if (!activity) {
    setStatus("Please select an activity", true);
    return;
  }
  
  // For Paired/Lock, use the paired animal as the value
  if ((activity === "Paired" || activity === "Lock") && pairedWith) {
    value = pairedWith;
  }
  
  var record = {
    "DATE": date,
    "UNIQUE ID": state.formData["UNIQUE ID"],
    "ACTIVITY": activity,
    "VALUE": value
  };
  
  // Save to sheet
  setStatus("Saving...");
  document.getElementById("saveBtn").textContent = "Saving...";
  document.getElementById("saveBtn").disabled = true;
  
  apiCall('saveRecord', { tab: 'Activity', data: record })
    .then(function(response) {
      if (response.success) {
        // Add to local data
        record.__rowIndex = state.data.activity.length;
        state.data.activity.push(record);
        
        setStatus("Activity logged for " + state.formData["UNIQUE ID"]);
        closeModal();
      } else {
        setStatus(response.error || "Failed to save", true);
      }
    })
    .catch(function(error) {
      setStatus("Error: " + error.message, true);
    })
    .finally(function() {
      document.getElementById("saveBtn").textContent = "Save";
      document.getElementById("saveBtn").disabled = false;
    });
}

