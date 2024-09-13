// Set the following fields when adding these scripts to the google sheet app script

let googleFormId = "";
let memberListId = "";
let shiftListId = "";

let googleSheetId = "";
let responseSheetName = "";
let shiftLimitsSheetName = "";
let rosterSheetName = "";

function populateMemberList() {
  var form = FormApp.openById(googleFormId);
  var namesList = form.getItemById(memberListId).asListItem();

  var ss = SpreadsheetApp.openById(googleSheetId);
  var rosterEntries = ss.getSheetByName(rosterSheetName).getDataRange().getValues();
  rosterEntries.shift();

  var memberNames = [];
  rosterEntries.map((row) => {
    var name = row[0];
    var responseReceived = row[2];
    if (name != "" && responseReceived == 0) {
      memberNames.push(name);
    }
  });

  namesList.setChoiceValues(memberNames);
}

function updateShiftsAndMembers(e) {
  let form = FormApp.openById(googleFormId);
  let shiftList = form.getItemById(shiftListId).asListItem();

  let ss = SpreadsheetApp.openById(googleSheetId);
  let shiftLimits = ss.getSheetByName(shiftLimitsSheetName).getDataRange().getValues();
  shiftLimits.shift();
  let responseSheet = ss.getSheetByName(responseSheetName);
  let responses = responseSheet.getDataRange().getValues();
  responses.shift();

  // Get current count for shifts
  var shiftCounts = {}
  responses.map((row) => {
    shift = row[3]
    if (!(shift in shiftCounts)) {
      shiftCounts[shift] = 0;
    }
    shiftCounts[shift] += 1;
  });

  // Get the Allowed number of shifts
  var openShifts = {};
  var availableShifts = [];
  shiftLimits.map((row) => {
    shift = row[0];
    maxSlots = row[1];
    if (!(shift in shiftCounts)) {
      shiftCounts[shift] = 0;
    }
    openShifts[shift] = maxSlots - shiftCounts[shift];
    if (openShifts[shift] > 0) {
      availableShifts.push(shift);
    }
  });

  // Update the dropdown based on what is currently available
  shiftList.setChoiceValues(availableShifts);

  updateMemberResponseValue();
  populateMemberList();
  populateFilledSlots(shiftCounts, shiftLimits);

}

function populateFilledSlots(shiftCounts, shiftLimits) {
  let ss = SpreadsheetApp.openById(googleSheetId);
  let shiftLimitSheet = ss.getSheetByName(shiftLimitsSheetName);
  for (var i = 0; i < shiftLimits.length; i++) {
    let filledCell = shiftLimitSheet.getRange(i+2,3);
    let remainingCell = shiftLimitSheet.getRange(i+2,4);
    shift = shiftLimits[i][0];
    if (shift in shiftCounts) {
      if (shift === "Total") {
        continue;
      }
      filledCell.setValue(shiftCounts[shift]);
      remainingCell.setValue(shiftLimits[i][1] - shiftCounts[shift]);
    }
  }
}

function updateMemberResponseValue() {
  let ss = SpreadsheetApp.openById(googleSheetId);
  let rosterSheet = ss.getSheetByName(rosterSheetName);
  let rosterEntries = rosterSheet.getDataRange().getValues();
  rosterEntries.shift();
  let signups = ss.getSheetByName(responseSheetName).getDataRange().getValues();
  signups.shift();

  var peopleWithSignup = [];
  signups.map((row) => {
    peopleWithSignup.push(row[2]);
  });

  for (var i = 0; i < rosterEntries.length; i++) {
    let cell = rosterSheet.getRange(i+2, 3);
    if (peopleWithSignup.indexOf(rosterEntries[i][0]) !== -1) {
      cell.setValue(1);
    } else {
      cell.setValue(0);
    }
  }
}
