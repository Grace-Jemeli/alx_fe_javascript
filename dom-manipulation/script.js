// ===========================
// Config
// ===========================
const STORAGE_KEY = "quotes";
const SELECTED_CAT_KEY = "selectedCategory";
const LAST_QUOTE_KEY = "lastQuote";
const LAST_SYNC_KEY = "lastSync";
const SYNC_URL = "https://jsonplaceholder.typicode.com/posts?_limit=10"; // mock server
const SYNC_INTERVAL_MS = 60000; // periodic sync

// ===========================
// State
// ===========================
let quotes = [
  { id: "seed-1", text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: "seed-2", text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { id: "seed-3", text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Inspiration" }
];

let lastConflicts = []; // { id, local, server }

// ===========================
// Utilities: storage
// ===========================
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      quotes = JSON.parse(stored);
    } catch { /* ignore parse errors */ }
  }
  ensureQuoteShape();
}

function ensureQuoteShape() {
  // Make sure each quote has an id + category
  quotes = quotes.map((q, idx) => ({
    id: q.id || `migrated-${Date.now()}-${idx}`,
    text: q.text,
    category: q.category || "General"
  }));
}

// ===========================
// UI helpers
// ===========================
function setSyncStatus(msg) {
  const el = document.getElementById("syncStatus");
  if (el) el.textContent = msg;
}

function renderNotifications(conflicts = [], summaryMsg = "") {
  const wrap = document.getElementById("notifications");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (summaryMsg) {
    const p = document.createElement("p");
    p.textContent = summaryMsg;
    wrap.appendChild(p);
  }

  if (conflicts.length) {
    const h = document.createElement("h3");
    h.textContent = "Conflicts resolved (server version kept):";
    wrap.appendChild(h);

    const list = document.createElement("ul");
    conflicts.forEach(c => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>ID:</strong> ${c.id}<br/>
          <strong>Local:</strong> "${c.local.text}" — ${c.local.category}<br/>
          <strong>Server:</strong> "${c.server.text}" — ${c.server.category}
        </div>
      `;
      const btn = document.createElement("button");
      btn.textContent = "Keep Local Version";
      btn.addEventListener("click", () => keepLocalVersion(c.id));
      li.appendChild(btn);
      list.appendChild(li);
    });
    wrap.appendChild(list);
  }
}

// ===========================
// Core features from previous tasks
// ===========================
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  const display = document.getElementById("quoteDisplay");
  display.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
  sessionStorage.setItem(LAST_QUOTE_KEY, JSON.stringify(quote));
}

function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill in both the quote and category.");
    return;
  }

  const newQuote = { id: `local-${Date.now()}`, text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  textInput.value = "";
  categoryInput.value = "";
}

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedValue = categoryFilter.value; // remember selection

  // Clear existing options
  categoryFilter.innerHTML = "";

  const uniqueCats = ["all", ...new Set(quotes.map(q => q.category))];

  uniqueCats.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  if (uniqueCats.includes(selectedValue)) {
    categoryFilter.value = selectedValue;
  }
}

function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  const display = document.getElementById("quoteDisplay");

  const filtered = category === "all"
    ? quotes
    : quotes.filter(q => q.category === category);

  if (filtered.length === 0) {
    display.innerHTML = "<p>No quotes available for this category.</p>";
    localStorage.setItem(SELECTED_CAT_KEY, category);
    return;
  }

  // Show one random from the filtered set
  const i = Math.floor(Math.random() * filtered.length);
  const q = filtered[i];
  display.innerHTML = `<p>"${q.text}"</p><small>- ${q.category}</small>`;

  localStorage.setItem(SELECTED_CAT_KEY, category);
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result)
      .map((q, idx) => ({
        id: q.id || `imported-${Date.now()}-${idx}`,
        text: q.text,
        category: q.category || "General"
      }));

    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// ===========================
// Server sync & conflict resolution
// ===========================
async function syncWithServer() {
  setSyncStatus("Syncing with server...");
  lastConflicts = [];

  try {
    const res = await fetch(SYNC_URL);
    const posts = await res.json();

    // Map server posts -> quotes shape
    const serverQuotes = posts.map(p => ({
      id: `server-${p.id}`,
      text: p.title,         // using title as quote text
      category: "Server"     // static category for server data
    }));

    const { added, updated, conflicts } = mergeServerQuotes(serverQuotes);
    lastConflicts = conflicts;

    saveQuotes();
    populateCategories();

    const currentFilter = localStorage.getItem(SELECTED_CAT_KEY) || "all";
    const filterEl = document.getElementById("categoryFilter");
    if (filterEl) filterEl.value = currentFilter;
    filterQuotes();

    const summary = `Sync complete: ${added} added, ${updated} updated, ${conflicts.length} conflicts.`;
    setSyncStatus(`${summary} (Last sync: ${new Date().toLocaleTimeString()})`);
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    renderNotifications(conflicts, summary);
  } catch (err) {
    setSyncStatus("Sync failed. Check your connection.");
  }
}

function mergeServerQuotes(serverQuotes) {
  const localById = new Map(quotes.map(q => [q.id, q]));
  let added = 0;
  let updated = 0;
  const conflicts = [];

  serverQuotes.forEach(sq => {
    if (!localById.has(sq.id)) {
      // New from server
      quotes.push(sq);
      added++;
      return;
    }
    // Exists locally -> possible conflict
    const lq = localById.get(sq.id);
    const differs = lq.text !== sq.text || lq.category !== sq.category;

    if (differs) {
      // Conflict strategy: server wins (but record it)
      conflicts.push({ id: sq.id, local: { ...lq }, server: { ...sq } });

      // Replace local with server version
      const idx = quotes.findIndex(q => q.id === sq.id);
      if (idx !== -1) {
        quotes[idx] = sq;
        updated++;
      }
    }
  });

  return { added, updated, conflicts };
}

// Allow user to keep local version for a specific conflict
function keepLocalVersion(conflictId) {
  const conflict = lastConflicts.find(c => c.id === conflictId);
  if (!conflict) return;

  const idx = quotes.findIndex(q => q.id === conflictId);
  if (idx !== -1) {
    quotes[idx] = { ...conflict.local };
    saveQuotes();
    populateCategories();
    filterQuotes();
    renderNotifications(
      lastConflicts.filter(c => c.id !== conflictId),
      "Reverted one item to the local version."
    );
    setSyncStatus("Local version kept for one conflicted quote.");
  }
}

// ===========================
// Event wiring & init
// ===========================
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("syncNow").addEventListener("click", syncWithServer);

function init() {
  loadQuotes();
  populateCategories();

  // Restore last selected category
  const savedCategory = localStorage.getItem(SELECTED_CAT_KEY);
  if (savedCategory) {
    const sel = document.getElementById("categoryFilter");
    if (sel) sel.value = savedCategory;
    filterQuotes();
  } else {
    // Show one initially
    showRandomQuote();
  }

  // Restore last viewed quote (sessionStorage)
  const last = sessionStorage.getItem(LAST_QUOTE_KEY);
  if (last) {
    const q = JSON.parse(last);
    document.getElementById("quoteDisplay").innerHTML =
      `<p>"${q.text}"</p><small>- ${q.category}</small>`;
  }

  // Show last sync time if available
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (lastSync) {
    setSyncStatus(`Last sync: ${new Date(parseInt(lastSync, 10)).toLocaleTimeString()}`);
  }

  // Start periodic sync
  setInterval(syncWithServer, SYNC_INTERVAL_MS);
  // Initial sync
  syncWithServer();
}

init();
