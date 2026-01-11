/*
 * THE RACK - Dashboard
 * Version: 3.14
 * Last Updated: 2026-01-10
 * 
 * Changelog:
 * - 3.14: Updated all alert cards to Soft Slate Blue palette (#B1BED0, #93A4B8, #7B8CA0, #5F7088)
 * - 3.13: Added last 3 months stats for Pairings (paired, locked, ovulation, pre-lay shed)
 * - 2.12.0: Split from monolithic index.html
 */


// ============ DASHBOARD ============
function renderDashboard() {
  var stats = calculateStats();
  var html = '';
  
  // Alerts Section (only show if there are alerts)
  var hasAlerts = stats.overdueClutches > 0 || stats.clutchesDueSoon > 0 || stats.unshipped > 0 || 
                  stats.needsSexing > 0 || stats.readyToList > 0 ||
                  stats.unpaidDeposits > 0 || stats.shippingSoon > 0 || stats.unpaidBalance > 0;
  
  if (hasAlerts) {
    html += '<div class="mb-8">';
    html += '<div class="text-xs uppercase tracking-wider text-gray-900 font-semibold mb-3">ALERTS</div>';
    html += '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">';
    
    // Overdue Clutches (DARKEST - most urgent)
    if (stats.overdueClutches > 0) {
      html += '<div onclick="filterByAlert(\'overdueClutches\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #5F7088, #4a5a6d); border: 2px solid #4a5a6d;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #B1BED0;">Overdue Clutches</div>';
      html += '<div class="text-2xl font-black text-white">' + stats.overdueClutches + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Clutches Due Soon (DARK)
    if (stats.clutchesDueSoon > 0) {
      html += '<div onclick="filterByAlert(\'clutchesDueSoon\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #7B8CA0, #5F7088); border: 2px solid #5F7088;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #B1BED0;">Due Within 7 Days</div>';
      html += '<div class="text-2xl font-black text-white">' + stats.clutchesDueSoon + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Unshipped Sales (MEDIUM-DARK)
    if (stats.unshipped > 0) {
      html += '<div onclick="filterByAlert(\'unshipped\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #93A4B8, #7B8CA0); border: 2px solid #7B8CA0;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider text-white">Unshipped Sales</div>';
      html += '<div class="text-2xl font-black text-white">' + stats.unshipped + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Shipping Soon (MEDIUM)
    if (stats.shippingSoon > 0) {
      html += '<div onclick="filterByAlert(\'shippingSoon\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #93A4B8, #7B8CA0); border: 2px solid #7B8CA0;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #5F7088;">Shipping in 3 Days</div>';
      html += '<div class="text-2xl font-black" style="color: #5F7088;">' + stats.shippingSoon + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Unpaid Deposits (MEDIUM)
    if (stats.unpaidDeposits > 0) {
      html += '<div onclick="filterByAlert(\'unpaidDeposits\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #93A4B8, #7B8CA0); border: 2px solid #7B8CA0;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #5F7088;">Unpaid Deposits</div>';
      html += '<div class="text-2xl font-black" style="color: #5F7088;">' + stats.unpaidDeposits + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Balance Due (MEDIUM)
    if (stats.unpaidBalance > 0) {
      html += '<div onclick="filterByAlert(\'balanceDue\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #93A4B8, #7B8CA0); border: 2px solid #7B8CA0;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #5F7088;">Balance Due</div>';
      html += '<div class="text-2xl font-black" style="color: #5F7088;">' + stats.unpaidBalance + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Needs Sexing (LIGHT)
    if (stats.needsSexing > 0) {
      html += '<div onclick="filterByAlert(\'needsSexing\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #B1BED0, #93A4B8); border: 2px solid #93A4B8;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #5F7088;">Needs Sexing</div>';
      html += '<div class="text-2xl font-black" style="color: #5F7088;">' + stats.needsSexing + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    // Ready to List (LIGHTEST)
    if (stats.readyToList > 0) {
      html += '<div onclick="filterByAlert(\'readyToList\');" class="cursor-pointer rounded-2xl p-3 hover:shadow-lg transition-shadow" style="background: linear-gradient(to bottom right, #d4dbe6, #B1BED0); border: 2px solid #B1BED0;">';
      html += '<div class="flex items-center justify-between">';
      html += '<div>';
      html += '<div class="text-xs uppercase tracking-wider" style="color: #5F7088;">Ready to List</div>';
      html += '<div class="text-2xl font-black" style="color: #5F7088;">' + stats.readyToList + '</div>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    
    html += '</div></div>';
  }
  
  // Breeders Section
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Breeders</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += statCard("Total Breeders", stats.totalBreeders, "slate", null, "state.activeTab=&#39;collection&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Males", stats.maleBreeders, "blue", Math.round(stats.malePct * 100) + "%", "state.activeTab=&#39;collection&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Females", stats.femaleBreeders, "pink", Math.round(stats.femalePct * 100) + "%", "state.activeTab=&#39;collection&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Holdbacks", stats.holdbacks, "amber", null, "state.activeTab=&#39;collection&#39;; renderNavTabs(); renderCurrentView();");
  html += '</div></div>';

  // Clutches Section
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Incubator</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += statCard("Incubating", stats.incubating, "green", null, "state.activeTab=&#39;clutches&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Hatched (Year)", stats.hatchedThisYear, "emerald", null, "state.activeTab=&#39;clutches&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Avg Days to Hatch", stats.avgDaysToHatch, "teal");
  html += statCard("Avg Fertile Eggs", stats.avgFertileEggs, "cyan");
  html += '</div></div>';

  // Hatchlings Section
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Hatchlings</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += statCard("Listed", stats.listed, "violet", null, "state.activeTab=&#39;hatchlings&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Unlisted", stats.unlisted, "slate", null, "state.activeTab=&#39;hatchlings&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Females", stats.hatchFemales, "pink", "Unknown: " + stats.hatchUnknown, "state.activeTab=&#39;hatchlings&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Males", stats.hatchMales, "blue", "Unknown: " + stats.hatchUnknown, "state.activeTab=&#39;hatchlings&#39;; renderNavTabs(); renderCurrentView();");
  html += '</div></div>';

  // Activity Section (This Month Stats)
  var activityStats = calculateActivityStats();
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Activity (This Month)</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-6 gap-4">';
  html += statCard("Took Meal", activityStats.tookMeal, "green", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Refused Meal", activityStats.refusedMeal, "orange", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Paired", activityStats.paired, "blue", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Locked", activityStats.locked, "violet", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Ovulation", activityStats.ovulation, "pink", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Laid", activityStats.laid, "emerald", null, "state.activeTab=&#39;activity&#39;; renderNavTabs(); renderCurrentView();");
  html += '</div></div>';

  // Sales Section
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Sales (This Year)</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += statCard("Sold", stats.soldThisYear, "green", null, "state.activeTab=&#39;sales&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Revenue", stats.revenueDisplay, "emerald", null, "state.activeTab=&#39;sales&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("On Hold", stats.onHold, "orange", null, "state.activeTab=&#39;sales&#39;; renderNavTabs(); renderCurrentView();");
  html += statCard("Unshipped", stats.unshipped, "red", null, "state.activeTab=&#39;sales&#39;; renderNavTabs(); renderCurrentView();");
  html += '</div></div>';

  // Last Year Sales Section
  html += '<div class="mb-8"><div class="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Sales (Last Year)</div>';
  html += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">';
  html += statCard("Sold", stats.soldLastYear, "slate", null, null);
  html += statCard("Revenue", stats.revenueLastYearDisplay, "slate", null, null);
  html += '</div></div>';

  document.getElementById("dashboardView").innerHTML = html;
}

function statCard(label, value, color, subtitle, onclick) {
  var colors = {
    slate: "from-gray-50 to-gray-100 text-gray-900",
    gray: "from-gray-50 to-gray-100 text-gray-900",
    charcoal: "from-gray-200 to-gray-300 text-gray-900",
    dark: "from-gray-300 to-gray-400 text-gray-900",
    blue: "from-gray-100 to-gray-200 text-gray-900",
    pink: "from-gray-100 to-gray-200 text-gray-900",
    amber: "from-gray-200 to-gray-300 text-gray-900",
    green: "from-gray-100 to-gray-200 text-gray-900",
    emerald: "from-gray-150 to-gray-250 text-gray-900",
    teal: "from-gray-100 to-gray-200 text-gray-900",
    cyan: "from-gray-50 to-gray-100 text-gray-900",
    violet: "from-gray-200 to-gray-300 text-gray-900",
    orange: "from-gray-150 to-gray-250 text-gray-900",
    red: "from-gray-300 to-gray-400 text-gray-900"
  };
  var sub = subtitle ? '<div class="text-xs opacity-60 mt-1">' + subtitle + '</div>' : '';
  var clickClass = onclick ? ' cursor-pointer hover:shadow-lg transition-shadow' : '';
  var clickAttr = onclick ? ' onclick="' + onclick + '"' : '';
  return '<div class="bg-gradient-to-br ' + colors[color] + ' rounded-2xl p-4 md:p-5 stat-card border border-gray-200' + clickClass + '"' + clickAttr + '>' +
         '<div class="text-xs uppercase tracking-wider opacity-70">' + label + '</div>' +
         '<div class="text-2xl md:text-4xl font-black mt-1">' + value + '</div>' + sub + '</div>';
}

function calculateStats() {
  // Filter out empty rows (rows without a STATUS or UNIQUE ID)
  var rows = state.data.collection.filter(function(r) {
    return (r.STATUS || "").trim() !== "" || (r["UNIQUE ID"] || "").trim() !== "";
  });
  var clutchRows = state.data.clutch.filter(function(r) {
    return (r.STATUS || "").trim() !== "" || (r["CLUTCH ID"] || "").trim() !== "";
  });
  var year = new Date().getFullYear();
  var today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Date for "due soon" (7 days from now)
  var sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  
  // Date for "ready to list" (30 days ago)
  var thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Date for "shipping soon" (3 days from now)
  var threeDaysOut = new Date(today);
  threeDaysOut.setDate(threeDaysOut.getDate() + 3);
  
  var s = {
    totalBreeders: 0, maleBreeders: 0, femaleBreeders: 0, holdbacks: 0,
    incubating: 0, hatchedThisYear: 0, avgDaysToHatch: "--", avgFertileEggs: "--",
    listed: 0, unlisted: 0, hatchMales: 0, hatchFemales: 0, hatchUnknown: 0,
    soldThisYear: 0, revenue: 0, revenueDisplay: "$0", onHold: 0, unshipped: 0,
    // Last year stats
    soldLastYear: 0, revenueLastYear: 0, revenueLastYearDisplay: "$0",
    malePct: 0, femalePct: 0,
    // Alerts
    overdueClutches: 0, 
    clutchesDueSoon: 0,
    needsSexing: 0,
    readyToList: 0,
    unpaidDeposits: 0,
    shippingSoon: 0,
    unpaidBalance: 0
  };
  
  var lastYear = year - 1;

  rows.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    var sex = (r.SEX || "").toLowerCase().trim();
    var dob = parseDate(r["DATE OF BIRTH"]);
    var paymentStatus = (r["PAYMENT STATUS"] || "").toLowerCase().trim();
    var shipDate = parseDate(r["SHIP DATE"]);
    
    // Breeders
    if (st === "breeder" || st === "on loan") {
      s.totalBreeders++;
      if (sex.startsWith("m")) s.maleBreeders++;
      if (sex.startsWith("f")) s.femaleBreeders++;
    }
    if (st === "holdback") s.holdbacks++;
    
    // Hatchlings (listed/unlisted)
    if (st === "listed" || st === "for sale") {
      s.listed++;
      countSex(sex, s, "hatch");
    }
    if (st === "unlisted" || st === "not listed") {
      s.unlisted++;
      countSex(sex, s, "hatch");
      // Needs sexing (unlisted with unknown sex)
      if (!sex || sex === "unknown") s.needsSexing++;
      // Ready to list (unlisted, 30+ days old)
      if (dob && dob <= thirtyDaysAgo) s.readyToList++;
    }
    
    // Sales
    if (st === "on hold" || st === "hold") {
      s.onHold++;
      // Check for unpaid deposits (old method)
      if (paymentStatus === "deposit") s.unpaidDeposits++;
      // Check shipping soon
      if (shipDate && shipDate >= today && shipDate <= threeDaysOut) s.shippingSoon++;
      // Check for unpaid balance (sold price vs total paid)
      var soldPrice = parseFloat(r["SOLD PRICE"]) || 0;
      var totalPaid = parseFloat(r["AMOUNT PAID"]) || 0;
      if (soldPrice > 0 && totalPaid < soldPrice) {
        s.unpaidBalance++;
      }
    }
    if (st === "sold") {
      var soldYear = getYearFromDate(r["DATE SOLD"]);
      var price = parseFloat(r["SOLD PRICE"]) || 0;
      if (soldYear === year) {
        s.soldThisYear++;
        s.revenue += price;
      }
      // Last year sales
      if (soldYear === lastYear) {
        s.soldLastYear++;
        s.revenueLastYear += price;
      }
      // Unshipped = ship date within next 7 days (or past due)
      var shipDate = parseDate(r["SHIP DATE"]);
      if (shipDate && shipDate <= sevenDaysOut) {
        s.unshipped++;
      }
      // Check shipping soon for sold items too
      if (shipDate && shipDate >= today && shipDate <= threeDaysOut) s.shippingSoon++;
      // Check for unpaid balance (sold price vs total paid)
      var totalPaid = parseFloat(r["AMOUNT PAID"]) || 0;
      if (price > 0 && totalPaid < price) {
        s.unpaidBalance++;
      }
    }
  });

  // Breeder percentages
  if (s.totalBreeders > 0) {
    s.malePct = s.maleBreeders / s.totalBreeders;
    s.femalePct = s.femaleBreeders / s.totalBreeders;
  }

  // Clutch stats
  var daysSum = 0, daysCount = 0, fertileSum = 0, fertileCount = 0;
  clutchRows.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    if (st === "incubating") {
      s.incubating++;
      // Check if overdue or due soon
      var estHatchDate = r["EST. HATCH DATE"] || r["EST HATCH DATE"] || r["ESTIMATED HATCH DATE"] || "";
      if (estHatchDate) {
        var estDate = parseDate(estHatchDate);
        if (estDate) {
          if (estDate < today) {
            s.overdueClutches++;
          } else if (estDate >= today && estDate <= sevenDaysOut) {
            s.clutchesDueSoon++;
          }
        }
      }
    }
    if (st === "hatched") {
      var hatchDate = parseDate(r["HATCH DATE"]);
      if (hatchDate && hatchDate.getFullYear() === year) s.hatchedThisYear++;
      
      var layDate = parseDate(r["LAY DATE"]);
      if (hatchDate && layDate) {
        var days = Math.round((hatchDate - layDate) / 86400000);
        if (days > 0 && days < 100) { daysSum += days; daysCount++; }
      }
      
      var fertile = parseInt(r["# FERTILE"]) || 0;
      if (fertile > 0) { fertileSum += fertile; fertileCount++; }
    }
  });
  
  if (daysCount > 0) s.avgDaysToHatch = Math.round(daysSum / daysCount);
  if (fertileCount > 0) s.avgFertileEggs = Math.round(fertileSum / fertileCount);
  s.revenueDisplay = "$" + Math.round(s.revenue).toLocaleString();
  s.revenueLastYearDisplay = "$" + Math.round(s.revenueLastYear).toLocaleString();

  return s;
}

function countSex(sex, stats, prefix) {
  if (sex.startsWith("m")) stats[prefix + "Males"]++;
  else if (sex.startsWith("f")) stats[prefix + "Females"]++;
  else stats[prefix + "Unknown"]++;
}

// Calculate sales stats for a specific year
function calculateSalesStatsForYear(year) {
  var rows = state.data.collection || [];
  var sold = 0;
  var revenue = 0;
  
  rows.forEach(function(r) {
    var st = (r.STATUS || "").toLowerCase().trim();
    if (st === "sold") {
      var rawDate = r["DATE SOLD"];
      var price = parseFloat(r["SOLD PRICE"]) || 0;
      
      // Extract year from date - handle multiple formats
      var dateYear = null;
      if (rawDate) {
        // Try to get year from various formats
        if (typeof rawDate === 'string') {
          // Format: "2025-04-10" or "2025-04-10 00:00:00" or "4/10/2025"
          var match = rawDate.match(/(\d{4})/);
          if (match) {
            dateYear = parseInt(match[1]);
          }
        } else if (rawDate instanceof Date || (rawDate && rawDate.getFullYear)) {
          dateYear = rawDate.getFullYear();
        } else if (typeof rawDate === 'number') {
          // Could be Excel serial date or timestamp
          var d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            dateYear = d.getFullYear();
          }
        }
      }
      
      // If year filter is set, only count that year
      if (year) {
        if (dateYear === year) {
          sold++;
          revenue += price;
        }
      } else {
        // No year filter - count all
        sold++;
        revenue += price;
      }
    }
  });
  
  return { sold: sold, revenue: Math.round(revenue) };
}

function calculateActivityStats() {
  var rows = state.data.activity || [];
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();
  
  // Calculate 3 months ago date
  var threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  threeMonthsAgo.setHours(0, 0, 0, 0);
  
  var stats = {
    feedingsMonth: 0,
    refusalsMonth: 0,
    shedsMonth: 0,
    ovulationsMonth: 0,
    // For dashboard (this month)
    tookMeal: 0,
    refusedMeal: 0,
    paired: 0,
    locked: 0,
    ovulation: 0,
    laid: 0,
    // For pairings view (this year - legacy)
    pairedYear: 0,
    lockedYear: 0,
    // For pairings view (last 3 months)
    paired3Mo: 0,
    locked3Mo: 0,
    ovulation3Mo: 0,
    preLayShed3Mo: 0
  };
  
  rows.forEach(function(r) {
    var activity = (r.ACTIVITY || "").toLowerCase().trim();
    var activityDate = parseDate(r.DATE);
    
    // Check if this month
    var isThisMonth = false;
    if (activityDate) {
      isThisMonth = (activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear);
    }
    
    // Check if last 3 months
    var isLast3Months = false;
    if (activityDate) {
      isLast3Months = (activityDate >= threeMonthsAgo);
    }
    
    // Count for Activity table stats (this month only)
    if (isThisMonth) {
      if (activity === "took meal") stats.feedingsMonth++;
      if (activity === "refused meal") stats.refusalsMonth++;
      if (activity === "shed") stats.shedsMonth++;
      if (activity === "ovulation") stats.ovulationsMonth++;
    }
    
    // Count for Dashboard (this month)
    if (isThisMonth) {
      if (activity === "took meal") stats.tookMeal++;
      if (activity === "refused meal") stats.refusedMeal++;
      if (activity === "paired") stats.paired++;
      if (activity === "lock") stats.locked++;
      if (activity === "ovulation") stats.ovulation++;
      if (activity === "laid") stats.laid++;
    }
    
    // Count for Pairings view (this year - legacy)
    var isThisYear = false;
    if (activityDate) {
      isThisYear = (activityDate.getFullYear() === currentYear);
    }
    if (isThisYear) {
      if (activity === "paired") stats.pairedYear++;
      if (activity === "lock") stats.lockedYear++;
    }
    
    // Count for Pairings view (last 3 months)
    if (isLast3Months) {
      if (activity === "paired") stats.paired3Mo++;
      if (activity === "lock") stats.locked3Mo++;
      if (activity === "ovulation") stats.ovulation3Mo++;
      if (activity === "pre lay shed") stats.preLayShed3Mo++;
    }
  });
  
  return stats;
}

// Extract year from various date formats without full parsing
function getYearFromDate(rawDate) {
  if (!rawDate) return null;
  
  if (typeof rawDate === 'string') {
    // Look for 4-digit year pattern
    var match = rawDate.match(/(\d{4})/);
    if (match) {
      return parseInt(match[1]);
    }
  } else if (rawDate instanceof Date || (rawDate && typeof rawDate.getFullYear === 'function')) {
    return rawDate.getFullYear();
  } else if (typeof rawDate === 'number') {
    // Could be timestamp
    var d = new Date(rawDate);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1990) {
      return d.getFullYear();
    }
  }
  return null;
}

function parseDate(v) {
  if (!v) return null;
  var d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// Get animal name by UNIQUE ID
function getAnimalNameById(uniqueId) {
  if (!uniqueId) return "";
  var rows = state.data.collection || [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i]["UNIQUE ID"] === uniqueId) {
      return rows[i]["ANIMAL NAME"] || "";
    }
  }
  return "";
}

