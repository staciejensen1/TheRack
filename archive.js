/*
 * THE RACK - Archive Functions
 * Version: 2.12.0
 * Last Updated: 2026-01-09
 * 
 * Changelog:
 * - 2.12.0: Split from monolithic index.html
 */


// ============ ARCHIVE ============
function renderArchiveView() {
  var archiveData = state.data.archive || [];
  var html = '';
  
  if (archiveData.length === 0) {
    html = '<div class="text-center py-12 text-gray-500">';
    html += '<p>No archived records yet.</p>';
    html += '<p class="text-sm mt-2">When you delete animals or clutches, they will appear here.</p>';
    html += '</div>';
  } else {
    // Filter into animals and clutches
    var archivedAnimals = archiveData.filter(function(r) { 
      var archiveType = (r["ARCHIVE TYPE"] || "").toLowerCase().trim();
      return archiveType === "collection" || archiveType === ""; 
    });
    var archivedClutches = archiveData.filter(function(r) { 
      var archiveType = (r["ARCHIVE TYPE"] || "").toLowerCase().trim();
      return archiveType === "clutch"; 
    });
    
    // If no ARCHIVE TYPE is set, show all as animals
    if (archivedAnimals.length === 0 && archivedClutches.length === 0 && archiveData.length > 0) {
      archivedAnimals = archiveData;
    }
    
    // Archived Animals
    if (archivedAnimals.length > 0) {
      html += '<div class="mb-8">';
      html += '<div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Archived Animals (' + archivedAnimals.length + ')</div>';
      html += '<div class="border border-gray-200 rounded-xl overflow-hidden">';
      html += '<table class="min-w-full text-sm">';
      html += '<thead class="bg-gray-50"><tr>';
      html += '<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Unique ID</th>';
      html += '<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">Action</th>';
      html += '</tr></thead>';
      html += '<tbody class="divide-y divide-gray-100">';
      
      archivedAnimals.forEach(function(animal, index) {
        var displayId = animal["UNIQUE ID"] || animal["MANUAL OVERRIDE"] || "Unknown";
        html += '<tr class="' + (index % 2 === 0 ? 'bg-white' : 'bg-gray-50') + '">';
        html += '<td class="px-4 py-3 font-medium mono">' + escapeHtml(displayId) + '</td>';
        html += '<td class="px-4 py-3 text-right"><button onclick="restoreFromArchive(' + animal.__rowIndex + ', \'Collection\')" class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">Restore</button></td>';
        html += '</tr>';
      });
      
      html += '</tbody></table></div></div>';
    }
    
    // Archived Clutches
    if (archivedClutches.length > 0) {
      html += '<div class="mb-8">';
      html += '<div class="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Archived Clutches (' + archivedClutches.length + ')</div>';
      html += '<div class="border border-gray-200 rounded-xl overflow-hidden">';
      html += '<table class="min-w-full text-sm">';
      html += '<thead class="bg-gray-50"><tr>';
      html += '<th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">Clutch ID</th>';
      html += '<th class="px-4 py-3 text-right text-xs font-semibold text-gray-600">Action</th>';
      html += '</tr></thead>';
      html += '<tbody class="divide-y divide-gray-100">';
      
      archivedClutches.forEach(function(clutch, index) {
        var displayId = clutch["CLUTCH ID"] || "Unknown";
        html += '<tr class="' + (index % 2 === 0 ? 'bg-white' : 'bg-gray-50') + '">';
        html += '<td class="px-4 py-3 font-medium mono">' + escapeHtml(displayId) + '</td>';
        html += '<td class="px-4 py-3 text-right"><button onclick="restoreFromArchive(' + clutch.__rowIndex + ', \'Clutch\')" class="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">Restore</button></td>';
        html += '</tr>';
      });
      
      html += '</tbody></table></div></div>';
    }
    
    // Empty Archive button
    html += '<div class="mt-6 pt-6 border-t border-gray-200">';
    html += '<button onclick="emptyArchive()" class="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200">';
    html += 'Empty Archive (' + archiveData.length + ' records)';
    html += '</button>';
    html += '<p class="text-xs text-gray-400 mt-2">This will permanently delete all archived records.</p>';
    html += '</div>';
  }
  
  document.getElementById("dashboardView").innerHTML = html;
  document.getElementById("dashboardView").classList.remove("hidden");
}

function emptyArchive() {
  var archiveData = state.data.archive || [];
  if (archiveData.length === 0) {
    setStatus("Archive is already empty");
    return;
  }
  
  if (!confirm("Permanently delete all " + archiveData.length + " archived records?\n\nThis cannot be undone.")) {
    return;
  }
  
  setStatus("Emptying archive...");
  
  // Delete rows from bottom to top to avoid index shifting issues
  var rowsToDelete = archiveData.map(function(r) { return r.__rowIndex; }).sort(function(a, b) { return b - a; });
  
  var deleteNext = function(index) {
    if (index >= rowsToDelete.length) {
      setStatus("Archive emptied");
      loadData();
      return;
    }
    
    apiCall('deleteRecord', { tab: 'Archive', rowIndex: rowsToDelete[index] })
      .then(function(response) {
        if (response.success) {
          deleteNext(index + 1);
        } else {
          setStatus("Error: " + (response.error || "Failed to delete"), true);
        }
      })
      .catch(function(error) {
        setStatus("Error: " + error.message, true);
      });
  };
  
  deleteNext(0);
}

function archiveRecord(rowIndex, sourceTab) {
  // Get source data based on tab
  var sourceData;
  if (sourceTab === "Collection") {
    sourceData = state.data.collection;
  } else if (sourceTab === "Clutch") {
    sourceData = state.data.clutch;
  } else {
    setStatus("Unknown source tab: " + sourceTab, true);
    return;
  }
  
  // Find the record
  var record = null;
  for (var i = 0; i < sourceData.length; i++) {
    if (sourceData[i].__rowIndex === rowIndex) {
      record = sourceData[i];
      break;
    }
  }
  
  if (!record) {
    setStatus("Record not found", true);
    return;
  }
  
  var recordName = record["ANIMAL NAME"] || record["CLUTCH ID"] || "this record";
  
  if (!confirm("Move \"" + recordName + "\" to Archive?\n\nYou can restore it later from the Archive tab.")) {
    return;
  }
  
  setStatus("Archiving...");
  
  // Create clean archive data
  var archiveData = {};
  var keys = Object.keys(record);
  for (var j = 0; j < keys.length; j++) {
    var key = keys[j];
    if (key !== "__rowIndex" && key !== "__raw") {
      archiveData[key] = record[key];
    }
  }
  archiveData["ARCHIVE TYPE"] = sourceTab;
  archiveData["DATE ARCHIVED"] = new Date().toISOString().split('T')[0];
  
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

function deleteActivityRecord(rowIndex) {
  // Find the record
  var record = null;
  for (var i = 0; i < state.data.activity.length; i++) {
    if (state.data.activity[i].__rowIndex === rowIndex) {
      record = state.data.activity[i];
      break;
    }
  }
  
  if (!record) {
    setStatus("Record not found", true);
    return;
  }
  
  var recordDesc = (record["DATE"] || "") + " - " + (record["ACTIVITY"] || "") + " for " + (record["UNIQUE ID"] || "unknown");
  
  if (!confirm("Delete this activity?\n\n" + recordDesc + "\n\nThis cannot be undone.")) {
    return;
  }
  
  setStatus("Deleting...");
  
  apiCall('deleteRecord', { tab: 'Activity', rowIndex: rowIndex })
    .then(function(response) {
      if (response.success) {
        setStatus("Activity deleted");
        loadData();
      } else {
        throw new Error(response.error || "Failed to delete");
      }
    })
    .catch(function(error) {
      setStatus("Error: " + error.message, true);
    });
}

function restoreFromArchive(archiveRowIndex, originalTab) {
  var record = state.data.archive.find(function(r) { return r.__rowIndex === archiveRowIndex; });
  
  if (!record) {
    setStatus("Record not found", true);
    return;
  }
  
  var recordName = record["ANIMAL NAME"] || record["CLUTCH ID"] || "this record";
  
  if (!confirm("Restore \"" + recordName + "\" from Archive?")) {
    return;
  }
  
  setStatus("Restoring...");
  
  // Remove archive metadata
  var restoreData = Object.assign({}, record);
  delete restoreData["ARCHIVE TYPE"];
  delete restoreData["DATE ARCHIVED"];
  delete restoreData.__rowIndex;
  
  // First, save to original tab
  apiCall('saveRecord', { tab: originalTab, data: restoreData })
    .then(function(response) {
      if (response.success) {
        // Then delete from Archive
        return apiCall('deleteRecord', { tab: 'Archive', rowIndex: archiveRowIndex });
      } else {
        throw new Error(response.error || "Failed to restore");
      }
    })
    .then(function(response) {
      if (response.success) {
        setStatus("Restored from Archive");
        loadData(); // Refresh all data
      } else {
        throw new Error(response.error || "Failed to remove from archive");
      }
    })
    .catch(function(error) {
      setStatus("Error: " + error.message, true);
    });
}

