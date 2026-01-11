# THE RACK - Structure Documentation
# Version: 3.13
# Last Updated: 2026-01-10

CLAUDE: UPDATE THIS FILE whenever you change file structure, rules, form fields, or table columns.

---

## FILES

| File | Purpose |
|------|---------|
| index.html | Main HTML, modals, sidebar navigation |
| config.js | VERSION variable, API URL, field options |
| app.js | Init, navigation, utilities |
| api.js | API calls to Google Apps Script backend |
| tables.js | Table rendering, column definitions |
| modals.js | Add/Edit forms, ID generation |
| dashboard.js | Dashboard stats and alerts |
| import.js | Import Collection from CSV |
| invoice.js | Invoice generation |
| bintags.js | Bin tag printing |
| qr-activity.js | QR code activity logging |
| hatch-sale.js | Hatch and sale modals |
| archive.js | Archive functionality |
| tools.js | Export, settings, changelog |
| STRUCTURE.md | This file |

---

## ADD FORMS - SHOW ONLY LISTS

### Add Breeder Form
**File:** modals.js (breederFormFields array, line ~275)
**Special elements:** UNIQUE ID preview at top

**SHOW ONLY these fields:**
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
**File:** modals.js (clutchFormFields array, line ~282)
**Special elements:** UNIQUE ID preview at top, EST. HATCH DATE preview at top

**SHOW ONLY these fields:**
1. DAM
2. SIRE
3. LAY DATE
4. # LAID
5. # SLUGS
6. # FERTILE
7. STATUS

### Add Hatchling Form
**File:** modals.js (renderHatchlingForm function, line ~368)
**Special elements:** UNIQUE ID preview at top, Select Clutch dropdown

**SHOW ONLY these fields:**
1. Select Clutch (custom dropdown)
2. DAM (read-only from clutch)
3. SIRE (read-only from clutch)
4. HATCH DATE
5. SEX
6. STATUS
7. HATCH WEIGHT (G)
8. SPECIES
9. GENETIC SUMMARY
10. BREEDER SOURCE
11. MANUAL OVERRIDE
12. NOTES

### Add Activity Form
**File:** modals.js (renderActivityAddForm function)
**SHOW ONLY these fields:**
- DATE
- UNIQUE ID (searchable dropdown)
- ACTIVITY (dropdown)
- VALUE
- PAIRED WITH (only for Paired/Lock)

---

## TABLE COLUMNS

### Collection: QR, UNIQUE ID, ANIMAL NAME, SEX, MATURITY, GENETIC SUMMARY, STATUS
### Clutches: UNIQUE ID, SIRE, DAM, LAY DATE, EST. HATCH DATE, # FERTILE, STATUS
### Pairings: DATE, UNIQUE ID, PAIRED WITH, ACTIVITY
### Hatchlings: QR, UNIQUE ID, CLUTCH ID, ANIMAL NAME, SEX, MATURITY, GENETIC SUMMARY, STATUS, LIST PRICE
### Sales: UNIQUE ID, ANIMAL NAME, STATUS, SOLD PRICE, AMOUNT PAID, DATE SOLD, BUYER NAME
### Activity: DATE, UNIQUE ID, ACTIVITY, VALUE

---

## ID GENERATION

- Breeder: B-YYYY-XXXX (checks for duplicates)
- Hatchling: H-YYYY-XXXX (checks for duplicates)
- Clutch: CL-YYYY-XXXX (checks for duplicates, uses UNIQUE ID column)
- Import: B-YYYY-XXXX + QR CODE auto-generated

---

## RULES FOR CLAUDE

1. Update version in config.js and file headers
2. No emojis
3. Confirm changes before making them
4. 9 PM daily summary
5. Update STRUCTURE.md when changing structure
6. Forms use SHOW ONLY lists - NOT skip lists
7. All ID generators check for duplicates
8. Never change form fields without permission
