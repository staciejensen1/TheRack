/*
 * THE RACK - Tables & Filters
 * Version: 2.12.41
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.41: Fixed button onclick closures using IIFE pattern, added debug logging
 * - 2.12.0: Split from monolithic index.html
 */


// ============ TABLE ============
function renderTable() {
  var columns = getColumns();
  var rows = getFilteredRows();
  var showHatch = state.activeTab === "clutches";
  var showSale = state.activeTab === "hatchlings";

  // Render stats cards for this view
  renderTableStats();
  
  // Show/hide filter bars based on tab
  var filterBar = document.getElementById("filterBar");
  var salesFilterBar = document.getElementById("salesFilterBar");
  var clutchesFilterBar = document.getElementById("clutchesFilterBar");
  var sheetKey = getSheetKey(state.activeTab);
  
  // Hide ALL filter bars first
  filterBar.classList.add("hidden");
  salesFilterBar.classList.add("hidden");
  if (clutchesFilterBar) clutchesFilterBar.classList.add("hidden");
  
  // Show only the appropriate filter bar for current tab
  if (state.activeTab === "clutches") {
    if (clutchesFilterBar) clutchesFilterBar.classList.remove("hidden");
    var clutchSearchInput = document.getElementById("clutchSearchInput");
    if (clutchSearchInput) clutchSearchInput.value = state.filters.search || "";
  } else if (state.activeTab === "sales") {
    salesFilterBar.classList.remove("hidden");
    populateSalesYearFilter();
    var salesSearchInput = document.getElementById("salesSearchInput");
    if (salesSearchInput) salesSearchInput.value = state.filters.search || "";
  } else if (sheetKey === "collection") {
    // Collection, Hatchlings, Pairings tabs
    filterBar.classList.remove("hidden");
    populateSpeciesFilter();
    var searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = state.filters.search || "";
  } else if (state.activeTab === "activity") {
    filterBar.classList.remove("hidden");
    var searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = state.filters.search || "";
  }
  // For archive and other tabs, all filter bars stay hidden
  
  // Show alert filter badge if active
  var alertFilterDisplay = document.getElementById("alertFilterDisplay");
  var alertFilterLabel = document.getElementById("alertFilterLabel");
  if (alertFilterDisplay && state.filters.alertFilter) {
    var label = ALERT_FILTER_LABELS[state.filters.alertFilter] || state.filters.alertFilter;
    alertFilterLabel.textContent = label;
    alertFilterDisplay.classList.remove("hidden");
  } else if (alertFilterDisplay) {
    alertFilterDisplay.classList.add("hidden");
  }

  // Header
  var headerRow = document.getElementById("tableHead").querySelector("tr");
  headerRow.innerHTML = "";
  
  // Actions header FIRST
  var actionTh = document.createElement("th");
  actionTh.className = "px-3 py-3 text-left font-semibold text-slate-600 bg-slate-50 whitespace-nowrap text-sm sticky left-0 z-10";
  actionTh.textContent = "Actions";
  headerRow.appendChild(actionTh);
  
  columns.forEach(function(col) {
    var th = document.createElement("th");
    th.className = "px-3 py-3 text-left font-semibold text-slate-600 bg-slate-50 whitespace-nowrap text-sm";
    th.textContent = col;
    headerRow.appendChild(th);
  });

  // Body
  var tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  
  if (!rows.length) {
    var tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="' + (columns.length + 1) + '" class="px-4 py-12 text-center text-slate-500">No data</td>';
    tbody.appendChild(tr);
    return;
  }

  rows.forEach(function(row) {
    var tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";
    
    console.log("Creating row for:", row["UNIQUE ID"] || row["CLUTCH ID"] || "unknown");
    
    // Check if this clutch is overdue (for Clutches view)
    var isOverdue = false;
    if (state.activeTab === "clutches") {
      var estHatchDate = row["EST. HATCH DATE"] || row["EST HATCH DATE"] || row["ESTIMATED HATCH DATE"] || "";
      var status = (row.STATUS || "").toLowerCase();
      if (estHatchDate && status === "incubating") {
        var estDate = parseDate(estHatchDate);
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        if (estDate && estDate < today) {
          isOverdue = true;
          tr.className = "hover:bg-gray-200 bg-gray-200";
        }
      }
    }
    
    // Actions FIRST (sticky left)
    var actionTd = document.createElement("td");
    actionTd.className = "px-3 py-3 whitespace-nowrap bg-white sticky left-0 z-10 border-r border-gray-100";
    
    var editBtn = document.createElement("button");
    editBtn.className = "px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200 mr-1";
    editBtn.textContent = "Edit";
    editBtn.onclick = (function(r) {
      return function() {
        console.log("Edit button clicked for row:", r["UNIQUE ID"] || r["CLUTCH ID"]);
        openEditModal(r);
      };
    })(row);
    actionTd.appendChild(editBtn);

    // + Activity button for collection, clutches, hatchlings (not activity tab itself)
    if (state.activeTab === "collection" || state.activeTab === "clutches" || state.activeTab === "hatchlings") {
      var activityBtn = document.createElement("button");
      activityBtn.className = "px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 mr-1";
      activityBtn.textContent = "+ Activity";
      activityBtn.onclick = (function(r) {
        return function() { openQuickActivityModal(r); };
      })(row);
      actionTd.appendChild(activityBtn);
    }

    if (showHatch) {
      var hatchBtn = document.createElement("button");
      hatchBtn.className = "px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 mr-1";
      hatchBtn.textContent = "Hatch";
      hatchBtn.onclick = (function(r) {
        return function() {
          console.log("Hatch button clicked for:", r["CLUTCH ID"]);
          openHatchModal(r);
        };
      })(row);
      actionTd.appendChild(hatchBtn);
    }

    if (showSale) {
      var saleBtn = document.createElement("button");
      saleBtn.className = "px-2 py-1 bg-gray-300 text-gray-800 rounded text-xs hover:bg-gray-400 mr-1";
      saleBtn.textContent = "Sell";
      saleBtn.onclick = (function(r) {
        return function() {
          console.log("Sell button clicked for:", r["UNIQUE ID"]);
          openSaleModal(r);
        };
      })(row);
      actionTd.appendChild(saleBtn);
      
      var holdbackBtn = document.createElement("button");
      holdbackBtn.className = "px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 mr-1";
      holdbackBtn.textContent = "+ Holdback";
      holdbackBtn.onclick = (function(r) {
        return function() {
          console.log("Holdback button clicked for:", r["UNIQUE ID"]);
          markAsHoldback(r);
        };
      })(row);
      actionTd.appendChild(holdbackBtn);
    }

    // Archive button for collection and clutches
    if (state.activeTab === "collection" || state.activeTab === "clutches" || state.activeTab === "hatchlings" || state.activeTab === "sales") {
      var archiveTab = state.activeTab === "clutches" ? "Clutch" : "Collection";
      var archiveBtn = document.createElement("button");
      archiveBtn.className = "px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200";
      archiveBtn.textContent = "Delete";
      archiveBtn.onclick = (function(rowIndex, tab) {
        return function() { archiveRecord(rowIndex, tab); };
      })(row.__rowIndex, archiveTab);
      actionTd.appendChild(archiveBtn);
    }

    // Print Tag button for collection and hatchlings (not clutches)
    if (state.activeTab === "collection" || state.activeTab === "hatchlings") {
      var tagBtn = document.createElement("button");
      tagBtn.className = "px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 ml-1";
      tagBtn.textContent = "Tag";
      tagBtn.onclick = (function(r) {
        return function() { printSingleBinTag(r); };
      })(row);
      actionTd.appendChild(tagBtn);
    }

    // Delete button for activity table (direct delete, no archive)
    if (state.activeTab === "activity") {
      var deleteBtn = document.createElement("button");
      deleteBtn.className = "px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = (function(rowIndex) {
        return function() { deleteActivityRecord(rowIndex); };
      })(row.__rowIndex);
      actionTd.appendChild(deleteBtn);
    }

    // Invoice button for Sales view
    if (state.activeTab === "sales") {
      var invoiceBtn = document.createElement("button");
      invoiceBtn.className = "px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 mr-1";
      invoiceBtn.textContent = "Invoice";
      invoiceBtn.onclick = (function(r) {
        return function() { openInvoiceModal(r); };
      })(row);
      actionTd.insertBefore(invoiceBtn, actionTd.firstChild);
    }

    tr.appendChild(actionTd);
    
    // Data columns
    columns.forEach(function(col, colIdx) {
      var td = document.createElement("td");
      td.className = "px-3 py-3 text-slate-700 whitespace-nowrap text-sm";
      
      // Special handling for QR column
      if (col === "QR") {
        var animalId = row["UNIQUE ID"] || row["MANUAL OVERRIDE"] || "";
        if (animalId) {
          var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=" + encodeURIComponent("https://app.therackapp.io?code=" + state.sheetId + "&animal=" + animalId);
          td.innerHTML = '<img src="' + qrUrl + '" alt="QR" style="width:40px; height:40px; min-width:40px; min-height:40px; max-width:40px; max-height:40px;" />';
        } else {
          td.textContent = "--";
        }
      }
      // Maturity column
      else if (col === "MATURITY") {
        var maturity = calculateMaturity(row["DATE OF BIRTH"]);
        td.innerHTML = '<span class="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">' + maturity + '</span>';
      }
      // Status badge
      else if (col === "STATUS") {
        var statusVal = row[col] || "--";
        td.innerHTML = '<span class="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">' + escapeHtml(statusVal) + '</span>';
      }
      // Gene tags
      else if (col === "GENETIC SUMMARY") {
        var genes = row[col] || "";
        if (genes) {
          td.innerHTML = renderGeneTags(genes);
        } else {
          td.textContent = "--";
        }
      }
      // Add warning icon to first data column if overdue
      else if (colIdx === 0 && isOverdue) {
        td.innerHTML = '<span class="text-red-600 font-bold mr-1" title="Overdue - past estimated hatch date">!</span>' + escapeHtml(row[col] || "--");
      }
      // Special handling for Pairings view - SIRE maps to UNIQUE ID, DAM maps to VALUE
      else if (state.activeTab === "pairings" && col === "SIRE") {
        // Get the animal name for the UNIQUE ID
        var sireId = row["UNIQUE ID"] || "";
        var sireName = getAnimalNameById(sireId);
        td.textContent = sireName ? sireName + " | " + sireId : sireId || "--";
      }
      else if (state.activeTab === "pairings" && col === "DAM") {
        // VALUE contains the paired animal (could be "Name | ID" format already)
        var damValue = row["VALUE"] || "";
        td.textContent = damValue || "--";
      }
      // Format date columns nicely
      else if (col.toUpperCase().includes("DATE") && row[col]) {
        var dateVal = parseDate(row[col]);
        if (dateVal) {
          td.textContent = (dateVal.getMonth() + 1) + "/" + dateVal.getDate() + "/" + dateVal.getFullYear();
        } else {
          td.textContent = row[col] || "--";
        }
      } else {
        td.textContent = row[col] || "--";
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// Simple button handlers that use window._displayedRows
function handleEdit(displayIndex) {
  console.log("handleEdit called with displayIndex:", displayIndex);
  console.log("window._displayedRows:", window._displayedRows);
  console.log("window._displayedRows length:", window._displayedRows ? window._displayedRows.length : 0);
  
  var row = window._displayedRows[displayIndex];
  console.log("Retrieved row:", row);
  
  if (!row) {
    setStatus("Row not found at index " + displayIndex, true);
    return;
  }
  openEditModal(row);
}

function handleHatch(displayIndex) {
  var row = window._displayedRows[displayIndex];
  if (!row) {
    setStatus("Row not found", true);
    return;
  }
  openHatchModal(row);
}

function handleSell(displayIndex) {
  var row = window._displayedRows[displayIndex];
  if (!row) {
    setStatus("Row not found", true);
    return;
  }
  openSaleModal(row);
}

function handleHoldback(displayIndex) {
  var row = window._displayedRows[displayIndex];
  if (!row) {
    setStatus("Row not found", true);
    return;
  }
  markAsHoldback(row);
}

function handleDelete(displayIndex, sourceTab) {
  var row = window._displayedRows[displayIndex];
  if (!row) {
    setStatus("Row not found", true);
    return;
  }
  
  var recordName = row["ANIMAL NAME"] || row["CLUTCH ID"] || "this record";
  
  if (!confirm("Move \"" + recordName + "\" to Archive?\n\nYou can restore it later from the Archive tab.")) {
    return;
  }
  
  setStatus("Archiving...");
  
  // Create clean archive data
  var archiveData = {};
  var keys = Object.keys(row);
  for (var j = 0; j < keys.length; j++) {
    var key = keys[j];
    if (key !== "__rowIndex" && key !== "__raw") {
      archiveData[key] = row[key];
    }
  }
  archiveData["ARCHIVE TYPE"] = sourceTab;
  archiveData["DATE ARCHIVED"] = new Date().toISOString().split('T')[0];
  
  // Get the actual row index for deletion
  var rowIndex = row.__rowIndex;
  
  // If no __rowIndex, we need to find it by matching UNIQUE ID or CLUTCH ID
  if (rowIndex === undefined) {
    var sheetKey = sourceTab === "Clutch" ? "clutch" : "collection";
    var allRows = state.data[sheetKey] || [];
    var uniqueId = row["UNIQUE ID"] || row["MANUAL OVERRIDE"] || row["CLUTCH ID"];
    
    for (var k = 0; k < allRows.length; k++) {
      var r = allRows[k];
      var rId = r["UNIQUE ID"] || r["MANUAL OVERRIDE"] || r["CLUTCH ID"];
      if (rId && rId === uniqueId) {
        rowIndex = r.__rowIndex;
        break;
      }
    }
  }
  
  if (rowIndex === undefined) {
    setStatus("Could not find row index for deletion", true);
    return;
  }
  
  // Save to Archive tab, then delete from original
  apiCall('saveRecord', { tab: 'Archive', data: archiveData })
    .then(function(response) {
      if (response.success) {
        return apiCall('deleteRecord', { tab: sourceTab, rowIndex: rowIndex });
      } else {
        throw new Error(response.error || "Failed to archive");
      }
    })
    .then(function(response) {
      if (response.success) {
        setStatus("Moved to Archive");
        loadData();
      } else {
        throw new Error(response.error || "Failed to delete original");
      }
    })
    .catch(function(error) {
      setStatus("Error: " + error.message, true);
    });
}

function calculateMaturity(dob) {
  if (!dob) return "UNK";
  var birthDate = parseDate(dob);
  if (!birthDate) return "UNK";
  
  var today = new Date();
  var months = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
  
  if (months < 6) return "HTCH";
  if (months < 18) return "SUB";
  return "ADULT";
}

function renderGeneTags(genes) {
  if (!genes) return "--";
  
  // Split by common delimiters and clean up
  var geneList = genes.split(/[\s,]+/).filter(function(g) { 
    return g.trim().length > 0; 
  });
  
  // Group consecutive words that might be one gene (e.g., "desert ghost" -> "Desert Ghost")
  var parsedGenes = [];
  var hetBuffer = "";
  
  for (var i = 0; i < geneList.length; i++) {
    var gene = geneList[i].trim();
    if (!gene) continue;
    
    // Check for het/possible het patterns
    if (gene.toLowerCase() === "het" || gene.toLowerCase() === "poss" || gene.toLowerCase() === "100%") {
      hetBuffer = gene;
      continue;
    }
    
    // If we have a het buffer, combine with next gene
    if (hetBuffer) {
      parsedGenes.push(hetBuffer + " " + gene);
      hetBuffer = "";
    } else {
      parsedGenes.push(gene);
    }
  }
  
  // Render as clickable tags (max 5 shown, then "+X more")
  var maxShow = 5;
  var html = '<div class="flex flex-wrap gap-1">';
  
  for (var j = 0; j < Math.min(parsedGenes.length, maxShow); j++) {
    var g = parsedGenes[j];
    html += '<span class="px-2 py-0.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-full text-xs cursor-pointer hover:bg-gray-200" onclick="filterByGene(\'' + escapeHtml(g).replace(/'/g, "\\'") + '\')">' + escapeHtml(g) + '</span>';
  }
  
  if (parsedGenes.length > maxShow) {
    html += '<span class="px-2 py-0.5 text-gray-500 text-xs">+' + (parsedGenes.length - maxShow) + ' more</span>';
  }
  
  html += '</div>';
  return html;
}

function filterByGene(gene) {
  state.filters.gene = gene;
  document.getElementById("geneFilterText").textContent = gene;
  document.getElementById("geneFilterDisplay").classList.remove("hidden");
  document.getElementById("clearFiltersBtn").classList.remove("hidden");
  renderTable();
}

function clearGeneFilter() {
  state.filters.gene = "";
  document.getElementById("geneFilterDisplay").classList.add("hidden");
  updateClearFiltersVisibility();
  renderTable();
}

function applyFilter(filterType, value) {
  state.filters[filterType] = value;
  updateClearFiltersVisibility();
  renderTable();
}

// Alert filter labels for display
var ALERT_FILTER_LABELS = {
  overdueClutches: "Overdue Clutches",
  clutchesDueSoon: "Due Within 7 Days",
  unshipped: "Unshipped Sales",
  shippingSoon: "Shipping Soon",
  unpaidDeposits: "Unpaid Deposits",
  balanceDue: "Balance Due",
  needsSexing: "Needs Sexing",
  readyToList: "Ready to List"
};

// Alert filter destinations
var ALERT_FILTER_TABS = {
  overdueClutches: "clutches",
  clutchesDueSoon: "clutches",
  unshipped: "sales",
  shippingSoon: "sales",
  unpaidDeposits: "sales",
  balanceDue: "sales",
  needsSexing: "hatchlings",
  readyToList: "hatchlings"
};

function filterByAlert(alertType) {
  state.filters.alertFilter = alertType;
  var targetTab = ALERT_FILTER_TABS[alertType] || "collection";
  navigateTo(targetTab);
  updateClearFiltersVisibility();
}

function clearAlertFilter() {
  state.filters.alertFilter = "";
  var alertFilterDisplay = document.getElementById("alertFilterDisplay");
  if (alertFilterDisplay) alertFilterDisplay.classList.add("hidden");
  updateClearFiltersVisibility();
  renderTable();
}

function clearAllFilters() {
  state.filters = { sex: "", status: "", species: "", gene: "", salesYear: "", salesStatus: "", search: "", alertFilter: "" };
  document.getElementById("filterSex").value = "";
  document.getElementById("filterStatus").value = "";
  document.getElementById("filterSpecies").value = "";
  var searchInput = document.getElementById("searchInput");
  if (searchInput) searchInput.value = "";
  var salesSearchInput = document.getElementById("salesSearchInput");
  if (salesSearchInput) salesSearchInput.value = "";
  var salesYearSelect = document.getElementById("filterSalesYear");
  if (salesYearSelect) salesYearSelect.value = "";
  var salesStatusSelect = document.getElementById("filterSalesStatus");
  if (salesStatusSelect) salesStatusSelect.value = "";
  document.getElementById("geneFilterDisplay").classList.add("hidden");
  document.getElementById("clearFiltersBtn").classList.add("hidden");
  // Hide all alert filter displays
  var alertFilterDisplay = document.getElementById("alertFilterDisplay");
  if (alertFilterDisplay) alertFilterDisplay.classList.add("hidden");
  renderTable();
}

function updateClearFiltersVisibility() {
  var hasFilters = state.filters.sex || state.filters.status || state.filters.species || state.filters.gene || state.filters.salesYear || state.filters.salesStatus || state.filters.search || state.filters.alertFilter;
  document.getElementById("clearFiltersBtn").classList.toggle("hidden", !hasFilters);
}

function populateSpeciesFilter() {
  var species = {};
  state.data.collection.forEach(function(r) {
    var sp = (r.SPECIES || "").trim();
    if (sp) species[sp] = true;
  });
  
  var select = document.getElementById("filterSpecies");
  select.innerHTML = '<option value="">All Species</option>';
  Object.keys(species).sort().forEach(function(sp) {
    select.innerHTML += '<option value="' + escapeHtml(sp) + '">' + escapeHtml(sp) + '</option>';
  });
}

function populateSalesYearFilter() {
  var years = {};
  state.data.collection.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    if (st === "sold" || st === "on hold" || st === "hold") {
      var soldDate = parseDate(r["DATE SOLD"]);
      if (soldDate) {
        years[soldDate.getFullYear()] = true;
      }
    }
  });
  
  var select = document.getElementById("filterSalesYear");
  select.innerHTML = '<option value="">All Years</option>';
  Object.keys(years).sort().reverse().forEach(function(yr) {
    select.innerHTML += '<option value="' + yr + '">' + yr + '</option>';
  });
}

function renderTableStats() {
  var statsView = document.getElementById("tableStatsView");
  var stats = calculateStats();
  var html = '';
  
  // Count on loan separately
  var onLoanCount = 0;
  state.data.collection.forEach(function(r) {
    if ((r.STATUS || "").toLowerCase().trim() === "on loan") onLoanCount++;
  });
  
  // Count clutch stats
  var hatchedCount = 0;
  var failedCount = 0;
  var totalEggs = 0;
  state.data.clutch.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    if (st === "hatched") hatchedCount++;
    if (st === "failed") failedCount++;
    var fertile = parseInt(r["# FERTILE"]) || 0;
    totalEggs += fertile;
  });
  
  if (state.activeTab === "collection") {
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Breeders</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.totalBreeders + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Males</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.maleBreeders + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Females</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.femaleBreeders + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">On Loan</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + onLoanCount + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else if (state.activeTab === "clutches") {
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Incubating</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.incubating + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Hatched</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + hatchedCount + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Failed</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + failedCount + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Total Eggs</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + totalEggs + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else if (state.activeTab === "hatchlings") {
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Listed</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.listed + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Unlisted</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.unlisted + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Holdbacks</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.holdbacks + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">On Hold</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.onHold + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else if (state.activeTab === "sales") {
    var currentYear = new Date().getFullYear();
    var displayYear = state.filters.salesYear ? parseInt(state.filters.salesYear) : currentYear;
    
    // Calculate stats for the selected year
    var salesStats = calculateSalesStatsForYear(displayYear);
    
    // Year filter dropdown
    html += '<div class="mb-4 flex items-center gap-2">';
    html += '<label class="text-sm text-gray-600">Show sales from:</label>';
    html += '<select onchange="state.filters.salesYear=this.value; renderCurrentView();" class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">';
    html += '<option value="">All Years</option>';
    for (var y = currentYear; y >= currentYear - 5; y--) {
      var selected = state.filters.salesYear === String(y) ? ' selected' : '';
      html += '<option value="' + y + '"' + selected + '>' + y + '</option>';
    }
    html += '</select>';
    html += '</div>';
    
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Sold (' + displayYear + ')</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + salesStats.sold + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Revenue</div>';
    html += '<div class="text-2xl font-black text-gray-900">$' + salesStats.revenue.toLocaleString() + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">On Hold</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.onHold + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Unshipped</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + stats.unshipped + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else if (state.activeTab === "activity") {
    var activityStats = calculateActivityStats();
    
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Feedings (Month)</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.feedingsMonth + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Refusals (Month)</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.refusalsMonth + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Sheds (Month)</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.shedsMonth + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Ovulations (Month)</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.ovulationsMonth + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else if (state.activeTab === "pairings") {
    var activityStats = calculateActivityStats();
    var currentYear = new Date().getFullYear();
    
    html += '<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Paired (' + currentYear + ')</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.pairedYear + '</div>';
    html += '</div>';
    html += '<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 border border-gray-200">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-500">Locked (' + currentYear + ')</div>';
    html += '<div class="text-2xl font-black text-gray-900">' + activityStats.lockedYear + '</div>';
    html += '</div>';
    html += '</div>';
    statsView.innerHTML = html;
    statsView.classList.remove("hidden");
    
  } else {
    statsView.classList.add("hidden");
    statsView.innerHTML = '';
  }
}

function getColumns() {
  var prefs = {
    collection: ["QR", "UNIQUE ID", "ANIMAL NAME", "SEX", "MATURITY", "GENETIC SUMMARY", "STATUS"],
    clutches: ["CLUTCH ID", "SIRE", "DAM", "LAY DATE", "# FERTILE", "STATUS"],
    pairings: ["DATE", "SIRE", "DAM", "ACTIVITY"],
    hatchlings: ["QR", "UNIQUE ID", "CLUTCH ID", "ANIMAL NAME", "SEX", "MATURITY", "GENETIC SUMMARY", "STATUS", "LIST PRICE"],
    sales: ["UNIQUE ID", "ANIMAL NAME", "STATUS", "SOLD PRICE", "TOTAL PAID", "DATE SOLD", "BUYER NAME"],
    activity: ["DATE", "UNIQUE ID", "ACTIVITY", "VALUE"]
  };
  var h = state.headers[getSheetKey(state.activeTab)] || [];
  var hUpper = h.map(function(x) { return (x || "").toUpperCase(); });
  var wanted = prefs[state.activeTab] || [];
  // QR, MATURITY are virtual columns for collection/hatchlings
  // SIRE, DAM are virtual columns for pairings (mapped from UNIQUE ID and VALUE)
  var virtualCols = ["QR", "MATURITY"];
  if (state.activeTab === "pairings") {
    virtualCols.push("SIRE", "DAM");
  }
  var result = wanted.filter(function(w) { 
    return virtualCols.indexOf(w) >= 0 || hUpper.indexOf(w.toUpperCase()) >= 0; 
  });
  return result.length ? result : h.slice(0, 6);
}

function getFilteredRows() {
  var sheetKey = getSheetKey(state.activeTab);
  var rows = state.data[sheetKey] || [];
  var searchTerm = (state.filters.search || "").toLowerCase().trim();
  var alertFilter = state.filters.alertFilter || "";
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  var threeDaysOut = new Date(today);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  var thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return rows.filter(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    
    // Global search filter - applies to all tabs
    if (searchTerm) {
      var name = (r["ANIMAL NAME"] || "").toLowerCase();
      var uniqueId = (r["UNIQUE ID"] || "").toLowerCase();
      var manualId = (r["MANUAL OVERRIDE"] || "").toLowerCase();
      var clutchId = (r["CLUTCH ID"] || "").toLowerCase();
      
      var matchesSearch = name.indexOf(searchTerm) >= 0 ||
                          uniqueId.indexOf(searchTerm) >= 0 ||
                          manualId.indexOf(searchTerm) >= 0 ||
                          clutchId.indexOf(searchTerm) >= 0;
      
      if (!matchesSearch) return false;
    }
    
    if (state.activeTab === "collection") {
      // First check if it's a valid collection status
      if (!(st === "breeder" || st === "collection" || st === "holdback" || st === "on loan")) {
        return false;
      }
      // Apply sex filter
      if (state.filters.sex && r.SEX !== state.filters.sex) {
        return false;
      }
      // Apply status filter
      if (state.filters.status && (r.STATUS || "").toLowerCase() !== state.filters.status.toLowerCase()) {
        return false;
      }
      // Apply species filter
      if (state.filters.species && r.SPECIES !== state.filters.species) {
        return false;
      }
      // Apply gene filter
      if (state.filters.gene) {
        var genes = (r["GENETIC SUMMARY"] || "").toLowerCase();
        if (genes.indexOf(state.filters.gene.toLowerCase()) < 0) {
          return false;
        }
      }
      return true;
    }
    if (state.activeTab === "clutches") {
      // Alert filters for clutches
      if (alertFilter === "overdueClutches") {
        var estHatchDate = r["EST. HATCH DATE"] || r["EST HATCH DATE"] || r["ESTIMATED HATCH DATE"] || "";
        var clutchStatus = (r.STATUS || "").toLowerCase();
        if (clutchStatus !== "incubating") return false;
        if (!estHatchDate) return false;
        var estDate = parseDate(estHatchDate);
        if (!estDate || estDate >= today) return false;
        return true;
      }
      if (alertFilter === "clutchesDueSoon") {
        var estHatchDate = r["EST. HATCH DATE"] || r["EST HATCH DATE"] || r["ESTIMATED HATCH DATE"] || "";
        var clutchStatus = (r.STATUS || "").toLowerCase();
        if (clutchStatus !== "incubating") return false;
        if (!estHatchDate) return false;
        var estDate = parseDate(estHatchDate);
        if (!estDate) return false;
        if (estDate < today || estDate > sevenDaysOut) return false;
        return true;
      }
      // Show all clutches (including hatched) when no alert filter
      return true;
    }
    if (state.activeTab === "hatchlings") {
      // First check if it's a valid hatchling status
      if (!(st === "listed" || st === "unlisted" || st === "not listed" || st === "for sale")) {
        return false;
      }
      
      // Alert filters for hatchlings
      if (alertFilter === "needsSexing") {
        var sex = (r.SEX || "").toLowerCase();
        if (st !== "unlisted" && st !== "not listed") return false;
        if (sex && sex !== "unknown") return false;
        return true;
      }
      if (alertFilter === "readyToList") {
        if (st !== "unlisted" && st !== "not listed") return false;
        var dob = parseDate(r["DATE OF BIRTH"]);
        if (!dob || dob > thirtyDaysAgo) return false;
        return true;
      }
      
      // Apply sex filter
      if (state.filters.sex && r.SEX !== state.filters.sex) {
        return false;
      }
      // Apply status filter
      if (state.filters.status && (r.STATUS || "").toLowerCase() !== state.filters.status.toLowerCase()) {
        return false;
      }
      // Apply species filter
      if (state.filters.species && r.SPECIES !== state.filters.species) {
        return false;
      }
      // Apply gene filter
      if (state.filters.gene) {
        var genes = (r["GENETIC SUMMARY"] || "").toLowerCase();
        if (genes.indexOf(state.filters.gene.toLowerCase()) < 0) {
          return false;
        }
      }
      return true;
    }
    if (state.activeTab === "sales") {
      // First filter by sales status
      if (!(st === "on hold" || st === "hold" || st === "sold")) {
        return false;
      }
      
      // Alert filters for sales
      if (alertFilter === "balanceDue") {
        var soldPrice = parseFloat(r["SOLD PRICE"]) || 0;
        var totalPaid = parseFloat(r["TOTAL PAID"]) || 0;
        if (!(soldPrice > 0 && totalPaid < soldPrice)) return false;
        return true;
      }
      if (alertFilter === "unshipped") {
        if (st !== "sold") return false;
        var shipDate = parseDate(r["SHIP DATE"]);
        if (!shipDate) return true; // No ship date = unshipped
        if (shipDate <= sevenDaysOut) return true;
        return false;
      }
      if (alertFilter === "shippingSoon") {
        var shipDate = parseDate(r["SHIP DATE"]);
        if (!shipDate) return false;
        if (shipDate < today || shipDate > threeDaysOut) return false;
        return true;
      }
      if (alertFilter === "unpaidDeposits") {
        if (st !== "on hold" && st !== "hold") return false;
        var paymentStatus = (r["PAYMENT STATUS"] || "").toLowerCase();
        if (paymentStatus !== "deposit") return false;
        return true;
      }
      
      // Apply year filter if set
      if (state.filters.salesYear) {
        var soldDate = parseDate(r["DATE SOLD"]);
        if (!soldDate || soldDate.getFullYear() !== parseInt(state.filters.salesYear)) {
          return false;
        }
      }
      // Apply status filter if set
      if (state.filters.salesStatus) {
        var statusMatch = state.filters.salesStatus.toLowerCase();
        if (st !== statusMatch && !(statusMatch === "on hold" && st === "hold")) {
          return false;
        }
      }
      return true;
    }
    if (state.activeTab === "pairings") {
      // Filter to only show Paired and Lock activities for current year
      var activity = (r.ACTIVITY || "").toLowerCase().trim();
      if (!(activity === "paired" || activity === "lock")) {
        return false;
      }
      // Filter to current year only
      var activityDate = parseDate(r.DATE);
      var currentYear = new Date().getFullYear();
      if (activityDate && activityDate.getFullYear() !== currentYear) {
        return false;
      }
      return true;
    }
    return true;
  });
}

function getSheetKey(tab) {
  if (tab === "clutches") return "clutch";
  if (tab === "hatchlings" || tab === "sales" || tab === "collection") return "collection";
  if (tab === "activity" || tab === "pairings") return "activity";
  return "collection";
}

