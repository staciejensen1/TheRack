/*
 * THE RACK - Configuration
 * Version: 2.12.2
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.2: Updated version for bin tag PDF download feature
 * - 2.12.0: Split from monolithic index.html
 */

var VERSION = "2.12.38";
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
