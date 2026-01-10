/*
 * THE RACK - Configuration
 * Version: 3.6
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 3.6: Clutch form now shows ONLY explicit field list
 * - 3.5: Rewrote Import Collection to handle Collection CSV format with auto-generated UNIQUE IDs
 * - 3.4: Added Import Collection link to sidebar
 * - 3.3: Fixed Clutches table to show CLUTCH ID column (was incorrectly set to UNIQUE ID)
 * - 3.2: Changed Clutches table first column from CLUTCH ID to UNIQUE ID
 * - 3.1: Added EST. HATCH DATE column to Clutches table
 * - 3.0: Fixed Pairings table to show DATE, UNIQUE ID, PAIRED WITH, ACTIVITY columns directly
 * - 2.12.47: App writes UNIQUE ID/CLUTCH ID to sheet, fix activity animal select, hide DAYS TILL HATCH
 * - 2.12.43: Fixed missing modal HTML - added all modals back to index.html
 * - 2.12.42: Added debug logging to trace script loading
 * - 2.12.41: Fixed button closures in tables.js, removed duplicate init() call
 * - 2.12.40: Removed bin tag PDF code, HTML print only
 * - 2.12.0: Split from monolithic index.html
 */

var VERSION = "3.6";
var API_URL = "https://script.google.com/macros/s/AKfycbxBCpAzek-NAGTLtORGt6JmenXjPlcH_p1XmuPTycZ4mSHRvkn8kFxrcd_Hu8nMAmnK/exec";

var SHEET_TABS = {
  collection: "Collection",
  clutch: "Clutch", 
  activity: "Activity",
  archive: "Archive",
  settings: "Settings"
};

var FIELD_OPTIONS = {
  SEX: ["Female", "Male", "Unknown"],
  STATUS: ["Breeder", "Holdback", "Listed", "Unlisted", "On Hold", "Sold", "Deceased", "Retired", "On Loan"],
  CLUTCH_STATUS: ["Incubating", "Hatched", "Failed"],
  ACTIVITY: ["Took Meal", "Refused Meal", "Weight", "Shed", "Note", "Health Hold", "Paired", "Lock", "Follicle Size", "Ovulation", "Pre Lay Shed", "Laid", "Sold", "Hatched", "Clutch Went Bad"],
  SALE_SOURCE: ["MorphMarket", "Instagram", "Facebook", "Repeat Buyer", "Local Show", "Website", "Other"],
  PAYMENT_STATUS: ["Deposit", "Paid", "Refunded"]
};

// ============ STATE ============
var state = {
  email: localStorage.getItem("therack_email") || "",
  sheetId: localStorage.getItem("therack_sheet_id") || "",
  isLoggedIn: false,
  isLoading: false,
  activeTab: "dashboard",
  data: { collection: [], clutch: [], activity: [], archive: [], settings: {} },
  headers: { collection: [], clutch: [], activity: [], archive: [] },
  settings: {},
  modalMode: "add",
  modalTab: null,
  editRowIndex: null,
  formData: {},
  originalData: {},
  modifiedFields: null,
  hatchClutchRow: null,
  hatchDate: "",
  hatchCount: 1,
  hatchDrafts: [],
  saleAnimalRow: null,
  saleForm: {},
  qrPending: null,
  filters: {
    sex: "",
    status: "",
    species: "",
    gene: "",
    salesYear: "",
    salesStatus: "",
    search: ""
  },
  invoice: {
    number: "",
    date: "",
    animals: [],
    buyerName: "",
    buyerEmail: "",
    buyerAddress: "",
    shipping: 0,
    taxRate: 0,
    notes: ""
  }
};
