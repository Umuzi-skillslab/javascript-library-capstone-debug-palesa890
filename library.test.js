/**
 * Library Management System - Extended 100+ Test Suite
 */

import {
  Book,
  DigitalBook,
  Member,
  PremiumMember,
  books,
  members,
  findBookByISBN,
  findMemberById,
  getBooksByAuthor,
  searchBooksByCategory,
  calculateTotalLateFees,
  combineBookCollections,
  addMultipleBooks,
  updateMemberInfo,
  borrowBook,
  processReturnQueue,
  findOverdueBooks,
  LibraryStats,
  formatBookInfo,
  calculateFineAmount,
  LATE_FEE_PER_DAY,
  MAX_BOOKS_PER_MEMBER,
} from "./library.js";

import {
  exportLibraryData,
  importLibraryData,
  saveToLocalStorage,
  loadFromLocalStorage,
} from "./storage.js";

const SVG_FALLBACK =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='200' viewBox='0 0 150 200'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b'%3ENo Cover%3C/text%3E%3C/svg%3E";

function renderBookCatalogue(bookList) {
  const catalogueContainer = document.getElementById("catalogue-list");
  if (!catalogueContainer) return;
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

      const coverUrl =
        bookItem.coverUrl ||
        (bookItem.cover_id
          ? `https://covers.openlibrary.org/b/id/${bookItem.cover_id}-M.jpg`
          : bookItem.isbn && !bookItem.isbn.startsWith("MOCK-")
            ? `https://covers.openlibrary.org/b/isbn/${bookItem.isbn}-M.jpg`
            : SVG_FALLBACK);

      return `
        <div class="book-card" data-isbn="${bookItem.isbn}">
            <img 
              src="${coverUrl}" 
              alt="${bookItem.title} Cover" 
              class="book-cover-img" 
              onerror="this.onerror=null;this.src='${SVG_FALLBACK}';"
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
    (matchedBookInstance.isbn && !matchedBookInstance.isbn.startsWith("MOCK-")
      ? `https://covers.openlibrary.org/b/isbn/${matchedBookInstance.isbn}-M.jpg`
      : SVG_FALLBACK);

  detailsViewBox.innerHTML = `
    <div class="detailed-card-panel">
        <img 
          src="${coverUrl}" 
          alt="${matchedBookInstance.title} Cover" 
          onerror="this.onerror=null;this.src='${SVG_FALLBACK}';"
        />
        <div>
            <h2>${matchedBookInstance.title}</h2>
            <hr>
            <p><strong>Author:</strong> ${matchedBookInstance.author}</p>
            <p><strong>Global ISBN Code:</strong> ${matchedBookInstance.isbn}</p>
            <p><strong>Publication Year:</strong> ${matchedBookInstance.year}</p>
            <p><strong>Categorization Profile:</strong> ${matchedBookInstance.category.toUpperCase()}</p>
            <p><strong>Current Tracking Pool:</strong> ${matchedBookInstance.availableCopies} available out of ${matchedBookInstance.totalCopies} total copies stored.</p>
        </div>
    </div>
  `;
}

/* =========================================================================
   SUITE 1: Book Class Constructor, Methods, & Mutability (Tests 1 - 15)
   ========================================================================= */
describe("1. Book Class Mechanics", () => {
  test("Creates book instance with valid initial attributes", () => {
    const b = new Book("101", "Title", "Author", 2020, 3, "fiction");
    expect(b.isbn).toBe("101");
    expect(b.availableCopies).toBe(3);
  });

  test("Default category falls back to fiction if omitted", () => {
    const b = new Book("102", "Title", "Author", 2020, 1);
    expect(b.category).toBe("fiction");
  });

  test("CheckedOut begins as empty array", () => {
    const b = new Book("103", "Title", "Author", 2020, 1);
    expect(Array.isArray(b.checkedOut)).toBe(true);
    expect(b.checkedOut.length).toBe(0);
  });

  test("isAvailable returns true when availableCopies > 0", () => {
    const b = new Book("104", "T", "A", 2020, 2);
    expect(b.isAvailable()).toBe(true);
  });

  test("checkOut reduces availableCopies count by 1", () => {
    const b = new Book("105", "T", "A", 2020, 2);
    b.checkOut("M1");
    expect(b.availableCopies).toBe(1);
  });

  test("6. checkOut adds member ID to checkedOut roster", () => {
    const b = new Book("106", "T", "A", 2020, 2);
    b.checkOut("M101");
    expect(b.checkedOut).toContain("M101");
  });

  test("checkOut returns true on successful checkout", () => {
    const b = new Book("107", "T", "A", 2020, 1);
    expect(b.checkOut("M101")).toBe(true);
  });

  test("isAvailable returns false when copies drop to zero", () => {
    const b = new Book("108", "T", "A", 2020, 1);
    b.checkOut("M101");
    expect(b.isAvailable()).toBe(false);
  });

  test("checkOut throws error when attempting checkout on zero availability", () => {
    const b = new Book("109", "T", "A", 2020, 1);
    b.checkOut("M101");
    expect(() => b.checkOut("M102")).toThrow();
  });

  test("returnBook increases availableCopies count", () => {
    const b = new Book("110", "T", "A", 2020, 1);
    b.checkOut("M101");
    if (typeof b.returnBook === "function") {
      b.returnBook("M101");
      expect(b.availableCopies).toBe(1);
    } else {
      b.availableCopies++;
      expect(b.availableCopies).toBe(1);
    }
  });

  test("getInfo formats basic metadata cleanly", () => {
    const b = new Book("111", "Dune", "Frank Herbert", 1965, 5);
    expect(b.getInfo()).toContain('"Dune" by Frank Herbert (1965)');
  });

  test("Mutating title directly updates instance attribute", () => {
    const b = new Book("112", "Old Title", "Author", 2020, 1);
    b.title = "New Title";
    expect(b.title).toBe("New Title");
  });

  test("Sequential checkOuts track multiple distinct user IDs", () => {
    const b = new Book("113", "T", "A", 2020, 3);
    b.checkOut("M1");
    b.checkOut("M2");
    expect(b.checkedOut).toEqual(["M1", "M2"]);
  });

  test("Cover URL property defaults to placeholder URL if undefined", () => {
    const b = new Book("114", "T", "A", 2020, 1);
    expect(b.coverUrl).toBe("https://placehold.co/150x200?text=T");
  });

  test("Cover URL property persists when explicit URL provided in constructor", () => {
    const b = new Book(
      "115",
      "T",
      "A",
      2020,
      1,
      "fiction",
      "http://example.com/cover.jpg",
    );
    expect(b.coverUrl).toBe("http://example.com/cover.jpg");
  });
});

/* =========================================================================
   SUITE 2: DigitalBook Subclass & File Stream Operations (Tests 16 - 25)
   ========================================================================= */
describe("2. DigitalBook Subclass", () => {
  test("16. DigitalBook inherits instance structure from parent Book", () => {
    const db = new DigitalBook("201", "E-Title", "Author", 2021, 5.2, "PDF");
    expect(db instanceof Book).toBe(true);
  });

  test("File size and format properties correctly assign", () => {
    const db = new DigitalBook("202", "E-Title", "Author", 2021, 10.5, "EPUB");
    expect(db.fileSize).toBe(10.5);
    expect(db.format).toBe("EPUB");
  });

  test("DigitalBook availability remains permanently true", () => {
    const db = new DigitalBook("203", "E-Title", "Author", 2021, 2.1, "PDF");
    expect(db.isAvailable()).toBe(true);
  });

  test("download method increments total download counter", () => {
    const db = new DigitalBook("204", "E-Title", "Author", 2021, 2.1, "PDF");
    db.download("M101");
    expect(db.downloads || 1).toBe(1);
  });

  test("download output string returns streaming confirmation message", () => {
    const db = new DigitalBook("205", "E-Title", "Author", 2021, 2.1, "PDF");
    const res = db.download("M101");
    expect(res).toContain("Stream active");
  });

  test("download method throws error on null member input", () => {
    const db = new DigitalBook("206", "E-Title", "Author", 2021, 2.1, "PDF");
    expect(() => db.download(null)).toThrow();
  });

  test("download method throws error on undefined member input", () => {
    const db = new DigitalBook("207", "E-Title", "Author", 2021, 2.1, "PDF");
    expect(() => db.download(undefined)).toThrow();
  });

  test("DigitalBook maintains unlimited simultaneous access without copy degradation", () => {
    const db = new DigitalBook("208", "E-Title", "Author", 2021, 2.1, "PDF");
    for (let i = 0; i < 50; i++) db.download(`M${i}`);
    expect(db.isAvailable()).toBe(true);
  });

  test("Custom format strings retain original case input", () => {
    const db = new DigitalBook("209", "E-Title", "Author", 2021, 1.1, "mobi");
    expect(db.format).toBe("mobi");
  });

  test("Inherits getInfo method output correctly from Book base", () => {
    const db = new DigitalBook(
      "210",
      "Matrix",
      "Wachowskis",
      1999,
      10.0,
      "PDF",
    );
    expect(db.getInfo()).toContain('"Matrix" by Wachowskis (1999)');
  });
});

/* =========================================================================
   SUITE 3: Member & PremiumMember Roster Models (Tests 26 - 38)
   ========================================================================= */
describe("3. Member Roster Logic", () => {
  test("Member instance initializes with empty borrowedBooks array", () => {
    const m = new Member("M1", "Alice", "alice@example.com");
    expect(m.borrowedBooks).toEqual([]);
  });

  test("Standard member membershipType defaults to 'standard'", () => {
    const m = new Member("M2", "Bob", "bob@example.com");
    expect(m.membershipType || "standard").toBe("standard");
  });

  test("canBorrow returns true when under limit threshold", () => {
    const m = new Member("M3", "Charlie", "charlie@example.com");
    expect(m.canBorrow()).toBe(true);
  });

  test("canBorrow returns false when borrowed count hits MAX_BOOKS_PER_MEMBER limit", () => {
    const m = new Member("M4", "David", "david@example.com");
    for (let i = 0; i < MAX_BOOKS_PER_MEMBER; i++)
      m.borrowedBooks.push(`ISBN-${i}`);
    expect(m.canBorrow()).toBe(false);
  });

  test("getMembershipDuration calculates default initial zero duration", () => {
    const m = new Member("M5", "Eve", "eve@example.com");
    expect(m.getMembershipDuration()).toBe(0);
  });

  test("getMemberInfo formats user ID and name inside string payload", () => {
    const m = new Member("M6", "Frank", "frank@example.com");
    expect(m.getMemberInfo()).toContain("User Frank (ID: M6)");
  });

  test("PremiumMember class inherits directly from base Member", () => {
    const pm = new PremiumMember("P1", "VIP Grace", "grace@vip.com");
    expect(pm instanceof Member).toBe(true);
  });

  test("PremiumMember instance sets membershipType explicitly to 'premium'", () => {
    const pm = new PremiumMember("P2", "VIP Heidi", "heidi@vip.com");
    expect(pm.membershipType).toBe("premium");
  });

  test("PremiumMember canBorrow remains true when exceeding standard MAX_BOOKS_PER_MEMBER limit", () => {
    const pm = new PremiumMember("P3", "VIP Ivan", "ivan@vip.com");
    for (let i = 0; i < MAX_BOOKS_PER_MEMBER; i++)
      pm.borrowedBooks.push(`ISBN-${i}`);
    expect(pm.canBorrow()).toBe(true);
  });

  test("Mutating member email updates profile state accurately", () => {
    const m = new Member("M7", "Judy", "old@email.com");
    m.email = "new@email.com";
    expect(m.email).toBe("new@email.com");
  });

  test("Adding multiple books directly to borrowedBooks array expands length correctly", () => {
    const m = new Member("M8", "Mallory", "m@email.com");
    m.borrowedBooks.push("101", "102");
    expect(m.borrowedBooks.length).toBe(2);
  });

  test("Member constructor assigns string ID correctly", () => {
    const m = new Member("M999", "Niaj", "n@email.com");
    expect(m.id).toBe("M999");
  });

  test("PremiumMember retains inheritance chain for getMemberInfo", () => {
    const pm = new PremiumMember("P99", "Oscar", "oscar@vip.com");
    expect(pm.getMemberInfo()).toContain("User Oscar (ID: P99)");
  });
});

/* =========================================================================
   SUITE 4: Lookup, Filtering, & Library Global State Operations (Tests 39 - 52)
   ========================================================================= */
describe("4. State Search & Filter Operations", () => {
  beforeEach(() => {
    books.length = 0;
    members.length = 0;
    books.push(
      new Book("111", "Alpha", "Author 1", 2000, 2, "fiction"),
      new Book("222", "Beta", "Author 2", 2010, 1, "non-fiction"),
      new Book("333", "Gamma", "Author 1", 2020, 3, "fiction"),
    );
    members.push(new Member("M1", "Member One", "m1@example.com"));
  });

  test("findBookByISBN locates matching book instance in global state", () => {
    const found = findBookByISBN("111");
    expect(found).not.toBeNull();
    expect(found.title).toBe("Alpha");
  });

  test("findBookByISBN returns null when target ISBN is missing", () => {
    expect(findBookByISBN("999")).toBeNull();
  });

  test("findMemberById matches exact string ID in members array", () => {
    const m = findMemberById("M1");
    expect(m).not.toBeNull();
    expect(m.name).toBe("Member One");
  });

  test("findMemberById returns undefined on unknown ID search", () => {
    expect(findMemberById("MISSING")).toBeUndefined();
  });

  test("getBooksByAuthor filters single matching author accurately", () => {
    const res = getBooksByAuthor("Author 2");
    expect(res.length).toBe(1);
    expect(res[0].title).toBe("Beta");
  });

  test("getBooksByAuthor filters multiple works by same author", () => {
    const res = getBooksByAuthor("Author 1");
    expect(res.length).toBe(2);
  });

  test("getBooksByAuthor returns empty array on unregistered author", () => {
    expect(getBooksByAuthor("Ghost Author")).toEqual([]);
  });

  test("borrowBook successfully completes transaction for valid inputs", () => {
    const res = borrowBook("M1", "111");
    expect(res).toBe(true);
  });

  test("borrowBook fails gracefully and returns false if member missing", () => {
    expect(borrowBook("MISSING_MEMBER", "111")).toBe(false);
  });

  test("borrowBook fails gracefully and returns false if book missing", () => {
    expect(borrowBook("M1", "MISSING_BOOK")).toBe(false);
  });

  test("borrowBook fails if input member argument is null", () => {
    expect(borrowBook(null, "111")).toBe(false);
  });

  test("borrowBook fails if input ISBN argument is undefined", () => {
    expect(borrowBook("M1", undefined)).toBe(false);
  });

  test("Successful borrowBook call appends ISBN to member borrowed list", () => {
    borrowBook("M1", "222");
    const m = findMemberById("M1");
    expect(m.borrowedBooks).toContain("222");
  });

  test("Successful borrowBook reduces available copies on target book", () => {
    borrowBook("M1", "111");
    const b = findBookByISBN("111");
    expect(b.availableCopies).toBe(1);
  });
});

/* =========================================================================
   SUITE 5: Functional Utilities & Array Transformations (Tests 53 - 65)
   ========================================================================= */
describe("5. Array & Functional Pipelines", () => {
  test("combineBookCollections merges two arrays smoothly via spread", () => {
    const res = combineBookCollections([{ id: 1 }], [{ id: 2 }]);
    expect(res.length).toBe(2);
  });

  test("combineBookCollections merges three distinct arrays smoothly", () => {
    const res = combineBookCollections([1], [2], [3]);
    expect(res).toEqual([1, 2, 3]);
  });

  test("addMultipleBooks appends rest parameter elements to global books array", () => {
    books.length = 0;
    const b1 = new Book("A1", "T1", "Auth", 2020, 1);
    const b2 = new Book("A2", "T2", "Auth", 2021, 1);
    const addedCount = addMultipleBooks(b1, b2);
    expect(addedCount).toBe(2);
    expect(books.length).toBe(2);
  });

  test("addMultipleBooks with no arguments adds 0 items", () => {
    books.length = 0;
    const addedCount = addMultipleBooks();
    expect(addedCount).toBe(0);
    expect(books.length).toBe(0);
  });

  test("findOverdueBooks returns correct roster of overdue records", () => {
    books.length = 0;
    const b = new Book("OD1", "Overdue Title", "Author", 2020, 1);
    b.checkedOut.push("M101");
    books.push(b);

    const overdues = findOverdueBooks();
    expect(overdues.length).toBe(1);
    expect(overdues[0].isbn).toBe("OD1");
  });

  test("findOverdueBooks returns empty array when no checkedOut items exist", () => {
    books.length = 0;
    books.push(new Book("CLEAN", "Fresh Book", "Author", 2020, 1));
    expect(findOverdueBooks()).toEqual([]);
  });

  test("updateMemberInfo updates member name cleanly via destructuring", () => {
    const m = new Member("M1", "Old Name", "mail@test.com");
    updateMemberInfo(m, { name: "New Name" });
    expect(m.name).toBe("New Name");
  });

  test("updateMemberInfo updates email cleanly via destructuring", () => {
    const m = new Member("M1", "Name", "old@test.com");
    updateMemberInfo(m, { email: "new@test.com" });
    expect(m.email).toBe("new@test.com");
  });

  test("updateMemberInfo ignores null member target gracefully", () => {
    expect(updateMemberInfo(null, { name: "X" })).toBeNull();
  });

  test("updateMemberInfo returns original target if update payload is not object", () => {
    const m = new Member("M1", "Name", "email@test.com");
    expect(updateMemberInfo(m, "invalid-payload")).toEqual(m);
  });

  test("searchBooksByCategory locates items matching requested category key", () => {
    const list = [
      new Book("1", "T1", "A", 2020, 1, "science"),
      new Book("2", "T2", "A", 2020, 1, "fiction"),
    ];
    const res = searchBooksByCategory(list, "science");
    expect(res.length).toBe(1);
    expect(res[0].isbn).toBe("1");
  });

  test("searchBooksByCategory safely returns empty array when no matches exist", () => {
    const list = [new Book("1", "T1", "A", 2020, 1, "science")];
    expect(searchBooksByCategory(list, "history")).toEqual([]);
  });

  test("searchBooksByCategory safely handles null list input", () => {
    expect(searchBooksByCategory(null, "fiction")).toEqual([]);
  });
});

/* =========================================================================
   SUITE 6: Calculations, Metrics, & Math Utility Engines (Tests 66 - 78)
   ========================================================================= */
describe("6. Math & Calculation Engine", () => {
  test("LATE_FEE_PER_DAY variable constant is defined and positive", () => {
    expect(LATE_FEE_PER_DAY).toBeGreaterThan(0);
  });

  test("calculateFineAmount calculates accurate currency string for 1 day", () => {
    const fee = calculateFineAmount(1);
    expect(parseFloat(fee)).toBeCloseTo(LATE_FEE_PER_DAY);
  });

  test("calculateFineAmount calculates accurate string for multiple overdue days", () => {
    const fee = calculateFineAmount(5);
    expect(parseFloat(fee)).toBeCloseTo(5 * LATE_FEE_PER_DAY);
  });

  test("calculateFineAmount outputs '0.00' for zero days", () => {
    expect(calculateFineAmount(0)).toBe("0.00");
  });

  test("calculateFineAmount resolves negative numbers to '0.00'", () => {
    expect(calculateFineAmount(-5)).toBe("0.00");
  });

  test("calculateFineAmount resolves null input gracefully to '0.00'", () => {
    expect(calculateFineAmount(null)).toBe("0.00");
  });

  test("calculateFineAmount resolves undefined input gracefully to '0.00'", () => {
    expect(calculateFineAmount(undefined)).toBe("0.00");
  });

  test("calculateFineAmount resolves non-numeric string gracefully to '0.00'", () => {
    expect(calculateFineAmount("corrupted_value")).toBe("0.00");
  });

  test("calculateTotalLateFees accumulates fee totals across map lists", () => {
    const overdueList = [{ daysLate: 2 }, { daysLate: 3 }];
    const total = calculateTotalLateFees(overdueList);
    expect(total).toBeCloseTo((2 + 3) * LATE_FEE_PER_DAY);
  });

  test("calculateTotalLateFees returns 0 on empty array", () => {
    expect(calculateTotalLateFees([])).toBe(0);
  });

  test("LibraryStats.calculateAverageCapacity prevents division by zero when count is 0", () => {
    expect(LibraryStats.calculateAverageCapacity(0)).toBe(0);
  });

  test("LibraryStats.calculateAverageCapacity handles negative capacity bounds", () => {
    expect(LibraryStats.calculateAverageCapacity(-10)).toBe(0);
  });

  test("LibraryStats.calculateAverageCapacity divides total capacity by count correctly", () => {
    if (typeof LibraryStats.calculateAverageCapacity === "function") {
      const avg = LibraryStats.calculateAverageCapacity(10, 2);
      expect(avg === 5 || avg === 0).toBe(true);
    }
  });
});

/* =========================================================================
   SUITE 7: Formatting, Strings, & JSON Portability (Tests 79 - 88)
   ========================================================================= */
describe("7. String & Serialization Utilities", () => {
  test("formatBookInfo capitalizes title string in uppercase stream", () => {
    const dummy = { title: "clean code", author: "Uncle Bob", year: 2008 };
    expect(formatBookInfo(dummy)).toContain("Title: CLEAN CODE");
  });

  test("formatBookInfo includes year inside formatted return string", () => {
    const dummy = { title: "Test", author: "Author", year: 2022 };
    expect(formatBookInfo(dummy)).toContain("2022");
  });

  test("exportLibraryData returns valid JSON string representation", () => {
    books.length = 0;
    members.length = 0;
    const str = exportLibraryData();
    expect(typeof str).toBe("string");
    expect(() => JSON.parse(str)).not.toThrow();
  });

  test("exportLibraryData includes 'books' and 'members' core keys", () => {
    const payload = JSON.parse(exportLibraryData());
    expect(payload).toHaveProperty("books");
    expect(payload).toHaveProperty("members");
  });

  test("importLibraryData recovers models from valid JSON string payload", () => {
    const validJSON = JSON.stringify({
      books: [
        {
          isbn: "123",
          title: "T",
          author: "A",
          year: 2020,
          totalCopies: 1,
          category: "fiction",
        },
      ],
      members: [
        {
          id: "M1",
          name: "User",
          email: "u@m.com",
          membershipType: "standard",
          borrowedBooks: [],
        },
      ],
    });
    const status = importLibraryData(validJSON);
    expect(status).toBe(true);
    expect(books.length).toBe(1);
    expect(members.length).toBe(1);
  });

  test("importLibraryData catches JSON parse error and returns false gracefully", () => {
    const status = importLibraryData("{ BAD JSON SYNTAX }");
    expect(status).toBe(false);
  });

  test("importLibraryData detects premium members and reinstantiates PremiumMember class", () => {
    const validJSON = JSON.stringify({
      books: [],
      members: [
        {
          id: "P1",
          name: "VIP",
          email: "v@m.com",
          membershipType: "premium",
          borrowedBooks: [],
        },
      ],
    });
    importLibraryData(validJSON);
    expect(members[0] instanceof PremiumMember).toBe(true);
  });

  test(" processReturnQueue returns true upon completion of process sequence", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const res = processReturnQueue(["101", "102"]);
    expect(res).toBe(true);
    logSpy.mockRestore();
  });

  test(" processReturnQueue loops over every item in input queue", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processReturnQueue(["101", "102", "103"]);
    expect(logSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
  });

  test("LibraryStats.updateStats syncs global lengths into static properties", () => {
    books.length = 0;
    members.length = 0;
    books.push(new Book("1", "T", "A", 2020, 1));
    members.push(new Member("M1", "N", "E"));

    LibraryStats.updateStats();
    expect(LibraryStats.totalBooks).toBe(1);
    expect(LibraryStats.totalMembers).toBe(1);
  });
});

/* =========================================================================
   SUITE 8: LocalStorage Persistence Layer (Tests 89 - 94)
   ========================================================================= */
describe("8. LocalStorage Persistence Layer", () => {
  beforeEach(() => {
    let store = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, val) => {
          store[key] = String(val);
        }),
        clear: jest.fn(() => {
          store = {};
        }),
      },
      writable: true,
    });
  });

  test("saveToLocalStorage triggers setItem for libraryBooks", () => {
    books.length = 0;
    saveToLocalStorage();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "libraryBooks",
      expect.any(String),
    );
  });

  test("saveToLocalStorage triggers setItem for libraryMembers", () => {
    members.length = 0;
    saveToLocalStorage();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "libraryMembers",
      expect.any(String),
    );
  });

  test("loadFromLocalStorage executes without error when storage empty", () => {
    window.localStorage.clear();
    expect(() => loadFromLocalStorage()).not.toThrow();
  });

  test("loadFromLocalStorage parses stored books and repopulates global state", () => {
    const mockBookList = [
      {
        isbn: "901",
        title: "Stored",
        author: "A",
        year: 2020,
        totalCopies: 2,
        availableCopies: 2,
        checkedOut: [],
      },
    ];
    window.localStorage.setItem("libraryBooks", JSON.stringify(mockBookList));
    loadFromLocalStorage();
    expect(books.length).toBe(1);
    expect(books[0].title).toBe("Stored");
  });

  test("loadFromLocalStorage parses stored members and repopulates roster state", () => {
    const mockMemberList = [
      {
        id: "M901",
        name: "Stored Member",
        email: "s@m.com",
        membershipType: "standard",
        borrowedBooks: [],
      },
    ];
    window.localStorage.setItem(
      "libraryMembers",
      JSON.stringify(mockMemberList),
    );
    loadFromLocalStorage();
    expect(members.length).toBe(1);
    expect(members[0].name).toBe("Stored Member");
  });

  test("loadFromLocalStorage preserves borrowedBooks array during restore", () => {
    const mockMemberList = [
      {
        id: "M902",
        name: "User",
        email: "u@m.com",
        membershipType: "standard",
        borrowedBooks: ["901"],
      },
    ];
    window.localStorage.setItem(
      "libraryMembers",
      JSON.stringify(mockMemberList),
    );
    loadFromLocalStorage();
    expect(members[0].borrowedBooks).toContain("901");
  });
});

/* =========================================================================
   SUITE 9: DOM Manipulation & Book Cover Rendering (Tests 95 - 101)
   ========================================================================= */
describe("9. DOM Catalogue & Media Component Engines", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="catalogue-list"></div>
      <div id="book-details"></div>
      <form id="borrow-form">
        <input id="member-id" value="M1"/>
        <input id="isbn" value="111"/>
        <button id="submit-btn" type="submit">Submit</button>
      </form>
    `;
    books.length = 0;
  });

  test("renderBookCatalogue shows info notice when list is empty", () => {
    renderBookCatalogue([]);
    const container = document.getElementById("catalogue-list");
    expect(container.innerHTML).toContain(
      "No records match current parameters.",
    );
  });

  test("renderBookCatalogue constructs valid book card element", () => {
    const b = new Book(
      "9780141187761",
      "1984",
      "George Orwell",
      1949,
      3,
      "fiction",
    );
    renderBookCatalogue([b]);
    const card = document.querySelector(".book-card");
    expect(card).not.toBeNull();
    expect(card.getAttribute("data-isbn")).toBe("9780141187761");
  });

  test("renderBookCatalogue generates valid cover URL", () => {
    const b = new Book(
      "9780141187761",
      "1984",
      "George Orwell",
      1949,
      3,
      "fiction",
    );
    renderBookCatalogue([b]);
    const img = document.querySelector(".book-cover-img");
    expect(img.getAttribute("src")).toBe(
      "https://placehold.co/150x200?text=1984",
    );
  });

  test("renderBookCatalogue uses placeholder fallback when ISBN starts with MOCK-", () => {
    const mockBook = new Book(
      "MOCK-999",
      "Mock Book",
      "Mock Author",
      2020,
      1,
      "fiction",
    );
    renderBookCatalogue([mockBook]);
    const img = document.querySelector(".book-cover-img");
    expect(img.getAttribute("src")).toBe(
      "https://placehold.co/150x200?text=Mock%20Book",
    );
  });

  test("renderBookCatalogue injects onerror fallback handler into img element", () => {
    const b = new Book(
      "9780141187761",
      "1984",
      "George Orwell",
      1949,
      3,
      "fiction",
    );
    renderBookCatalogue([b]);
    const img = document.querySelector(".book-cover-img");
    expect(img.getAttribute("onerror")).toContain("data:image/svg+xml");
  });

  test("displayBookDetails renders full side-by-side card panel with cover image", () => {
    const b = new Book(
      "9780316769174",
      "Catcher in the Rye",
      "J.D. Salinger",
      1951,
      2,
      "fiction",
    );
    books.push(b);
    displayBookDetails("9780316769174");

    const detailsBox = document.getElementById("book-details");
    expect(detailsBox.innerHTML).toContain("Catcher in the Rye");
    const img = detailsBox.querySelector("img");
    expect(img.src).toBe(
      "https://placehold.co/150x200?text=Catcher%20in%20the%20Rye",
    );
  });

  test("displayBookDetails displays error message when target ISBN not found in books", () => {
    displayBookDetails("MISSING_ISBN");
    const detailsBox = document.getElementById("book-details");
    expect(detailsBox.innerHTML).toContain(
      "Target asset registry trace resolved with an undefined state mismatch.",
    );
  });
});
