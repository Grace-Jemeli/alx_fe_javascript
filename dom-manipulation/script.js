// quotes array with categories
let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Inspiration" }
];

// show a random quote
function showRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  const display = document.getElementById("quoteDisplay");
  display.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;

  // store last viewed quote in sessionStorage
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// add a new quote
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

  // save updated quotes
  saveQuotes();

  // update dropdown with new category if needed
  populateCategories();

  // clear inputs
  textInput.value = "";
  categoryInput.value = "";
}

// save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// load quotes from localStorage
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

// Populate category filter dropdown using appendChild
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedValue = categoryFilter.value; // remember current selection

  // Clear existing options
  categoryFilter.innerHTML = "";

  // Collect unique categories
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  // Create and append each option
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore previous selection if still valid
  if (categories.includes(selectedValue)) {
    categoryFilter.value = selectedValue;
  }
}

// filter quotes by category
function filterQuotes() {
  const category = document.getElementById("categoryFilter").value;
  const display = document.getElementById("quoteDisplay");

  let filteredQuotes = category === "all" ? quotes : quotes.filter(q => q.category === category);

  if (filteredQuotes.length === 0) {
    display.innerHTML = "<p>No quotes available for this category.</p>";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  display.innerHTML = `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;

  // save selected category to localStorage
  localStorage.setItem("selectedCategory", category);
}

// export quotes to JSON
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
}

// import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };
  fileReader.readAsText(event.target.files[0]);
}

// event listeners
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// initialize app
loadQuotes();
populateCategories();

// restore last selected category filter
const savedCategory = localStorage.getItem("selectedCategory");
if (savedCategory) {
  document.getElementById("categoryFilter").value = savedCategory;
  filterQuotes();
}

// restore last viewed quote from sessionStorage
const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  const quote = JSON.parse(lastQuote);
  document.getElementById("quoteDisplay").innerHTML =
    `<p>"${quote.text}"</p><small>- ${quote.category}</small>`;
}
