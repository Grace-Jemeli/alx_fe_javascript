// quotes array with categories
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Inspiration" }
];

// Show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  const display = document.getElementById("quoteDisplay");
  display.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;

  // Save last viewed quote in sessionStorage
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Add a new quote
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill in both the quote and category.");
    return;
  }

  const newQuote = { text, category };
  quotes.push(newQuote);

  // Save to localStorage
  saveQuotes();

  // Update categories dropdown
  populateCategories();

  // Clear inputs
  textInput.value = "";
  categoryInput.value = "";
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Load quotes from localStorage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

// Populate category filter dropdown
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedValue = categoryFilter.value; // keep user’s selection

  // Collect unique categories
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  // Rebuild dropdown
  categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join("");

  // Restore selection if possible
  if (categories.includes(selectedValue)) {
    categoryFilter.value = selectedValue;
  }
}

// Filter quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const display = document.getElementById("quoteDisplay");

  localStorage.setItem("selectedCategory", selectedCategory);

  if (selectedCategory === "all") {
    display.innerHTML = quotes.map(q => `<p>"${q.text}"</p><small>- ${q.category}</small>`).join("");
  } else {
    const filtered = quotes.filter(q => q.category === selectedCategory);
    display.innerHTML = filtered.map(q => `<p>"${q.text}"</p><small>- ${q.category}</small>`).join("");
  }
}

// Export quotes as JSON file
function exportQuotes() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// Event listener for "Show New Quote"
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// Initialize app
function init() {
  loadQuotes();
  populateCategories();

  // Restore last selected category
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    document.getElementById("categoryFilter").value = savedCategory;
    filterQuotes();
  }

  // Restore last viewed quote (sessionStorage)
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML =
      `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
  }
}

init();
