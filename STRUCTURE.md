# THE RACK - Structure Documentation
# Version: 3.9
# Last Updated: 2026-01-10

This file documents where everything is located in THE RACK application.
CLAUDE: UPDATE THIS FILE whenever you change file structure, rules, form fields, or table columns.

---

## FILES

| File | Purpose |
|------|---------|
| index.html | Main HTML, modals, sidebar navigation |
| config.js | VERSION variable, API URL, field options, app state |
| app.js | Init, navigation, utilities |
| api.js | API calls to Google Apps Script backend |
| tables.js | Table rendering, column definitions, filters |
| modals.js | Add/Edit forms, ID generation functions |
| dashboard.js | Dashboard stats and alerts |
| import.js | Import Collection from CSV |
| invoice.js | Invoice generation |
| bintags.js | Bin tag printing |
| qr-activity.js | QR code activity logging |
| hatch-sale.js | Hatch and sale modals |
| archive.js | Archive functionality |
| tools.js | Export, settings, changelog |
| help.html | Help guide page |
| styles.css | Custom styles |
| STRUCTURE.md | This file - documents structure and rules |

---

## ADD FORMS (SHOW ONLY - no skip lists)

### Add Breeder Form
**File:** modals.js (breederFormFields array)
**Method:** SHOW ONLY these fields
**Special elements at top:**
- UNIQUE ID preview (read-only, auto-generated)

**Fields shown:**
1. ANIMAL NAME
2. SEX
3. DATE OF BIRTH
4. SPECIES
5. GENETIC SUMMARY
6. STATUS
7. WT PURCHASE (G)
8. PURCHASE PRICE
9. BREEDER SOURCE
10. MANUAL OVERRIDE
11. NOTES

### Add Clutch Form
**File:** modals.js (clutchFormFields array)
**Method:** SHOW ONLY these fields
**Special elements at top:**
- UNIQUE ID preview (read-only, auto-generated)
- ESTIMATED HATCH DATE preview (read-only, calculated from LAY DATE + 59 days)

**Fields shown:**
1. DAM
2. SIRE
3. LAY DATE
4. # LAID
5. # SLUGS
6. # FERTILE
7. STATUS

### Add Hatchling Form
**File:** modals.js (renderHatchlingForm function)
**Method:** Custom render function with EXPLICIT field list
**Special elements at top:**
- UNIQUE ID preview (read-only, auto-generated)
- Select Clutch (searchable dropdown)

**Fields shown:**
1. DAM (read-only, from clutch)
2. SIRE (read-only, from clutch)
3. HATCH DATE
4. SEX
5. STATUS
6. HATCH WEIGHT (G)
7. SPECIES
8. GENETIC SUMMARY
9. BREEDER SOURCE
10. MANUAL OVERRIDE
11. NOTES

### Add Activity Form
**File:** modals.js (renderActivityAddForm function)
**Method:** Custom render function
**Fields shown:**
- DATE
- UNIQUE ID (searchable dropdown)
- ACTIVITY (dropdown)
- VALUE
- PAIRED WITH (only for Paired/Lock activities)

---

## TABLE COLUMNS

### Collection Table
**File:** tables.js (getColumns function, prefs.collection)
**Columns:** QR, UNIQUE ID, ANIMAL NAME, SEX, MATURITY, GENETIC SUMMARY, STATUS

### Clutches Table
**File:** tables.js (getColumns function, prefs.clutches)
**Columns:** CLUTCH ID, SIRE, DAM, LAY DATE, EST. HATCH DATE, # FERTILE, STATUS

### Pairings Table
**File:** tables.js (getColumns function, prefs.pairings)
**Columns:** DATE, UNIQUE ID, PAIRED WITH, ACTIVITY

### Hatchlings Table
**File:** tables.js (getColumns function, prefs.hatchlings)
**Columns:** QR, UNIQUE ID, CLUTCH ID, ANIMAL NAME, SEX, MATURITY, GENETIC SUMMARY, STATUS, LIST PRICE

### Sales Table
**File:** tables.js (getColumns function, prefs.sales)
**Columns:** UNIQUE ID, ANIMAL NAME, STATUS, SOLD PRICE, AMOUNT PAID, DATE SOLD, BUYER NAME

### Activity Table
**File:** tables.js (getColumns function, prefs.activity)
**Columns:** DATE, UNIQUE ID, ACTIVITY, VALUE

---

## ID GENERATION RULES

### Breeder ID
**File:** modals.js (generateBreederId function)
**Format:** B-YYYY-XXXX (e.g., B-2026-0001)
**Rule:** Checks all existing UNIQUE IDs, finds max number for current year, increments, verifies no duplicate exists

### Hatchling ID
**File:** modals.js (generateHatchlingId function)
**Format:** H-YYYY-XXXX (e.g., H-2026-0001)
**Rule:** Checks all existing UNIQUE IDs, finds max number for current year, increments, verifies no duplicate exists

### Clutch ID
**File:** modals.js (generateClutchId function)
**Format:** CL-YYYY-XXXX (e.g., CL-2026-0001)
**Rule:** Checks all existing CLUTCH IDs, finds max number for current year, increments, verifies no duplicate exists

### Import IDs
**File:** import.js (generateUniqueIdForImport function)
**Format:** B-YYYY-XXXX
**Rule:** Same as Breeder ID but also tracks IDs generated during current import session to prevent duplicates within batch

### QR CODE Generation
**File:** import.js (executeImport function)
**Format:** https://app.therackapp.io?code={sheetId}&animal={uniqueId}
**Rule:** Generated automatically when importing records

---

## SIDEBAR LINKS

**File:** index.html

### Quick Add Section
- + Breeder
- + Clutch
- + Hatchling
- + Activity

### Navigation Section
- Dashboard
- Collection
- Clutches
- Pairings
- Hatchlings
- Sales
- Activity

### Tools Section
- Import Collection
- Create Invoice
- Print Bin Tags
- Export Collection
- Export Clutches
- Print QR Codes
- Data Health
- Archive
- Settings
- Help Guide

### Support Section
- What's New
- Submit Support Ticket

---

## VERSION TRACKING

**Files that need version updates:**
1. config.js - VERSION variable (displays in header)
2. config.js - Header comment changelog
3. index.html - Header comment changelog
4. Any modified .js file - Header comment changelog

---

## RULES FOR CLAUDE

1. Always update version # in config.js VERSION variable and file headers when making changes
2. Do not use emojis
3. Confirm changes with summary before making them
4. Give 9 PM daily summary (completed, tomorrow, issues, accomplishments)
5. Use GitHub files for context before asking for details
6. UPDATE THIS FILE (STRUCTURE.md) when changing structure, rules, form fields, or table columns
7. Forms use SHOW ONLY logic - explicit list of fields to display, NOT skip lists
8. All ID generators must check for duplicates before returning new ID
9. Never change form fields without explicit permission from user
