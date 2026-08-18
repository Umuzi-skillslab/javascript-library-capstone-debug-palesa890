/**
 * Library User Interface Controller Module
 * @module ui
 */

import {
  books,
  members,
  Book,
  Member,
  PremiumMember,
  borrowBook,
  returnBook,
  findBookByISBN,
  LibraryStats,
} from "./library.js";

import { saveToLocalStorage, loadFromLocalStorage } from "./storage.js";

let catalogueContainer;
let searchInput;
let filterDropdown;
let borrowForm;
let returnForm;
let memberFormContainer;
let memberListContainer;

async function initializeUI() {
  catalogueContainer = document.querySelector("#catalogue-list");
  searchInput = document.getElementById("search");
  filterDropdown = document.querySelector("#filter-category");
  borrowForm = document.getElementById("borrow-form");
  returnForm = document.getElementById("return-form");
  memberFormContainer = document.getElementById("member-form");
  memberListContainer = document.getElementById("member-list");

  if (!catalogueContainer || !searchInput || !filterDropdown || !borrowForm) {
    console.warn(
      "UI Initialization halted: Target layout elements are missing in active viewport.",
    );
    return;
  }

  if (memberListContainer)
    memberListContainer.innerHTML = "<p>Loading members database...</p>";

  await seedInitialMockData();

  setupEventListeners();
  setupTabNavigation();
  createMemberForm();

  loadCatalogue();
  renderMemberList();
  updateStatisticsDisplay();
}

function setupEventListeners() {
  searchInput.addEventListener("input", handleSearch);
  filterDropdown.addEventListener("change", handleFilterChange);
  borrowForm.addEventListener("submit", handleBorrowSubmit);

  if (returnForm) {
    returnForm.addEventListener("submit", handleReturnSubmit);
  }

  catalogueContainer.addEventListener("click", handleBookClick);

  if (memberListContainer) {
    memberListContainer.addEventListener("click", handleMemberListClick);
  }
}

function setupTabNavigation() {
  const tabs = ["catalogue", "members", "statistics"];

  tabs.forEach((tabName) => {
    const targetBtn = document.getElementById(`${tabName}-tab`);
    if (!targetBtn) return;

    targetBtn.addEventListener("click", () => {
      tabs.forEach((t) => {
        const section = document.getElementById(`${t}-section`);
        const button = document.getElementById(`${t}-tab`);
        if (section) section.style.display = "none";
        if (button) button.classList.remove("active");
      });

      const targetSection = document.getElementById(`${tabName}-section`);
      if (targetSection) targetSection.style.display = "block";
      targetBtn.classList.add("active");

      const borrowSection = document.getElementById("borrow-section");
      if (borrowSection) {
        borrowSection.style.display =
          tabName === "catalogue" ? "block" : "none";
      }

      const returnSection = document.getElementById("return-section");
      if (returnSection) {
        returnSection.style.display =
          tabName === "catalogue" ? "block" : "none";
      }

      if (tabName === "statistics") updateStatisticsDisplay();
    });
  });

  const defaultBtn = document.getElementById("catalogue-tab");
  if (defaultBtn) defaultBtn.classList.add("active");
}

function loadCatalogue() {
  renderBookCatalogue(books);
}

function renderBookCatalogue(bookList) {
  catalogueContainer.innerHTML = "";

  if (!bookList || bookList.length === 0) {
    catalogueContainer.innerHTML = `<div class="info-notice">No records match current parameters.</div>`;
    return;
  }

  const dynamicHTMLPayload = bookList
    .map((bookItem) => {
      const availabilityBadgeState =
        bookItem.availableCopies > 0 ? "available" : "unavailable";
      const visualBadgeText =
        bookItem.availableCopies > 0 ? "In Stock" : "Checked Out";

      // Resolve cover URL (uses book property, Open Library ISBN lookup, or a fallback placeholder)
      const coverUrl =
        bookItem.coverUrl ||
        (bookItem.cover_id
          ? `https://covers.openlibrary.org/b/id/${bookItem.cover_id}-M.jpg`
          : bookItem.isbn && !bookItem.isbn.startsWith("MOCK-")
            ? `https://covers.openlibrary.org/b/isbn/${bookItem.isbn}-M.jpg`
            : `https://placehold.co/150x200?text=${encodeURIComponent(
                bookItem.title,
              )}`);

      return `
            <div class="book-card" data-isbn="${bookItem.isbn}">
                <img 
                  src="${coverUrl}" 
                  alt="${bookItem.title} Cover" 
                  class="book-cover-img" 
                  onerror="this.onerror=null;this.src='https://placehold.co/150x200?text=No+Cover';"
                  style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;"
                />
                <h3>${bookItem.title}</h3>
                <p><strong>Author:</strong> ${bookItem.author}</p>
                <p><strong>Category:</strong> ${bookItem.category.toUpperCase()}</p>
                <span class="badge ${availabilityBadgeState}">${visualBadgeText} (${bookItem.availableCopies}/${bookItem.totalCopies})</span>
            </div>
        `;
    })
    .join("");

  catalogueContainer.innerHTML = dynamicHTMLPayload;
}

function handleBookClick(event) {
  const resolvingCardContext = event.target.closest(".book-card");
  if (!resolvingCardContext) return;

  const extractionTargetISBN = resolvingCardContext.getAttribute("data-isbn");
  if (extractionTargetISBN) {
    displayBookDetails(extractionTargetISBN);
  }
}

async function handleSearch(event) {
  const rawExpression = event.target.value || "";
  const cleanSearchToken = rawExpression.trim().toLowerCase();

  if (cleanSearchToken === "") {
    loadCatalogue();
    return;
  }

  catalogueContainer.innerHTML = `<div class="info-notice">Searching global registry...</div>`;

  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(cleanSearchToken)}&limit=5`;
    const response = await fetch(searchUrl);

    if (!response.ok)
      throw new Error("Search endpoint dropped query connectivity");

    const data = await response.json();

    if (data && data.docs && data.docs.length > 0) {
      const apiSearchResults = data.docs.map((doc) => {
        const title = doc.title || "Unknown Title";
        const author =
          doc.author_name && doc.author_name.length > 0
            ? doc.author_name[0]
            : "Generic Author";
        const year = doc.first_publish_year || 2000;

        const isbn =
          doc.isbn && doc.isbn.length > 0
            ? doc.isbn[0]
            : `MOCK-${doc.key.split("/").pop()}`;

        // Extract cover image ID from API search response
        const coverUrl = doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : `https://placeholder.co/150x200?text=${encodeURIComponent(title)}`;

        const newBookInstance = new Book(
          isbn,
          title,
          author,
          year,
          3,
          "fiction",
          coverUrl, // Pass coverUrl if your Book constructor accepts it
        );
        newBookInstance.coverUrl = coverUrl;

        if (!books.some((b) => b.isbn === isbn)) {
          books.push(newBookInstance);
        }

        return newBookInstance;
      });

      renderBookCatalogue(apiSearchResults);
    } else {
      catalogueContainer.innerHTML = `<div class="info-notice">No records match global parameters.</div>`;
    }
  } catch (err) {
    console.error(`Dynamic Lookup Failed: ${err.message}`);
    catalogueContainer.innerHTML = `<div class="info-notice error-msg">Search unavailable (Offline fallback error)</div>`;
  }
}

function handleFilterChange() {
  const targetValue = filterDropdown.value || "all";
  const normalCategoryExpression = targetValue.trim().toLowerCase();

  if (normalCategoryExpression === "all") {
    loadCatalogue();
    return;
  }

  const categoricalMatches = books.filter(
    (item) => item.category === normalCategoryExpression,
  );
  renderBookCatalogue(categoricalMatches);
}

function handleBorrowSubmit(event) {
  event.preventDefault();

  const mIdInput = document.getElementById("member-id");
  const isbnInput = document.getElementById("isbn");

  if (!mIdInput || !isbnInput) return;

  const memberId = mIdInput.value.trim();
  const targetIsbn = isbnInput.value.trim();

  if (!memberId || !targetIsbn) {
    displaySystemToast(
      "Submission Rejected: Credentials cannot be blank.",
      "danger",
    );
    return;
  }

  let resolvedMember = members.find(
    (m) => m.id.toLowerCase() === memberId.toLowerCase(),
  );
  if (!resolvedMember) {
    resolvedMember = members.find(
      (m) => m.name.toLowerCase() === memberId.toLowerCase(),
    );
  }

  if (!resolvedMember) {
    displaySystemToast(
      `We couldn't find a member matching "${memberId}".`,
      "danger",
    );
    return;
  }

  const success = borrowBook(resolvedMember.id, targetIsbn);

  if (success) {
    displaySystemToast(
      `Transaction Complete! "${resolvedMember.name}" has borrowed this book.`,
      "success",
    );
    borrowForm.reset();
    loadCatalogue();
    renderMemberList();
    updateStatisticsDisplay();
    saveToLocalStorage();
  } else {
    const errorMessage =
      borrowBook.lastError ||
      "Transaction failed. Please check your parameters.";
    displaySystemToast(errorMessage, "danger");
  }
}

/**
 * Handles submission of the Return Book form
 */
function handleReturnSubmit(event) {
  event.preventDefault();

  const mIdInput =
    document.getElementById("return-member-id") ||
    document.getElementById("member-id");
  const isbnInput =
    document.getElementById("return-isbn") || document.getElementById("isbn");

  if (!mIdInput || !isbnInput) return;

  const memberId = mIdInput.value.trim();
  const targetIsbn = isbnInput.value.trim();

  processBookReturn(memberId, targetIsbn, returnForm);
}

/**
 * Core execution logic for returning a book
 */
function processBookReturn(memberQuery, isbn, formToReset = null) {
  if (!memberQuery || !isbn) {
    displaySystemToast(
      "Return Rejected: Member and ISBN identifiers are required.",
      "danger",
    );
    return false;
  }

  let resolvedMember = members.find(
    (m) => m.id.toLowerCase() === memberQuery.toLowerCase(),
  );
  if (!resolvedMember) {
    resolvedMember = members.find(
      (m) => m.name.toLowerCase() === memberQuery.toLowerCase(),
    );
  }

  if (!resolvedMember) {
    displaySystemToast(
      `We couldn't find a member matching "${memberQuery}".`,
      "danger",
    );
    return false;
  }

  const success = returnBook(resolvedMember.id, isbn);

  if (success) {
    displaySystemToast(
      `Return Complete! Book with ISBN ${isbn} returned by "${resolvedMember.name}".`,
      "success",
    );
    if (formToReset) formToReset.reset();
    loadCatalogue();
    renderMemberList();
    updateStatisticsDisplay();
    saveToLocalStorage();
    return true;
  } else {
    const errorMessage =
      returnBook.lastError ||
      "Return failed. Verify the member has actively checked out this item.";
    displaySystemToast(errorMessage, "danger");
    return false;
  }
}

/**
 * Handles clicks within the member list (e.g. quick return buttons)
 */
function handleMemberListClick(event) {
  const returnBtn = event.target.closest(".quick-return-btn");
  if (!returnBtn) return;

  const memberId = returnBtn.getAttribute("data-member-id");
  const isbn = returnBtn.getAttribute("data-isbn");

  if (memberId && isbn) {
    processBookReturn(memberId, isbn);
  }
}

function displayBookDetails(isbn) {
  const matchedBookInstance = findBookByISBN(isbn);
  const detailsViewBox = document.getElementById("book-details");

  if (!detailsViewBox) return;

  if (!matchedBookInstance) {
    detailsViewBox.innerHTML = `<p class="error-msg">Target asset registry trace resolved with an undefined state mismatch.</p>`;
    return;
  }

  const coverUrl =
    matchedBookInstance.coverUrl ||
    `https://covers.openlibrary.org/b/isbn/${matchedBookInstance.isbn}-M.jpg`;

  detailsViewBox.innerHTML = `
        <div class="detailed-card-panel" style="display: flex; gap: 1rem; align-items: flex-start;">
            <img 
              src="${coverUrl}" 
              alt="${matchedBookInstance.title} Cover" 
              onerror="this.onerror=null;this.src='https://placehold.co/150x200?text=No+Cover';"
              style="width: 140px; height: 200px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" 
            />
            <div>
                <h2>${matchedBookInstance.title}</h2>
                <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid #cbd5e1;">
                <p><strong>Author:</strong> ${matchedBookInstance.author}</p>
                <p><strong>Global ISBN Code:</strong> ${matchedBookInstance.isbn}</p>
                <p><strong>Publication Year:</strong> ${matchedBookInstance.year}</p>
                <p><strong>Categorization Profile:</strong> ${matchedBookInstance.category.toUpperCase()}</p>
                <p><strong>Current Tracking Pool:</strong> ${matchedBookInstance.availableCopies} available out of ${matchedBookInstance.totalCopies} total copies stored.</p>
            </div>
        </div>
    `;
}

function updateStatisticsDisplay() {
  const totalBooksEl = document.querySelector(".total-books");
  const totalMembersEl = document.querySelector(".total-members");
  const borrowedCountEl = document.querySelector(".books-borrowed");

  if (totalBooksEl) totalBooksEl.textContent = String(books.length);
  if (totalMembersEl) totalMembersEl.textContent = String(members.length);

  if (borrowedCountEl) {
    LibraryStats.updateStats();
    LibraryStats.aggregateTotalBorrowingsCount(members);
    borrowedCountEl.textContent = String(LibraryStats.totalBorrowings);
  }
}

function createMemberForm() {
  if (!memberFormContainer) return;

  memberFormContainer.innerHTML = `
        <form id="dynamic-user-add-form" style="box-shadow: none; padding: 0; max-width: 100%;">
            <div>
                <label for="new-member-id" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.25rem;">Member ID Code</label>
                <input type="text" id="new-member-id" placeholder="e.g., M401" required>
            </div>
            <div>
                <label for="new-member-name" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.25rem;">Full Legal Name</label>
                <input type="text" id="new-member-name" placeholder="e.g., John Doe" required>
            </div>
            <div>
                <label for="new-member-email" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.25rem;">Electronic Mail</label>
                <input type="email" id="new-member-email" placeholder="name@domain.com" required>
            </div>
            <div>
                <label for="new-member-tier" style="display:block; font-size:0.85rem; font-weight:600; margin-bottom:0.25rem;">Account Access Class</label>
                <select id="new-member-tier">
                    <option value="standard">Standard Tier Membership</option>
                    <option value="premium">Premium VIP Tier</option>
                </select>
            </div>
            <button type="submit" style="margin-top: 0.5rem;">Register New Account Profile</button>
        </form>
    `;

  const userSubmissionForm = document.getElementById("dynamic-user-add-form");
  if (userSubmissionForm) {
    userSubmissionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const idValue = document.getElementById("new-member-id").value.trim();
      const nameValue = document.getElementById("new-member-name").value.trim();
      const emailValue = document
        .getElementById("new-member-email")
        .value.trim();
      const tierValue = document.getElementById("new-member-tier").value;

      if (members.some((m) => m.id === idValue)) {
        displaySystemToast(
          "Profile Collision: This identification number is already taken.",
          "danger",
        );
        return;
      }

      let brandNewUser;
      if (tierValue === "premium") {
        brandNewUser = new PremiumMember(idValue, nameValue, emailValue);
      } else {
        brandNewUser = new Member(idValue, nameValue, emailValue);
      }

      members.push(brandNewUser);
      displaySystemToast(
        `Account Profile successfully authorized for ${nameValue}!`,
        "success",
      );
      userSubmissionForm.reset();
      renderMemberList();
      updateStatisticsDisplay();
      saveToLocalStorage();
    });
  }
}

function renderMemberList() {
  if (!memberListContainer) return;
  memberListContainer.innerHTML = "";

  if (members.length === 0) {
    memberListContainer.innerHTML = `<p style="color: var(--text-muted);">No active cardholders configured in system memory.</p>`;
    return;
  }

  members.forEach((m) => {
    const structuralDiv = document.createElement("div");
    structuralDiv.className = "member-card";

    let loansMarkup = `<p style="font-size: 0.85rem;"><strong>Active Loans:</strong> ${m.borrowedBooks.length} items out</p>`;

    if (m.borrowedBooks.length > 0) {
      loansMarkup += `<ul style="font-size: 0.8rem; margin: 0.5rem 0; padding-left: 1.2rem; list-style-type: disc;">`;
      m.borrowedBooks.forEach((bookOrIsbn) => {
        const isbnStr =
          typeof bookOrIsbn === "object" ? bookOrIsbn.isbn : bookOrIsbn;
        const matchedBook = findBookByISBN(isbnStr);
        const bookTitle = matchedBook ? matchedBook.title : isbnStr;

        loansMarkup += `
          <li style="margin-bottom: 0.25rem;">
            <span>${bookTitle}</span>
            <button 
              class="quick-return-btn" 
              data-member-id="${m.id}" 
              data-isbn="${isbnStr}" 
              style="font-size:0.7rem; padding: 2px 6px; margin-left: 6px; cursor: pointer;">
              Return
            </button>
          </li>
        `;
      });
      loansMarkup += `</ul>`;
    }

    structuralDiv.innerHTML = `
      <h4>${m.name} (ID: ${m.id})</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted);">${m.email}</p>
      <p style="font-size: 0.85rem; margin-top:0.5rem;"><strong>Tier Status:</strong> ${m.membershipType.toUpperCase()}</p>
      ${loansMarkup}
    `;
    memberListContainer.appendChild(structuralDiv);
  });
}

function displaySystemToast(message, variant = "success") {
  const structuralToastNode = document.createElement("div");
  structuralToastNode.style.position = "fixed";
  structuralToastNode.style.bottom = "24px";
  structuralToastNode.style.right = "24px";
  structuralToastNode.style.padding = "12px 24px";
  structuralToastNode.style.borderRadius = "8px";
  structuralToastNode.style.color = "#ffffff";
  structuralToastNode.style.fontWeight = "600";
  structuralToastNode.style.zIndex = "99999";
  structuralToastNode.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.1)";
  structuralToastNode.style.background =
    variant === "success" ? "#10b981" : "#ef4444";
  structuralToastNode.textContent = message;

  document.body.appendChild(structuralToastNode);
  setTimeout(() => structuralToastNode.remove(), 4000);
}

async function seedInitialMockData() {
  loadFromLocalStorage();

  if (books.length === 0) {
    try {
      const apiEndpoint =
        "https://openlibrary.org/subjects/classic_fiction.json?limit=5";
      const response = await fetch(apiEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.works && data.works.length > 0) {
        data.works.forEach((work) => {
          const title = work.title || "Unknown Title";
          const author =
            work.authors && work.authors.length > 0
              ? work.authors[0].name
              : "Generic Author";
          const year = work.first_publish_year || 2000;

          const mockIsbn = work.cover_id
            ? `9780${work.cover_id}00`
            : String(Math.floor(1000000000000 + Math.random() * 9000000000000));
          const defaultTotalCopies = Math.floor(Math.random() * 4) + 2;

          // Generate cover image URL dynamically using Open Library Cover API
          const coverUrl = work.cover_id
            ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
            : `https://placehold.co/150x200?text=${encodeURIComponent(title)}`;

          const newBook = new Book(
            mockIsbn,
            title,
            author,
            year,
            defaultTotalCopies,
            "fiction",
            coverUrl,
          );

          // Guarantee coverUrl property is set on object
          newBook.coverUrl = coverUrl;

          books.push(newBook);
        });

        saveToLocalStorage();
      } else {
        throw new Error(
          "Empty works payload structure returned from endpoint.",
        );
      }
    } catch (apiError) {
      console.error(
        `API Fetch Interrupted: ${apiError.message}. Initiating static fallbacks.`,
      );

      // Static fallback books with explicit Open Library ISBN cover URLs
      const fallbackBooks = [
        new Book(
          "9780141187761",
          "1984",
          "George Orwell",
          1949,
          3,
          "fiction",
          "https://covers.openlibrary.org/b/isbn/9780141187761-M.jpg",
        ),
        new Book(
          "9780316769174",
          "The Catcher in the Rye",
          "J.D. Salinger",
          1951,
          2,
          "fiction",
          "https://covers.openlibrary.org/b/isbn/9780316769174-M.jpg",
        ),
        new Book(
          "9780061120084",
          "To Kill a Mockingbird",
          "Harper Lee",
          1960,
          4,
          "fiction",
          "https://covers.openlibrary.org/b/isbn/9780061120084-M.jpg",
        ),
      ];

      fallbackBooks.forEach((book) => {
        book.coverUrl =
          book.coverUrl ||
          `https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`;
        books.push(book);
      });

      saveToLocalStorage();
    }
  }

  if (members.length === 0) {
    members.push(
      new Member("M101", "Alice Smith", "alice@example.com"),
      new PremiumMember("M202", "Bob Jones", "bob@vip.com"),
    );
    saveToLocalStorage();
  }
}

document.addEventListener("DOMContentLoaded", initializeUI);