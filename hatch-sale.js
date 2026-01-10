/*
 * THE RACK - Hatch & Sale Modals
 * Version: 2.12.48
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.48: Added Amount Paid field to Sale modal (writes to AMOUNT PAID column)
 * - 2.12.0: Split from monolithic index.html
 */


// ============ HATCH MODAL ============
function openHatchModal(clutchRow) {
  state.hatchClutchRow = clutchRow;
  state.hatchDate = new Date().toISOString().split("T")[0];
  state.hatchCount = 1;
  state.hatchDrafts = [];

  var clutchId = clutchRow["CLUTCH ID"] || "Unknown";
  document.getElementById("hatchClutchId").textContent = "Clutch: " + clutchId;

  var html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">';
  html += '<div><label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Hatch Date</label>';
  html += '<input type="date" id="hatchDateInput" value="' + state.hatchDate + '" onchange="state.hatchDate=this.value" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 mono"></div>';
  html += '<div><label class="block text-xs font-semibold text-slate-600 uppercase mb-1"># of Hatchlings</label>';
  html += '<input type="number" id="hatchCountInput" value="1" min="1" max="20" onchange="state.hatchCount=parseInt(this.value)||1" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"></div>';
  html += '</div>';
  html += '<div id="hatchDraftsArea"></div>';

  document.getElementById("hatchModalBody").innerHTML = html;
  document.getElementById("hatchModal").classList.remove("hidden");
}

function closeHatchModal() {
  document.getElementById("hatchModal").classList.add("hidden");
  document.getElementById("hatchModalError").textContent = "";
  state.hatchClutchRow = null;
  state.hatchDrafts = [];
}

function markHatchedOnly() {
  if (!state.hatchClutchRow) return;
  
  var headers = state.headers.clutch || [];
  var statusIdx = headers.indexOf("STATUS");
  var hatchDateIdx = headers.indexOf("HATCH DATE");
  if (statusIdx < 0) { document.getElementById("hatchModalError").textContent = "No STATUS column"; return; }

  var updateData = { "STATUS": "Hatched" };
  if (hatchDateIdx >= 0) {
    updateData["HATCH DATE"] = state.hatchDate;
  }

  document.getElementById("hatchOnlyBtn").textContent = "Saving...";
  document.getElementById("hatchOnlyBtn").disabled = true;

  apiCall('updateRecord', {
    tab: SHEET_TABS.clutch,
    rowIndex: state.hatchClutchRow.__rowIndex,
    data: updateData
  }).then(function(response) {
    if (response.success) {
      setStatus("Clutch marked as hatched!");
      closeHatchModal();
      loadData();
    } else {
      document.getElementById("hatchModalError").textContent = "Failed: " + response.error;
    }
  }).catch(function(e) {
    document.getElementById("hatchModalError").textContent = "Failed: " + e.message;
  }).finally(function() {
    document.getElementById("hatchOnlyBtn").textContent = "Mark Hatched Only";
    document.getElementById("hatchOnlyBtn").disabled = false;
  });
}

function hatchAndCreateHatchlings() {
  if (!state.hatchClutchRow) return;
  var count = parseInt(document.getElementById("hatchCountInput").value) || 1;
  var hatchDate = document.getElementById("hatchDateInput").value;
  
  if (!hatchDate) {
    document.getElementById("hatchModalError").textContent = "Please enter a hatch date";
    return;
  }
  
  // Generate hatchling drafts
  var year = new Date().getFullYear();
  var baseNum = getMaxHatchlingNum(year);
  var clutchId = state.hatchClutchRow["CLUTCH ID"] || "";
  var sire = state.hatchClutchRow["SIRE"] || "";
  var dam = state.hatchClutchRow["DAM"] || "";

  state.hatchDrafts = [];
  for (var i = 1; i <= count; i++) {
    var id = "H-" + year + "-" + String(baseNum + i).padStart(4, "0");
    state.hatchDrafts.push({
      id: id,
      clutchId: clutchId,
      sire: sire,
      dam: dam,
      hatchDate: hatchDate,
      sex: "Unknown",
      animalName: "",
      geneticSummary: "",
      status: "Unlisted",
      notes: ""
    });
  }
  
  // Render the hatchling entry forms
  renderHatchlingForms();
}

function renderHatchlingForms() {
  var html = '<div class="mb-4 bg-gray-100 border border-gray-300 rounded-xl px-4 py-3">';
  html += '<div class="text-sm text-gray-700">Enter details for each hatchling. Click "Save All Hatchlings" when done.</div>';
  html += '</div>';
  
  html += '<div class="space-y-4 max-h-96 overflow-auto">';
  
  state.hatchDrafts.forEach(function(draft, idx) {
    html += '<div class="bg-slate-50 rounded-xl p-4 border border-slate-200">';
    html += '<div class="flex items-center justify-between mb-3">';
    html += '<div class="font-bold text-slate-800 mono">' + draft.id + '</div>';
    html += '<button onclick="removeHatchDraft(' + idx + ')" class="text-red-500 hover:text-red-700 text-sm">x Remove</button>';
    html += '</div>';
    
    html += '<div class="grid grid-cols-2 md:grid-cols-3 gap-3">';
    
    // Sex dropdown
    html += '<div>';
    html += '<label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Sex</label>';
    html += '<select onchange="updateHatchDraft(' + idx + ', \'sex\', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm">';
    html += '<option value="Unknown"' + (draft.sex === "Unknown" ? " selected" : "") + '>Unknown</option>';
    html += '<option value="Female"' + (draft.sex === "Female" ? " selected" : "") + '>Female</option>';
    html += '<option value="Male"' + (draft.sex === "Male" ? " selected" : "") + '>Male</option>';
    html += '</select>';
    html += '</div>';
    
    // Animal Name
    html += '<div>';
    html += '<label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Name (optional)</label>';
    html += '<input type="text" value="' + escapeHtml(draft.animalName) + '" onchange="updateHatchDraft(' + idx + ', \'animalName\', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm">';
    html += '</div>';
    
    // Status
    html += '<div>';
    html += '<label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>';
    html += '<select onchange="updateHatchDraft(' + idx + ', \'status\', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm">';
    html += '<option value="Unlisted"' + (draft.status === "Unlisted" ? " selected" : "") + '>Unlisted</option>';
    html += '<option value="Listed"' + (draft.status === "Listed" ? " selected" : "") + '>Listed</option>';
    html += '<option value="Holdback"' + (draft.status === "Holdback" ? " selected" : "") + '>Holdback</option>';
    html += '</select>';
    html += '</div>';
    
    // Genetic Summary - full width
    html += '<div class="col-span-2 md:col-span-3">';
    html += '<label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Genetic Summary</label>';
    html += '<input type="text" value="' + escapeHtml(draft.geneticSummary) + '" onchange="updateHatchDraft(' + idx + ', \'geneticSummary\', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm" placeholder="e.g. Pastel Het Clown">';
    html += '</div>';
    
    // Notes - full width
    html += '<div class="col-span-2 md:col-span-3">';
    html += '<label class="block text-xs font-semibold text-slate-600 uppercase mb-1">Notes (optional)</label>';
    html += '<input type="text" value="' + escapeHtml(draft.notes) + '" onchange="updateHatchDraft(' + idx + ', \'notes\', this.value)" class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-sm">';
    html += '</div>';
    
    html += '</div>'; // grid
    html += '</div>'; // card
  });
  
  html += '</div>'; // space-y container
  
  // Add another hatchling button
  html += '<div class="mt-4">';
  html += '<button onclick="addAnotherHatchDraft()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">+ Add Another Hatchling</button>';
  html += '</div>';
  
  document.getElementById("hatchModalBody").innerHTML = html;
  
  // Update button text
  document.getElementById("hatchAndCreateBtn").textContent = "Save All Hatchlings (" + state.hatchDrafts.length + ")";
  document.getElementById("hatchAndCreateBtn").onclick = saveAllHatchlings;
}

function updateHatchDraft(idx, field, value) {
  if (state.hatchDrafts[idx]) {
    state.hatchDrafts[idx][field] = value;
  }
}

function removeHatchDraft(idx) {
  state.hatchDrafts.splice(idx, 1);
  if (state.hatchDrafts.length === 0) {
    // Reset to initial view
    openHatchModal(state.hatchClutchRow);
  } else {
    renderHatchlingForms();
  }
}

function addAnotherHatchDraft() {
  var year = new Date().getFullYear();
  var baseNum = getMaxHatchlingNum(year) + state.hatchDrafts.length;
  var id = "H-" + year + "-" + String(baseNum + 1).padStart(4, "0");
  var clutchId = state.hatchClutchRow["CLUTCH ID"] || "";
  var sire = state.hatchClutchRow["SIRE"] || "";
  var dam = state.hatchClutchRow["DAM"] || "";
  var hatchDate = document.getElementById("hatchDateInput") ? document.getElementById("hatchDateInput").value : state.hatchDate;
  
  state.hatchDrafts.push({
    id: id,
    clutchId: clutchId,
    sire: sire,
    dam: dam,
    hatchDate: hatchDate,
    sex: "Unknown",
    animalName: "",
    geneticSummary: "",
    status: "Unlisted",
    notes: ""
  });
  
  renderHatchlingForms();
}

function saveAllHatchlings() {
  if (!state.hatchClutchRow || !state.hatchDrafts.length) return;
  
  var headers = state.headers.collection || [];
  var clutchHeaders = state.headers.clutch || [];
  var hatchDate = state.hatchDrafts[0] ? state.hatchDrafts[0].hatchDate : "";

  document.getElementById("hatchAndCreateBtn").textContent = "Saving...";
  document.getElementById("hatchAndCreateBtn").disabled = true;

  // First update the clutch status
  var clutchUpdate = { "STATUS": "Hatched" };
  if (clutchHeaders.indexOf("HATCH DATE") >= 0 && hatchDate) {
    clutchUpdate["HATCH DATE"] = hatchDate;
  }
  var numHatchedIdx = -1;
  for (var i = 0; i < clutchHeaders.length; i++) {
    if (clutchHeaders[i].toUpperCase() === "# HATCHED") {
      numHatchedIdx = i;
      clutchUpdate[clutchHeaders[i]] = String(state.hatchDrafts.length);
      break;
    }
  }

  apiCall('updateRecord', {
    tab: SHEET_TABS.clutch,
    rowIndex: state.hatchClutchRow.__rowIndex,
    data: clutchUpdate
  }).then(function(response) {
    if (!response.success) {
      throw new Error(response.error || "Failed to update clutch");
    }
    // Now save each hatchling
    var promises = state.hatchDrafts.map(function(draft) {
      var hatchlingData = {};
      headers.forEach(function(h) {
        var hUpper = h.toUpperCase();
        if (hUpper === "UNIQUE ID" || hUpper === "MANUAL OVERRIDE") hatchlingData[h] = draft.id;
        else if (hUpper === "CLUTCH ID") hatchlingData[h] = draft.clutchId;
        else if (hUpper === "SIRE") hatchlingData[h] = draft.sire;
        else if (hUpper === "DAM") hatchlingData[h] = draft.dam;
        else if (hUpper === "HATCH DATE" || hUpper === "DATE OF BIRTH") hatchlingData[h] = draft.hatchDate;
        else if (hUpper === "STATUS") hatchlingData[h] = draft.status;
        else if (hUpper === "SEX") hatchlingData[h] = draft.sex;
        else if (hUpper === "ANIMAL NAME") hatchlingData[h] = draft.animalName;
        else if (hUpper === "GENETIC SUMMARY") hatchlingData[h] = draft.geneticSummary;
        else if (hUpper === "NOTES") hatchlingData[h] = draft.notes;
        else if (hUpper === "SPECIES") hatchlingData[h] = "Ball Python";
        else if (hUpper === "BREEDER SOURCE") hatchlingData[h] = "Produced In House";
        else hatchlingData[h] = "";
      });
      return apiCall('saveRecord', {
        tab: SHEET_TABS.collection,
        data: hatchlingData
      });
    });
    return Promise.all(promises);
  }).then(function() {
    setStatus("Created " + state.hatchDrafts.length + " hatchlings!");
    closeHatchModal();
    loadData();
  }).catch(function(e) {
    document.getElementById("hatchModalError").textContent = "Failed: " + e.message;
  }).finally(function() {
    document.getElementById("hatchAndCreateBtn").textContent = "Save All Hatchlings";
    document.getElementById("hatchAndCreateBtn").disabled = false;
  });
}

function getMaxHatchlingNum(year) {
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
  return max;
}

// ============ SALE MODAL ============
function openSaleModal(animalRow) {
  state.saleAnimalRow = animalRow;
  var today = new Date().toISOString().split("T")[0];
  state.saleForm = {
    soldDate: today,
    soldPrice: "",
    totalPaid: "",
    shippingFee: "",
    buyerName: "",
    buyerEmail: "",
    saleSource: "MorphMarket",
    paymentStatus: "Paid",
    shipDate: ""
  };

  var uid = animalRow["UNIQUE ID"] || "Unknown";
  document.getElementById("saleAnimalId").textContent = uid;

  var html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  html += formField("Sold Date", "date", "soldDate", state.saleForm.soldDate);
  html += formField("Sold Price", "number", "soldPrice", "");
  html += formField("Amount Paid", "number", "totalPaid", "");
  html += formField("Shipping Fee", "number", "shippingFee", "");
  html += formField("Buyer Name", "text", "buyerName", "");
  html += formField("Buyer Email", "email", "buyerEmail", "");
  html += formSelect("Sale Source", "saleSource", FIELD_OPTIONS.SALE_SOURCE, "MorphMarket");
  html += formSelect("Payment Status", "paymentStatus", FIELD_OPTIONS.PAYMENT_STATUS, "Paid");
  html += formField("Ship Date", "date", "shipDate", "");
  html += '</div>';

  document.getElementById("saleModalBody").innerHTML = html;
  document.getElementById("saleModal").classList.remove("hidden");
}

function formField(label, type, key, val) {
  return '<div><label class="block text-xs font-semibold text-slate-600 uppercase mb-1">' + label + '</label>' +
         '<input type="' + type + '" value="' + (val || "") + '" onchange="state.saleForm.' + key + '=this.value" ' +
         'class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 mono text-sm"></div>';
}

function formSelect(label, key, opts, selected) {
  var html = '<div><label class="block text-xs font-semibold text-slate-600 uppercase mb-1">' + label + '</label>';
  html += '<select onchange="state.saleForm.' + key + '=this.value" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm">';
  opts.forEach(function(o) {
    var sel = (o === selected) ? " selected" : "";
    html += '<option value="' + o + '"' + sel + '>' + o + '</option>';
  });
  html += '</select></div>';
  return html;
}

function closeSaleModal() {
  document.getElementById("saleModal").classList.add("hidden");
  document.getElementById("saleModalError").textContent = "";
  state.saleAnimalRow = null;
}

function saveSale() {
  if (!state.saleAnimalRow) return;
  
  var f = state.saleForm;
  if (!f.soldDate) { document.getElementById("saleModalError").textContent = "Sold date required"; return; }
  if (!f.soldPrice) { document.getElementById("saleModalError").textContent = "Sold price required"; return; }
  if (!f.buyerName) { document.getElementById("saleModalError").textContent = "Buyer name required"; return; }

  var updateData = {
    "STATUS": "Sold",
    "SOLD PRICE": f.soldPrice,
    "AMOUNT PAID": f.totalPaid,
    "DATE SOLD": f.soldDate,
    "BUYER NAME": f.buyerName,
    "BUYER EMAIL": f.buyerEmail,
    "SHIPPING FEE": f.shippingFee,
    "SHIP DATE": f.shipDate
  };

  document.getElementById("saveSaleBtn").textContent = "Saving...";
  document.getElementById("saveSaleBtn").disabled = true;

  apiCall('updateRecord', {
    tab: SHEET_TABS.collection,
    rowIndex: state.saleAnimalRow.__rowIndex,
    data: updateData
  }).then(function(response) {
    if (response.success) {
      setStatus("Sale recorded!");
      closeSaleModal();
      loadData();
    } else {
      document.getElementById("saleModalError").textContent = "Failed: " + response.error;
    }
  }).catch(function(e) {
    document.getElementById("saleModalError").textContent = "Failed: " + e.message;
  }).finally(function() {
    document.getElementById("saveSaleBtn").textContent = "Save Sale";
    document.getElementById("saveSaleBtn").disabled = false;
  });
}

// ============ HOLDBACK FUNCTION ============
function markAsHoldback(row) {
  if (!state.isLoggedIn) {
    setStatus("Not logged in", true);
    return;
  }
  
  setStatus("Updating to Holdback...");
  
  apiCall('updateRecord', {
    tab: SHEET_TABS.collection,
    rowIndex: row.__rowIndex,
    data: { "STATUS": "Holdback" }
  }).then(function(response) {
    if (response.success) {
      setStatus("Marked as Holdback!");
      loadData();
    } else {
      setStatus("Failed: " + response.error, true);
    }
  }).catch(function(e) {
    setStatus("Failed: " + e.message, true);
  });
}
