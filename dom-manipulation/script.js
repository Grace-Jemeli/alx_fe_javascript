// ... (keep all your existing code above)

// ===========================
// Server sync & conflicts
// ===========================
async function fetchQuotesFromServer() {
  const res = await fetch(SYNC_URL);
  const posts = await res.json();
  return posts.map(p => ({
    id: `server-${p.id}`,
    text: p.title,
    category: "Server"
  }));
}

async function postQuoteToServer(quote) {
  try {
    const res = await fetch(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    const data = await res.json();
    console.log("Posted to server:", data);
  } catch (err) {
    console.error("Failed to post quote:", err);
  }
}

// ✅ wrapper with required name
async function syncQuotes() {
  return await syncWithServer();
}

async function syncWithServer() {
  setSyncStatus("Syncing with server...");
  lastConflicts = [];

  try {
    const serverQuotes = await fetchQuotesFromServer();
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

// ... (mergeServerQuotes, keepLocalVersion stay unchanged)

// ===========================
// Init
// ===========================
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// ✅ update button to use syncQuotes
document.getElementById("syncNow").addEventListener("click", syncQuotes);

function init() {
  loadQuotes();
  populateCategories();
  const savedCategory = localStorage.getItem(SELECTED_CAT_KEY);
  if (savedCategory) {
    const sel = document.getElementById("categoryFilter");
    if (sel) sel.value = savedCategory;
    filterQuotes();
  } else {
    showRandomQuote();
  }
  const last = sessionStorage.getItem(LAST_QUOTE_KEY);
  if (last) {
    const q = JSON.parse(last);
    document.getElementById("quoteDisplay").innerHTML =
      `<p>"${q.text}"</p><small>- ${q.category}</small>`;
  }
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (lastSync) {
    setSyncStatus(`Last sync: ${new Date(parseInt(lastSync, 10)).toLocaleTimeString()}`);
  }
  // ✅ call syncQuotes instead of syncWithServer
  setInterval(syncQuotes, SYNC_INTERVAL_MS);
  syncQuotes();
}
init();
