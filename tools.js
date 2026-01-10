/*
 * THE RACK - Tools (Export, Data Health, Settings, Changelog)
 * Version: 2.12.58
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 2.12.7: Logo upload with base64 storage instead of external URL
 * - 2.12.0: Split from monolithic index.html
 */


// ============ TOOLS ============
function exportCSV(sheetKey) {
  var headers = state.headers[sheetKey] || [];
  var rows = state.data[sheetKey] || [];
  if (!headers.length) { alert("No data to export"); return; }

  var lines = [headers.join(",")];
  rows.forEach(function(r) {
    var vals = headers.map(function(h) {
      var v = String(r[h] || "").replace(/"/g, '""');
      return '"' + v + '"';
    });
    lines.push(vals.join(","));
  });

  var blob = new Blob([lines.join("\n")], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = sheetKey + "_export_" + new Date().toISOString().split("T")[0] + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

function showDataHealth() {
  var rows = state.data.collection || [];
  var clutchRows = state.data.clutch || [];
  var missingSex = 0, listedNoSex = 0;
  
  // Check for missing sex
  rows.forEach(function(r) {
    var sex = (r.SEX || "").trim();
    var status = (r.STATUS || "").toLowerCase();
    if (!sex) missingSex++;
    if ((status === "listed" || status === "for sale") && !sex) listedNoSex++;
  });
  
  // Check for duplicate UNIQUE IDs
  var uniqueIds = {};
  var duplicateUniqueIds = [];
  rows.forEach(function(r) {
    var id = (r["UNIQUE ID"] || "").trim();
    if (id) {
      if (uniqueIds[id]) {
        if (duplicateUniqueIds.indexOf(id) < 0) {
          duplicateUniqueIds.push(id);
        }
      } else {
        uniqueIds[id] = true;
      }
    }
  });
  
  // Check for duplicate CLUTCH IDs
  var clutchIds = {};
  var duplicateClutchIds = [];
  clutchRows.forEach(function(r) {
    var id = (r["CLUTCH ID"] || "").trim();
    if (id) {
      if (clutchIds[id]) {
        if (duplicateClutchIds.indexOf(id) < 0) {
          duplicateClutchIds.push(id);
        }
      } else {
        clutchIds[id] = true;
      }
    }
  });
  
  var report = "DATA HEALTH CHECK\n";
  report += "==================\n\n";
  report += "COLLECTION:\n";
  report += "  Total animals: " + rows.length + "\n";
  report += "  Missing sex: " + missingSex + "\n";
  report += "  Listed without sex: " + listedNoSex + "\n";
  
  if (duplicateUniqueIds.length > 0) {
    report += "\n  WARNING - Duplicate UNIQUE IDs found:\n";
    duplicateUniqueIds.forEach(function(id) {
      report += "    - " + id + "\n";
    });
  } else {
    report += "  Duplicate UNIQUE IDs: None (good!)\n";
  }
  
  report += "\nCLUTCHES:\n";
  report += "  Total clutches: " + clutchRows.length + "\n";
  
  if (duplicateClutchIds.length > 0) {
    report += "\n  WARNING - Duplicate CLUTCH IDs found:\n";
    duplicateClutchIds.forEach(function(id) {
      report += "    - " + id + "\n";
    });
  } else {
    report += "  Duplicate CLUTCH IDs: None (good!)\n";
  }

  alert(report);
}

function openAddForCurrentTab() {
  // Map activeTab to the correct add form type
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

function openChangelogModal() {
  var html = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-auto" style="z-index: 9999;" onclick="if(event.target===this)closeChangelogModal()">';
  html += '<div class="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">';
  html += '<div class="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">';
  html += '<h2 class="text-xl font-bold text-gray-900">What\'s New - v' + VERSION + '</h2>';
  html += '<button onclick="closeChangelogModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>';
  html += '</div>';
  html += '<div class="p-6 max-h-[70vh] overflow-y-auto">';
  
  // Changelog content
  html += '<div class="space-y-6">';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Login & Security</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Email + Access Code Login - Simple, secure login</li>';
  html += '<li>- Auto-login - Remembers your credentials</li>';
  html += '<li>- Per-customer Google Sheets - Your data stays private</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Dashboard</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- At-a-glance stats for breeders, clutches, hatchlings, sales</li>';
  html += '<li>- Year-over-year sales comparison</li>';
  html += '<li>- Smart alerts - Overdue clutches, unshipped sales, needs sexing, and more</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Collection Management</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Full animal profiles with genetics, status, DOB</li>';
  html += '<li>- Clickable gene tags for filtering</li>';
  html += '<li>- Maturity auto-calculation from DOB</li>';
  html += '<li>- QR codes for each animal</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Clutch Management</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Track sire, dam, lay date, egg counts</li>';
  html += '<li>- Auto-calculated estimated hatch date</li>';
  html += '<li>- Overdue clutch alerts</li>';
  html += '<li>- Batch hatchling creation from clutch</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Sales & Hatchlings</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Dedicated views for hatchlings and sales</li>';
  html += '<li>- Quick sell and holdback actions</li>';
  html += '<li>- Payment and shipping tracking</li>';
  html += '<li>- Revenue calculation by year</li>';
  html += '<li>- PDF Invoice generation with multi-animal support</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Import & Export</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- MorphMarket CSV import with field mapping</li>';
  html += '<li>- Smart duplicate detection (updates instead of duplicates)</li>';
  html += '<li>- Export collection or clutches to CSV</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">QR Code System</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Auto-generated QR codes for every animal</li>';
  html += '<li>- Print QR labels (small, medium, large)</li>';
  html += '<li>- Scan QR to quickly log activity</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Archive & Activity</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Soft delete - items go to Archive, can be restored</li>';
  html += '<li>- Activity log for feeding, sheds, weights, pairings</li>';
  html += '</ul></div>';
  
  html += '<div><h3 class="font-bold text-gray-800 mb-2">Mobile Friendly</h3>';
  html += '<ul class="text-sm text-gray-600 space-y-1">';
  html += '<li>- Responsive design for phone, tablet, desktop</li>';
  html += '<li>- Slide-out mobile menu</li>';
  html += '<li>- Touch-friendly buttons</li>';
  html += '</ul></div>';
  
  html += '</div>'; // space-y-6
  html += '</div>'; // p-6 overflow
  html += '</div></div>';
  
  var modal = document.createElement('div');
  modal.id = 'changelogModal';
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

function closeChangelogModal() {
  var modal = document.getElementById('changelogModal');
  if (modal) modal.remove();
}

function openSettingsModal() {
  console.log("openSettingsModal called");
  console.log("state.settings:", state.settings);
  
  // Remove any existing settings modal first
  var existingModal = document.getElementById('settingsModal');
  if (existingModal) existingModal.remove();
  
  var html = '<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style="z-index: 9999;" onclick="if(event.target===this)closeSettingsModal()">';
  html += '<div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">';
  html += '<div class="p-6">';
  html += '<div class="flex justify-between items-center mb-6">';
  html += '<h2 class="text-xl font-bold text-gray-900">Settings</h2>';
  html += '<button onclick="closeSettingsModal()" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>';
  html += '</div>';
  
  // Logo upload section
  var currentLogo = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  var hasLogo = currentLogo && currentLogo.length > 0;
  
  html += '<div class="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">';
  html += '<label class="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>';
  html += '<div class="flex items-center gap-4">';
  
  // Logo preview
  html += '<div id="logoPreviewContainer" class="w-20 h-20 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">';
  if (hasLogo) {
    html += '<img id="logoPreview" src="' + escapeHtml(currentLogo) + '" class="max-w-full max-h-full object-contain">';
  } else {
    html += '<span id="logoPlaceholder" class="text-gray-400 text-xs text-center">No logo</span>';
  }
  html += '</div>';
  
  // Upload controls
  html += '<div class="flex-1">';
  html += '<input type="file" id="logoFileInput" accept="image/*" onchange="handleLogoUpload(event)" class="hidden">';
  html += '<button type="button" onclick="document.getElementById(\'logoFileInput\').click()" class="px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-black">Upload Logo</button>';
  if (hasLogo) {
    html += ' <button type="button" onclick="removeLogo()" class="px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 ml-2">Remove</button>';
  }
  html += '<div class="text-xs text-gray-500 mt-2">Square image recommended. Max 500KB.</div>';
  html += '</div>';
  
  html += '</div>';
  html += '</div>';
  
  // Settings fields with optional helper text
  var settingsFields = [
    { key: "BUSINESS NAME", label: "Business Name", placeholder: "Your breeding business name", helper: "" },
    { key: "OWNER NAME", label: "Owner Name", placeholder: "Your name", helper: "" },
    { key: "EMAIL", label: "Email", placeholder: "contact@yourbusiness.com", helper: "" },
    { key: "PHONE", label: "Phone", placeholder: "(555) 123-4567", helper: "" },
    { key: "CITY, STATE, ZIP", label: "Location", placeholder: "City, State ZIP", helper: "" },
    { key: "WEBSITE", label: "Website", placeholder: "https://...", helper: "" },
    { key: "INSTAGRAM", label: "Instagram", placeholder: "@yourhandle", helper: "" },
    { key: "DEFAULT SPECIES", label: "Default Species", placeholder: "Ball Pythons", helper: "" },
    { key: "INCUBATION DAYS", label: "Default Incubation Days", placeholder: "55", helper: "" },
    { key: "DEFAULT TAX RATE", label: "Default Tax Rate (%)", placeholder: "0", helper: "" },
    { key: "INVOICE TERMS", label: "Invoice Terms / Health Guarantee", placeholder: "Live arrival guarantee. Health guarantee valid 7 days from delivery.", helper: "" }
  ];
  
  html += '<div class="space-y-4">';
  settingsFields.forEach(function(field) {
    var value = state.settings[field.key] || "";
    html += '<div>';
    html += '<label class="block text-sm font-medium text-gray-700 mb-1">' + field.label + '</label>';
    html += '<input type="text" id="setting_' + field.key.replace(/[^a-zA-Z0-9]/g, '_') + '" value="' + escapeHtml(value) + '" placeholder="' + field.placeholder + '" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">';
    if (field.helper) {
      html += '<div class="text-xs text-gray-500 mt-1">' + field.helper + '</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  
  html += '<div class="mt-6 flex gap-3">';
  html += '<button onclick="saveSettings()" class="flex-1 px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-black text-sm">Save Settings</button>';
  html += '<button onclick="closeSettingsModal()" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 text-sm">Cancel</button>';
  html += '</div>';
  
  html += '</div></div></div>';
  
  var modal = document.createElement('div');
  modal.id = 'settingsModal';
  modal.innerHTML = html;
  document.body.appendChild(modal);
}

// Temporary storage for uploaded logo
var pendingLogoData = null;

function handleLogoUpload(event) {
  var file = event.target.files[0];
  if (!file) return;
  
  // Check file size (500KB max)
  if (file.size > 500 * 1024) {
    alert("Logo file is too large. Please use an image under 500KB.");
    return;
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    alert("Please select an image file.");
    return;
  }
  
  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    
    // Update preview
    var container = document.getElementById('logoPreviewContainer');
    container.innerHTML = '<img id="logoPreview" src="' + dataUrl + '" class="max-w-full max-h-full object-contain">';
    
    // Store for saving
    pendingLogoData = dataUrl;
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  pendingLogoData = "";  // Empty string signals removal
  var container = document.getElementById('logoPreviewContainer');
  container.innerHTML = '<span id="logoPlaceholder" class="text-gray-400 text-xs text-center">No logo</span>';
}

function closeSettingsModal() {
  var modal = document.getElementById('settingsModal');
  if (modal) modal.remove();
}

function saveSettings() {
  var settingsFields = [
    "BUSINESS NAME", "OWNER NAME", "EMAIL", "PHONE", 
    "CITY, STATE, ZIP", "WEBSITE", "INSTAGRAM", "DEFAULT SPECIES", "INCUBATION DAYS",
    "DEFAULT TAX RATE", "INVOICE TERMS"
  ];
  
  var updates = [];
  settingsFields.forEach(function(field) {
    var inputId = 'setting_' + field.replace(/[^a-zA-Z0-9]/g, '_');
    var input = document.getElementById(inputId);
    if (input) {
      var newValue = input.value.trim();
      var oldValue = state.settings[field] || "";
      if (newValue !== oldValue) {
        updates.push({ field: field, value: newValue });
        state.settings[field] = newValue;
      }
    }
  });
  
  // Handle logo upload
  if (pendingLogoData !== null) {
    updates.push({ field: "LOGO DATA", value: pendingLogoData });
    state.settings["LOGO DATA"] = pendingLogoData;
    // Clear old LOGO URL if we're using uploaded data
    if (pendingLogoData && state.settings["LOGO URL"]) {
      updates.push({ field: "LOGO URL", value: "" });
      state.settings["LOGO URL"] = "";
    }
    pendingLogoData = null;
  }
  
  if (updates.length === 0) {
    closeSettingsModal();
    return;
  }
  
  setStatus("Saving settings...");
  
  // Save each setting to the Settings sheet
  var savePromises = updates.map(function(update) {
    return apiCall('saveRecord', { 
      tab: 'Settings', 
      data: { "FIELD": update.field, "VALUE": update.value }
    });
  });
  
  Promise.all(savePromises)
    .then(function() {
      setStatus("Settings saved!");
      updateUIWithSettings();
      closeSettingsModal();
    })
    .catch(function(error) {
      setStatus("Error saving settings: " + error.message, true);
    });
}

