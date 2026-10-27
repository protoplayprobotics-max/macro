/**
 * CopperTrace Labs — website contact form -> Google Sheet
 *
 * Paste this into Extensions > Apps Script of your Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 * See SETUP.md for the full steps.
 */

var SHEET_NAME = "Enquiries";
var HEADERS = ["Timestamp", "Name", "Email", "Phone", "Company", "Service", "Message", "Page"];

// Optional: get an email for every new enquiry. Leave "" to turn off.
var NOTIFY_EMAIL = "";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var p = (e && e.parameter) || {};

    // Spam trap: real visitors never fill the hidden "website" field
    if (p.website) return json({ result: "ok" });

    var sheet = getSheet();
    var row = [
      new Date(),
      clean(p.name),
      clean(p.email),
      asText(p.phone),
      clean(p.company),
      clean(p.service),
      clean(p.message),
      clean(p.page)
    ];
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        replyTo: row[2] || NOTIFY_EMAIL,
        subject: "New website enquiry: " + row[5] + " — " + row[1],
        body: HEADERS.map(function (h, i) { return h + ": " + row[i]; }).join("\n")
      });
    }
    return json({ result: "ok" });
  } catch (err) {
    return json({ result: "error", message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the web app URL in a browser to check it is deployed
function doGet() {
  return json({ result: "ok", message: "Contact form endpoint is running." });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#0f3d22").setFontColor("#f0d28a");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and stop values being read as spreadsheet formulas
function clean(v) {
  v = String(v || "").trim().slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

// Keep values like phone numbers as text so Sheets doesn't drop leading zeros
function asText(v) {
  v = clean(v);
  return v && v.charAt(0) !== "'" ? "'" + v : v;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
