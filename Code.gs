/**
 * ======================================================================
 * THE RACK - OFFICIAL PRODUCTION CODE (WORKSHEET RECEIVER)
 * ----------------------------------------------------------------------
 * PERMANENT INSTRUCTION: DO NOT DELETE OR TRUNCATE THE CHANGE LOG.
 * ----------------------------------------------------------------------
 * VERSION: 14.0
 * LAST UPDATED:    January 10, 2026
 * CHANGE LOG:
 * v14.0 - Removed all custom menus (Import Tools, Tag Templates, Open Menu)
 *       - Added RECORD_ID support for duplicate prevention
 *       - Added ensureRecordIdColumn, generateRecordId, findRowByRecordId
 *       - Added saveRecordWithId for create/update logic
 * v13.1 - Clutch Hatch Date: Modified getClutchData and updateClutch to 
 *         support saving/reading from Column J.
 * v13.0 - Clutch Update Support: Added getClutchData and updateClutch bridges.
 * ======================================================================
 */

// ==========================================
// 1. SYSTEM TRIGGERS
// ==========================================

function onOpen() {
  // No custom menus - app is accessed via web interface
}

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  if (sheet.getName() === "MOBILE VIEW" && e.range.getValue() === "SUBMIT") {
    if (e.range.getA1Notation() === "C18") { runMobileSave(e); return; }
    if (e.range.getA1Notation() === "C34") { runNewResident(e); return; }
  }
  if (typeof RackSystemCore !== 'undefined') RackSystemCore.handleEdit(e);
}

// ==========================================
// 2. RECORD_ID SYSTEM
// ==========================================

/**
 * Ensures RECORD_ID column exists on the specified sheet
 * Adds it as the last column if missing
 */
function ensureRecordIdColumn(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: "Sheet not found: " + sheetName };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const recordIdIndex = headers.indexOf("RECORD_ID");
  
  if (recordIdIndex === -1) {
    // Add RECORD_ID as the last column
    const newColIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColIndex).setValue("RECORD_ID");
    return { success: true, columnIndex: newColIndex, created: true };
  }
  
  return { success: true, columnIndex: recordIdIndex + 1, created: false };
}

/**
 * Generates a unique RECORD_ID based on timestamp
 */
function generateRecordId() {
  return Date.now().toString();
}

/**
 * Finds a row by RECORD_ID
 * Returns row number (1-indexed) or -1 if not found
 */
function findRowByRecordId(sheetName, recordId) {
  if (!recordId) return -1;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return -1;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const recordIdIndex = headers.indexOf("RECORD_ID");
  if (recordIdIndex === -1) return -1;
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  
  const recordIds = sheet.getRange(2, recordIdIndex + 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < recordIds.length; i++) {
    if (String(recordIds[i][0]) === String(recordId)) {
      return i + 2; // +2 because array is 0-indexed and we skip header row
    }
  }
  
  return -1;
}

/**
 * Saves a record with RECORD_ID support
 * - If RECORD_ID exists and row found: update
 * - If RECORD_ID exists but row not found: create new
 * - If no RECORD_ID: create new with generated ID
 */
function saveRecordWithId(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: "Sheet not found: " + sheetName };
  
  // Ensure RECORD_ID column exists
  ensureRecordIdColumn(sheetName);
  
  // Get headers
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const recordIdIndex = headers.indexOf("RECORD_ID");
  
  // Check if we have an existing RECORD_ID
  const existingRecordId = data["RECORD_ID"] || data["recordId"];
  let rowToUpdate = -1;
  
  if (existingRecordId) {
    rowToUpdate = findRowByRecordId(sheetName, existingRecordId);
  }
  
  if (rowToUpdate > 0) {
    // UPDATE existing row
    const rowData = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (data.hasOwnProperty(header)) {
        rowData.push(data[header]);
      } else {
        // Keep existing value
        rowData.push(sheet.getRange(rowToUpdate, i + 1).getValue());
      }
    }
    sheet.getRange(rowToUpdate, 1, 1, headers.length).setValues([rowData]);
    return { success: true, action: "updated", rowIndex: rowToUpdate - 2, recordId: existingRecordId };
  } else {
    // CREATE new row
    const newRecordId = existingRecordId || generateRecordId();
    data["RECORD_ID"] = newRecordId;
    
    const rowData = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      rowData.push(data[header] || "");
    }
    
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, headers.length).setValues([rowData]);
    return { success: true, action: "created", rowIndex: newRow - 2, recordId: newRecordId };
  }
}

/**
 * Checks if a record with given RECORD_ID exists
 */
function recordExists(sheetName, recordId) {
  return findRowByRecordId(sheetName, recordId) > 0;
}

/**
 * Gets all RECORD_IDs from a sheet
 */
function getAllRecordIds(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const recordIdIndex = headers.indexOf("RECORD_ID");
  if (recordIdIndex === -1) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const recordIds = sheet.getRange(2, recordIdIndex + 1, lastRow - 1, 1).getValues();
  return recordIds.map(function(row) { return String(row[0]); }).filter(function(id) { return id && id !== ""; });
}

// ==========================================
// 3. BRIDGE FUNCTIONS
// ==========================================

function getAnimalNameById(id) { return RackSystemCore.getAnimalNameById(id); }
function getClutchData(id) { return RackSystemCore.getClutchData(id); }
function updateClutch(data) { return RackSystemCore.updateClutch(data); }
function launchAdminPanelFromModal() { showAdminSidebar(); }
function showAdminSidebar() { if (typeof RackSystemCore !== 'undefined') RackSystemCore.showAdminSidebar(); else SpreadsheetApp.getUi().alert("Library Error."); }
function addCollectionAnimal(data) { return RackSystemCore.addCollectionAnimal(data); }
function addNewClutch(data) { return RackSystemCore.addNewClutch(data); }
function addNewHatchling(data) { return RackSystemCore.addNewHatchling(data); }
function getCollectionNames() { return RackSystemCore.getCollectionNames(); }
function getClutchIds() { return RackSystemCore.getClutchIds(); }
function getCollectionAnimalData(id) { return RackSystemCore.getCollectionAnimalData(id); }
function getHatchlingData(id) { return RackSystemCore.getHatchlingData(id); }
function updateCollectionAnimal(data) { return RackSystemCore.updateCollectionAnimal(data); }
function logActivityFromSidebar(id, action, val) { return RackSystemCore.logActivityFromSidebar(id, action, val); }
function getAnimalHistory(id) { return RackSystemCore.getAnimalHistory(id); }
function updateHatchlingStatus(data) { return RackSystemCore.updateHatchlingStatus(data); }

// ==========================================
// 4. HELPERS
// ==========================================

function findNextEmptyRow(sheet) { 
  const values = sheet.getRange("B:B").getValues(); 
  for (let i = 1; i < values.length; i++) {
    if (!values[i][0]) return i + 1; 
  }
  return values.length + 1; 
}

// ==========================================
// 5. MOBILE LOGIC
// ==========================================

function runMobileSave(e) {
  const s = e.source.getActiveSheet(); 
  const log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Activity"); 
  const id = String(s.getRange("C3").getValue()).trim(); 
  const act = String(s.getRange("C15").getValue()).trim(); 
  let val = s.getRange("C16").getValue(); 
  if (!id || !act) return; 
  if (!isNaN(parseFloat(val)) && isFinite(val)) val = parseFloat(val); 
  const row = findNextEmptyRow(log); 
  log.getRange(row, 1, 1, 4).setValues([[new Date(), id, act, val]]); 
  s.getRange("C16").clearContent(); 
  e.range.setValue("");
}

function runNewResident(e) {
  const s = e.source.getActiveSheet(); 
  const coll = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Collection"); 
  const ins = s.getRange("C23:C32").getValues().flat(); 
  const name = String(ins[0]).trim(); 
  if (!name) return; 
  const row = findNextEmptyRow(coll); 
  coll.getRange(row, 2).setValue(name); 
  coll.getRange(row, 3).setValue(String(ins[1] || "Unknown").trim()); 
  coll.getRange(row, 5).setValue(ins[4] || new Date().getFullYear()); 
  coll.getRange(row, 6).setValue(ins[3]); 
  coll.getRange(row, 7).setValue(String(ins[5] || "Ball Python").trim()); 
  coll.getRange(row, 8).setValue(String(ins[6] || "Normal").trim()); 
  coll.getRange(row, 9).setValue(String(ins[2] || "Breeder").trim()); 
  coll.getRange(row, 10).setValue(parseFloat(ins[7]) || 0); 
  coll.getRange(row, 12).setValue(parseFloat(ins[8]) || 0); 
  coll.getRange(row, 13).setValue(String(ins[9] || "Self-Produced").trim()); 
  s.getRange("C23:C32").clearContent(); 
  e.range.setValue("");
}
