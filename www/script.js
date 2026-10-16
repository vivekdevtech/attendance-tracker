// ---------- About me: change these to your own details ----------
// Any link with an empty url ("") is hidden automatically.
const PROFILE = {
  name: "Vivek Kumar",
  role: "B.Tech MnC, Supaul College of Engineering",
  bio: "I'm a B.Tech student in Mathematics and Computing at Supaul College of Engineering (SCE), Supaul. I found it hard to remember my attendance for each subject, so I built this app to track it.",
  email: "devtechvivek@gmail.com",
  links: [
    { label: "Instagram", url: "https://www.instagram.com/vivekdev.tech.io/?hl=en" },
    { label: "Facebook", url: "https://www.facebook.com/profile.php?id=100086583813032" },
    { label: "X", url: "https://x.com/dev_techvivek" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/vivek-kumar-a54922222/" },
    { label: "GitHub", url: "https://github.com/vivekdevtech" }
  ]
};
const APP_VERSION = "1.0";

// Subjects and teachers. No numbers here: every student enters their own.
const subjects = [
  { name: "Physics (L)", teacher: "Dr. K. N. Ray" },
  { name: "Physics (P)", teacher: "Mr. Anil Kumar" },
  { name: "Math-I", teacher: "Dr. Mahendra Kumar" },
  { name: "BEEE (L)", teacher: "Mr. Ajay Anand" },
  { name: "BEEE Lab", teacher: "TBD" },
  { name: "Intro to AI", teacher: "Ms. Phool Kumari" },
  { name: "PPS (P)", teacher: "TBD" },
  { name: "CFET", teacher: "Mr. Nitesh Kumar" },
  { name: "UHV", teacher: "Mr. V.P. Bhaskar" },
  { name: "EIC", teacher: "Dr. V.K. Mandal" }
];

// Weekly timetable. 0 = Sunday, 1 = Monday ... 6 = Saturday.
// "group" is only for lab classes. No group means everyone attends.
const timetable = {
  0: [],
  1: [
    { subject: "PPS (P)", group: "G1" },
    { subject: "BEEE Lab", group: "G2" },
    { subject: "Math-I" },
    { subject: "Intro to AI" },
    { subject: "EIC" }
  ],
  2: [
    { subject: "CFET" },
    { subject: "UHV" },
    { subject: "Math-I" },
    { subject: "Intro to AI" }
  ],
  3: [
    { subject: "PPS (P)", group: "G2" },
    { subject: "BEEE Lab", group: "G1" },
    { subject: "Math-I" },
    { subject: "Intro to AI" },
    { subject: "Physics (P)", group: "G1" }
  ],
  4: [
    { subject: "CFET" },
    { subject: "UHV" },
    { subject: "Physics (L)" },
    { subject: "BEEE (L)" },
    { subject: "Physics (P)", group: "G2" }
  ],
  5: [
    { subject: "CFET" },
    { subject: "BEEE (L)" },
    { subject: "Physics (L)" },
    { subject: "EIC" }
  ],
  6: [
    { subject: "BEEE (L)" },
    { subject: "EIC" },
    { subject: "Physics (L)" }
  ]
};

// College holidays (same for every student)
const HOLIDAYS = [
  "2026-10-02",
  "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20",
  "2026-11-08", "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12",
  "2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16",
  "2026-11-24"
];

const TARGET = 75;
const STORAGE_KEY = "attendance-marks";
const GROUP_KEY = "attendance-group";
const START_KEY = "attendance-start";
const DATE_KEY = "attendance-start-date";
const HOL_KEY = "attendance-holiday-overrides";
const ALL_KEYS = [STORAGE_KEY, GROUP_KEY, START_KEY, DATE_KEY, HOL_KEY];

// Read saved data from the phone/browser. If nothing is saved or it is damaged, use the fallback.
function loadJSON(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

// null on the very first open, then "G1" or "G2"
let myGroup = localStorage.getItem(GROUP_KEY);

// Your own starting numbers, like { "CFET": { held: 19, attended: 10 }, ... } (null until entered)
let start = loadJSON(START_KEY, null);

// The first day the app counts, like "2026-10-01" (null until entered)
let startDate = localStorage.getItem(DATE_KEY);

// Everything you tick: marks["2026-10-15"]["CFET|0"] = "P"
const marks = loadJSON(STORAGE_KEY, {});

// Holidays you changed yourself: true = force holiday, false = force normal day
const holidayOverrides = loadJSON(HOL_KEY, {});

let editingSetup = false;
let showingSettings = false;
let showingAbout = false;

function saveMarks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dateToString(d) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function todayString() {
  return dateToString(new Date());
}

function shiftDate(dateString, days) {
  const parts = dateString.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
  return dateToString(d);
}

let selectedDate = todayString();

const picker = document.getElementById("picker");
const setup = document.getElementById("setup");
const settings = document.getElementById("settings");
const about = document.getElementById("about");
const app = document.getElementById("app");
const setupList = document.getElementById("setup-list");
const setupError = document.getElementById("setup-error");
const setupCancel = document.getElementById("setup-cancel");
const startDateInput = document.getElementById("start-date");
const dateField = document.getElementById("date-field");
const backupText = document.getElementById("backup-text");
const backupMsg = document.getElementById("backup-msg");
const restoreText = document.getElementById("restore-text");
const restoreMsg = document.getElementById("restore-msg");
const banner = document.getElementById("banner");
const subjectList = document.getElementById("subject-list");
const dayList = document.getElementById("day-list");
const dayTitle = document.getElementById("day-title");
const todayBtn = document.getElementById("today-btn");
const holidayBtn = document.getElementById("holiday-btn");
const overallPercent = document.getElementById("overall-percent");
const overallDetail = document.getElementById("overall-detail");

function calcPercent(attended, held) {
  if (held === 0) {
    return 0;
  }
  return (attended / held) * 100;
}

// Tells you how many classes you can skip, or how many you must attend, to stay at TARGET %
function getHint(attended, held) {
  if (held === 0) {
    return "No classes yet";
  }

  // We multiply by 100 so every number stays a whole number (no decimal rounding problems)
  const spare = attended * 100 - TARGET * held;

  if (spare >= 0) {
    const canMiss = Math.floor(spare / TARGET);

    if (canMiss === 0) {
      return "Don't miss the next class";
    }
    return "Can miss " + canMiss + (canMiss === 1 ? " more class" : " more classes");
  }

  const needed = Math.ceil(-spare / (100 - TARGET));
  return "Attend " + needed + " in a row to reach " + TARGET + "%";
}

function isHoliday(dateString) {
  if (dateString in holidayOverrides) {
    return holidayOverrides[dateString];
  }
  return HOLIDAYS.includes(dateString);
}

// Your starting numbers + ticks from your starting date onwards = current numbers
function getStats() {
  const stats = subjects.map(function (s) {
    const base = start && start[s.name] ? start[s.name] : { held: 0, attended: 0 };
    return { name: s.name, teacher: s.teacher, held: base.held, attended: base.attended };
  });

  Object.keys(marks).forEach(function (date) {
    // Skip days before your starting date and holidays
    if (date < startDate || isHoliday(date)) {
      return;
    }

    Object.keys(marks[date]).forEach(function (key) {
      const subjectName = key.split("|")[0];
      const status = marks[date][key];
      const stat = stats.find(function (s) {
        return s.name === subjectName;
      });

      if (status === "P") {
        stat.held += 1;
        stat.attended += 1;
      } else if (status === "A") {
        stat.held += 1;
      }
      // "C" (cancelled) adds nothing
    });
  });

  return stats;
}

function getClassesForDate(dateString) {
  const parts = dateString.split("-").map(Number);
  const dayIndex = new Date(parts[0], parts[1] - 1, parts[2]).getDay();

  return {
    dayIndex: dayIndex,
    classes: timetable[dayIndex]
      .map(function (c, index) {
        return { subject: c.subject, group: c.group, key: c.subject + "|" + index };
      })
      .filter(function (c) {
        return !c.group || c.group === myGroup;
      })
  };
}

// Days from your starting date up to yesterday that still have unticked classes
function getPendingDays() {
  const pending = [];
  const today = todayString();
  let d = startDate;

  while (d < today) {
    if (!isHoliday(d)) {
      const info = getClassesForDate(d);
      const dayMarks = marks[d] || {};
      const hasUnticked = info.classes.some(function (c) {
        return !dayMarks[c.key];
      });

      if (hasUnticked) {
        pending.push(d);
      }
    }
    d = shiftDate(d, 1);
  }

  return pending;
}

function goToPending() {
  const pending = getPendingDays();

  if (pending.length > 0) {
    selectedDate = pending[0];
    render();
  }
}

function setGroup(group) {
  myGroup = group;
  localStorage.setItem(GROUP_KEY, group);
  render();
}

function toggleHoliday() {
  holidayOverrides[selectedDate] = !isHoliday(selectedDate);
  localStorage.setItem(HOL_KEY, JSON.stringify(holidayOverrides));
  render();
}

function showError(message, box) {
  setupError.textContent = message;
  box.classList.add("bad");
  box.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearErrors() {
  setupError.textContent = "";
  document.querySelectorAll(".bad").forEach(function (el) {
    el.classList.remove("bad");
  });
}

// ---------- About me ----------

// Fill the About page from PROFILE (runs once when the app starts)
function setupAbout() {
  const year = new Date().getFullYear();

  document.getElementById("about-name").textContent = PROFILE.name;
  document.getElementById("about-role").textContent = PROFILE.role;
  document.getElementById("about-bio").textContent = PROFILE.bio;
  document.getElementById("about-credit").textContent =
    "© " + year + " " + PROFILE.name + ". All rights reserved. Version " + APP_VERSION;
  document.getElementById("home-credit").textContent = "Made by " + PROFILE.name;

  // Link buttons: skip any link with an empty url
  const linksBox = document.getElementById("about-links");
  const filled = PROFILE.links.filter(function (link) {
    return link.url !== "";
  });

  filled.forEach(function (link) {
    const a = document.createElement("a");
    a.className = "pill";
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = link.label;
    linksBox.appendChild(a);
  });

  document.getElementById("links-card").style.display = filled.length > 0 ? "block" : "none";

  // The email button opens the mail app with the subject and a template already filled in
  const subject = "Attendance app: bug report or question";
  const body = "Describe the problem or your question here:\n\n\n---\nPhone model:\nApp version: " + APP_VERSION;
  document.getElementById("about-mail").href =
    "mailto:" + PROFILE.email +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);
}

function openAbout() {
  showingAbout = true;
  render();
  window.scrollTo(0, 0);
}

function closeAbout() {
  showingAbout = false;
  render();
}

// ---------- Settings, backup, restore, reset ----------

function setMsg(element, text, type) {
  element.textContent = text;
  element.className = "msg " + (type || "");
}

function openSettings() {
  backupText.style.display = "none";
  restoreText.value = "";
  setMsg(backupMsg, "", "");
  setMsg(restoreMsg, "", "");
  showingSettings = true;
  render();
}

function closeSettings() {
  showingSettings = false;
  render();
}

// Collect everything the app saved into one object
function makeBackup() {
  return {
    app: "attendance",
    version: 1,
    group: myGroup,
    start: start,
    startDate: startDate,
    marks: marks,
    holidayOverrides: holidayOverrides
  };
}

function copyBackup() {
  const text = JSON.stringify(makeBackup());

  // Show the text too, so you can copy it by hand if automatic copying fails
  backupText.value = text;
  backupText.style.display = "block";
  backupText.select();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      setMsg(backupMsg, "Copied. Paste it into Notes or WhatsApp to keep it safe.", "ok");
    }).catch(function () {
      setMsg(backupMsg, "Could not copy automatically. Select the text above and copy it yourself.", "bad-msg");
    });
  } else {
    setMsg(backupMsg, "Could not copy automatically. Select the text above and copy it yourself.", "bad-msg");
  }
}

function restoreBackup() {
  let data;

  try {
    data = JSON.parse(restoreText.value);
  } catch (error) {
    setMsg(restoreMsg, "That is not a valid backup. Paste the whole text you copied.", "bad-msg");
    return;
  }

  const looksRight = data && data.app === "attendance" && data.start && data.startDate && data.marks;

  if (!looksRight) {
    setMsg(restoreMsg, "That text is not an attendance backup.", "bad-msg");
    return;
  }

  if (!confirm("This replaces ALL the data on this phone with the backup. Continue?")) {
    return;
  }

  localStorage.setItem(START_KEY, JSON.stringify(data.start));
  localStorage.setItem(DATE_KEY, data.startDate);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data.marks));
  localStorage.setItem(HOL_KEY, JSON.stringify(data.holidayOverrides || {}));

  if (data.group === "G1" || data.group === "G2") {
    localStorage.setItem(GROUP_KEY, data.group);
  }

  // Reload so the app starts again with the restored data
  location.reload();
}

function resetAll() {
  if (!confirm("This will erase ALL your attendance data and cannot be undone. Continue?")) {
    return;
  }

  ALL_KEYS.forEach(function (key) {
    localStorage.removeItem(key);
  });

  location.reload();
}

// ---------- Starting numbers form ----------

// Build the starting-numbers form and show it
function openSetup() {
  setupList.innerHTML = "";

  subjects.forEach(function (s, i) {
    const base = start && start[s.name] ? start[s.name] : { held: 0, attended: 0 };

    setupList.innerHTML += `
      <div class="setup-row" id="row-${i}">
        <b>${s.name}</b>
        <div class="fields">
          <label>Held
            <input type="number" min="0" id="held-${i}" value="${base.held}">
          </label>
          <label>Attended
            <input type="number" min="0" id="att-${i}" value="${base.attended}">
          </label>
        </div>
      </div>
    `;
  });

  startDateInput.value = startDate || todayString();
  clearErrors();
  setupCancel.style.display = start && startDate ? "block" : "none";
  showingSettings = false;
  editingSetup = true;
  render();
}

function saveSetup() {
  clearErrors();

  if (!startDateInput.value) {
    showError("Choose the date you start ticking from.", dateField);
    return;
  }

  const newStart = {};

  for (let i = 0; i < subjects.length; i++) {
    const held = Number(document.getElementById("held-" + i).value);
    const attended = Number(document.getElementById("att-" + i).value);
    const row = document.getElementById("row-" + i);

    if (!Number.isInteger(held) || !Number.isInteger(attended) || held < 0 || attended < 0) {
      showError(subjects[i].name + ": use whole numbers, 0 or more.", row);
      return;
    }

    if (attended > held) {
      showError(subjects[i].name + ": attended can't be more than held.", row);
      return;
    }

    newStart[subjects[i].name] = { held: held, attended: attended };
  }

  start = newStart;
  startDate = startDateInput.value;
  localStorage.setItem(START_KEY, JSON.stringify(start));
  localStorage.setItem(DATE_KEY, startDate);
  editingSetup = false;
  render();
}

function cancelSetup() {
  editingSetup = false;
  render();
}

// ---------- Ticking classes ----------

function mark(key, status) {
  if (!marks[selectedDate]) {
    marks[selectedDate] = {};
  }

  if (marks[selectedDate][key] === status) {
    delete marks[selectedDate][key];
  } else {
    marks[selectedDate][key] = status;
  }

  saveMarks();
  render();
}

function changeDay(days) {
  selectedDate = shiftDate(selectedDate, days);
  render();
}

function goToday() {
  selectedDate = todayString();
  render();
}

function renderDay() {
  const info = getClassesForDate(selectedDate);
  const dayMarks = marks[selectedDate] || {};
  const isToday = selectedDate === todayString();
  const holiday = isHoliday(selectedDate);
  const beforeStart = selectedDate < startDate;

  dayTitle.textContent = dayNames[info.dayIndex].slice(0, 3) + ", " + selectedDate + (isToday ? " (today)" : "");
  todayBtn.style.display = isToday ? "none" : "block";

  holidayBtn.style.display = info.dayIndex === 0 || beforeStart ? "none" : "block";
  holidayBtn.textContent = holiday ? "Remove holiday" : "Mark as holiday";

  dayList.innerHTML = "";

  if (beforeStart) {
    dayList.innerHTML = '<p class="empty">This day is before your starting date. It is already counted in your starting numbers.</p>';
    return;
  }

  if (holiday) {
    dayList.innerHTML = '<p class="empty">Holiday. Not counted.</p>';
    return;
  }

  if (info.dayIndex === 0) {
    dayList.innerHTML = '<p class="empty">Sunday. No classes.</p>';
    return;
  }

  if (info.classes.length === 0) {
    dayList.innerHTML = '<p class="empty">No classes on this day.</p>';
    return;
  }

  info.classes.forEach(function (c) {
    const current = dayMarks[c.key];
    const teacher = subjects.find(function (s) {
      return s.name === c.subject;
    }).teacher;

    dayList.innerHTML += `
      <div class="class-row">
        <b>${c.subject}</b>
        <small>${teacher}</small>
        <div class="buttons">
          <button class="P ${current === "P" ? "on" : ""}" onclick="mark('${c.key}', 'P')">Present</button>
          <button class="A ${current === "A" ? "on" : ""}" onclick="mark('${c.key}', 'A')">Absent</button>
          <button class="C ${current === "C" ? "on" : ""}" onclick="mark('${c.key}', 'C')">Cancelled</button>
        </div>
      </div>
    `;
  });
}

// Show one screen and hide the other four
function showOnly(name) {
  picker.style.display = name === "picker" ? "block" : "none";
  setup.style.display = name === "setup" ? "block" : "none";
  settings.style.display = name === "settings" ? "block" : "none";
  about.style.display = name === "about" ? "block" : "none";
  app.style.display = name === "app" ? "block" : "none";
}

function render() {
  // Screen 1: choose a group
  if (!myGroup) {
    showOnly("picker");
    return;
  }

  // Screen 2: starting numbers and date (first time, or when editing)
  if ((!start || !startDate) && !editingSetup) {
    openSetup();
    return;
  }

  if (editingSetup) {
    showOnly("setup");
    return;
  }

  // Screen 3: settings
  if (showingSettings) {
    showOnly("settings");
    return;
  }

  // Screen 4: about
  if (showingAbout) {
    showOnly("about");
    return;
  }

  // Screen 5: the app
  showOnly("app");

  document.getElementById("btn-G1").className = myGroup === "G1" ? "on" : "";
  document.getElementById("btn-G2").className = myGroup === "G2" ? "on" : "";

  const stats = getStats();
  let totalHeld = 0;
  let totalAttended = 0;

  subjectList.innerHTML = "";

  stats.forEach(function (subject) {
    totalHeld += subject.held;
    totalAttended += subject.attended;

    const percent = calcPercent(subject.attended, subject.held);
    const isLow = subject.held > 0 && percent < TARGET;
    const percentText = subject.held === 0 ? "-" : percent.toFixed(1) + "%";

    subjectList.innerHTML += `
      <div class="subject">
        <div class="subject-top">
          <b>${subject.name}</b>
          <span class="subject-percent ${isLow ? "low" : ""}">${percentText}</span>
        </div>
        <small>${subject.teacher}</small>
        <p>${subject.attended} / ${subject.held}</p>
        <div class="bar">
          <div class="bar-fill ${isLow ? "low" : ""}" style="width: ${percent}%"></div>
        </div>
        <small>${getHint(subject.attended, subject.held)}</small>
      </div>
    `;
  });

  const overall = calcPercent(totalAttended, totalHeld);
  overallPercent.textContent = overall.toFixed(1) + "%";
  overallDetail.textContent = totalAttended + " attended of " + totalHeld + " classes";

  const pending = getPendingDays();
  if (pending.length > 0) {
    banner.style.display = "block";
    banner.textContent = pending.length + (pending.length === 1 ? " day" : " days") + " not ticked. Tap to fix from " + pending[0];
  } else {
    banner.style.display = "none";
  }

  renderDay();
}

setupAbout();
render();