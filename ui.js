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
  findBookByISBN,
  LibraryStats,
} from "./library.js";

// Central UI Element Registry
let catalogueContainer;
let searchInput;
let filterDropdown;
let borrowForm;
let memberFormContainer;
let memberListContainer;


function initializeUI() {
  catalogueContainer = document.querySelector("#catalogue-list");
  searchInput = document.getElementById("search");
  filterDropdown = document.querySelector("#filter-category");
  borrowForm = document.getElementById("borrow-form");
  memberFormContainer = document.getElementById("member-form");
  memberListContainer = document.getElementById("member-list");

  if (!catalogueContainer || !searchInput || !filterDropdown || !borrowForm) {
    console.warn(
      "UI Initialization halted: Target layout elements are missing in active viewport.",
    );
    return;
  }

  seedInitialMockData();

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

  catalogueContainer.addEventListener("click", handleBookClick);
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

      // Cross-functional fallback view displays
      const borrowSection = document.getElementById("borrow-section");
      if (borrowSection) {
        borrowSection.style.display =
          tabName === "catalogue" ? "block" : "none";
      }

      if (tabName === "statistics") updateStatisticsDisplay();
    });
  });

  // Default active landing layer view
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

      return `
            <div class="book-card" data-isbn="${bookItem.isbn}">
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


function handleSearch(event) {
  const rawExpression = event.target.value || "";
  const cleanSearchToken = rawExpression.trim().toLowerCase();

  if (cleanSearchToken === "") {
    loadCatalogue();
    return;
  }

  const searchMatches = books.filter(
    (item) =>
      item.title.toLowerCase().includes(cleanSearchToken) ||
      item.author.toLowerCase().includes(cleanSearchToken) ||
      item.isbn.includes(cleanSearchToken),
  );

  renderBookCatalogue(searchMatches);
}


function handleFilterChange() {
  const targetValue = filterDropdown.value || "all";
  const normalCategoryExpression = targetValue.trim().toLowerCase();

\  if (normalCategoryExpression === "all") {
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

  const systemAuthorizationStatus = borrowBook(memberId, targetIsbn);

  if (systemAuthorizationStatus) {
    displaySystemToast(
      `Transaction Complete! Book matching barcode [${targetIsbn}] assigned to Member [${memberId}].`,
      "success",
    );
    borrowForm.reset();

    loadCatalogue();
    renderMemberList();
    updateStatisticsDisplay();
    saveToLocalStorage();
  } else {
    displaySystemToast(
      "Transaction Denied: Verify user cap limits or inventory stock levels.",
      "danger",
    );
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

  detailsViewBox.innerHTML = `
        <div class="detailed-card-panel">
            <h2>${matchedBookInstance.title}</h2>
            <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid #cbd5e1;">
            <p><strong>Author:</strong> ${matchedBookInstance.author}</p>
            <p><strong>Global ISBN Code:</strong> ${matchedBookInstance.isbn}</p>
            <p><strong>Publication Year:</strong> ${matchedBookInstance.year}</p>
            <p><strong>Categorization Profile:</strong> ${matchedBookInstance.category.toUpperCase()}</p>
            <p><strong>Current Tracking Pool:</strong> ${matchedBookInstance.availableCopies} available out of ${matchedBookInstance.totalCopies} total copies stored.</p>
        </div>
    `;
}

function updateStatisticsDisplay() {
  const totalBooksEl = document.querySelector(".total-books");
  const totalMembersEl = document.querySelector(".total-members");
  const borrowedCountEl = document.querySelector(".books-borrowed");

  // Fixed: Implemented rigorous element existence checks and used .textContent for security
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

/**
 * Spits out clean account index loops
 */
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
    structuralDiv.innerHTML = `
            <h4>${m.name} (ID: ${m.id})</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted);">${m.email}</p>
            <p style="font-size: 0.85rem; margin-top:0.5rem;"><strong>Tier Status:</strong> ${m.membershipType.toUpperCase()}</p>
            <p style="font-size: 0.85rem;"><strong>Active Loans:</strong> ${m.borrowedBooks.length} items out</p>
        `;
    memberListContainer.appendChild(structuralDiv);
  });
}

// DATA PERSISTENCE & PORTABILITY MANAGEMENT ENGINE


export function exportLibraryData() {
  try {
    const databasePayload = { books, members };
    return JSON.stringify(databasePayload);
  } catch (conversionError) {
    console.error(`Serialization Engine Failed: ${conversionError.message}`);
    return null;
  }
}

export function importLibraryData(jsonString) {
  try {
    if (!jsonString) return false;
    const compiledObjects = JSON.parse(jsonString);

    if (compiledObjects.books && compiledObjects.members) {
      books.length = 0;
      compiledObjects.books.forEach((b) =>
        books.push(
          new Book(
            b.isbn,
            b.title,
            b.author,
            b.year,
            b.totalCopies,
            b.category,
          ),
        ),
      );

      members.length = 0;
      compiledObjects.members.forEach((m) => {
        let rebuiltUser =
          m.membershipType === "premium"
            ? new PremiumMember(m.id, m.name, m.email)
            : new Member(m.id, m.name, m.email);
        rebuiltUser.borrowedBooks = m.borrowedBooks || [];
        members.push(rebuiltUser);
      });

      loadCatalogue();
      renderMemberList();
      updateStatisticsDisplay();
      return true;
    }
    return false;
  } catch (parseFaultException) {
    console.error(
      `Structural Integrity Restructuring Error: ${parseFaultException.message}`,
    );
    return false;
  }
}

export function saveToLocalStorage() {
  //Safeguarded execution storage scopes using diagnostic checks
  try {
    localStorage.setItem("libraryBooks", JSON.stringify(books));
    localStorage.setItem("libraryMembers", JSON.stringify(members));
  } catch (discStorageWriteException) {
    console.error(
      `Storage Registry Write Fault: ${discStorageWriteException.message}`,
    );
  }
}

export function loadFromLocalStorage() {
  try {
    const rawBooksCollectionString = localStorage.getItem("libraryBooks");
    const rawMembersCollectionString = localStorage.getItem("libraryMembers");

    if (rawBooksCollectionString) {
      const parsedBooks = JSON.parse(rawBooksCollectionString);
      books.length = 0;
      parsedBooks.forEach((b) => {
        const recoveryInstance = new Book(
          b.isbn,
          b.title,
          b.author,
          b.year,
          b.totalCopies,
          b.category,
        );
        recoveryInstance.availableCopies = b.availableCopies;
        recoveryInstance.checkedOut = b.checkedOut || [];
        books.push(recoveryInstance);
      });
    }

    if (rawMembersCollectionString) {
      const parsedMembers = JSON.parse(rawMembersCollectionString);
      members.length = 0;
      parsedMembers.forEach((m) => {
        let userInstance =
          m.membershipType === "premium"
            ? new PremiumMember(m.id, m.name, m.email)
            : new Member(m.id, m.name, m.email);
        userInstance.borrowedBooks = m.borrowedBooks || [];
        members.push(userInstance);
      });
    }
  } catch (storageRecoveryFault) {
    console.error(
      `Local Engine System Profile Restructuring Halted: ${storageRecoveryFault.message}`,
    );
  }
}

// FEEDBACK ALERTS NOTIFICATION INFRASTRUCTURE

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

function seedInitialMockData() {
  loadFromLocalStorage();
  if (books.length === 0) {
    books.push(
      new Book("9780141187761", "1984", "George Orwell", 1949, 3, "fiction"),
      new Book(
        "9780316769174",
        "The Catcher in the Rye",
        "J.D. Salinger",
        1951,
        2,
        "fiction",
      ),
      new Book(
        "9780061120084",
        "To Kill a Mockingbird",
        "Harper Lee",
        1960,
        4,
        "fiction",
      ),
      new Book(
        "9780451524935",
        "The Scarlet Letter",
        "Nathaniel Hawthorne",
        1850,
        1,
        "fiction",
      ),
    );
    saveToLocalStorage();
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
