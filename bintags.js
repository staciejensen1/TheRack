/*
 * THE RACK - QR Codes & Bin Tags
 * Version: 2.12.21
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.21: Fixed PDF Row 2 centering - use line-height equal to row height for true centering
 * - 2.12.20: Fixed PDF Row 2 centering - correct padding calc for 18px name and 11px INFO
 * - 2.12.19: Increased Sex+ID top padding - PDF to 37px, HTML to 33px for card cutout clearance
 * - 2.12.18: PDF Row 2 uses explicit padding for vertical centering (html2canvas fix), HTML print centers on page
 * - 2.12.17: PDF now uses colgroup for consistent column widths, removed redundant inline widths
 * - 2.12.16: Print Tags now uses TABLE layout with colgroup for consistent 30% column width
 * - 2.12.15: PDF rewrite - use TABLE layout instead of flexbox for reliable rendering
 * - 2.12.14: PDF fix - Row 2 now matches preview exactly (simple flexbox, no extra props)
 * - 2.12.6: Fixed logo not appearing in PDF - preload and convert to base64 before rendering
 * - 2.12.5: PDF now renders HTML with html2canvas for proper Norwester font
 * - 2.12.4: Fixed Norwester font import in index.html (was missing)
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
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
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
  html += '<div style="width: 45%; background: #fff; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 4px; padding-top: 18px; border-left: 1px solid #000; border-right: 1px solid #000;">';
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
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  printBinTags(animalsToInclude, businessName, logoUrl);
  
  btn.textContent = "Print Tags";
  btn.disabled = false;
}

function printSingleBinTag(animal) {
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
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
  html += 'html, body { margin: 0; padding: 0; width: 3.38in; height: 2.13in; }';
  html += 'body { font-family: Inter, system-ui, sans-serif; display: flex; justify-content: center; align-items: center; }';
  html += '.bin-tag { width: 3.38in; height: 2.13in; page-break-after: always; box-sizing: border-box; overflow: hidden; border: 1px solid #000; background: #fff; margin: 0 auto; }';
  html += '.bin-tag:last-child { page-break-after: avoid; }';
  html += 'table { border-collapse: collapse; table-layout: fixed; }';
  html += '@media print { html, body { margin: 0; padding: 0; } .bin-tag { margin: 0; } }';
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
    html += '<table style="width: 100%; height: 100%;">';
    
    // Define column widths: 25% | 45% | 30%
    html += '<colgroup>';
    html += '<col style="width: 25%;">';
    html += '<col style="width: 45%;">';
    html += '<col style="width: 30%;">';
    html += '</colgroup>';
    
    // ROW 1: Logo | Sex+ID | QR - 47% height
    html += '<tr style="height: 47%;">';
    
    // Logo cell
    html += '<td style="background: #000; color: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px;">';
    if (logoUrl) {
      html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width: 90%; max-height: 85px; object-fit: contain;" alt="Logo">';
    } else {
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 9px; font-weight: 400; letter-spacing: 0.5px; line-height: 1.2;">' + escapeHtml(businessName).toUpperCase() + '</div>';
    }
    html += '</td>';
    
    // Sex + ID cell (with top padding for card cutout - ~0.35")
    html += '<td style="background: #fff; text-align: center; vertical-align: top; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; padding-top: 33px;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 20px; font-weight: 400; color: #000; letter-spacing: 2px;">' + escapeHtml(sexDisplay) + '</div>';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; color: #000; margin-top: 2px; letter-spacing: 1px;">' + escapeHtml(id) + '</div>';
    html += '</td>';
    
    // QR cell
    html += '<td style="background: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; padding: 4px;">';
    html += '<img src="' + qrUrl + '" style="width: 85%; height: auto; max-height: 85px;" alt="QR">';
    html += '</td>';
    
    html += '</tr>';
    
    // ROW 2: Name (spans 2 cols) | INFO - 15% height
    html += '<tr style="height: 15%;">';
    
    // Name cell spans first 2 columns
    html += '<td colspan="2" style="background: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; border-right: 1px solid #000;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 18px; font-weight: 400; color: #000; letter-spacing: 1px;">' + escapeHtml(name || "UNNAMED").toUpperCase() + '</div>';
    html += '</td>';
    
    // INFO cell
    html += '<td style="background: #000; text-align: center; vertical-align: middle; border-bottom: 1px solid #000;">';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; color: #fff; letter-spacing: 2px;">INFO</div>';
    html += '</td>';
    
    html += '</tr>';
    
    // ROW 3: Genetics (spans 2 cols) | Year+Breeder - 38% height
    html += '<tr style="height: 38%;">';
    
    // Genetics cell spans first 2 columns
    html += '<td colspan="2" style="background: #fff; text-align: center; vertical-align: middle; border-right: 1px solid #000; padding: 4px;">';
    html += '<div style="font-size: 9px; font-weight: 500; line-height: 1.3; color: #000;">' + escapeHtml(genetics || "No genetics listed") + '</div>';
    html += '</td>';
    
    // Year + Breeder cell (nested table for split)
    html += '<td style="background: #fff; padding: 0; vertical-align: top;">';
    html += '<table style="width: 100%; height: 100%;">';
    
    // Year Born row
    html += '<tr style="height: 50%;">';
    html += '<td style="text-align: center; vertical-align: middle; border-bottom: 1px solid #000; padding: 2px;">';
    html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">YEAR BORN:</div>';
    html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 14px; font-weight: 400; color: #000;">' + (yearBorn || "--") + '</div>';
    html += '</td>';
    html += '</tr>';
    
    // Breeder row
    html += '<tr style="height: 50%;">';
    html += '<td style="text-align: center; vertical-align: middle; padding: 2px;">';
    html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">BREEDER:</div>';
    html += '<div style="font-size: 7px; font-weight: 600; color: #000; line-height: 1.1;">' + escapeHtml(breederSource || "--").toUpperCase() + '</div>';
    html += '</td>';
    html += '</tr>';
    
    html += '</table>';
    html += '</td>';
    
    html += '</tr>';
    
    html += '</table>';
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
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  // Card size at screen resolution (96 DPI) - html2canvas will scale up
  var cardWidthPx = 325;   // ~3.38" at 96 DPI
  var cardHeightPx = 205;  // ~2.13" at 96 DPI
  var cardWidthPt = 3.38 * 72;   // 243.36pt for PDF
  var cardHeightPt = 2.13 * 72;  // 153.36pt for PDF
  
  // Pre-load logo image and convert to base64 for PDF rendering
  var logoBase64 = null;
  
  function startPDFGeneration() {
    // Create a hidden container for rendering
    var container = document.createElement('div');
    container.style.cssText = 'position: absolute; left: -9999px; top: 0;';
    document.body.appendChild(container);
    
    // Create PDF
    var doc = new jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [cardHeightPt, cardWidthPt]
    });
    
    var totalAnimals = animalsToInclude.length;
    var currentIndex = 0;
    
    // Process animals one at a time
    function processNextAnimal() {
      if (currentIndex >= totalAnimals) {
        // All done - save PDF
        document.body.removeChild(container);
        var filename = "bin-tags-" + new Date().toISOString().split('T')[0] + ".pdf";
        doc.save(filename);
        if (btn) {
          btn.textContent = "Download PDF";
          btn.disabled = false;
        }
        setStatus("PDF downloaded: " + filename);
        return;
      }
      
      var animal = animalsToInclude[currentIndex];
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
      
      var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
      
      // Create the bin tag HTML at screen resolution using TABLE for reliable rendering
      var tagDiv = document.createElement('div');
      tagDiv.style.cssText = 'width: ' + cardWidthPx + 'px; height: ' + cardHeightPx + 'px; background: #fff; font-family: Norwester, Inter, sans-serif; box-sizing: border-box; border: 1px solid #000; overflow: hidden;';
      
      var row1Height = Math.round(cardHeightPx * 0.47);
      var row2Height = Math.round(cardHeightPx * 0.15);
      var row3Height = cardHeightPx - row1Height - row2Height - 2; // -2 for borders
      
      var html = '<table style="width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed;">';
      
      // Define column widths explicitly
      html += '<colgroup>';
      html += '<col style="width: 25%;">';
      html += '<col style="width: 45%;">';
      html += '<col style="width: 30%;">';
      html += '</colgroup>';
      
      // ROW 1: Logo (25%) | Sex+ID (45%) | QR (30%)
      html += '<tr style="height: ' + row1Height + 'px;">';
      
      // Logo cell
      html += '<td style="background: #000; color: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px;">';
      if (logoBase64) {
        html += '<img src="' + logoBase64 + '" style="max-width: 90%; max-height: ' + (row1Height - 10) + 'px; object-fit: contain;">';
      } else if (logoUrl) {
        html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width: 90%; max-height: ' + (row1Height - 10) + 'px; object-fit: contain;">';
      } else {
        html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; letter-spacing: 0.5px; line-height: 1.2;">' + escapeHtml(businessName).toUpperCase() + '</div>';
      }
      html += '</td>';
      
      // Sex + ID cell (with top padding for card cutout - ~0.38")
      html += '<td style="background: #fff; text-align: center; vertical-align: top; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; padding-top: 37px;">';
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 20px; font-weight: 400; color: #000; letter-spacing: 2px;">' + escapeHtml(sexDisplay) + '</div>';
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 10px; font-weight: 400; color: #000; margin-top: 2px; letter-spacing: 1px;">' + escapeHtml(id) + '</div>';
      html += '</td>';
      
      // QR cell
      html += '<td style="background: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; padding: 4px;">';
      html += '<img src="' + qrUrl + '" style="width: 85%; height: auto; max-height: ' + (row1Height - 10) + 'px;">';
      html += '</td>';
      
      html += '</tr>';
      
      // ROW 2: Name (70%) | INFO (30%)
      // Use line-height equal to row height for true vertical centering
      html += '<tr style="height: ' + row2Height + 'px;">';
      
      // Name cell - spans first 2 columns
      html += '<td colspan="2" style="background: #fff; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 0; height: ' + row2Height + 'px;">';
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 18px; font-weight: 400; color: #000; letter-spacing: 1px; line-height: ' + row2Height + 'px; margin: 0;">' + escapeHtml(name || "UNNAMED").toUpperCase() + '</div>';
      html += '</td>';
      
      // INFO cell
      html += '<td style="background: #000; text-align: center; vertical-align: middle; border-bottom: 1px solid #000; padding: 0; height: ' + row2Height + 'px;">';
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 11px; font-weight: 400; color: #fff; letter-spacing: 2px; line-height: ' + row2Height + 'px; margin: 0;">INFO</div>';
      html += '</td>';
      
      html += '</tr>';
      
      // ROW 3: Genetics (70%) | Year+Breeder (30%)
      html += '<tr style="height: ' + row3Height + 'px;">';
      
      // Genetics cell
      html += '<td colspan="2" style="background: #fff; text-align: center; vertical-align: middle; border-right: 1px solid #000; padding: 4px;">';
      html += '<div style="font-size: 10px; font-weight: 500; line-height: 1.2; color: #000;">' + escapeHtml(genetics || "No genetics listed") + '</div>';
      html += '</td>';
      
      // Year Born + Breeder cell (nested table for split)
      html += '<td style="background: #fff; padding: 0; vertical-align: top;">';
      html += '<table style="width: 100%; height: 100%; border-collapse: collapse;">';
      
      // Year Born row
      html += '<tr style="height: 50%;">';
      html += '<td style="text-align: center; vertical-align: middle; border-bottom: 1px solid #000;">';
      html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">YEAR BORN:</div>';
      html += '<div style="font-family: Norwester, Inter, sans-serif; font-size: 14px; font-weight: 400; color: #000;">' + (yearBorn || "--") + '</div>';
      html += '</td>';
      html += '</tr>';
      
      // Breeder row
      html += '<tr style="height: 50%;">';
      html += '<td style="text-align: center; vertical-align: middle; padding: 2px;">';
      html += '<div style="font-size: 6px; font-weight: 700; color: #000; letter-spacing: 0.5px;">BREEDER:</div>';
      html += '<div style="font-size: 7px; font-weight: 600; color: #000; line-height: 1.1;">' + escapeHtml(breederSource || "--").toUpperCase() + '</div>';
      html += '</td>';
      html += '</tr>';
      
      html += '</table>';
      html += '</td>';
      
      html += '</tr>';
      
      html += '</table>';
      
      tagDiv.innerHTML = html;
      container.appendChild(tagDiv);
      
      // Update status
      setStatus("Rendering " + (currentIndex + 1) + " of " + totalAnimals + "...");
      
      // Wait for images to load, then render to canvas with 3x scale for quality
      setTimeout(function() {
        html2canvas(tagDiv, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        }).then(function(canvas) {
          // Add new page if not first
          if (currentIndex > 0) {
            doc.addPage([cardHeightPt, cardWidthPt], 'landscape');
          }
          
          // Add canvas as image to PDF
          var imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 0, 0, cardWidthPt, cardHeightPt);
          
          // Remove this tag from container
          container.removeChild(tagDiv);
          
          // Process next animal
          currentIndex++;
          processNextAnimal();
        }).catch(function(err) {
          console.error("Error rendering bin tag:", err);
          container.removeChild(tagDiv);
          currentIndex++;
          processNextAnimal();
        });
      }, 300);
    }
    
    // Start processing
    processNextAnimal();
  }
  
  // Preload logo if URL exists, then start PDF generation
  if (logoUrl && !logoUrl.startsWith('data:')) {
    setStatus("Loading logo...");
    var logoImg = new Image();
    logoImg.crossOrigin = "Anonymous";
    logoImg.onload = function() {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = logoImg.naturalWidth;
        canvas.height = logoImg.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0);
        logoBase64 = canvas.toDataURL('image/png');
      } catch (e) {
        console.error("Could not convert logo to base64:", e);
        logoBase64 = null;
      }
      startPDFGeneration();
    };
    logoImg.onerror = function() {
      console.error("Could not load logo image");
      logoBase64 = null;
      startPDFGeneration();
    };
    logoImg.src = logoUrl;
  } else {
    // Logo is already base64 or not set
    if (logoUrl && logoUrl.startsWith('data:')) {
      logoBase64 = logoUrl;
    }
    startPDFGeneration();
  }
}

