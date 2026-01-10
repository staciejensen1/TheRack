/*
 * THE RACK - Modals (Add/Edit)
 * Version: 3.6
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 3.6: Clutch form now shows ONLY explicit field list (SIRE, DAM, LAY DATE, # LAID, # FERTILE, # SLUGS, STATUS, MANUAL OVERRIDE, NOTES)
 * - 2.12.51: Added AMOUNT PAID to breederSkipFields (not shown on Add Breeder form)
 * - 2.12.0: Split from monolithic index.html
 */


// ============ ADD/EDIT MODAL ============
function openAddModal(tab) {
  if (!state.isLoggedIn) { setStatus("Log in first", true); return; }
  
  var sheetKey = getSheetKey(tab);
  if (tab === "hatchling") sheetKey = "collection";
  if (tab === "clutch") sheetKey = "clutch";
  if (tab === "activity") sheetKey = "activity";
  
  state.modalMode = "add";
  state.modalTab = sheetKey;
  state.editRowIndex = null;
  state.formData = {};
  state.originalData = {};     // Clear original data
  state.modifiedFields = null; // null means send all fields (ADD mode)
  
  // Defaults
  var today = new Date().toISOString().split("T")[0];
  if (tab === "collection") {
    state.formData.STATUS = "Breeder";
    state.formData.SEX = "Female";
    state.formData.SPECIES = "Ball Python";
    state.formType = "breeder";
  } else if (tab === "hatchling") {
    state.formData.STATUS = "Unlisted";
    state.formData.SEX = "Unknown";
    state.formData.SPECIES = "Ball Python";
    state.formData["BREEDER SOURCE"] = "Produced In House";
    state.formData["DATE OF BIRTH"] = today;
    state.formType = "hatchling";
  } else if (tab === "clutch") {
    state.formData.STATUS = "Incubating";
    state.formData["LAY DATE"] = today;
    state.formData.SEASON = String(new Date().getFullYear());
    state.formType = "clutch";
  } else if (tab === "activity") {
    state.formData.DATE = today;
    state.formData.ACTIVITY = "Note";
    state.formType = "activity";
  }

  var title = tab === "hatchling" ? "Hatchling" : (tab === "collection" ? "Breeder" : sheetKey.charAt(0).toUpperCase() + sheetKey.slice(1));
  document.getElementById("modalTitle").textContent = "Add " + title;
  
  // Show ID preview for new records (except Activity - that uses a lookup)
  var idDisplay = document.getElementById("modalIdDisplay");
  var idValue = document.getElementById("modalIdValue");
  
  if (tab === "hatchling") {
    idDisplay.classList.remove("hidden");
    idValue.textContent = generateHatchlingId();
  } else if (tab === "clutch") {
    idDisplay.classList.remove("hidden");
    idValue.textContent = generateClutchId(today);
  } else if (tab === "collection") {
    idDisplay.classList.remove("hidden");
    idValue.textContent = generateBreederId();
  } else {
    // Activity and others don't show the ID box
    idDisplay.classList.add("hidden");
  }

  renderModalForm(tab);
  document.getElementById("modal").classList.remove("hidden");
  // Reset save button to normal saveRecord function (may have been changed by quick activity modal)
  document.getElementById("saveBtn").onclick = saveRecord;
}

function openEditModal(row) {
  console.log("openEditModal called with row:", row);
  console.log("row.__rowIndex:", row.__rowIndex);
  console.log("row UNIQUE ID:", row["UNIQUE ID"]);
  console.log("row MANUAL OVERRIDE:", row["MANUAL OVERRIDE"]);
  
  if (!state.isLoggedIn) { setStatus("Log in first", true); return; }
  
  // Map view tab to actual sheet tab
  var sheetKey = getSheetKey(state.activeTab);
  console.log("sheetKey:", sheetKey);
  console.log("state.data[sheetKey] length:", (state.data[sheetKey] || []).length);
  
  state.modalMode = "edit";
  state.modalTab = sheetKey;
  
  // Initialize modified fields tracker - ONLY fields in this Set will be sent to API
  state.modifiedFields = new Set();
  
  // Copy row data, normalizing any Date objects to YYYY-MM-DD strings
  state.formData = {};
  state.originalData = {}; // Store original for comparison
  for (var key in row) {
    var val = row[key];
    // If it's a Date object, convert to YYYY-MM-DD
    if (val instanceof Date && !isNaN(val.getTime())) {
      state.formData[key] = val.toISOString().split('T')[0];
    } else if (typeof val === "string" && val.includes('T') && key.toUpperCase().includes("DATE")) {
      // If it's an ISO timestamp string for a date field, strip the time
      state.formData[key] = val.split('T')[0];
    } else {
      state.formData[key] = val;
    }
    // Store original value for comparison
    state.originalData[key] = state.formData[key];
  }
  
  state.formType = null; // Clear formType for edit mode
  
  // Get row index - if missing, find by UNIQUE ID or MANUAL OVERRIDE
  var rowIndex = row.__rowIndex;
  console.log("Initial rowIndex:", rowIndex);
  
  if (rowIndex === undefined) {
    var allRows = state.data[sheetKey] || [];
    var uniqueId = row["UNIQUE ID"] || row["MANUAL OVERRIDE"] || row["CLUTCH ID"];
    console.log("Looking for uniqueId:", uniqueId);
    
    for (var i = 0; i < allRows.length; i++) {
      var r = allRows[i];
      var rId = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || r["CLUTCH ID"];
      console.log("Checking row", i, "rId:", rId, "__rowIndex:", r.__rowIndex);
      if (rId && rId === uniqueId && r.__rowIndex !== undefined) {
        rowIndex = r.__rowIndex;
        console.log("Found match at rowIndex:", rowIndex);
        break;
      }
    }
  }
  
  console.log("Final rowIndex:", rowIndex);
  
  if (rowIndex === undefined) {
    setStatus("Cannot edit - please click Sync first to reload data", true);
    return;
  }
  
  state.editRowIndex = rowIndex;

  document.getElementById("modalTitle").textContent = "Edit Record";
  
  // Show existing ID
  var idDisplay = document.getElementById("modalIdDisplay");
  var idValue = document.getElementById("modalIdValue");
  var uid = row["UNIQUE ID"] || row["CLUTCH ID"] || "";
  if (uid) {
    idDisplay.classList.remove("hidden");
    idValue.textContent = uid;
  } else {
    idDisplay.classList.add("hidden");
  }

  renderModalForm(sheetKey);
  document.getElementById("modal").classList.remove("hidden");
  // Reset save button to normal saveRecord function (may have been changed by quick activity modal)
  document.getElementById("saveBtn").onclick = saveRecord;
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modalError").textContent = "";
}

function renderModalForm(tab) {
  var headers = state.headers[state.modalTab] || [];
  
  // Fallback headers for activity if none loaded
  if (state.modalTab === "activity" && headers.length === 0) {
    headers = ["DATE", "UNIQUE ID", "ACTIVITY", "VALUE", "SOLD DATE", "SOLD PRICE", "BUYER NAME", "BUYER EMAIL", "SALE SOURCE", "PAYMENT STATUS", "SHIP DATE", "SHIPPING FEE", "PAIRED WITH"];
  }
  
  // Fallback headers for collection if none loaded
  if (state.modalTab === "collection" && headers.length === 0) {
    headers = ["ANIMAL NAME", "SEX", "DATE OF BIRTH", "SPECIES", "GENETIC SUMMARY", "STATUS", "WT PURCHASE (G)", "PURCHASE PRICE", "BREEDER SOURCE", "MANUAL OVERRIDE", "NOTES", "CLUTCH ID", "SIRE", "DAM", "HATCH WEIGHT (G)", "HATCH DATE", "LIST PRICE", "SOLD PRICE", "DATE SOLD", "BUYER NAME", "BUYER EMAIL"];
  }
  
  // Fallback headers for clutch if none loaded
  if (state.modalTab === "clutch" && headers.length === 0) {
    headers = ["CLUTCH ID", "SIRE", "DAM", "LAY DATE", "# LAID", "# FERTILE", "# SLUGS", "STATUS", "MANUAL OVERRIDE", "NOTES"];
  }
  
  // Special rendering for Activity ADD form
  if (state.modalTab === "activity" && state.modalMode === "add") {
    renderActivityAddForm();
    return;
  }
  
  // Skip UNIQUE ID and CLUTCH ID except for activity form where we need UNIQUE ID
  var skipFields = ["__rowIndex", "__raw", "QR CODE", "SHEET ID", "SHEET_ID"];
  if (state.modalTab !== "activity") {
    skipFields.push("UNIQUE ID");
    skipFields.push("CLUTCH ID");
  }
  
  // Fields to skip for clutch ADD form (these are set via Hatch modal)
  var clutchHatchFields = ["DAYS TO HATCH", "DAYS TIL HATCH", "DAYS TILL HATCH", "# HATCHED", "HATCH DATE", "EST. HATCH DATE", "EST HATCH DATE", "ESTIMATED HATCH DATE", "DAYS (LAY", "MANUAL ID", "QR CODE", "SHEET ID", "SHEET_ID"];
  
  // Fields to skip for breeder ADD form (hatchling/sale specific fields)
  var breederSkipFields = ["HATCH WEIGHT", "HATCH DATE", "LIST PRICE", "BUYER ADDRESS", "MANUAL ID", "CLUTCH ID", "DATE SOLD", "SOLD PRICE", "BUYER NAME", "BUYER EMAIL", "SHIP DATE", "AMOUNT PAID", "SHIPPING FEE", "SALE SOURCE", "PAYMENT STATUS", "SIRE", "DAM", "QR CODE", "SHEET ID", "SHEET_ID"];
  
  // Fields to skip for hatchling ADD form
  var hatchlingSkipFields = ["ANIMAL NAME", "LIST PRICE", "BUYER ADDRESS", "DATE SOLD", "SOLD PRICE", "BUYER NAME", "BUYER EMAIL", "SHIP DATE", "AMOUNT PAID", "SHIPPING FEE", "SALE SOURCE", "PAYMENT STATUS", "QR CODE", "SHEET ID", "SHEET_ID"];
  
  // Fields to show at the end for hatchling form
  var hatchlingEndFields = ["MANUAL OVERRIDE", "NOTES"];
  
  // Fields that are read-only on hatchling form (auto-filled from clutch)
  var hatchlingReadOnlyFields = ["SIRE", "DAM"];
  
  // Activity form - conditional fields based on ACTIVITY type
  var activityType = (state.formData.ACTIVITY || "").toLowerCase();
  var isSaleActivity = (activityType === "sold");
  var isPairingActivity = (activityType === "paired" || activityType === "lock");
  
  // Fields only shown for specific activities
  var activitySaleFields = ["SOLD DATE", "SOLD PRICE", "BUYER NAME", "BUYER EMAIL", "SALE SOURCE", "PAYMENT STATUS", "SHIP DATE", "SHIPPING FEE"];
  var activityPairingFields = ["PAIRED WITH"];
  
  // Determine which fields to show based on STATUS
  var status = (state.formData.STATUS || "").toLowerCase();
  var showSaleFields = (status === "on hold" || status === "sold");
  var saleFields = ["SOLD PRICE", "DATE SOLD", "BUYER NAME", "BUYER EMAIL", "SHIP DATE", "AMOUNT PAID", "SHIPPING FEE"];
  
  // Check if this is a hatchling form - ONLY for hatchling, not clutch or anything else
  var isHatchlingForm = (state.formType === "hatchling" && state.modalMode === "add" && state.modalTab === "collection");

  var html = '';
  
  // Show estimated hatch date preview for clutch form
  if ((tab === "clutch" || state.modalTab === "clutch") && state.formData["LAY DATE"]) {
    var estHatch = calculateEstHatchDate(state.formData["LAY DATE"]);
    html += '<div class="mb-4 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3">';
    html += '<div class="text-xs text-gray-600 uppercase font-semibold">Estimated Hatch Date (Lay Date + 59 days)</div>';
    html += '<div class="font-bold text-gray-800 text-lg">' + estHatch + '</div>';
    html += '</div>';
  }
  
  // Special rendering for hatchling form ONLY
  if (isHatchlingForm) {
    html += renderHatchlingForm(headers);
    document.getElementById("modalBody").innerHTML = html;
    return;
  }
  
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  
  headers.forEach(function(h) {
    if (skipFields.indexOf(h) >= 0) return;
    if (skipFields.indexOf(h.toUpperCase()) >= 0) return;
    if (h.includes("(RESERVED)")) return;
    // Skip fields that look like Sheet IDs (long alphanumeric strings, may contain / or other chars)
    if (/^[A-Z0-9_\-\/]{15,}$/i.test(h)) return;
    // Also skip any field that starts with a number and is very long
    if (/^\d/.test(h) && h.length > 10) return;
    // Skip anything with SHEET in the name
    if (h.toUpperCase().indexOf("SHEET") >= 0) return;
    
    // Collection form - hide sale fields unless status is on hold/sold
    if (state.modalTab === "collection" && saleFields.indexOf(h) >= 0 && !showSaleFields) return;
    
    // Skip hatchling/sale fields on breeder ADD form (status = Breeder)
    if (state.modalTab === "collection" && state.modalMode === "add") {
      var formStatus = (state.formData.STATUS || "").toLowerCase();
      if (formStatus === "breeder" || state.formType === "breeder") {
        var hUpper = h.toUpperCase();
        for (var i = 0; i < breederSkipFields.length; i++) {
          if (hUpper === breederSkipFields[i] || hUpper.indexOf(breederSkipFields[i]) >= 0) return;
        }
      }
    }
    
    // Clutch form - ONLY show these fields, nothing else
    if (state.modalTab === "clutch") {
      var clutchFormFields = ["SIRE", "DAM", "LAY DATE", "# LAID", "# FERTILE", "# SLUGS", "STATUS", "MANUAL OVERRIDE", "NOTES"];
      if (clutchFormFields.indexOf(h.toUpperCase()) < 0 && clutchFormFields.indexOf(h) < 0) return;
    }
    
    // Activity form conditional fields
    if (state.modalTab === "activity") {
      // Skip sale fields unless activity is "Sold"
      if (activitySaleFields.indexOf(h) >= 0 && !isSaleActivity) return;
      // Skip pairing fields unless activity is "Paired" or "Lock"
      if (activityPairingFields.indexOf(h) >= 0 && !isPairingActivity) return;
      // Skip VALUE field if it's a sale (sale data goes in specific fields)
      if (h === "VALUE" && isSaleActivity) return;
    }
    
    var val = state.formData[h] || "";
    var input = "";
    var opts = getFieldOptions(h, state.modalTab);
    
    // Special searchable dropdown for UNIQUE ID in activity form
    if (h.toUpperCase() === "UNIQUE ID" && state.modalTab === "activity" && opts && opts.length > 0) {
      input = '<div class="relative">';
      input += '<input type="text" id="animalSearch" placeholder="Search by name or ID..." oninput="filterAnimalDropdown(this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm mb-1">';
      input += '<select id="animalSelect" onchange="updateFormField(\'UNIQUE ID\', this.value); document.getElementById(\'animalSearch\').value=this.options[this.selectedIndex].text;" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" size="6">';
      opts.forEach(function(o) {
        var sel = (val && (val === o || val.toLowerCase() === o.toLowerCase())) ? " selected" : "";
        input += '<option value="' + escapeHtml(o) + '"' + sel + '>' + escapeHtml(o) + '</option>';
      });
      input += '</select>';
      input += '</div>';
    } else if (opts && opts.length > 0) {
      input = '<select onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">';
      input += '<option value="">Select...</option>';
      opts.forEach(function(o) {
        var sel = (val && (val === o || val.toLowerCase() === o.toLowerCase())) ? " selected" : "";
        input += '<option value="' + escapeHtml(o) + '"' + sel + '>' + escapeHtml(o) + '</option>';
      });
      input += '</select>';
    } else if (Array.isArray(opts) && opts.length === 0) {
      // Empty dropdown - show text input with placeholder
      var placeholder = "";
      if (h.toUpperCase() === "DAM") placeholder = "No female breeders found";
      if (h.toUpperCase() === "SIRE") placeholder = "No male breeders found";
      if (h.toUpperCase() === "PAIRED WITH") placeholder = "No animals found";
      if (h.toUpperCase() === "UNIQUE ID") placeholder = "No animals found - load data first";
      input = '<input type="text" value="' + escapeHtml(val) + '" onchange="updateFormField(\'' + h + '\', this.value)" placeholder="' + placeholder + '" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">';
    } else if (h.toUpperCase().includes("DATE")) {
      var isRequired = (h.toUpperCase() === "DATE OF BIRTH" && state.formType === "breeder");
      var requiredAttr = isRequired ? ' required' : '';
      // Format date value for input field (needs YYYY-MM-DD format)
      var dateVal = formatDateForInput(val);
      input = '<input type="date" value="' + dateVal + '" onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 mono text-sm"' + requiredAttr + '>';
    } else if (h.toUpperCase().includes("PRICE") || h.toUpperCase().includes("WEIGHT") || h.toUpperCase().includes("FEE") || h.startsWith("#")) {
      input = '<input type="number" step="any" value="' + val + '" onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 mono text-sm">';
    } else if (h.toUpperCase().includes("NOTES")) {
      input = '<textarea onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm" rows="2">' + escapeHtml(val) + '</textarea>';
    } else if (h.toUpperCase().includes("EMAIL")) {
      input = '<input type="email" value="' + escapeHtml(val) + '" onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">';
    } else {
      input = '<input type="text" value="' + escapeHtml(val) + '" onchange="updateFormField(\'' + h + '\', this.value)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">';
    }

    // UI-friendly label overrides
    var displayLabel = h;
    if (h.toUpperCase() === "MANUAL OVERRIDE") {
      displayLabel = "Custom Unique ID (optional)";
    }
    
    // Add required indicator for certain fields
    var requiredMark = '';
    if (h.toUpperCase() === "DATE OF BIRTH" && state.formType === "breeder") {
      requiredMark = ' <span class="text-red-500">*</span>';
    }

    html += '<div><label class="block text-xs font-semibold text-slate-600 uppercase mb-1">' + displayLabel + requiredMark + '</label>' + input + '</div>';
  });

  html += '</div>';
  document.getElementById("modalBody").innerHTML = html;
}

function calculateEstHatchDate(layDateStr) {
  if (!layDateStr) return "--";
  var d = parseDate(layDateStr);
  if (!d) return "--";
  d.setDate(d.getDate() + 59);
  return d.toISOString().split("T")[0];
}

function renderHatchlingForm(headers) {
  var html = '<div class="space-y-4">';
  
  // 1. CLUTCH ID - searchable chip selector showing "Clutch ID | Sire x Dam"
  var clutchOpts = getClutchOptions() || [];
  var clutchVal = state.formData["CLUTCH ID"] || "";
  html += '<div>';
  html += '<label class="block text-sm font-semibold text-gray-700 mb-2">Select Clutch</label>';
  html += '<div class="relative">';
  html += '<input type="text" id="hatchlingClutchSearch" placeholder="Type to search..." ';
  html += 'oninput="filterHatchlingClutches(this.value)" ';
  html += 'class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-gray-400 focus:outline-none">';
  html += '<div id="hatchlingClutchList" class="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white ' + (clutchVal ? 'hidden' : '') + '">';
  clutchOpts.forEach(function(clutchId) {
    // Get clutch details for display
    var clutch = state.data.clutch.find(function(c) { return c["CLUTCH ID"] === clutchId; });
    var sire = clutch ? (clutch["SIRE"] || "").split(" | ")[0] : "";
    var dam = clutch ? (clutch["DAM"] || "").split(" | ")[0] : "";
    var pairing = (sire && dam) ? sire + " x " + dam : (sire || dam || "");
    var displayLabel = clutchId + (pairing ? " | " + pairing : "");
    html += '<div onclick="selectHatchlingClutch(\'' + escapeHtml(clutchId).replace(/'/g, "\\'") + '\')" ';
    html += 'class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0">';
    html += '<span class="font-medium">' + escapeHtml(displayLabel) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';
  
  // Show selected clutch as dark chip
  if (clutchVal) {
    var selectedClutch = state.data.clutch.find(function(c) { return c["CLUTCH ID"] === clutchVal; });
    var displayLabel = clutchVal;
    if (selectedClutch) {
      var s = (selectedClutch["SIRE"] || "").split(" | ")[0];
      var d = (selectedClutch["DAM"] || "").split(" | ")[0];
      if (s && d) displayLabel = clutchVal + " | " + s + " x " + d;
    }
    html += '<div id="selectedClutchDisplay" class="mt-2 px-4 py-3 bg-gray-900 text-white rounded-xl flex items-center justify-between">';
    html += '<span class="font-medium">' + escapeHtml(displayLabel) + '</span>';
    html += '<button type="button" onclick="clearHatchlingClutch()" class="text-gray-400 hover:text-white text-lg">&times;</button>';
    html += '</div>';
  }
  html += '</div>';
  
  // 2. DAM and SIRE (read-only, auto-filled from clutch)
  var damVal = state.formData["DAM"] || "";
  var sireVal = state.formData["SIRE"] || "";
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Dam (from clutch)</label>';
  html += '<div class="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-100 text-sm text-gray-600">' + (damVal || "--") + '</div>';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Sire (from clutch)</label>';
  html += '<div class="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-100 text-sm text-gray-600">' + (sireVal || "--") + '</div>';
  html += '</div>';
  html += '</div>';
  
  // 3. DATE OF BIRTH and SEX row
  var dobVal = state.formData["DATE OF BIRTH"] || "";
  var sexVal = state.formData["SEX"] || "Unknown";
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Hatch Date <span class="text-red-500">*</span></label>';
  html += '<input type="date" value="' + dobVal + '" onchange="updateFormField(\'DATE OF BIRTH\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 mono text-sm" required>';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Sex</label>';
  html += '<select onchange="updateFormField(\'SEX\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">';
  ["Unknown", "Female", "Male"].forEach(function(o) {
    var sel = (sexVal === o) ? " selected" : "";
    html += '<option value="' + o + '"' + sel + '>' + o + '</option>';
  });
  html += '</select>';
  html += '</div>';
  html += '</div>';
  
  // 4. STATUS and HATCH WEIGHT row
  var statusVal = state.formData["STATUS"] || "Unlisted";
  var weightVal = state.formData["HATCH WEIGHT (G)"] || "";
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Status</label>';
  html += '<select onchange="updateFormField(\'STATUS\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">';
  ["Unlisted", "Listed", "Holdback"].forEach(function(o) {
    var sel = (statusVal === o) ? " selected" : "";
    html += '<option value="' + o + '"' + sel + '>' + o + '</option>';
  });
  html += '</select>';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Hatch Weight (g)</label>';
  html += '<input type="number" step="any" value="' + weightVal + '" onchange="updateFormField(\'HATCH WEIGHT (G)\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 mono text-sm">';
  html += '</div>';
  html += '</div>';
  
  // 5. SPECIES
  var speciesVal = state.formData["SPECIES"] || "Ball Python";
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Species</label>';
  html += '<input type="text" value="' + escapeHtml(speciesVal) + '" onchange="updateFormField(\'SPECIES\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">';
  html += '</div>';
  
  // 6. GENETIC SUMMARY
  var geneticsVal = state.formData["GENETIC SUMMARY"] || "";
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Genetic Summary</label>';
  html += '<input type="text" value="' + escapeHtml(geneticsVal) + '" onchange="updateFormField(\'GENETIC SUMMARY\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm" placeholder="e.g. Pastel Het Clown">';
  html += '</div>';
  
  // 7. BREEDER SOURCE
  var sourceVal = state.formData["BREEDER SOURCE"] || "Produced In House";
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Breeder Source</label>';
  html += '<input type="text" value="' + escapeHtml(sourceVal) + '" onchange="updateFormField(\'BREEDER SOURCE\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">';
  html += '</div>';
  
  // 8. Custom Unique ID and Notes row
  var manualVal = state.formData["MANUAL OVERRIDE"] || "";
  var notesVal = state.formData["NOTES"] || "";
  html += '<div class="grid grid-cols-2 gap-4">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Custom Unique ID (optional)</label>';
  html += '<input type="text" value="' + escapeHtml(manualVal) + '" onchange="updateFormField(\'MANUAL OVERRIDE\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm" placeholder="Your own ID system">';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Notes</label>';
  html += '<input type="text" value="' + escapeHtml(notesVal) + '" onchange="updateFormField(\'NOTES\', this.value)" class="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm">';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  return html;
}

function filterHatchlingClutches(search) {
  var list = document.getElementById("hatchlingClutchList");
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

function selectHatchlingClutch(clutchId) {
  state.formData["CLUTCH ID"] = clutchId;
  
  // Look up the clutch to get DAM and SIRE
  var clutchRows = state.data.clutch || [];
  var found = clutchRows.find(function(c) { return c["CLUTCH ID"] === clutchId; });
  
  if (found) {
    state.formData["DAM"] = found["DAM"] || "";
    state.formData["SIRE"] = found["SIRE"] || "";
  } else {
    state.formData["DAM"] = "";
    state.formData["SIRE"] = "";
  }
  
  // Re-render the form
  renderModalForm("hatchling");
}

function clearHatchlingClutch() {
  state.formData["CLUTCH ID"] = "";
  state.formData["DAM"] = "";
  state.formData["SIRE"] = "";
  renderModalForm("hatchling");
}

// Custom Activity Add Form - cleaner design
function renderActivityAddForm() {
  var html = '';
  var today = state.formData["DATE"] || new Date().toISOString().split("T")[0];
  var selectedActivity = state.formData["ACTIVITY"] || "";
  var selectedAnimal = state.formData["UNIQUE ID"] || "";
  
  // Get all animals for selection
  var animals = state.data.collection.filter(function(r) {
    var st = (r.STATUS || "").toLowerCase();
    return st === "breeder" || st === "holdback" || st === "on loan" || st === "listed" || st === "unlisted";
  });
  
  // Step 1: Select Animal (large, prominent)
  html += '<div class="mb-5">';
  html += '<label class="block text-sm font-semibold text-gray-700 mb-2">Select Animal</label>';
  html += '<div class="relative">';
  html += '<input type="text" id="activityAnimalSearch" placeholder="Type to search..." ';
  html += 'oninput="filterActivityAnimals(this.value)" ';
  html += 'class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-gray-400 focus:outline-none">';
  html += '<div id="activityAnimalList" class="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white ' + (selectedAnimal ? 'hidden' : '') + '">';
  animals.forEach(function(a) {
    var name = a["ANIMAL NAME"] || "";
    var id = a["UNIQUE ID"] || "";
    var selectId = id || name; // Use name as fallback if no ID
    var label = name ? (id ? name + " | " + id : name) : id;
    html += '<div onclick="selectActivityAnimal(\'' + escapeHtml(selectId).replace(/'/g, "\\'") + '\', \'' + escapeHtml(label).replace(/'/g, "\\'") + '\')" ';
    html += 'class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0">';
    html += '<span class="font-medium">' + escapeHtml(name || id) + '</span>';
    if (name && id) html += ' <span class="text-gray-400 text-xs">' + escapeHtml(id) + '</span>';
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';
  
  // Show selected animal
  if (selectedAnimal) {
    var selectedName = getAnimalNameById(selectedAnimal);
    var displayLabel = selectedName ? selectedName + " | " + selectedAnimal : selectedAnimal;
    html += '<div id="selectedAnimalDisplay" class="mt-2 px-4 py-3 bg-gray-900 text-white rounded-xl flex items-center justify-between">';
    html += '<span class="font-medium">' + escapeHtml(displayLabel) + '</span>';
    html += '<button type="button" onclick="clearActivityAnimal()" class="text-gray-400 hover:text-white text-lg">&times;</button>';
    html += '</div>';
  }
  html += '</div>';
  
  // Step 2: Date (simple)
  html += '<div class="mb-5">';
  html += '<label class="block text-sm font-semibold text-gray-700 mb-2">Date</label>';
  html += '<input type="date" id="activityDate" value="' + today + '" ';
  html += 'onchange="state.formData[\'DATE\']=this.value" ';
  html += 'class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-gray-400 focus:outline-none">';
  html += '</div>';
  
  // Step 3: Activity Type - Visual buttons in categories
  html += '<div class="mb-5">';
  html += '<label class="block text-sm font-semibold text-gray-700 mb-2">Activity Type</label>';
  
  // Feeding row
  html += '<div class="mb-2">';
  html += '<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Feeding</div>';
  html += '<div class="flex gap-2">';
  html += activityButton("Took Meal", selectedActivity);
  html += activityButton("Refused Meal", selectedActivity);
  html += '</div>';
  html += '</div>';
  
  // General row
  html += '<div class="mb-2">';
  html += '<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">General</div>';
  html += '<div class="flex gap-2">';
  html += activityButton("Shed", selectedActivity);
  html += activityButton("Weight", selectedActivity);
  html += activityButton("Note", selectedActivity);
  html += activityButton("Health Hold", selectedActivity);
  html += '</div>';
  html += '</div>';
  
  // Breeding row
  html += '<div class="mb-2">';
  html += '<div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Breeding</div>';
  html += '<div class="flex gap-2">';
  html += activityButton("Paired", selectedActivity);
  html += activityButton("Lock", selectedActivity);
  html += activityButton("Ovulation", selectedActivity);
  html += activityButton("Pre Lay Shed", selectedActivity);
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Step 4: Value field (conditional based on activity)
  var showValue = selectedActivity === "Weight" || selectedActivity === "Note" || selectedActivity === "Health Hold" || selectedActivity === "Ovulation";
  var showPairedWith = selectedActivity === "Paired" || selectedActivity === "Lock";
  
  if (showValue) {
    var valueLabel = "Value";
    var valuePlaceholder = "";
    if (selectedActivity === "Weight") { valueLabel = "Weight (grams)"; valuePlaceholder = "e.g. 1500"; }
    if (selectedActivity === "Note" || selectedActivity === "Health Hold") { valueLabel = "Notes"; valuePlaceholder = "Enter notes..."; }
    if (selectedActivity === "Ovulation") { valueLabel = "Follicle Size (mm)"; valuePlaceholder = "e.g. 35"; }
    
    html += '<div class="mb-5">';
    html += '<label class="block text-sm font-semibold text-gray-700 mb-2">' + valueLabel + '</label>';
    html += '<input type="text" id="activityValue" value="' + escapeHtml(state.formData["VALUE"] || "") + '" ';
    html += 'placeholder="' + valuePlaceholder + '" ';
    html += 'onchange="state.formData[\'VALUE\']=this.value" ';
    html += 'class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-gray-400 focus:outline-none">';
    html += '</div>';
  }
  
  if (showPairedWith) {
    var pairedValue = state.formData["VALUE"] || "";
    html += '<div class="mb-5">';
    html += '<label class="block text-sm font-semibold text-gray-700 mb-2">Paired With</label>';
    html += '<div class="relative">';
    html += '<input type="text" id="pairedWithSearch" placeholder="Type to search..." ';
    html += 'oninput="filterPairedWithAnimals(this.value)" ';
    html += 'class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm focus:border-gray-400 focus:outline-none">';
    html += '<div id="pairedWithList" class="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white ' + (pairedValue ? 'hidden' : '') + '">';
    animals.forEach(function(a) {
      var name = a["ANIMAL NAME"] || "";
      var id = a["UNIQUE ID"] || "";
      var label = name ? name + " | " + id : id;
      html += '<div onclick="selectPairedWithAnimal(\'' + escapeHtml(label).replace(/'/g, "\\'") + '\')" ';
      html += 'class="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-0">';
      html += '<span class="font-medium">' + escapeHtml(name || id) + '</span>';
      if (name && id) html += ' <span class="text-gray-400 text-xs">' + escapeHtml(id) + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    
    // Show selected paired animal
    if (pairedValue) {
      html += '<div id="selectedPairedDisplay" class="mt-2 px-4 py-3 bg-gray-900 text-white rounded-xl flex items-center justify-between">';
      html += '<span class="font-medium">' + escapeHtml(pairedValue) + '</span>';
      html += '<button type="button" onclick="clearPairedWithAnimal()" class="text-gray-400 hover:text-white text-lg">&times;</button>';
      html += '</div>';
    }
    html += '</div>';
  }
  
  document.getElementById("modalBody").innerHTML = html;
  
  // Set up save button
  document.getElementById("saveBtn").onclick = saveActivityFromForm;
}

function activityButton(label, selected) {
  var isSelected = (selected === label);
  var baseClass = "px-3 py-2 rounded-lg text-sm font-medium transition-colors ";
  var colorClass = isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  return '<button type="button" onclick="selectActivityType(\'' + label + '\')" class="' + baseClass + colorClass + '">' + label + '</button>';
}

function filterActivityAnimals(search) {
  var list = document.getElementById("activityAnimalList");
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

function selectActivityAnimal(id, label) {
  state.formData["UNIQUE ID"] = id;
  renderActivityAddForm();
}

function clearActivityAnimal() {
  state.formData["UNIQUE ID"] = "";
  renderActivityAddForm();
}

function selectActivityType(activity) {
  state.formData["ACTIVITY"] = activity;
  state.formData["VALUE"] = ""; // Clear value when changing activity type
  renderActivityAddForm();
}

function filterPairedWithAnimals(search) {
  var list = document.getElementById("pairedWithList");
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

function selectPairedWithAnimal(label) {
  state.formData["VALUE"] = label;
  renderActivityAddForm();
}

function clearPairedWithAnimal() {
  state.formData["VALUE"] = "";
  renderActivityAddForm();
}

function saveActivityFromForm() {
  var animalId = state.formData["UNIQUE ID"] || "";
  var date = state.formData["DATE"] || "";
  var activity = state.formData["ACTIVITY"] || "";
  var value = state.formData["VALUE"] || "";
  
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
    "VALUE": value
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

function getFieldOptions(field, sheetKey) {
  var f = field.toUpperCase();
  if (f === "SEX") return FIELD_OPTIONS.SEX;
  if (f === "STATUS" && sheetKey === "clutch") return FIELD_OPTIONS.CLUTCH_STATUS;
  if (f === "STATUS") return FIELD_OPTIONS.STATUS;
  if (f === "ACTIVITY") return FIELD_OPTIONS.ACTIVITY;
  if (f === "SALE SOURCE") return FIELD_OPTIONS.SALE_SOURCE;
  if (f === "PAYMENT STATUS") return FIELD_OPTIONS.PAYMENT_STATUS;
  
  // DAM/SIRE dropdowns
  if (f === "DAM") return getBreederOptions("Female");
  if (f === "SIRE") return getBreederOptions("Male");
  if (f === "CLUTCH ID" && sheetKey === "collection") return getClutchOptions();
  
  // Activity form - UNIQUE ID dropdown (all animals)
  if (f === "UNIQUE ID" && sheetKey === "activity") return getAllAnimalOptions();
  // Activity form - PAIRED WITH dropdown (for pairing/lock activities)
  if (f === "PAIRED WITH") return getAllAnimalOptions();
  
  return null;
}

function getAllAnimalOptions() {
  var rows = state.data.collection || [];
  var opts = [];
  rows.forEach(function(r) {
    var id = r["UNIQUE ID"] || "";
    var name = r["ANIMAL NAME"] || "";
    if (id) {
      var label = name ? name + " | " + id : id;
      opts.push(label);
    }
  });
  return opts;
}

// Filter the animal dropdown based on search input
function filterAnimalDropdown(searchText) {
  var select = document.getElementById("animalSelect");
  if (!select) return;
  
  var search = searchText.toLowerCase();
  var options = select.options;
  
  for (var i = 0; i < options.length; i++) {
    var optionText = options[i].text.toLowerCase();
    if (search === "" || optionText.indexOf(search) >= 0) {
      options[i].style.display = "";
    } else {
      options[i].style.display = "none";
    }
  }
}

function getBreederOptions(sex) {
  var rows = state.data.collection || [];
  var opts = [];
  rows.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase();
    // Only include breeders and holdbacks as potential parents
    if (st !== "breeder" && st !== "holdback") return;
    var s = (r.SEX || "").toLowerCase();
    if (sex === "Female" && !s.startsWith("f")) return;
    if (sex === "Male" && !s.startsWith("m")) return;
    var id = r["UNIQUE ID"] || "";
    var name = r["ANIMAL NAME"] || "";
    if (id || name) {
      var label = name ? (id ? name + " | " + id : name) : id;
      opts.push(label);
    }
  });
  // Always return array so it shows as dropdown, even if empty
  return opts;
}

function getClutchOptions() {
  var rows = state.data.clutch || [];
  var opts = [];
  rows.forEach(function(r) {
    var id = r["CLUTCH ID"];
    var status = (r["STATUS"] || "").toLowerCase();
    // Only show clutches that are NOT hatched
    if (id && status !== "hatched") {
      opts.push(id);
    }
  });
  return opts.length ? opts : null;
}

function updateFormField(field, value) {
  state.formData[field] = value;
  
  // Track that this field was modified by the user (for edit mode)
  if (state.modifiedFields) {
    state.modifiedFields.add(field);
  }
  
  // Re-render if STATUS changed (to show/hide sale fields)
  if (field === "STATUS") {
    renderModalForm(state.activeTab);
  }
  
  // Re-render if ACTIVITY changed (to show/hide conditional fields)
  if (field === "ACTIVITY") {
    renderModalForm(state.activeTab);
  }
  
  // Re-render if LAY DATE changed (to update estimated hatch date)
  if (field === "LAY DATE" && state.modalTab === "clutch") {
    renderModalForm(state.activeTab);
    // Also update CLUTCH ID preview if in add mode
    if (state.modalMode === "add") {
      document.getElementById("modalIdValue").textContent = generateClutchId(value);
    }
  }
}

function escapeHtml(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Format a date value for HTML date input (needs YYYY-MM-DD)
// Handles: Date objects, ISO strings, "MM/DD/YYYY", "YYYY-MM-DD", timestamps
function formatDateForInput(val) {
  if (!val) return "";
  
  // If it's already in YYYY-MM-DD format, return as-is
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  
  // If it's a Date object
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  
  // If it's a string with timestamp (like "2022-01-01T08:00:00")
  if (typeof val === "string" && val.includes('T')) {
    return val.split('T')[0];
  }
  
  // If it's MM/DD/YYYY format
  if (typeof val === "string") {
    var parts = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (parts) {
      var mm = parts[1].padStart(2, '0');
      var dd = parts[2].padStart(2, '0');
      var yyyy = parts[3];
      return yyyy + '-' + mm + '-' + dd;
    }
  }
  
  // Try to parse as date
  try {
    var d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  // Return original value if we can't parse it
  return String(val);
}

// Format date as YYYY-MM-DD only (no timestamp)
// formatDateOnly removed - dates pass through as-is to preserve original format
function generateHatchlingId() {
  var year = new Date().getFullYear();
  var rows = state.data.collection || [];
  var max = 0;
  var re = /^H-(\d{4})-(\d{4})$/i;
  rows.forEach(function(r) {
    var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
    var m = re.exec(id);
    if (m && m[1] === String(year)) {
      var n = parseInt(m[2], 10);
      if (n > max) max = n;
    }
  });
  return "H-" + year + "-" + String(max + 1).padStart(4, "0");
}

function generateBreederId() {
  var year = new Date().getFullYear();
  var rows = state.data.collection || [];
  var max = 0;
  var re = /^B-(\d{4})-(\d{4})$/i;
  rows.forEach(function(r) {
    var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
    var m = re.exec(id);
    if (m && m[1] === String(year)) {
      var n = parseInt(m[2], 10);
      if (n > max) max = n;
    }
  });
  return "B-" + year + "-" + String(max + 1).padStart(4, "0");
}

function generateActivityId() {
  var year = new Date().getFullYear();
  var rows = state.data.activity || [];
  var max = 0;
  var re = /^A-(\d{4})-(\d{4})$/i;
  rows.forEach(function(r) {
    var id = r["ACTIVITY ID"] || "";
    var m = re.exec(id);
    if (m && m[1] === String(year)) {
      var n = parseInt(m[2], 10);
      if (n > max) max = n;
    }
  });
  return "A-" + year + "-" + String(max + 1).padStart(4, "0");
}

function generateClutchId(layDate) {
  var d = parseDate(layDate);
  var year = d ? d.getFullYear() : new Date().getFullYear();
  var rows = state.data.clutch || [];
  var count = 0;
  rows.forEach(function(r) {
    var ld = parseDate(r["LAY DATE"]);
    if (ld && ld.getFullYear() === year) count++;
  });
  return "CL-" + year + "-" + String(count + 1).padStart(4, "0");
}

function saveRecord() {
  var headers = state.headers[state.modalTab] || [];
  if (!headers.length) { document.getElementById("modalError").textContent = "No headers"; return; }

  // Auto-generate UNIQUE ID for new collection records (breeders/hatchlings)
  if (state.modalMode === "add" && state.modalTab === "collection") {
    var generatedId = document.getElementById("modalIdValue") ? document.getElementById("modalIdValue").textContent : "";
    if (generatedId && !state.formData["UNIQUE ID"]) {
      state.formData["UNIQUE ID"] = generatedId;
    }
  }
  
  // Auto-generate CLUTCH ID for new clutch records
  if (state.modalMode === "add" && state.modalTab === "clutch") {
    var generatedId = document.getElementById("modalIdValue") ? document.getElementById("modalIdValue").textContent : "";
    if (generatedId && !state.formData["CLUTCH ID"]) {
      state.formData["CLUTCH ID"] = generatedId;
    }
  }

  // Auto-calculate EST. HATCH DATE for clutches
  if (state.modalTab === "clutch" && state.formData["LAY DATE"]) {
    var estHatchIdx = -1;
    for (var i = 0; i < headers.length; i++) {
      var hUpper = headers[i].toUpperCase();
      if (hUpper === "EST. HATCH DATE" || hUpper === "EST HATCH DATE" || hUpper === "ESTIMATED HATCH DATE") {
        estHatchIdx = i;
        break;
      }
    }
    if (estHatchIdx >= 0) {
      state.formData[headers[estHatchIdx]] = calculateEstHatchDate(state.formData["LAY DATE"]);
    }
  }

  var sheetName = SHEET_TABS[state.modalTab];
  var savedTab = state.modalTab;
  var savedFormData = Object.assign({}, state.formData);
  var isAdd = state.modalMode === "add";

  document.getElementById("saveBtn").textContent = "Saving...";
  document.getElementById("saveBtn").disabled = true;

  var promise;
  if (isAdd) {
    promise = apiCall('saveRecord', {
      tab: sheetName,
      data: state.formData
    });
  } else {
    promise = apiCall('updateRecord', {
      tab: sheetName,
      rowIndex: state.editRowIndex,
      data: state.formData
    });
  }

  promise.then(function(response) {
    if (response.success) {
      // Optimistic UI: Add to local data immediately
      if (isAdd) {
        var newRow = Object.assign({ __rowIndex: state.data[savedTab].length }, savedFormData);
        state.data[savedTab].push(newRow);
      }
      
      setStatus("Saved!");
      closeModal();
      renderCurrentView(); // Render immediately with local data
      
      // Then refresh from server in background
      loadDataQuietly();
    } else {
      document.getElementById("modalError").textContent = response.error || "Save failed";
    }
  }).catch(function(e) {
    document.getElementById("modalError").textContent = e.message || "Save failed";
  }).finally(function() {
    document.getElementById("saveBtn").textContent = "Save";
    document.getElementById("saveBtn").disabled = false;
  });
}

// Silent data refresh (no loading message)
function loadDataQuietly() {
  apiCall('getData', {})
    .then(function(response) {
      if (response.success) {
        var data = response.data;
        state.headers = {
          collection: data.collection ? data.collection.headers : [],
          clutch: data.clutch ? data.clutch.headers : [],
          activity: data.activity ? data.activity.headers : []
        };
        state.data = {
          collection: data.collection ? data.collection.rows : [],
          clutch: data.clutch ? data.clutch.rows : [],
          activity: data.activity ? data.activity.rows : []
        };
        renderCurrentView();
      }
    })
    .catch(function() {
      // Silently fail - we already have optimistic data
    });
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

