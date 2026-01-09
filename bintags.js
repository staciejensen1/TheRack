/*
 * THE RACK - QR Codes & Bin Tags
 * Version: 2.12.3
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.3: Fixed bin tag layout to match final approved design:
 *           Row 1 (47%): Logo 25% | Sex+ID 45% | QR 30%
 *           Row 2 (15%): Name 70% | INFO 30%
 *           Row 3 (38%): Genetics 70% | Year+Breeder 30%
 *           Right column all 30% for vertical alignment
 *           Info boxes have NO black background, just thin 1px borders
 * - 2.12.2: Added downloadBinTagsPDFFile() for proper PDF generation at card stock size (3.38" x 2.13")
 * - 2.12.0: Split from monolithic index.html
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
  
  // Filter animals - include all with any ID
  var animals = state.data.collection.filter(function(r) {
    var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
    var status = (r.STATUS || "").toLowerCase().trim();
    if (!id) return false;
    
    if (filter === "breeders") {
      return status === "breeder" || status === "on loan";
    } else if (filter === "hatchlings") {
      return status === "listed" || status === "unlisted" || status === "holdback" || status === "for sale";
    }
    return true; // all
  });
  
  if (animals.length === 0) {
    preview.innerHTML = '<p class="text-gray-500 text-sm">No animals found matching filter. Make sure animals have a STATUS set.</p>';
    return;
  }
  
  // Size settings
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
    html += '<img src="' + qrImageUrl + '" alt="QR" style="width:' + s.qr + 'px; height:' + s.qr + 'px; margin: 0 auto; display: block;" />';
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
  printWindow.document.write('<html><head><title>QR Codes - The Rack</title>');
  printWindow.document.write('<style>');
  printWindow.document.write('body { font-family: Inter, system-ui, sans-serif; margin: 20px; }');
  printWindow.document.write('.flex { display: flex; flex-wrap: wrap; gap: 8px; }');
  printWindow.document.write('.qr-label { background: white; border: 1px solid #ccc; border-radius: 4px; padding: 8px; text-align: center; page-break-inside: avoid; }');
  printWindow.document.write('.mx-auto { margin-left: auto; margin-right: auto; display: block; }');
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
  animals.forEach(function(animal, idx) {
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
  
  // Get animals to preview
  var animalsToShow = [];
  if (binTagSelectedAnimals.length > 0) {
    animalsToShow = state.data.collection.filter(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      return binTagSelectedAnimals.indexOf(id) >= 0;
    });
  } else {
    // Show first 3 as sample
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
    preview.innerHTML = '<p class="text-gray-500 text-sm">No animals to preview. Select some animals above.</p>';
    return;
  }
  
  // Card size: 3.38" x 2.13" = 324px x 204px at 96dpi
  var dims = { w: 324, h: 204 };
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO URL"] || "";
  
  var html = '<div class="flex flex-wrap gap-4">';
  
  animalsToShow.forEach(function(animal) {
    html += renderBinTagPreview(animal, dims, businessName, logoUrl);
  });
  
  html += '</div>';
  
  if (binTagSelectedAnimals.length === 0) {
    html += '<p class="text-gray-400 text-xs mt-4">Showing first 3 animals as sample. Select specific animals above or print all.</p>';
  }
  
  preview.innerHTML = html;
}

function renderBinTagPreview(animal, dims, businessName, logoUrl) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = animal["ANIMAL NAME"] || "";
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = animal["BREEDER SOURCE"] || "";
  
  // Parse year from DOB (last 2 digits)
  var yearBorn = "";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear()).slice(-2);
  }
  
  // QR code URL
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  // Build the tag HTML matching Canva design exactly
  // Card dimensions: 3.38" x 2.13" = 324.48px x 204.48px at 96dpi
  // Using Norwester font for headlines, Inter for body
  var html = '<div class="bin-tag-preview" style="width:' + dims.w + 'px; height:' + dims.h + 'px; font-family: Inter, system-ui, sans-serif; border: 1px solid #000; box-sizing: border-box; overflow: hidden; background: #fff;">';
  
  // ROW 1: Logo (25%) | Sex+ID (45%) | QR (30%) - 47% height
  html += '<div style="display: flex; height: 47%; border-bottom: 1px solid #000;">';
  
  // Left: Logo section (black background, 25% width)
  html += '<div style="width: 25%; background: #000; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4px;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width: 90%; max-height: 90%; object-fit: contain;" alt="Logo">';
  } else {
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; text-align: center; letter-spacing: 0.5px; line-height: 1.2;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Center: Sex + ID (white background, 45% width)
  html += '<div style="width: 45%; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 4px; border-left: 1px solid #000; border-right: 1px solid #000;">';
  html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 24px; font-weight: 400; color: #000; letter-spacing: 2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 12px; font-weight: 400; color: #000; margin-top: 2px; letter-spacing: 1px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // Right: QR code (white background, 30% width)
  html += '<div style="width: 30%; background: #fff; display: flex; justify-content: center; align-items: center; padding: 4px;">';
  html += '<img src="' + qrUrl + '" style="width: 90%; height: 90%; object-fit: contain;" alt="QR">';
  html += '</div>';
  
  html += '</div>';
  
  // ROW 2: Animal Name (70%) | INFO header (30%) - 15% height
  html += '<div style="display: flex; height: 15%; border-bottom: 1px solid #000;">';
  html += '<div style="width: 70%; background: #fff; display: flex; justify-content: center; align-items: center; border-right: 1px solid #000;">';
  html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 22px; font-weight: 400; color: #000; letter-spacing: 1px;">' + escapeHtml(name || "UNNAMED") + '</div>';
  html += '</div>';
  html += '<div style="width: 30%; background: #000; display: flex; justify-content: center; align-items: center;">';
  html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 12px; font-weight: 400; color: #fff; letter-spacing: 2px;">INFO</div>';
  html += '</div>';
  html += '</div>';
  
  // ROW 3: Genetics (70%) | Year Born + Breeder boxes (30%) - 38% height
  html += '<div style="display: flex; height: 38%;">';
  
  // Left: Genetics (white background, 70%)
  html += '<div style="width: 70%; background: #fff; display: flex; justify-content: center; align-items: center; padding: 6px; text-align: center; border-right: 1px solid #000;">';
  html += '<div style="font-size: 11px; font-weight: 500; line-height: 1.25; color: #000;">' + escapeHtml(genetics || "No genetics listed") + '</div>';
  html += '</div>';
  
  // Right: Info boxes (white background, 30% - thin 1px borders only, NO black background)
  html += '<div style="width: 30%; background: #fff; display: flex; flex-direction: column;">';
  
  // Year Born box (thin 1px border on bottom only)
  html += '<div style="flex: 1; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border-bottom: 1px solid #000;">';
  html += '<div style="font-size: 7px; font-weight: 700; color: #000; letter-spacing: 0.5px;">YEAR BORN:</div>';
  html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 16px; font-weight: 400; color: #000;">' + (yearBorn || "--") + '</div>';
  html += '</div>';
  
  // Breeder box (no extra borders needed)
  html += '<div style="flex: 1; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">';
  html += '<div style="font-size: 7px; font-weight: 700; color: #000; letter-spacing: 0.5px;">BREEDER:</div>';
  html += '<div style="font-size: 8px; font-weight: 600; color: #000; line-height: 1.1; overflow: hidden;">' + escapeHtml(breederSource || "--").toUpperCase() + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function downloadBinTagsPDF() {
  var btn = document.getElementById("binTagDownloadBtn");
  btn.textContent = "Generating...";
  btn.disabled = true;
  
  // Get animals to include
  var animalsToInclude = [];
  if (binTagSelectedAnimals.length > 0) {
    animalsToInclude = state.data.collection.filter(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      return binTagSelectedAnimals.indexOf(id) >= 0;
    });
  } else {
    var filter = document.getElementById("binTagAnimalSelect").value;
    animalsToInclude = state.data.collection.filter(function(r) {
      var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
      var status = (r.STATUS || "").toLowerCase().trim();
      if (!id) return false;
      if (filter === "breeders") return status === "breeder" || status === "on loan";
      if (filter === "hatchlings") return status === "listed" || status === "unlisted" || status === "holdback";
      return true;
    });
  }
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    btn.textContent = "Print Tags";
    btn.disabled = false;
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO URL"] || "";
  
  printBinTags(animalsToInclude, businessName, logoUrl);
  
  btn.textContent = "Print Tags";
  btn.disabled = false;
}

function printSingleBinTag(animal) {
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO URL"] || "";
  printBinTags([animal], businessName, logoUrl);
}

function printBinTags(animals, businessName, logoUrl) {
  // Card size: 3.38" x 2.13"
  var printWindow = window.open('', '_blank');
  
  var html = '<!DOCTYPE html><html><head><title>Bin Tags - The Rack</title>';
  html += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">';
  html += '<link href="https://fonts.cdnfonts.com/css/norwester" rel="stylesheet">';
  html += '<style>';
  html += '@page { size: 3.38in 2.13in; margin: 0; }';
  html += 'body { font-family: Inter, system-ui, sans-serif; margin: 0; padding: 0; }';
  html += '.bin-tag { width: 3.38in; height: 2.13in; page-break-after: always; box-sizing: border-box; overflow: hidden; border: 1px solid #000; background: #fff; }';
  html += '.bin-tag:last-child { page-break-after: avoid; }';
  html += '@media print { body { margin: 0; } }';
  html += '</style></head><body>';
  
  animals.forEach(function(animal) {
    var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var name = animal["ANIMAL NAME"] || "";
    var sex = (animal["SEX"] || "").toUpperCase();
    var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
    var genetics = animal["GENETIC SUMMARY"] || "";
    var dob = animal["DATE OF BIRTH"] || "";
    var breederSource = animal["BREEDER SOURCE"] || "";
    
    var yearBorn = "";
    if (dob) {
      var d = parseDate(dob);
      if (d) yearBorn = String(d.getFullYear()).slice(-2);
    }
    
    var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
    
    html += '<div class="bin-tag">';
    
    // ROW 1: Logo (25%) | Sex+ID (45%) | QR (30%) - 47% height
    html += '<div style="display: flex; height: 47%; border-bottom: 1px solid #000;">';
    
    // Left: Logo (black bg, 25%)
    html += '<div style="width: 25%; background: #000; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 3px;">';
    if (logoUrl) {
      html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width: 90%; max-height: 90%; object-fit: contain;" alt="Logo">';
    } else {
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 9px; font-weight: 400; text-align: center; letter-spacing: 0.5px; line-height: 1.2;">' + escapeHtml(businessName).toUpperCase() + '</div>';
    }
    html += '</div>';
    
    // Center: Sex + ID (white bg, 45%)
    html += '<div style="width: 45%; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 3px; border-left: 1px solid #000; border-right: 1px solid #000;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 20px; font-weight: 400; color: #000; letter-spacing: 2px;">' + escapeHtml(sexDisplay) + '</div>';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; color: #000; margin-top: 2px; letter-spacing: 1px;">' + escapeHtml(id) + '</div>';
    html += '</div>';
    
    // Right: QR (white bg, 30%)
    html += '<div style="width: 30%; background: #fff; display: flex; justify-content: center; align-items: center; padding: 3px;">';
    html += '<img src="' + qrUrl + '" style="width: 90%; height: 90%; object-fit: contain;" alt="QR">';
    html += '</div>';
    
    html += '</div>';
    
    // ROW 2: Animal Name (70%) | INFO header (30%) - 15% height
    html += '<div style="display: flex; height: 15%; border-bottom: 1px solid #000;">';
    html += '<div style="width: 70%; background: #fff; display: flex; justify-content: center; align-items: center; border-right: 1px solid #000;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 18px; font-weight: 400; color: #000; letter-spacing: 1px;">' + escapeHtml(name || "UNNAMED") + '</div>';
    html += '</div>';
    html += '<div style="width: 30%; background: #000; display: flex; justify-content: center; align-items: center;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; color: #fff; letter-spacing: 2px;">INFO</div>';
    html += '</div>';
    html += '</div>';
    
    // ROW 3: Genetics (70%) | Year Born + Breeder (30%) - 38% height
    html += '<div style="display: flex; height: 38%;">';
    
    // Left: Genetics (70%)
    html += '<div style="width: 70%; background: #fff; display: flex; justify-content: center; align-items: center; padding: 4px; text-align: center; border-right: 1px solid #000;">';
    html += '<div style="font-size: 9px; font-weight: 500; line-height: 1.2; color: #000;">' + escapeHtml(genetics || "No genetics listed") + '</div>';
    html += '</div>';
    
    // Right: Info boxes (30% - white background, thin 1px borders only)
    html += '<div style="width: 30%; background: #fff; display: flex; flex-direction: column;">';
    
    // Year Born box (thin 1px border on bottom only)
    html += '<div style="flex: 1; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; border-bottom: 1px solid #000;">';
    html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">YEAR BORN:</div>';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 14px; font-weight: 400; color: #000;">' + (yearBorn || "--") + '</div>';
    html += '</div>';
    
    // Breeder box (no extra borders)
    html += '<div style="flex: 1; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">';
    html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">BREEDER:</div>';
    html += '<div style="font-size: 7px; font-weight: 600; color: #000; line-height: 1.1;">' + escapeHtml(breederSource || "--").toUpperCase() + '</div>';
    html += '</div>';
    
    html += '</div>';
    
    html += '</div>';
    
    html += '</div>';
  });
  
  html += '</body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for images/fonts to load then print
  setTimeout(function() {
    printWindow.print();
  }, 1000);
}

// ============ BIN TAG PDF DOWNLOAD ============
function downloadBinTagsPDFFile() {
  var btn = document.getElementById("binTagPdfBtn");
  if (btn) {
    btn.textContent = "Generating PDF...";
    btn.disabled = true;
  }
  
  // Get animals to include
  var animalsToInclude = [];
  if (binTagSelectedAnimals.length > 0) {
    animalsToInclude = state.data.collection.filter(function(r) {
      var id = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "";
      return binTagSelectedAnimals.indexOf(id) >= 0;
    });
  } else {
    var filter = document.getElementById("binTagAnimalSelect").value;
    animalsToInclude = state.data.collection.filter(function(r) {
      var id = (r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || "").trim();
      var status = (r.STATUS || "").toLowerCase().trim();
      if (!id) return false;
      if (filter === "breeders") return status === "breeder" || status === "on loan";
      if (filter === "hatchlings") return status === "listed" || status === "unlisted" || status === "holdback";
      return true;
    });
  }
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    if (btn) {
      btn.textContent = "Download PDF";
      btn.disabled = false;
    }
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO URL"] || "";
  
  // Card size: 3.38" x 2.13" in points (72 points per inch)
  var cardWidthPt = 3.38 * 72;  // 243.36
  var cardHeightPt = 2.13 * 72; // 153.36
  
  // Create PDF with custom page size
  var doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [cardHeightPt, cardWidthPt]
  });
  
  var totalAnimals = animalsToInclude.length;
  var processed = 0;
  var qrImages = {};
  
  // First, load all QR code images
  var loadPromises = animalsToInclude.map(function(animal) {
    return new Promise(function(resolve) {
      var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
      var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
      
      var img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        qrImages[id] = canvas.toDataURL('image/png');
        resolve();
      };
      img.onerror = function() {
        qrImages[id] = null;
        resolve();
      };
      img.src = qrUrl;
    });
  });
  
  Promise.all(loadPromises).then(function() {
    // Now generate PDF pages
    animalsToInclude.forEach(function(animal, index) {
      if (index > 0) {
        doc.addPage([cardHeightPt, cardWidthPt], 'landscape');
      }
      
      var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
      var name = animal["ANIMAL NAME"] || "";
      var sex = (animal["SEX"] || "").toUpperCase();
      var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
      var genetics = animal["GENETIC SUMMARY"] || "";
      var dob = animal["DATE OF BIRTH"] || "";
      var breederSource = animal["BREEDER SOURCE"] || "";
      
      var yearBorn = "";
      if (dob) {
        var d = parseDate(dob);
        if (d) yearBorn = String(d.getFullYear()).slice(-2);
      }
      
      // Dimensions in points
      var w = cardWidthPt;
      var h = cardHeightPt;
      
      // Row heights
      var row1H = h * 0.47;
      var row2H = h * 0.15;
      var row3H = h * 0.38;
      
      // Column widths for row 1
      var col1W = w * 0.25;  // Logo
      var col2W = w * 0.45;  // Sex + ID
      var col3W = w * 0.30;  // QR
      
      // Column widths for rows 2 & 3
      var leftColW = w * 0.70;
      var rightColW = w * 0.30;
      
      // Draw border
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(0, 0, w, h);
      
      // ROW 1
      // Logo area (black background)
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, col1W, row1H, 'F');
      
      // Business name in logo area
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      var bizLines = doc.splitTextToSize(businessName.toUpperCase(), col1W - 6);
      var bizY = (row1H / 2) - ((bizLines.length * 9) / 2) + 7;
      bizLines.forEach(function(line, i) {
        doc.text(line, col1W / 2, bizY + (i * 9), { align: 'center' });
      });
      
      // Sex + ID area (white)
      doc.setDrawColor(0);
      doc.line(col1W, 0, col1W, row1H);
      doc.line(col1W + col2W, 0, col1W + col2W, row1H);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(sexDisplay, col1W + (col2W / 2), row1H * 0.4, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(id, col1W + (col2W / 2), row1H * 0.65, { align: 'center' });
      
      // QR code area
      var qrData = qrImages[id];
      if (qrData) {
        var qrSize = Math.min(col3W, row1H) * 0.85;
        var qrX = col1W + col2W + (col3W - qrSize) / 2;
        var qrY = (row1H - qrSize) / 2;
        doc.addImage(qrData, 'PNG', qrX, qrY, qrSize, qrSize);
      }
      
      // Row 1 bottom border
      doc.line(0, row1H, w, row1H);
      
      // ROW 2
      var row2Y = row1H;
      
      // Animal name area
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      var displayName = name || "UNNAMED";
      // Truncate if too long
      while (doc.getTextWidth(displayName) > leftColW - 10 && displayName.length > 3) {
        displayName = displayName.slice(0, -1);
      }
      doc.text(displayName, leftColW / 2, row2Y + (row2H / 2) + 5, { align: 'center' });
      
      // INFO header (black background)
      doc.setFillColor(0, 0, 0);
      doc.rect(leftColW, row2Y, rightColW, row2H, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text("INFO", leftColW + (rightColW / 2), row2Y + (row2H / 2) + 3, { align: 'center' });
      
      // Vertical divider
      doc.setDrawColor(0);
      doc.line(leftColW, row2Y, leftColW, row2Y + row2H);
      
      // Row 2 bottom border
      doc.line(0, row2Y + row2H, w, row2Y + row2H);
      
      // ROW 3
      var row3Y = row1H + row2H;
      
      // Genetics area
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      var geneticsText = genetics || "No genetics listed";
      var geneticsLines = doc.splitTextToSize(geneticsText, leftColW - 12);
      var geneticsStartY = row3Y + (row3H / 2) - ((geneticsLines.length * 10) / 2) + 5;
      geneticsLines.forEach(function(line, i) {
        doc.text(line, leftColW / 2, geneticsStartY + (i * 10), { align: 'center' });
      });
      
      // Right info column (white background, NO black - just thin borders)
      // Vertical divider between genetics and info column
      doc.setDrawColor(0);
      doc.line(leftColW, row3Y, leftColW, row3Y + row3H);
      
      // Year Born box (white with border on bottom only for divider)
      var infoBoxH = row3H / 2;
      var infoBoxW = rightColW;
      var infoBoxX = leftColW;
      var infoBox1Y = row3Y;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text("YEAR BORN:", infoBoxX + (infoBoxW / 2), infoBox1Y + 10, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(yearBorn || "--", infoBoxX + (infoBoxW / 2), infoBox1Y + infoBoxH - 4, { align: 'center' });
      
      // Horizontal divider between year born and breeder
      doc.line(leftColW, row3Y + infoBoxH, w, row3Y + infoBoxH);
      
      // Breeder box (white, no extra borders needed)
      var infoBox2Y = row3Y + infoBoxH;
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text("BREEDER:", infoBoxX + (infoBoxW / 2), infoBox2Y + 10, { align: 'center' });
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      var breederText = (breederSource || "--").toUpperCase();
      var breederLines = doc.splitTextToSize(breederText, infoBoxW - 8);
      if (breederLines.length > 2) breederLines = breederLines.slice(0, 2);
      var breederStartY = infoBox2Y + infoBoxH - 4 - ((breederLines.length - 1) * 7);
      breederLines.forEach(function(line, i) {
        doc.text(line, infoBoxX + (infoBoxW / 2), breederStartY + (i * 7), { align: 'center' });
      });
    });
    
    // Save the PDF
    var filename = "bin-tags-" + new Date().toISOString().split('T')[0] + ".pdf";
    doc.save(filename);
    
    if (btn) {
      btn.textContent = "Download PDF";
      btn.disabled = false;
    }
    setStatus("PDF downloaded: " + filename);
  });
}

