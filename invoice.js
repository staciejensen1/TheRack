/*
 * THE RACK - Invoice Functions
 * Version: 2.12.0
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */


// ============ INVOICE FUNCTIONS ============
function openInvoiceModal(row) {
  if (!state.isLoggedIn) {
    setStatus("Please log in first", true);
    return;
  }
  
  // Generate invoice number
  var counter = parseInt(state.settings["INVOICE COUNTER"]) || 0;
  counter++;
  var year = new Date().getFullYear();
  var invoiceNum = "INV-" + year + "-" + String(counter).padStart(4, "0");
  
  // Initialize invoice state
  state.invoice = {
    number: invoiceNum,
    counter: counter,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    animals: [row],
    buyerName: row["BUYER NAME"] || "",
    buyerEmail: row["BUYER EMAIL"] || "",
    buyerAddress: row["BUYER ADDRESS"] || "",
    shipping: parseFloat(row["SHIPPING FEE"]) || 0,
    taxRate: parseFloat(state.settings["DEFAULT TAX RATE"]) || 0,
    deposit: parseFloat(row["TOTAL PAID"]) || 0,
    notes: ""
  };
  
  // Calculate due date (7 days from now)
  var dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  state.invoice.dueDate = dueDate.toISOString().split("T")[0];
  
  document.getElementById("invoiceNumber").textContent = invoiceNum;
  renderInvoiceModal();
  document.getElementById("invoiceModal").classList.remove("hidden");
}

function closeInvoiceModal() {
  document.getElementById("invoiceModal").classList.add("hidden");
  document.getElementById("invoiceModalError").textContent = "";
}

function renderInvoiceModal() {
  var inv = state.invoice;
  var html = '';
  
  // Invoice Info Row
  html += '<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Invoice Date</label>';
  html += '<input type="date" id="invoiceDate" value="' + inv.date + '" onchange="state.invoice.date=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Due Date</label>';
  html += '<input type="date" id="invoiceDueDate" value="' + inv.dueDate + '" onchange="state.invoice.dueDate=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">';
  html += '</div>';
  html += '<div></div>';
  html += '</div>';
  
  // Buyer Info
  html += '<div class="bg-gray-50 rounded-xl p-4 mb-6">';
  html += '<div class="text-xs font-semibold text-gray-600 uppercase mb-3">Bill To</div>';
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
  html += '<div>';
  html += '<label class="block text-xs text-gray-500 mb-1">Name</label>';
  html += '<input type="text" id="invoiceBuyerName" value="' + escapeHtml(inv.buyerName) + '" onchange="state.invoice.buyerName=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Buyer name">';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs text-gray-500 mb-1">Email</label>';
  html += '<input type="email" id="invoiceBuyerEmail" value="' + escapeHtml(inv.buyerEmail) + '" onchange="state.invoice.buyerEmail=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="buyer@email.com">';
  html += '</div>';
  html += '<div class="md:col-span-2">';
  html += '<label class="block text-xs text-gray-500 mb-1">Address</label>';
  html += '<input type="text" id="invoiceBuyerAddress" value="' + escapeHtml(inv.buyerAddress) + '" onchange="state.invoice.buyerAddress=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Street, City, State ZIP">';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  
  // Animals List
  html += '<div class="mb-6">';
  html += '<div class="flex items-center justify-between mb-3">';
  html += '<div class="text-xs font-semibold text-gray-600 uppercase">Line Items</div>';
  html += '<button onclick="showAddAnimalDropdown()" class="text-sm text-gray-600 hover:text-gray-900">+ Add Another Animal</button>';
  html += '</div>';
  
  html += '<div class="border border-gray-200 rounded-xl overflow-hidden">';
  html += '<table class="w-full text-sm">';
  html += '<thead class="bg-gray-100">';
  html += '<tr>';
  html += '<th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Animal</th>';
  html += '<th class="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>';
  html += '<th class="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>';
  html += '<th class="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Remove</th>';
  html += '</tr>';
  html += '</thead>';
  html += '<tbody>';
  
  inv.animals.forEach(function(animal, idx) {
    var animalId = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var animalName = animal["ANIMAL NAME"] || "";
    var species = animal["SPECIES"] || "";
    var sex = animal["SEX"] || "";
    var genetics = animal["GENETIC SUMMARY"] || "";
    var price = parseFloat(animal["SOLD PRICE"]) || 0;
    
    html += '<tr class="border-t border-gray-100">';
    html += '<td class="px-3 py-3">';
    html += '<div class="font-medium text-gray-900">' + escapeHtml(animalId) + '</div>';
    html += '<div class="text-gray-500 text-xs">' + escapeHtml(animalName) + '</div>';
    html += '</td>';
    html += '<td class="px-3 py-3">';
    html += '<div class="text-gray-700">' + escapeHtml(species) + ' - ' + escapeHtml(sex) + '</div>';
    html += '<div class="text-gray-500 text-xs">' + escapeHtml(genetics) + '</div>';
    html += '</td>';
    html += '<td class="px-3 py-3 text-right font-medium">$' + price.toFixed(2) + '</td>';
    html += '<td class="px-3 py-3 text-center">';
    if (inv.animals.length > 1) {
      html += '<button onclick="removeInvoiceAnimal(' + idx + ')" class="text-red-500 hover:text-red-700">X</button>';
    } else {
      html += '<span class="text-gray-300">-</span>';
    }
    html += '</td>';
    html += '</tr>';
  });
  
  html += '</tbody>';
  html += '</table>';
  html += '</div>';
  
  // Add Animal Dropdown (hidden by default)
  html += '<div id="addAnimalDropdown" class="hidden mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">';
  html += '<label class="block text-xs text-gray-500 mb-1">Select animal to add:</label>';
  html += '<select id="addAnimalSelect" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">';
  html += '<option value="">Choose an animal...</option>';
  
  // Filter to same buyer (by name or email) and exclude already added
  var addedIds = inv.animals.map(function(a) { return a["UNIQUE ID"] || a["MANUAL OVERRIDE"]; });
  var sameBuyerAnimals = state.data.collection.filter(function(r) {
    var st = (r.STATUS || "").toLowerCase();
    if (st !== "sold" && st !== "on hold") return false;
    var rid = r["UNIQUE ID"] || r["MANUAL OVERRIDE"];
    if (addedIds.indexOf(rid) >= 0) return false;
    // Match by buyer name or email
    var buyerMatch = (r["BUYER NAME"] && r["BUYER NAME"] === inv.buyerName) ||
                     (r["BUYER EMAIL"] && r["BUYER EMAIL"] === inv.buyerEmail);
    return buyerMatch;
  });
  
  if (sameBuyerAnimals.length === 0) {
    html += '<option value="" disabled>No other animals for this buyer</option>';
  } else {
    sameBuyerAnimals.forEach(function(r) {
      var rid = r["UNIQUE ID"] || r["MANUAL OVERRIDE"];
      var rname = r["ANIMAL NAME"] || "";
      var rprice = parseFloat(r["SOLD PRICE"]) || 0;
      html += '<option value="' + escapeHtml(rid) + '">' + escapeHtml(rid) + ' - ' + escapeHtml(rname) + ' ($' + rprice.toFixed(2) + ')</option>';
    });
  }
  
  html += '</select>';
  html += '<div class="mt-2 flex gap-2">';
  html += '<button onclick="addSelectedAnimal()" class="px-3 py-1 bg-gray-900 text-white text-sm rounded-lg">Add</button>';
  html += '<button onclick="hideAddAnimalDropdown()" class="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg">Cancel</button>';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Totals Section
  var subtotal = 0;
  inv.animals.forEach(function(a) {
    subtotal += parseFloat(a["SOLD PRICE"]) || 0;
  });
  var shipping = parseFloat(inv.shipping) || 0;
  var taxRate = parseFloat(inv.taxRate) || 0;
  var taxAmount = (subtotal + shipping) * (taxRate / 100);
  var total = subtotal + shipping + taxAmount;
  var deposit = parseFloat(inv.deposit) || 0;
  var balanceDue = total - deposit;
  
  html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">';
  
  // Left column - editable fields
  html += '<div class="space-y-3">';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Shipping</label>';
  html += '<input type="number" step="0.01" id="invoiceShipping" value="' + shipping + '" onchange="updateInvoiceShipping(this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="0.00">';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Tax Rate (%)</label>';
  html += '<input type="number" step="0.01" id="invoiceTaxRate" value="' + taxRate + '" onchange="updateInvoiceTaxRate(this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="0">';
  html += '</div>';
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Deposit/Amount Paid</label>';
  html += '<input type="number" step="0.01" id="invoiceDeposit" value="' + deposit + '" onchange="updateInvoiceDeposit(this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="0.00">';
  html += '</div>';
  html += '</div>';
  
  // Right column - calculated totals
  html += '<div class="bg-gray-50 rounded-xl p-4">';
  html += '<div class="flex justify-between py-2 border-b border-gray-200">';
  html += '<span class="text-gray-600">Subtotal</span>';
  html += '<span class="font-medium">$' + subtotal.toFixed(2) + '</span>';
  html += '</div>';
  html += '<div class="flex justify-between py-2 border-b border-gray-200">';
  html += '<span class="text-gray-600">Shipping</span>';
  html += '<span class="font-medium">$' + shipping.toFixed(2) + '</span>';
  html += '</div>';
  html += '<div class="flex justify-between py-2 border-b border-gray-200">';
  html += '<span class="text-gray-600">Tax (' + taxRate + '%)</span>';
  html += '<span class="font-medium">$' + taxAmount.toFixed(2) + '</span>';
  html += '</div>';
  html += '<div class="flex justify-between py-2 border-b border-gray-200">';
  html += '<span class="text-gray-600 font-semibold">Total</span>';
  html += '<span class="font-bold">$' + total.toFixed(2) + '</span>';
  html += '</div>';
  if (deposit > 0) {
    html += '<div class="flex justify-between py-2 border-b border-gray-200">';
    html += '<span class="text-gray-600">Deposit Received</span>';
    html += '<span class="font-medium text-green-600">-$' + deposit.toFixed(2) + '</span>';
    html += '</div>';
  }
  html += '<div class="flex justify-between py-3 bg-gray-200 -mx-4 -mb-4 px-4 rounded-b-xl">';
  html += '<span class="text-gray-900 font-bold">Amount Due</span>';
  html += '<span class="font-bold text-lg">$' + balanceDue.toFixed(2) + '</span>';
  html += '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Notes
  html += '<div>';
  html += '<label class="block text-xs font-semibold text-gray-600 uppercase mb-1">Notes (optional)</label>';
  html += '<textarea id="invoiceNotes" onchange="state.invoice.notes=this.value" class="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" rows="2" placeholder="Additional notes for this invoice...">' + escapeHtml(inv.notes) + '</textarea>';
  html += '</div>';
  
  document.getElementById("invoiceModalBody").innerHTML = html;
}

function showAddAnimalDropdown() {
  document.getElementById("addAnimalDropdown").classList.remove("hidden");
}

function hideAddAnimalDropdown() {
  document.getElementById("addAnimalDropdown").classList.add("hidden");
}

function addSelectedAnimal() {
  var select = document.getElementById("addAnimalSelect");
  var selectedId = select.value;
  if (!selectedId) return;
  
  var animal = state.data.collection.find(function(r) {
    var rid = r["UNIQUE ID"] || r["MANUAL OVERRIDE"];
    return rid === selectedId;
  });
  
  if (animal) {
    state.invoice.animals.push(animal);
    // Update shipping to sum
    state.invoice.shipping += parseFloat(animal["SHIPPING FEE"]) || 0;
    renderInvoiceModal();
  }
}

function removeInvoiceAnimal(idx) {
  if (state.invoice.animals.length > 1) {
    var removed = state.invoice.animals.splice(idx, 1)[0];
    // Subtract shipping
    state.invoice.shipping -= parseFloat(removed["SHIPPING FEE"]) || 0;
    if (state.invoice.shipping < 0) state.invoice.shipping = 0;
    renderInvoiceModal();
  }
}

function updateInvoiceShipping(val) {
  state.invoice.shipping = parseFloat(val) || 0;
  renderInvoiceModal();
}

function updateInvoiceTaxRate(val) {
  state.invoice.taxRate = parseFloat(val) || 0;
  renderInvoiceModal();
}

function updateInvoiceDeposit(val) {
  state.invoice.deposit = parseFloat(val) || 0;
  renderInvoiceModal();
}

function generateInvoiceHTML() {
  var inv = state.invoice;
  var settings = state.settings;
  
  // Calculate totals
  var subtotal = 0;
  inv.animals.forEach(function(a) {
    subtotal += parseFloat(a["SOLD PRICE"]) || 0;
  });
  var shipping = parseFloat(inv.shipping) || 0;
  var taxRate = parseFloat(inv.taxRate) || 0;
  var taxAmount = (subtotal + shipping) * (taxRate / 100);
  var total = subtotal + shipping + taxAmount;
  var deposit = parseFloat(inv.deposit) || 0;
  var balanceDue = total - deposit;
  
  var html = '';
  html += '<div class="invoice-preview" style="background: white; padding: 40px; max-width: 800px; margin: 0 auto; font-family: Inter, system-ui, sans-serif; font-size: 14px; line-height: 1.5;">';
  
  // Header with gray bar
  html += '<div style="background: #f3f4f6; padding: 20px; margin: -40px -40px 30px -40px;">';
  html += '<div style="display: flex; justify-content: space-between; align-items: flex-start;">';
  html += '<div style="font-size: 32px; font-weight: 800; color: #111; letter-spacing: -1px;">INVOICE</div>';
  html += '<div style="text-align: right;">';
  html += '<table style="font-size: 12px; border-collapse: collapse;">';
  html += '<tr><td style="padding: 2px 10px; color: #666; font-weight: 600;">INVOICE #</td><td style="padding: 2px 10px; color: #666; font-weight: 600;">INVOICE DATE</td><td style="padding: 2px 10px; color: #666; font-weight: 600;">DUE DATE</td></tr>';
  html += '<tr><td style="padding: 2px 10px; color: #111;">' + inv.number + '</td><td style="padding: 2px 10px; color: #111;">' + formatDateDisplay(inv.date) + '</td><td style="padding: 2px 10px; color: #111;">' + formatDateDisplay(inv.dueDate) + '</td></tr>';
  html += '</table>';
  html += '</div>';
  html += '</div>';
  html += '</div>';
  
  // Seller and Buyer Info
  html += '<div style="display: flex; justify-content: space-between; margin-bottom: 30px;">';
  
  // Seller (left)
  html += '<div style="max-width: 45%;">';
  if (settings["LOGO URL"]) {
    html += '<img src="' + escapeHtml(settings["LOGO URL"]) + '" style="max-height: 50px; margin-bottom: 10px;" alt="Logo">';
  }
  html += '<div style="font-weight: 700; color: #111;">' + escapeHtml(settings["BUSINESS NAME"] || "Your Business Name") + '</div>';
  var address = [];
  if (settings["CITY"]) address.push(settings["CITY"]);
  if (settings["STATE"]) address.push(settings["STATE"]);
  if (settings["ZIP"]) address.push(settings["ZIP"]);
  if (address.length > 0) {
    html += '<div style="color: #666;">' + escapeHtml(address.join(", ")) + '</div>';
  }
  if (settings["EMAIL"]) html += '<div style="color: #666;">' + escapeHtml(settings["EMAIL"]) + '</div>';
  if (settings["PHONE"]) html += '<div style="color: #666;">' + escapeHtml(settings["PHONE"]) + '</div>';
  html += '</div>';
  
  // Buyer (right)
  html += '<div style="text-align: right; max-width: 45%;">';
  html += '<div style="font-size: 11px; color: #999; font-weight: 600; margin-bottom: 5px;">BILL TO:</div>';
  html += '<div style="font-weight: 700; color: #111;">' + escapeHtml(inv.buyerName || "Customer Name") + '</div>';
  if (inv.buyerAddress) html += '<div style="color: #666;">' + escapeHtml(inv.buyerAddress) + '</div>';
  if (inv.buyerEmail) html += '<div style="color: #666;">' + escapeHtml(inv.buyerEmail) + '</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Line Items Table
  html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">';
  html += '<thead>';
  html += '<tr style="background: #f9fafb;">';
  html += '<th style="padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Animal ID / Description</th>';
  html += '<th style="padding: 10px 12px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Qty</th>';
  html += '<th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Price</th>';
  html += '<th style="padding: 10px 12px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Total</th>';
  html += '</tr>';
  html += '</thead>';
  html += '<tbody>';
  
  inv.animals.forEach(function(animal) {
    var animalId = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var animalName = animal["ANIMAL NAME"] || "";
    var species = animal["SPECIES"] || "";
    var sex = animal["SEX"] || "";
    var genetics = animal["GENETIC SUMMARY"] || "";
    var price = parseFloat(animal["SOLD PRICE"]) || 0;
    
    html += '<tr>';
    html += '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; vertical-align: top;">';
    html += '<div style="font-weight: 600; color: #111;">' + escapeHtml(animalId) + '</div>';
    if (animalName) html += '<div style="color: #666;">' + escapeHtml(animalName) + '</div>';
    html += '<div style="color: #888; font-size: 12px;">' + escapeHtml(species) + ' - ' + escapeHtml(sex) + '</div>';
    if (genetics) html += '<div style="color: #888; font-size: 12px;">' + escapeHtml(genetics) + '</div>';
    html += '</td>';
    html += '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; vertical-align: top;">1</td>';
    html += '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top;">$' + price.toFixed(2) + '</td>';
    html += '<td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: top; font-weight: 500;">$' + price.toFixed(2) + '</td>';
    html += '</tr>';
  });
  
  html += '</tbody>';
  html += '</table>';
  
  // Totals Section
  html += '<div style="display: flex; justify-content: flex-end;">';
  html += '<div style="width: 280px;">';
  
  html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">';
  html += '<span style="color: #666;">SUBTOTAL</span>';
  html += '<span style="color: #111;">$' + subtotal.toFixed(2) + '</span>';
  html += '</div>';
  
  if (shipping > 0) {
    html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">';
    html += '<span style="color: #666;">SHIPPING</span>';
    html += '<span style="color: #111;">$' + shipping.toFixed(2) + '</span>';
    html += '</div>';
  }
  
  if (taxRate > 0) {
    html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">';
    html += '<span style="color: #666;">TAX ' + taxRate + '%</span>';
    html += '<span style="color: #111;">$' + taxAmount.toFixed(2) + '</span>';
    html += '</div>';
  }
  
  if (deposit > 0) {
    html += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">';
    html += '<span style="color: #666;">DEPOSIT</span>';
    html += '<span style="color: #111;">-$' + deposit.toFixed(2) + '</span>';
    html += '</div>';
  }
  
  html += '<div style="display: flex; justify-content: space-between; padding: 12px; background: #e5e7eb; margin-top: 10px;">';
  html += '<span style="font-weight: 700; color: #111;">AMOUNT DUE</span>';
  html += '<span style="font-weight: 700; font-size: 18px; color: #111;">$' + balanceDue.toFixed(2) + '</span>';
  html += '</div>';
  
  html += '</div>';
  html += '</div>';
  
  // Terms / Footer
  var terms = settings["INVOICE TERMS"] || "";
  if (terms || inv.notes) {
    html += '<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666;">';
    if (terms) html += '<div>' + escapeHtml(terms) + '</div>';
    if (inv.notes) html += '<div style="margin-top: 10px;"><strong>Notes:</strong> ' + escapeHtml(inv.notes) + '</div>';
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
}

function previewInvoice() {
  var html = generateInvoiceHTML();
  document.getElementById("invoicePrintArea").innerHTML = html;
  document.getElementById("invoicePreviewModal").classList.remove("hidden");
}

function closeInvoicePreview() {
  document.getElementById("invoicePreviewModal").classList.add("hidden");
}

function printInvoice() {
  previewInvoice();
  setTimeout(function() {
    window.print();
  }, 300);
}

function printInvoiceFromPreview() {
  window.print();
}

function downloadInvoicePDF() {
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF('p', 'pt', 'letter');
  
  var inv = state.invoice;
  var settings = state.settings;
  
  // Calculate totals
  var subtotal = 0;
  inv.animals.forEach(function(a) {
    subtotal += parseFloat(a["SOLD PRICE"]) || 0;
  });
  var shipping = parseFloat(inv.shipping) || 0;
  var taxRate = parseFloat(inv.taxRate) || 0;
  var taxAmount = (subtotal + shipping) * (taxRate / 100);
  var total = subtotal + shipping + taxAmount;
  var deposit = parseFloat(inv.deposit) || 0;
  var balanceDue = total - deposit;
  
  var pageWidth = 612;
  var margin = 50;
  var y = 50;
  
  // Header background
  doc.setFillColor(243, 244, 246);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // INVOICE title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(17, 17, 17);
  doc.text('INVOICE', margin, 50);
  
  // Invoice details (right side)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(102, 102, 102);
  doc.text('INVOICE #', 400, 30);
  doc.text('INVOICE DATE', 470, 30);
  doc.text('DUE DATE', 540, 30);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(17, 17, 17);
  doc.text(inv.number, 400, 45);
  doc.text(formatDateDisplay(inv.date), 470, 45);
  doc.text(formatDateDisplay(inv.dueDate), 540, 45);
  
  y = 110;
  
  // Seller info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(settings["BUSINESS NAME"] || "Your Business Name", margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  y += 15;
  var address = [];
  if (settings["CITY"]) address.push(settings["CITY"]);
  if (settings["STATE"]) address.push(settings["STATE"]);
  if (settings["ZIP"]) address.push(settings["ZIP"]);
  if (address.length > 0) {
    doc.text(address.join(", "), margin, y);
    y += 12;
  }
  if (settings["EMAIL"]) {
    doc.text(settings["EMAIL"], margin, y);
    y += 12;
  }
  if (settings["PHONE"]) {
    doc.text(settings["PHONE"], margin, y);
  }
  
  // Buyer info (right side)
  var buyerY = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(153, 153, 153);
  doc.text('BILL TO:', pageWidth - margin - 150, buyerY - 10);
  
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(11);
  doc.text(inv.buyerName || "Customer Name", pageWidth - margin - 150, buyerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  if (inv.buyerAddress) {
    doc.text(inv.buyerAddress, pageWidth - margin - 150, buyerY + 20);
  }
  if (inv.buyerEmail) {
    doc.text(inv.buyerEmail, pageWidth - margin - 150, buyerY + 35);
  }
  
  // Line items table
  y = 180;
  
  // Table header
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, y, pageWidth - (margin * 2), 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('ANIMAL ID / DESCRIPTION', margin + 10, y + 16);
  doc.text('QTY', 380, y + 16);
  doc.text('PRICE', 430, y + 16);
  doc.text('TOTAL', 510, y + 16);
  
  y += 30;
  
  // Table rows
  inv.animals.forEach(function(animal) {
    var animalId = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "";
    var animalName = animal["ANIMAL NAME"] || "";
    var species = animal["SPECIES"] || "";
    var sex = animal["SEX"] || "";
    var genetics = animal["GENETIC SUMMARY"] || "";
    var price = parseFloat(animal["SOLD PRICE"]) || 0;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text(animalId, margin + 10, y + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    if (animalName) {
      doc.text(animalName, margin + 10, y + 24);
    }
    doc.setFontSize(9);
    doc.text(species + ' - ' + sex, margin + 10, y + 36);
    if (genetics) {
      var maxWidth = 250;
      var geneticsLines = doc.splitTextToSize(genetics, maxWidth);
      doc.text(geneticsLines, margin + 10, y + 48);
    }
    
    doc.setTextColor(17, 17, 17);
    doc.setFontSize(10);
    doc.text('1', 388, y + 12);
    doc.text('$' + price.toFixed(2), 430, y + 12);
    doc.setFont('helvetica', 'bold');
    doc.text('$' + price.toFixed(2), 510, y + 12);
    
    // Row line
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + 55, pageWidth - margin, y + 55);
    
    y += 60;
  });
  
  // Totals
  y += 20;
  var totalsX = 400;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  doc.text('SUBTOTAL', totalsX, y);
  doc.setTextColor(17, 17, 17);
  doc.text('$' + subtotal.toFixed(2), 530, y);
  
  if (shipping > 0) {
    y += 18;
    doc.setTextColor(102, 102, 102);
    doc.text('SHIPPING', totalsX, y);
    doc.setTextColor(17, 17, 17);
    doc.text('$' + shipping.toFixed(2), 530, y);
  }
  
  if (taxRate > 0) {
    y += 18;
    doc.setTextColor(102, 102, 102);
    doc.text('TAX ' + taxRate + '%', totalsX, y);
    doc.setTextColor(17, 17, 17);
    doc.text('$' + taxAmount.toFixed(2), 530, y);
  }
  
  if (deposit > 0) {
    y += 18;
    doc.setTextColor(102, 102, 102);
    doc.text('DEPOSIT', totalsX, y);
    doc.setTextColor(17, 17, 17);
    doc.text('-$' + deposit.toFixed(2), 530, y);
  }
  
  // Amount due box
  y += 25;
  doc.setFillColor(229, 231, 235);
  doc.rect(totalsX - 10, y - 12, pageWidth - margin - totalsX + 10, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);
  doc.text('AMOUNT DUE', totalsX, y + 5);
  doc.setFontSize(14);
  doc.text('$' + balanceDue.toFixed(2), pageWidth - margin - 10, y + 5, { align: 'right' });
  
  // Terms footer
  var terms = settings["INVOICE TERMS"] || "";
  if (terms || inv.notes) {
    y += 60;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    if (terms) {
      var termsLines = doc.splitTextToSize(terms, pageWidth - (margin * 2));
      doc.text(termsLines, margin, y);
      y += termsLines.length * 12;
    }
    if (inv.notes) {
      doc.text('Notes: ' + inv.notes, margin, y + 5);
    }
  }
  
  // Save
  doc.save('Invoice_' + inv.number + '.pdf');
}
