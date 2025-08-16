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

  // store in localStorage
  localStorage.setItem("quotes", JSON.stringify(quotes));

  // clear inputs
  textInput.value = "";
  categoryInput.value = "";
}

// load quotes from localStorage (if any)
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}

// event listener for newQuote button
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// load stored quotes on page load
loadQuotes();
