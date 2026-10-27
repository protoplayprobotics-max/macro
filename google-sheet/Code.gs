/**
 * CopperTrace Labs — website contact form -> Google Sheet,
 * and website content (meta tags, About Us) <- Google Sheet.
 *
 * Paste this into Extensions > Apps Script of your Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 * See SETUP.md for the full steps.
 */

var SHEET_NAME = "Enquiries";
var HEADERS = ["Timestamp", "Name", "Email", "Phone", "Company", "Service", "Message", "Page"];

// Optional: get an email for every new enquiry. Leave "" to turn off.
var NOTIFY_EMAIL = "";

// Website text you can edit in the "Content" tab. Only this tab is ever sent to the website.
var CONTENT_SHEET = "Content";
var CONTENT_CACHE_SECONDS = 60;

// Starting values, written to the Content tab the first time it is created.
// In the sheet: wrap words in *stars* to show them in gold; put a single - to hide an item.
var CONTENT_DEFAULTS = [
  ["meta.keywords", "PCB design, electronics R&D, embedded systems, IoT products, firmware, prototyping", "Search keywords for every page"],

  ["meta.home.title", "CopperTrace Labs | PCB Design, Embedded & IoT R&D", "Home page: browser tab / Google title"],
  ["meta.home.description", "CopperTrace Labs — PCB design, electronics R&D, embedded firmware and IoT product development from concept to prototype.", "Home page: Google description"],
  ["meta.about.title", "About Us | CopperTrace Labs", "About page title"],
  ["meta.about.description", "About CopperTrace Labs — a team of hardware and firmware engineers building PCBs, embedded systems and IoT products.", "About page description"],
  ["meta.rnd.title", "Research & Development | CopperTrace Labs", "R&D page title"],
  ["meta.rnd.description", "CopperTrace Labs R&D — PCB design capabilities, embedded and IoT research areas, design process, tools and lab equipment.", "R&D page description"],
  ["meta.products.title", "Products & Prototypes | CopperTrace Labs", "Products page title"],
  ["meta.products.description", "IoT and embedded product prototypes from CopperTrace Labs — water level controllers, energy meters, sensor nodes, relay boards and development boards.", "Products page description"],
  ["meta.contact.title", "Contact Us | CopperTrace Labs", "Contact page title"],
  ["meta.contact.description", "Contact CopperTrace Labs for PCB design, embedded firmware, IoT product development and prototype enquiries.", "Contact page description"],

  ["about.hero.title", "Engineers Who Think in *Copper & Code*", "About: main heading"],
  ["about.hero.lead", "CopperTrace Labs is an electronics design house focused on PCB design, embedded systems and IoT. We help startups, OEMs and researchers turn ideas into reliable, manufacturable hardware.", "About: intro paragraph"],
  ["about.story.title", "Started on a *Workbench*", "Our Story: heading"],
  ["about.story.p1", "We began as a small group of electronics engineers who loved solving tricky hardware problems — noisy power rails, RF that wouldn't connect, batteries that died too soon.", "Our Story: paragraph 1"],
  ["about.story.p2", "Today we run a full design lab with schematic and layout, firmware development, SMT prototyping and test benches under one roof. We've delivered boards for agriculture, energy, industrial automation, healthcare and consumer products.", "Our Story: paragraph 2"],
  ["about.story.p3", "What hasn't changed: we care about every trace, every via, and every line of firmware that goes into your product.", "Our Story: paragraph 3 (- to hide)"],
  ["about.mission", "To make professional-grade electronics design accessible to every innovator — from first-time founders to established manufacturers.", "Our Mission"],
  ["about.vision", "To be a trusted R&D partner for smart, connected and energy-efficient products made in India for the world.", "Our Vision"],
  ["about.values.1", "Quality over shortcuts", "Our Values: item 1"],
  ["about.values.2", "Transparent communication", "Our Values: item 2"],
  ["about.values.3", "Respect for client IP", "Our Values: item 3"],
  ["about.values.4", "Continuous learning", "Our Values: item 4"],

  ["about.journey.title", "Our *Journey*", "Milestones: heading"],
  ["about.journey.lead", "Every year brought new tools, new capabilities and new challenges solved.", "Milestones: intro"],
  ["about.timeline.1.year", "2016", "Milestone 1: year"],
  ["about.timeline.1.title", "The First Board", "Milestone 1: title (- to hide)"],
  ["about.timeline.1.text", "Founded as a PCB layout service for local startups.", "Milestone 1: text"],
  ["about.timeline.2.year", "2018", "Milestone 2: year"],
  ["about.timeline.2.title", "Embedded Team", "Milestone 2: title (- to hide)"],
  ["about.timeline.2.text", "Added firmware development for STM32 & AVR platforms.", "Milestone 2: text"],
  ["about.timeline.3.year", "2020", "Milestone 3: year"],
  ["about.timeline.3.title", "IoT Division", "Milestone 3: title (- to hide)"],
  ["about.timeline.3.text", "Launched connected-device design with Wi-Fi, BLE and LoRa.", "Milestone 3: text"],
  ["about.timeline.4.year", "2023", "Milestone 4: year"],
  ["about.timeline.4.title", "In-house Prototyping Lab", "Milestone 4: title (- to hide)"],
  ["about.timeline.4.text", "Set up SMT rework, reflow and test benches for rapid prototypes.", "Milestone 4: text"],
  ["about.timeline.5.year", "2026", "Milestone 5: year"],
  ["about.timeline.5.title", "Own Product Line", "Milestone 5: title (- to hide)"],
  ["about.timeline.5.text", "Began field trials of our own IoT products for water, energy and agriculture.", "Milestone 5: text"],

  ["about.team.title", "People Behind the *Boards*", "Team: heading"],
  ["about.team.lead", "A compact team of specialists across hardware, firmware and cloud.", "Team: intro"],
  ["about.team.1.name", "Founder Name", "Team member 1: name (- to hide; initials are automatic)"],
  ["about.team.1.role", "Founder & Lead Hardware", "Team member 1: role"],
  ["about.team.1.bio", "15+ years in PCB design and power electronics.", "Team member 1: short bio"],
  ["about.team.2.name", "Firmware Lead", "Team member 2: name (- to hide)"],
  ["about.team.2.role", "Embedded Systems", "Team member 2: role"],
  ["about.team.2.bio", "RTOS, low-power design and bootloaders.", "Team member 2: short bio"],
  ["about.team.3.name", "RF Engineer", "Team member 3: name (- to hide)"],
  ["about.team.3.role", "Wireless & Antennas", "Team member 3: role"],
  ["about.team.3.bio", "BLE, Wi-Fi, LoRa and antenna matching.", "Team member 3: short bio"],
  ["about.team.4.name", "IoT Developer", "Team member 4: name (- to hide)"],
  ["about.team.4.role", "Cloud & Apps", "Team member 4: role"],
  ["about.team.4.bio", "MQTT, dashboards and mobile app integration.", "Team member 4: short bio"],

  ["contact.address", "Plot No. 00, Electronics City,\nYour City, State – 000000, India", "Lab address on Contact Us + home page (Ctrl+Enter for a new line)"],
  ["contact.email", "info@coppertracelabs.com", "Email: Contact Us, home page and every footer (also the email link)"],
  ["contact.phone", "+91 00000 00000", "Phone: Contact Us, home page and every footer (also the call link; - to hide)"],
  ["contact.hours", "Mon – Sat, 9:30 AM – 6:30 PM", "Working hours on Contact Us + home page (- to hide)"],
  ["contact.city", "Your City, India", "Location under Reach Us in every footer (- to hide)"]
];

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

// ?action=content returns the Content tab for the website.
// With no action, it just confirms the web app is deployed.
function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === "content") return json({ result: "ok", content: getContent() });
  return json({ result: "ok", message: "Contact form endpoint is running." });
}

function getContent() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("content");
  if (hit) return JSON.parse(hit);

  var sheet = getContentSheet();
  var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getDisplayValues() : [];
  var content = {};
  rows.forEach(function (r) {
    var key = String(r[0]).trim();
    if (key) content[key] = String(r[1]);
  });
  cache.put("content", JSON.stringify(content), CONTENT_CACHE_SECONDS);
  return content;
}

function getContentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONTENT_SHEET);
  if (sheet) {
    addMissingRows(sheet);
    return sheet;
  }

  sheet = ss.insertSheet(CONTENT_SHEET);
  var header = [["Key (do not change)", "Value (edit this)", "What it is"]];
  sheet.getRange(1, 1, 1, 3).setValues(header)
    .setFontWeight("bold").setBackground("#0f3d22").setFontColor("#f0d28a");
  sheet.getRange(2, 1, CONTENT_DEFAULTS.length, 3).setValues(CONTENT_DEFAULTS);
  sheet.getRange(2, 2, CONTENT_DEFAULTS.length, 1).setNumberFormat("@").setWrap(true);
  sheet.getRange(2, 1, CONTENT_DEFAULTS.length, 1).setFontColor("#888888");
  sheet.setColumnWidth(1, 220);
  sheet.setColumnWidth(2, 520);
  sheet.setColumnWidth(3, 300);
  sheet.setFrozenRows(1);
  return sheet;
}

// When the script gains new editable items, add them to an existing Content tab
// (at the bottom) without touching the rows you've already edited
function addMissingRows(sheet) {
  var last = sheet.getLastRow();
  var have = {};
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { have[String(r[0]).trim()] = true; });
  }
  var missing = CONTENT_DEFAULTS.filter(function (r) { return !have[r[0]]; });
  if (!missing.length) return;
  var start = Math.max(last, 1) + 1;
  sheet.getRange(start, 1, missing.length, 3).setValues(missing);
  sheet.getRange(start, 2, missing.length, 1).setNumberFormat("@").setWrap(true);
  sheet.getRange(start, 1, missing.length, 1).setFontColor("#888888");
}

// Runs automatically when you edit the sheet, so content changes show up quickly
function onEdit(e) {
  if (e && e.range && e.range.getSheet().getName() === CONTENT_SHEET) {
    CacheService.getScriptCache().remove("content");
  }
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
