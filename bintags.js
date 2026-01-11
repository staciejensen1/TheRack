/*
 * THE RACK - QR Codes & Bin Tags
 * Version: 2.12.43
 * Last Updated: 2026-01-11
 * 
 * Changelog:
 * - 2.12.43: Added printBinTagsMultiple() function for printing multiple tags per page
 * - 2.12.42: Changed Unique ID font to Montserrat 7pt (non-bold)
 * - 2.12.41: Redesigned bin tag layout - new structure with INFO/Year/Breeder in right column, updated fonts (Norwester + Montserrat), shows ID in name area if no name
 * - 2.12.40: Removed all PDF code, HTML print only
 * - 2.12.39: LOCKED - 3.18x1.93in tag, 0.10in bleed, explicit row heights
 * - 2.12.23: Complete rewrite - Norwester font
 */


// ============ QR CODE GENERATOR ============
function openQRGenerator() {
  if (!state.isLoggedIn) {
    setStatus("Please log in first", true);
    return;
  }
  document.getElementById("qrModal").classList.remove("hidden");
  updateQRPreview();
}

function closeQRModal() {
  document.getElementById("qrModal").classList.add("hidden");
}

function updateQRPreview() {
  var filter = document.getElementById("qrAnimalSelect").value;
  var size = document.getElementById("qrSizeSelect").value;
  var preview = document.getElementById("qrPreview");
  
  var animals = state.data.collection.filter(function(r) {
    var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
    var status = (r.STATUS || "").toLowerCase().trim();
    if (!id) return false;
    
    if (filter === "breeders") {
      return status === "breeder" || status === "on loan";
    } else if (filter === "hatchlings") {
      return status === "listed" || status === "unlisted" || status === "holdback" || status === "for sale";
    }
    return true;
  });
  
  if (animals.length === 0) {
    preview.innerHTML = '<p class="text-gray-500 text-sm">No animals found matching filter.</p>';
    return;
  }
  
  var sizes = {
    small: { box: 100, qr: 60, font: 9 },
    medium: { box: 140, qr: 100, font: 11 },
    large: { box: 180, qr: 140, font: 13 }
  };
  var s = sizes[size];
  
  var html = '<div id="qrPrintArea" class="flex flex-wrap gap-2">';
  
  animals.forEach(function(animal) {
    var animalId = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var animalName = animal["ANIMAL NAME"] || "";
    var scanUrl = "https://app.therackapp.io?code=" + encodeURIComponent(state.sheetId) + "&animal=" + encodeURIComponent(animalId);
    var qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=" + s.qr + "x" + s.qr + "&data=" + encodeURIComponent(scanUrl);
    
    html += '<div class="qr-label bg-white border border-gray-300 rounded p-2 text-center" style="width:' + s.box + 'px;">';
    html += '<img src="' + qrImageUrl + '" alt="QR" style="width:' + s.qr + 'px; height:' + s.qr + 'px; margin: 0 auto; display: block;">';
    html += '<div class="font-bold truncate" style="font-size:' + s.font + 'px; margin-top: 4px;">' + escapeHtml(animalName) + '</div>';
    html += '<div class="text-gray-500 mono truncate" style="font-size:' + (s.font - 2) + 'px;">' + escapeHtml(animalId) + '</div>';
    html += '</div>';
  });
  
  html += '</div>';
  preview.innerHTML = html;
}

function printQRCodes() {
  var printContent = document.getElementById("qrPrintArea").innerHTML;
  var printWindow = window.open('', '_blank');
  printWindow.document.write('<html><head><title>QR Codes</title>');
  printWindow.document.write('<style>');
  printWindow.document.write('body { font-family: Inter, sans-serif; margin: 20px; }');
  printWindow.document.write('.flex { display: flex; flex-wrap: wrap; gap: 8px; }');
  printWindow.document.write('.qr-label { background: white; border: 1px solid #ccc; border-radius: 4px; padding: 8px; text-align: center; }');
  printWindow.document.write('.font-bold { font-weight: bold; }');
  printWindow.document.write('.text-gray-500 { color: #6b7280; }');
  printWindow.document.write('.mono { font-family: monospace; }');
  printWindow.document.write('.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }');
  printWindow.document.write('</style></head><body>');
  printWindow.document.write(printContent);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}


// ============ BIN TAG GENERATOR ============
var binTagSelectedAnimals = [];

function openBinTagGenerator() {
  if (!state.isLoggedIn) {
    setStatus("Please log in first", true);
    return;
  }
  binTagSelectedAnimals = [];
  document.getElementById("binTagModal").classList.remove("hidden");
  updateBinTagAnimalList();
  updateBinTagPreview();
}

function closeBinTagModal() {
  document.getElementById("binTagModal").classList.add("hidden");
}

function updateBinTagAnimalList() {
  var filter = document.getElementById("binTagAnimalSelect").value;
  var listEl = document.getElementById("binTagAnimalList");
  
  var animals = state.data.collection.filter(function(r) {
    var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
    var status = (r.STATUS || "").toLowerCase().trim();
    if (!id) return false;
    
    if (filter === "breeders") {
      return status === "breeder" || status === "on loan";
    } else if (filter === "hatchlings") {
      return status === "listed" || status === "unlisted" || status === "holdback" || status === "for sale";
    }
    return true;
  });
  
  if (animals.length === 0) {
    listEl.innerHTML = '<p class="text-gray-500 text-sm">No animals found.</p>';
    return;
  }
  
  var html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">';
  animals.forEach(function(animal) {
    var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var name = animal["ANIMAL NAME"] || "";
    var display = name ? name + " (" + id + ")" : id;
    var checked = binTagSelectedAnimals.indexOf(id) >= 0 ? "checked" : "";
    
    html += '<label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">';
    html += '<input type="checkbox" value="' + escapeHtml(id) + '" onchange="toggleBinTagAnimal(this)" ' + checked + ' class="rounded">';
    html += '<span class="truncate">' + escapeHtml(display) + '</span>';
    html += '</label>';
  });
  html += '</div>';
  
  listEl.innerHTML = html;
  updateBinTagSelectedCount();
}

function toggleBinTagAnimal(checkbox) {
  var id = checkbox.value;
  if (checkbox.checked) {
    if (binTagSelectedAnimals.indexOf(id) < 0) {
      binTagSelectedAnimals.push(id);
    }
  } else {
    var idx = binTagSelectedAnimals.indexOf(id);
    if (idx >= 0) {
      binTagSelectedAnimals.splice(idx, 1);
    }
  }
  updateBinTagSelectedCount();
  updateBinTagPreview();
}

function selectAllBinTagAnimals() {
  var checkboxes = document.querySelectorAll('#binTagAnimalList input[type="checkbox"]');
  binTagSelectedAnimals = [];
  checkboxes.forEach(function(cb) {
    cb.checked = true;
    binTagSelectedAnimals.push(cb.value);
  });
  updateBinTagSelectedCount();
  updateBinTagPreview();
}

function deselectAllBinTagAnimals() {
  var checkboxes = document.querySelectorAll('#binTagAnimalList input[type="checkbox"]');
  checkboxes.forEach(function(cb) {
    cb.checked = false;
  });
  binTagSelectedAnimals = [];
  updateBinTagSelectedCount();
  updateBinTagPreview();
}

function updateBinTagSelectedCount() {
  document.getElementById("binTagSelectedCount").textContent = binTagSelectedAnimals.length;
}

function updateBinTagPreview() {
  var preview = document.getElementById("binTagPreview");
  
  var animalsToShow = [];
  if (binTagSelectedAnimals.length > 0) {
    animalsToShow = state.data.collection.filter(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      return binTagSelectedAnimals.indexOf(id) >= 0;
    });
  } else {
    var filter = document.getElementById("binTagAnimalSelect").value;
    animalsToShow = state.data.collection.filter(function(r) {
      var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
      var status = (r.STATUS || "").toLowerCase().trim();
      if (!id) return false;
      if (filter === "breeders") return status === "breeder" || status === "on loan";
      if (filter === "hatchlings") return status === "listed" || status === "unlisted" || status === "holdback";
      return true;
    }).slice(0, 3);
  }
  
  if (animalsToShow.length === 0) {
    preview.innerHTML = '<p class="text-gray-500 text-sm">No animals to preview.</p>';
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  var html = '<div class="flex flex-wrap gap-4">';
  animalsToShow.forEach(function(animal) {
    html += buildBinTagPreview(animal, businessName, logoUrl);
  });
  html += '</div>';
  
  if (binTagSelectedAnimals.length === 0) {
    html += '<p class="text-gray-400 text-xs mt-4">Showing first 3 animals as sample.</p>';
  }
  
  preview.innerHTML = html;
}

function buildBinTagPreview(animal, businessName, logoUrl) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = (animal["ANIMAL NAME"] || "").toUpperCase();
  var displayName = name || id.toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear());
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  // New design - 3.18in x 1.93in at 96dpi = 305px x 185px
  var html = '<div style="width:305px; height:185px; border:2px solid #000; background:#fff; box-sizing:border-box; overflow:hidden; display:flex; flex-direction:column;">';
  
  // ROW 1 - Logo | Sex+ID | QR (47% height)
  html += '<div style="display:flex; height:47%; border-bottom:2px solid #000;">';
  
  // Logo (32%)
  html += '<div style="width:32%; background:#000; display:flex; justify-content:center; align-items:center; border-right:2px solid #000;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:85%; max-height:85%; object-fit:contain;">';
  } else {
    html += '<div style="font-family:Norwester,sans-serif; font-size:8pt; color:#fff; text-align:center; padding:5px;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Sex + ID (38%) - positioned at bottom
  html += '<div style="width:38%; background:#fff; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:8px; border-right:2px solid #000; box-sizing:border-box;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:17pt; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:7pt; font-weight:400; color:#000; margin-top:2px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // QR (30%)
  html += '<div style="width:30%; background:#fff; display:flex; justify-content:center; align-items:center;">';
  html += '<img src="' + qrUrl + '" style="width:80%; height:80%; object-fit:contain;">';
  html += '</div>';
  
  html += '</div>';
  
  // BOTTOM SECTION - Left (Name + Genetics) | Right (INFO + Year + Breeder)
  html += '<div style="display:flex; flex:1;">';
  
  // Left column (70%)
  html += '<div style="width:70%; display:flex; flex-direction:column; border-right:2px solid #000;">';
  
  // Name (40% of bottom)
  html += '<div style="height:40%; background:#fff; display:flex; justify-content:center; align-items:center; border-bottom:2px solid #000;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:20pt; color:#000; letter-spacing:1px;">' + escapeHtml(displayName) + '</div>';
  html += '</div>';
  
  // Genetics (60% of bottom)
  html += '<div style="flex:1; background:#fff; display:flex; justify-content:center; align-items:center; padding:6px; text-align:center; box-sizing:border-box;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:9pt; font-weight:500; color:#000; line-height:1.3;">' + escapeHtml(genetics) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Right column (30%)
  html += '<div style="width:30%; display:flex; flex-direction:column;">';
  
  // INFO (30% of bottom section)
  html += '<div style="height:30%; background:#000; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:13pt; font-weight:bold; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</div>';
  
  // Year Born (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">YEAR BORN:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + yearBorn + '</div>';
  html += '</div>';
  
  // Breeder (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">BREEDER:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + escapeHtml(breederSource) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  return html;
}


// ============ PRINT BIN TAGS (HTML) ============
function printBinTags() {
  var btn = document.getElementById("binTagDownloadBtn");
  btn.textContent = "Generating...";
  btn.disabled = true;
  
  var animalsToInclude = getAnimalsToInclude();
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    btn.textContent = "Print";
    btn.disabled = false;
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  printBinTagsHTML(animalsToInclude, businessName, logoUrl);
  
  btn.textContent = "Print";
  btn.disabled = false;
}

function printSingleBinTag(animal) {
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  printBinTagsHTML([animal], businessName, logoUrl);
}

function printBinTagsHTML(animals, businessName, logoUrl) {
  var printWindow = window.open('', '_blank');
  
  var html = '<!DOCTYPE html><html><head><title>Bin Tags</title>';
  html += '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">';
  html += '<link href="https://fonts.cdnfonts.com/css/norwester" rel="stylesheet">';
  html += '<style>';
  
  // Page setup - be explicit about no margins anywhere
  html += '@page { size: 3.38in 2.13in; margin: 0 !important; padding: 0 !important; }';
  html += '* { box-sizing: border-box; margin: 0; padding: 0; }';
  html += 'html, body { margin: 0 !important; padding: 0 !important; width: 3.38in; height: 2.13in; overflow: visible; }';
  html += '.bin-tag-page { width: 3.38in; height: 2.13in; page-break-after: always; overflow: visible; }';
  html += '.bin-tag-page:last-child { page-break-after: avoid; }';
  
  // Print media query
  html += '@media print {';
  html += '  @page { margin: 0 !important; }';
  html += '  html, body { margin: 0 !important; padding: 0 !important; width: 3.38in; height: 2.13in; overflow: visible; -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
  html += '  .bin-tag-page { width: 3.38in; height: 2.13in; overflow: visible; page-break-inside: avoid; }';
  html += '}';
  
  html += '</style></head><body>';
  
  animals.forEach(function(animal) {
    html += '<div class="bin-tag-page">';
    html += buildBinTagForPrint(animal, businessName, logoUrl);
    html += '</div>';
  });
  
  html += '</body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(function() {
    printWindow.print();
  }, 1000);
}

// Print multiple bin tags per page (letter size paper)
function printBinTagsMultiple() {
  var animalsToInclude = getAnimalsToInclude();
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  var printWindow = window.open('', '_blank');
  
  var html = '<!DOCTYPE html><html><head><title>Bin Tags - Multiple Per Page</title>';
  html += '<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">';
  html += '<link href="https://fonts.cdnfonts.com/css/norwester" rel="stylesheet">';
  html += '<style>';
  
  // Letter size page setup
  html += '@page { size: letter; margin: 0.25in; }';
  html += '* { box-sizing: border-box; margin: 0; padding: 0; }';
  html += 'html, body { margin: 0; padding: 0; }';
  html += '.page { width: 8in; padding: 0.25in; display: flex; flex-wrap: wrap; gap: 0.125in; align-content: flex-start; page-break-after: always; }';
  html += '.page:last-child { page-break-after: avoid; }';
  html += '.bin-tag-wrapper { width: 3.38in; height: 2.13in; flex-shrink: 0; }';
  
  // Print media query
  html += '@media print {';
  html += '  @page { margin: 0.25in; }';
  html += '  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }';
  html += '  .page { page-break-inside: avoid; }';
  html += '}';
  
  html += '</style></head><body>';
  
  // Calculate tags per page (2 columns x 4 rows = 8 tags per letter page)
  var tagsPerPage = 8;
  var totalPages = Math.ceil(animalsToInclude.length / tagsPerPage);
  
  for (var page = 0; page < totalPages; page++) {
    html += '<div class="page">';
    var startIdx = page * tagsPerPage;
    var endIdx = Math.min(startIdx + tagsPerPage, animalsToInclude.length);
    
    for (var i = startIdx; i < endIdx; i++) {
      html += '<div class="bin-tag-wrapper">';
      html += buildBinTagPrint(animalsToInclude[i], businessName, logoUrl);
      html += '</div>';
    }
    html += '</div>';
  }
  
  html += '</body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(function() {
    printWindow.print();
  }, 1000);
}

// Dedicated function for print - uses inch dimensions
// Card stock: 3.38in x 2.13in
// Bleed margin: 0.10in on each side
// Actual tag: 3.18in x 1.93in
function buildBinTagForPrint(animal, businessName, logoUrl) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = (animal["ANIMAL NAME"] || "").toUpperCase();
  var displayName = name || id.toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear());
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  // Outer wrapper - card stock size
  var html = '<div style="width:3.38in; height:2.13in; position:relative; box-sizing:border-box;">';
  
  // Actual tag: 3.18in x 1.93in with 0.10in bleed margin
  html += '<div style="position:absolute; left:0.10in; top:0.10in; width:3.18in; height:1.93in; border:2px solid #000; background:#fff; box-sizing:border-box; overflow:hidden; display:flex; flex-direction:column;">';
  
  // ROW 1 - Logo | Sex+ID | QR (47% height)
  html += '<div style="display:flex; height:47%; border-bottom:2px solid #000;">';
  
  // Logo (32%)
  html += '<div style="width:32%; background:#000; display:flex; justify-content:center; align-items:center; border-right:2px solid #000;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:85%; max-height:85%; object-fit:contain;">';
  } else {
    html += '<div style="font-family:Norwester,sans-serif; font-size:8pt; color:#fff; text-align:center; padding:5px;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Sex + ID (38%) - positioned at bottom
  html += '<div style="width:38%; background:#fff; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:8px; border-right:2px solid #000; box-sizing:border-box;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:17pt; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:7pt; font-weight:400; color:#000; margin-top:2px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // QR (30%)
  html += '<div style="width:30%; background:#fff; display:flex; justify-content:center; align-items:center;">';
  html += '<img src="' + qrUrl + '" style="width:80%; height:80%; object-fit:contain;">';
  html += '</div>';
  
  html += '</div>';
  
  // BOTTOM SECTION - Left (Name + Genetics) | Right (INFO + Year + Breeder)
  html += '<div style="display:flex; flex:1;">';
  
  // Left column (70%)
  html += '<div style="width:70%; display:flex; flex-direction:column; border-right:2px solid #000;">';
  
  // Name (40% of bottom)
  html += '<div style="height:40%; background:#fff; display:flex; justify-content:center; align-items:center; border-bottom:2px solid #000;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:20pt; color:#000; letter-spacing:1px;">' + escapeHtml(displayName) + '</div>';
  html += '</div>';
  
  // Genetics (60% of bottom)
  html += '<div style="flex:1; background:#fff; display:flex; justify-content:center; align-items:center; padding:6px; text-align:center; box-sizing:border-box;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:9pt; font-weight:500; color:#000; line-height:1.3;">' + escapeHtml(genetics) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Right column (30%)
  html += '<div style="width:30%; display:flex; flex-direction:column;">';
  
  // INFO (30% of bottom section)
  html += '<div style="height:30%; background:#000; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:13pt; font-weight:bold; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</div>';
  
  // Year Born (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">YEAR BORN:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + yearBorn + '</div>';
  html += '</div>';
  
  // Breeder (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">BREEDER:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + escapeHtml(breederSource) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>'; // Close inner tag
  html += '</div>'; // Close outer wrapper
  
  return html;
}

function buildBinTagPrint(animal, businessName, logoUrl) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = (animal["ANIMAL NAME"] || "").toUpperCase();
  var displayName = name || id.toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear());
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  // New design - matches buildBinTagPreview and buildBinTagForPrint
  var html = '<div class="bin-tag" style="width:3.38in; height:2.13in; border:2px solid #000; background:#fff; box-sizing:border-box; overflow:hidden; display:flex; flex-direction:column;">';
  
  // ROW 1 - Logo | Sex+ID | QR (47% height)
  html += '<div style="display:flex; height:47%; border-bottom:2px solid #000;">';
  
  // Logo (32%)
  html += '<div style="width:32%; background:#000; display:flex; justify-content:center; align-items:center; border-right:2px solid #000;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:85%; max-height:85%; object-fit:contain;">';
  } else {
    html += '<div style="font-family:Norwester,sans-serif; font-size:8pt; color:#fff; text-align:center; padding:5px;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Sex + ID (38%) - positioned at bottom
  html += '<div style="width:38%; background:#fff; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding-bottom:8px; border-right:2px solid #000; box-sizing:border-box;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:17pt; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:7pt; font-weight:400; color:#000; margin-top:2px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // QR (30%)
  html += '<div style="width:30%; background:#fff; display:flex; justify-content:center; align-items:center;">';
  html += '<img src="' + qrUrl + '" style="width:80%; height:80%; object-fit:contain;">';
  html += '</div>';
  
  html += '</div>';
  
  // BOTTOM SECTION - Left (Name + Genetics) | Right (INFO + Year + Breeder)
  html += '<div style="display:flex; flex:1;">';
  
  // Left column (70%)
  html += '<div style="width:70%; display:flex; flex-direction:column; border-right:2px solid #000;">';
  
  // Name (40% of bottom)
  html += '<div style="height:40%; background:#fff; display:flex; justify-content:center; align-items:center; border-bottom:2px solid #000;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:20pt; color:#000; letter-spacing:1px;">' + escapeHtml(displayName) + '</div>';
  html += '</div>';
  
  // Genetics (60% of bottom)
  html += '<div style="flex:1; background:#fff; display:flex; justify-content:center; align-items:center; padding:6px; text-align:center; box-sizing:border-box;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:9pt; font-weight:500; color:#000; line-height:1.3;">' + escapeHtml(genetics) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Right column (30%)
  html += '<div style="width:30%; display:flex; flex-direction:column;">';
  
  // INFO (30% of bottom section)
  html += '<div style="height:30%; background:#000; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:13pt; font-weight:bold; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</div>';
  
  // Year Born (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">YEAR BORN:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + yearBorn + '</div>';
  html += '</div>';
  
  // Breeder (half of remaining)
  html += '<div style="flex:1; background:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:700; color:#000;">BREEDER:</div>';
  html += '<div style="font-family:Montserrat,sans-serif; font-size:5.5pt; font-weight:400; color:#000; margin-top:1px;">' + escapeHtml(breederSource) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  return html;
}
// ============ HELPER ============
function getAnimalsToInclude() {
  if (binTagSelectedAnimals.length > 0) {
    return state.data.collection.filter(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      return binTagSelectedAnimals.indexOf(id) >= 0;
    });
  }
  
  var filter = document.getElementById("binTagAnimalSelect").value;
  return state.data.collection.filter(function(r) {
    var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
    var status = (r.STATUS || "").toLowerCase().trim();
    if (!id) return false;
    if (filter === "breeders") return status === "breeder" || status === "on loan";
    if (filter === "hatchlings") return status === "listed" || status === "unlisted" || status === "holdback";
    return true;
  });
}
