/*
 * THE RACK - QR Codes & Bin Tags
 * Version: 2.12.24
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.24: Fixed print HTML to fill card - use table layout, inches for sizing
 * - 2.12.23: Complete rewrite - Norwester font preload, uppercase name, 32px top padding for Sex+ID
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
  var name = (animal["ANIMAL NAME"] || "UNNAMED").toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear()).slice(-2);
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  var html = '<div style="width:324px; height:204px; border:1px solid #000; background:#fff; font-family:Inter,sans-serif; overflow:hidden;">';
  
  // ROW 1 (47%)
  html += '<div style="display:flex; height:47%; border-bottom:1px solid #000;">';
  
  // Logo
  html += '<div style="width:25%; background:#000; display:flex; justify-content:center; align-items:center;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:90%; max-height:90%; object-fit:contain;">';
  } else {
    html += '<div style="font-family:Norwester,sans-serif; font-size:10px; color:#fff; text-align:center;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Sex + ID
  html += '<div style="width:45%; background:#fff; border-left:1px solid #000; border-right:1px solid #000; display:flex; flex-direction:column; justify-content:flex-start; align-items:center; padding-top:32px;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:24px; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-family:Norwester,sans-serif; font-size:12px; color:#000; margin-top:2px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // QR
  html += '<div style="width:30%; background:#fff; display:flex; justify-content:center; align-items:center;">';
  html += '<img src="' + qrUrl + '" style="width:85%; height:85%; object-fit:contain;">';
  html += '</div>';
  
  html += '</div>';
  
  // ROW 2 (15%)
  html += '<div style="display:flex; height:15%; border-bottom:1px solid #000;">';
  
  // Name
  html += '<div style="width:70%; background:#fff; border-right:1px solid #000; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:22px; color:#000; letter-spacing:1px;">' + escapeHtml(name) + '</div>';
  html += '</div>';
  
  // INFO
  html += '<div style="width:30%; background:#000; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Norwester,sans-serif; font-size:12px; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</div>';
  
  html += '</div>';
  
  // ROW 3 (38%)
  html += '<div style="display:flex; height:38%;">';
  
  // Genetics
  html += '<div style="width:70%; background:#fff; border-right:1px solid #000; display:flex; justify-content:center; align-items:center; padding:6px; text-align:center;">';
  html += '<div style="font-size:11px; font-weight:500; line-height:1.25; color:#000;">' + escapeHtml(genetics) + '</div>';
  html += '</div>';
  
  // Year + Breeder
  html += '<div style="width:30%; background:#fff; display:flex; flex-direction:column;">';
  
  html += '<div style="flex:1; border-bottom:1px solid #000; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-size:7px; font-weight:700; color:#000;">YEAR BORN:</div>';
  html += '<div style="font-family:Norwester,sans-serif; font-size:16px; color:#000;">' + yearBorn + '</div>';
  html += '</div>';
  
  html += '<div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-size:7px; font-weight:700; color:#000;">BREEDER:</div>';
  html += '<div style="font-size:8px; font-weight:600; color:#000;">' + escapeHtml(breederSource) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  html += '</div>';
  
  return html;
}


// ============ PRINT BIN TAGS (HTML) ============
function downloadBinTagsPDF() {
  var btn = document.getElementById("binTagDownloadBtn");
  btn.textContent = "Generating...";
  btn.disabled = true;
  
  var animalsToInclude = getAnimalsToInclude();
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    btn.textContent = "Print Tags";
    btn.disabled = false;
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  printBinTagsHTML(animalsToInclude, businessName, logoUrl);
  
  btn.textContent = "Print Tags";
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
  html += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">';
  html += '<link href="https://fonts.cdnfonts.com/css/norwester" rel="stylesheet">';
  html += '<style>';
  html += '@page { size: 3.38in 2.13in; margin: 0; }';
  html += 'html, body { margin: 0; padding: 0; width: 3.38in; height: 2.13in; }';
  html += '.bin-tag { width: 3.38in; height: 2.13in; box-sizing: border-box; page-break-after: always; }';
  html += '.bin-tag:last-child { page-break-after: avoid; }';
  html += '</style></head><body>';
  
  animals.forEach(function(animal) {
    html += buildBinTagPrint(animal, businessName, logoUrl);
  });
  
  html += '</body></html>';
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(function() {
    printWindow.print();
  }, 1000);
}

function buildBinTagPrint(animal, businessName, logoUrl) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = (animal["ANIMAL NAME"] || "UNNAMED").toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear()).slice(-2);
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  var html = '<div class="bin-tag" style="border:1px solid #000; background:#fff; font-family:Norwester,Inter,sans-serif; overflow:hidden;">';
  
  // Use table for print - more reliable
  html += '<table style="width:100%; height:100%; border-collapse:collapse; table-layout:fixed;">';
  html += '<colgroup><col style="width:25%"><col style="width:45%"><col style="width:30%"></colgroup>';
  
  // ROW 1 (47%)
  html += '<tr style="height:47%">';
  
  // Logo
  html += '<td style="background:#000; text-align:center; vertical-align:middle; border-right:1px solid #000; border-bottom:1px solid #000;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:90%; max-height:90%; object-fit:contain;">';
  } else {
    html += '<div style="font-size:10px; color:#fff;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</td>';
  
  // Sex + ID
  html += '<td style="background:#fff; text-align:center; vertical-align:top; border-right:1px solid #000; border-bottom:1px solid #000; padding-top:0.33in;">';
  html += '<div style="font-size:24px; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-size:12px; color:#000; margin-top:2px;">' + escapeHtml(id) + '</div>';
  html += '</td>';
  
  // QR
  html += '<td style="background:#fff; text-align:center; vertical-align:middle; border-bottom:1px solid #000;">';
  html += '<img src="' + qrUrl + '" style="width:0.9in; height:0.9in;">';
  html += '</td>';
  
  html += '</tr>';
  
  // ROW 2 (15%)
  html += '<tr style="height:15%">';
  
  // Name
  html += '<td colspan="2" style="background:#fff; text-align:center; vertical-align:middle; border-right:1px solid #000; border-bottom:1px solid #000;">';
  html += '<div style="font-size:22px; color:#000; letter-spacing:1px;">' + escapeHtml(name) + '</div>';
  html += '</td>';
  
  // INFO
  html += '<td style="background:#000; text-align:center; vertical-align:middle; border-bottom:1px solid #000;">';
  html += '<div style="font-size:12px; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</td>';
  
  html += '</tr>';
  
  // ROW 3 (38%)
  html += '<tr style="height:38%">';
  
  // Genetics
  html += '<td colspan="2" style="background:#fff; text-align:center; vertical-align:middle; border-right:1px solid #000; padding:4px;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:11px; font-weight:500; line-height:1.25;">' + escapeHtml(genetics) + '</div>';
  html += '</td>';
  
  // Year + Breeder (nested table)
  html += '<td style="background:#fff; padding:0; vertical-align:top;">';
  html += '<table style="width:100%; height:100%; border-collapse:collapse;">';
  
  // Year Born
  html += '<tr style="height:50%"><td style="text-align:center; vertical-align:middle; border-bottom:1px solid #000;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:7px; font-weight:700;">YEAR BORN:</div>';
  html += '<div style="font-size:16px;">' + yearBorn + '</div>';
  html += '</td></tr>';
  
  // Breeder
  html += '<tr style="height:50%"><td style="text-align:center; vertical-align:middle;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:7px; font-weight:700;">BREEDER:</div>';
  html += '<div style="font-family:Inter,sans-serif; font-size:8px; font-weight:600;">' + escapeHtml(breederSource) + '</div>';
  html += '</td></tr>';
  
  html += '</table>';
  html += '</td>';
  
  html += '</tr>';
  
  html += '</table>';
  html += '</div>';
  
  return html;
}


// ============ DOWNLOAD BIN TAGS PDF ============
function downloadBinTagsPDFFile() {
  var btn = document.getElementById("binTagPdfBtn");
  if (btn) {
    btn.textContent = "Generating PDF...";
    btn.disabled = true;
  }
  
  var animalsToInclude = getAnimalsToInclude();
  
  if (animalsToInclude.length === 0) {
    setStatus("No animals selected", true);
    if (btn) {
      btn.textContent = "Download PDF";
      btn.disabled = false;
    }
    return;
  }
  
  var businessName = state.settings["BUSINESS NAME"] || "THE RACK";
  var logoUrl = state.settings["LOGO DATA"] || state.settings["LOGO URL"] || "";
  
  // Preload logo
  var logoBase64 = null;
  
  if (logoUrl && !logoUrl.startsWith('data:')) {
    setStatus("Loading logo...");
    var img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function() {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        logoBase64 = canvas.toDataURL('image/png');
      } catch (e) {
        logoBase64 = null;
      }
      generateBinTagPDF(animalsToInclude, businessName, logoBase64, btn);
    };
    img.onerror = function() {
      generateBinTagPDF(animalsToInclude, businessName, null, btn);
    };
    img.src = logoUrl;
  } else {
    logoBase64 = (logoUrl && logoUrl.startsWith('data:')) ? logoUrl : null;
    generateBinTagPDF(animalsToInclude, businessName, logoBase64, btn);
  }
}

function generateBinTagPDF(animals, businessName, logoBase64, btn) {
  // Card: 3.38" x 2.13"
  var cardW = 325;
  var cardH = 205;
  var pdfW = 3.38 * 72;
  var pdfH = 2.13 * 72;
  
  // Create hidden container with font preloaded
  var container = document.createElement('div');
  container.style.cssText = 'position:absolute; left:-9999px; top:0;';
  container.innerHTML = '<link href="https://fonts.cdnfonts.com/css/norwester" rel="stylesheet"><div style="font-family:Norwester;">.</div>';
  document.body.appendChild(container);
  
  var doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [pdfH, pdfW]
  });
  
  var total = animals.length;
  var current = 0;
  
  // Wait for font to load
  setTimeout(function() {
    processNextTag();
  }, 500);
  
  function processNextTag() {
    if (current >= total) {
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
    
    var animal = animals[current];
    setStatus("Rendering " + (current + 1) + " of " + total + "...");
    
    var tagDiv = document.createElement('div');
    tagDiv.innerHTML = buildPDFBinTag(animal, businessName, logoBase64, cardW, cardH);
    container.appendChild(tagDiv);
    
    setTimeout(function() {
      html2canvas(tagDiv.firstChild, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(function(canvas) {
        if (current > 0) {
          doc.addPage([pdfH, pdfW], 'landscape');
        }
        
        var imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
        
        container.removeChild(tagDiv);
        current++;
        processNextTag();
      }).catch(function(err) {
        console.error("Render error:", err);
        container.removeChild(tagDiv);
        current++;
        processNextTag();
      });
    }, 300);
  }
}

function buildPDFBinTag(animal, businessName, logoUrl, w, h) {
  var id = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
  var name = (animal["ANIMAL NAME"] || "UNNAMED").toUpperCase();
  var sex = (animal["SEX"] || "").toUpperCase();
  var sexDisplay = sex.startsWith("M") ? "MALE" : (sex.startsWith("F") ? "FEMALE" : "");
  var genetics = animal["GENETIC SUMMARY"] || "No genetics listed";
  var dob = animal["DATE OF BIRTH"] || "";
  var breederSource = (animal["BREEDER SOURCE"] || "--").toUpperCase();
  
  var yearBorn = "--";
  if (dob) {
    var d = parseDate(dob);
    if (d) yearBorn = String(d.getFullYear()).slice(-2);
  }
  
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + id);
  
  // Heights
  var row1H = Math.round(h * 0.47);
  var row2H = Math.round(h * 0.15);
  var row3H = h - row1H - row2H;
  
  // Widths
  var col1W = Math.round(w * 0.25);
  var col2W = Math.round(w * 0.45);
  var col3W = w - col1W - col2W;
  var col12W = col1W + col2W;
  
  var html = '<div style="width:' + w + 'px; height:' + h + 'px; border:1px solid #000; background:#fff; box-sizing:border-box; overflow:hidden; position:relative; font-family:Norwester,Inter,sans-serif;">';
  
  // ROW 1
  
  // Logo (black)
  html += '<div style="position:absolute; left:0; top:0; width:' + col1W + 'px; height:' + row1H + 'px; background:#000; display:flex; justify-content:center; align-items:center; box-sizing:border-box;">';
  if (logoUrl) {
    html += '<img src="' + escapeHtml(logoUrl) + '" style="max-width:90%; max-height:90%; object-fit:contain;">';
  } else {
    html += '<div style="font-size:10px; color:#fff; text-align:center;">' + escapeHtml(businessName).toUpperCase() + '</div>';
  }
  html += '</div>';
  
  // Sex + ID (white, 32px top padding for card cutout = ~0.33")
  html += '<div style="position:absolute; left:' + col1W + 'px; top:0; width:' + col2W + 'px; height:' + row1H + 'px; background:#fff; border-left:1px solid #000; border-right:1px solid #000; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; padding-top:32px;">';
  html += '<div style="font-size:20px; color:#000; letter-spacing:2px;">' + escapeHtml(sexDisplay) + '</div>';
  html += '<div style="font-size:10px; color:#000; margin-top:2px; letter-spacing:1px;">' + escapeHtml(id) + '</div>';
  html += '</div>';
  
  // QR
  html += '<div style="position:absolute; right:0; top:0; width:' + col3W + 'px; height:' + row1H + 'px; background:#fff; display:flex; justify-content:center; align-items:center; box-sizing:border-box;">';
  html += '<img src="' + qrUrl + '" style="width:' + (row1H - 10) + 'px; height:' + (row1H - 10) + 'px;">';
  html += '</div>';
  
  // Border under row 1
  html += '<div style="position:absolute; left:0; top:' + row1H + 'px; width:100%; height:1px; background:#000;"></div>';
  
  // ROW 2
  
  // Name (white)
  html += '<div style="position:absolute; left:0; top:' + row1H + 'px; width:' + col12W + 'px; height:' + row2H + 'px; background:#fff; border-right:1px solid #000; box-sizing:border-box; display:flex; justify-content:center; align-items:center;">';
  html += '<div style="font-size:18px; color:#000; letter-spacing:1px;">' + escapeHtml(name) + '</div>';
  html += '</div>';
  
  // INFO (black)
  html += '<div style="position:absolute; right:0; top:' + row1H + 'px; width:' + col3W + 'px; height:' + row2H + 'px; background:#000; display:flex; justify-content:center; align-items:center; box-sizing:border-box;">';
  html += '<div style="font-size:11px; color:#fff; letter-spacing:2px;">INFO</div>';
  html += '</div>';
  
  // Border under row 2
  var row2Bottom = row1H + row2H;
  html += '<div style="position:absolute; left:0; top:' + row2Bottom + 'px; width:100%; height:1px; background:#000;"></div>';
  
  // ROW 3
  
  // Genetics (white)
  html += '<div style="position:absolute; left:0; top:' + row2Bottom + 'px; width:' + col12W + 'px; height:' + row3H + 'px; background:#fff; border-right:1px solid #000; box-sizing:border-box; display:flex; justify-content:center; align-items:center; padding:4px; text-align:center;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:10px; font-weight:500; line-height:1.2; color:#000;">' + escapeHtml(genetics) + '</div>';
  html += '</div>';
  
  // Year Born + Breeder
  var infoBoxH = Math.round(row3H / 2);
  
  // Year Born
  html += '<div style="position:absolute; right:0; top:' + row2Bottom + 'px; width:' + col3W + 'px; height:' + infoBoxH + 'px; background:#fff; border-bottom:1px solid #000; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:6px; font-weight:700; color:#000;">YEAR BORN:</div>';
  html += '<div style="font-size:14px; color:#000;">' + yearBorn + '</div>';
  html += '</div>';
  
  // Breeder
  html += '<div style="position:absolute; right:0; top:' + (row2Bottom + infoBoxH) + 'px; width:' + col3W + 'px; height:' + infoBoxH + 'px; background:#fff; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; align-items:center;">';
  html += '<div style="font-family:Inter,sans-serif; font-size:6px; font-weight:700; color:#000;">BREEDER:</div>';
  html += '<div style="font-family:Inter,sans-serif; font-size:7px; font-weight:600; color:#000;">' + escapeHtml(breederSource) + '</div>';
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
