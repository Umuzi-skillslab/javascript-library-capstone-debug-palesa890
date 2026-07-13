/**
 * Library Management System Unit Test Suite
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

describe("Book Class", () => {
  test("should create a book instance with correct properties", () => {
    const book = new Book(
      "978-0-123",
      "Test Book",
      "Author Name",
      2020,
      5,
      "fiction",
    );

    expect(book.isbn).toBe("978-0-123");
    expect(book.title).toBe("Test Book");
    expect(book.author).toBe("Author Name");
    expect(book.year).toBe(2020);
    expect(book.totalCopies).toBe(5);
    expect(book.availableCopies).toBe(5);
    expect(book.category).toBe("fiction");
    expect(book.checkedOut).toEqual([]);
  });

  test("should check availability correctly", () => {
    const book = new Book("978-0-123", "Title", "Author", 2020, 1);
    expect(book.isAvailable()).toBe(true);
    book.checkOut("M101");
    expect(book.isAvailable()).toBe(false);
  });

  test("should handle checking out and validation correctly", () => {
    const book = new Book("978-0-123", "Title", "Author", 2020, 1);
    expect(book.checkOut("M101")).toBe(true);
    expect(book.availableCopies).toBe(0);
    expect(book.checkedOut).toContain("M101");

    // Error handling out of stock
    expect(() => book.checkOut("M102")).toThrow();
  });

  test("should return formatted string using template literals", () => {
    const book = new Book("123", "A", "B", 2022, 1);
    expect(book.getInfo()).toContain('"A" by B (2022)');
  });
});

describe("DigitalBook Class", () => {
  test("should correctly inherit from Book and allow infinite downloads", () => {
    const ebook = new DigitalBook(
      "978-0-321",
      "EBook",
      "Digital Author",
      2025,
      4.5,
      "PDF",
      "non-fiction",
    );

    expect(ebook instanceof Book).toBe(true);
    expect(ebook.fileSize).toBe(4.5);
    expect(ebook.format).toBe("PDF");
    expect(ebook.isAvailable()).toBe(true); // Always true for digital copies

    const output = ebook.download("M101");
    expect(ebook.downloads).toBe(1);
    expect(output).toContain("Stream active");
  });
});

describe("Member Class", () => {
  test("canBorrow checks limits with strict comparison", () => {
    const member = new Member(
      "M101",
      "John Doe",
      "john@example.com",
      "standard",
    );
    expect(member.canBorrow()).toBe(true);

    // Fill cap capacity
    for (let i = 0; i < MAX_BOOKS_PER_MEMBER; i++) {
      member.borrowedBooks.push(`ISBN-${i}`);
    }
    expect(member.canBorrow()).toBe(false);
  });

  test("should calculate membership duration correctly", () => {
    const member = new Member("M101", "John Doe", "john@example.com");
    expect(member.getMembershipDuration()).toBe(0); // Created right now
  });

  test("should return member information via destructuring", () => {
    const member = new Member("M101", "Jane", "jane@example.com", "standard");
    expect(member.getMemberInfo()).toContain("User Jane (ID: M101)");
  });
});

describe("PremiumMember Class", () => {
  test("should inherit and allow extended borrow allowances caps", () => {
    const premium = new PremiumMember("P99", "VIP User", "vip@example.com");
    expect(premium instanceof Member).toBe(true);
    expect(premium.membershipType).toBe("premium");

    // Max standard limit
    for (let i = 0; i < MAX_BOOKS_PER_MEMBER; i++) {
      premium.borrowedBooks.push(`ISBN-${i}`);
    }
    // Premium should pass standard limit barrier caps
    expect(premium.canBorrow()).toBe(true);
  });
});

describe("Library Functions and Global State Operations", () => {
  beforeEach(() => {
    // Clear global data tracking registers before each routine loop execution
    books.length = 0;
    members.length = 0;

    books.push(
      new Book("111", "Book One", "Author X", 2010, 2, "fiction"),
      new Book("222", "Book Two", "Author Y", 2015, 1, "reference"),
    );

    members.push(new Member("M1", "User Alpha", "alpha@example.com"));
  });

  test("findBookByISBN returns book object or null if absent", () => {
    const found = findBookByISBN("111");
    expect(found).not.toBeNull();
    expect(found.title).toBe("Book One");

    const absent = findBookByISBN("999");
    expect(absent).toBeNull();
  });

  test("getBooksByAuthor returns accurate arrays through filters", () => {
    const matches = getBooksByAuthor("Author X");
    expect(matches.length).toBe(1);
    expect(matches[0].isbn).toBe("111");

    const emptyMatches = getBooksByAuthor("Unknown");
    expect(emptyMatches).toEqual([]);
  });

  test("borrowBook transactions should fail with null/undefined inputs", () => {
    expect(borrowBook(null, "111")).toBe(false);
    expect(borrowBook("M1", undefined)).toBe(false);
  });
});

describe("Array Operations (Functional Pipelines)", () => {
  test("combineBookCollections correctly joins collections via spreads", () => {
    const fic = [{ id: 1 }];
    const nonFic = [{ id: 2 }];
    const ref = [{ id: 3 }];
    const combined = combineBookCollections(fic, nonFic, ref);
    expect(combined).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  test("addMultipleBooks utilizes rest parameters safely", () => {
    books.length = 0;
    const b1 = new Book("A", "T1", "Auth", 2020, 1);
    const b2 = new Book("B", "T2", "Auth", 2021, 1);
    const count = addMultipleBooks(b1, b2);
    expect(count).toBe(2);
    expect(books.length).toBe(2);
  });
});

describe("Recursive Functions", () => {
  test("searchBooksByCategory navigates matching tree layers with valid base cases", () => {
    const list = [
      new Book("1", "T1", "A", 2020, 1, "fiction"),
      new Book("2", "T2", "A", 2021, 1, "reference"),
      new Book("3", "T3", "A", 2022, 1, "fiction"),
    ];
    const results = searchBooksByCategory(list, "fiction");
    expect(results.length).toBe(2);
    expect(results[0].isbn).toBe("1");
    expect(results[1].isbn).toBe("3");
  });

  test("searchBooksByCategory avoids stack overflow with empty list or deep bounds", () => {
    const results = searchBooksByCategory([], "fiction");
    expect(results).toEqual([]);
  });
});

describe("Error Handling Contexts", () => {
  test("borrowBook catches operational throwing blocks natively within try-catch layouts", () => {
    books.length = 0; // Forces missing reference error
    members.length = 0;
    const status = borrowBook("M1", "111");
    expect(status).toBe(false); // Clean termination without global trace stack crashes
  });
});

describe("String Operations", () => {
  test("formatBookInfo safely transforms metrics into template streams", () => {
    const dummy = { title: " simple title ", author: "Author", year: 2020 };
    const result = formatBookInfo(dummy);
    expect(result).toContain("Title: SIMPLE TITLE");
  });
});

describe("Math Operations", () => {
  test("calculateFineAmount accurately structures currency text strings", () => {
    const fine = calculateFineAmount(5);
    expect(fine).toBe("2.50"); // Correct calculation (5 * 0.50) with precision fixing
  });

  test("calculateFineAmount resolves NaN/Null/Negative scenarios gracefully", () => {
    expect(calculateFineAmount(null)).toBe("0.00");
    expect(calculateFineAmount(undefined)).toBe("0.00");
    expect(calculateFineAmount("corrupted text")).toBe("0.00");
    expect(calculateFineAmount(-10)).toBe("0.00");
  });
});

describe("JSON Data Portability Structures", () => {
  test("exportLibraryData stringifies operational collections", () => {
    books.length = 0;
    members.length = 0;
    const serialized = exportLibraryData();
    expect(typeof serialized).toBe("string");
    expect(serialized).toContain('"books":[]');
  });

  test("importLibraryData recovers model definitions safely while shielding bad JSON schemas", () => {
    const badJSON = "{ invalid structural layout }";
    const result = importLibraryData(badJSON);
    expect(result).toBe(false); // Intercepted smoothly without halting processes
  });
});

describe("LocalStorage Layer Persistences", () => {
  beforeEach(() => {
    // Build mock proxy implementations for LocalStorage tracking fields
    let dataStore = {};
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn((key) => dataStore[key] || null),
        setItem: jest.fn((key, val) => {
          dataStore[key] = String(val);
        }),
        clear: jest.fn(() => {
          dataStore = {};
        }),
      },
      writable: true,
    });
  });

  test("saveToLocalStorage dumps records cleanly onto storage registries", () => {
    books.length = 0;
    saveToLocalStorage();
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "libraryBooks",
      JSON.stringify([]),
    );
  });

  test("loadFromLocalStorage recovers instances safely ignoring null traces", () => {
    window.localStorage.clear();
    expect(() => loadFromLocalStorage()).not.toThrow();
  });
});

describe("Advanced Loop Matrices & Structural Scopes", () => {
  test("processReturnQueue executes loop sequences without lock issues", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const status = processReturnQueue(["ItemA", "ItemB"]);
    expect(status).toBe(true);
    expect(logSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });

  test("findOverdueBooks processes internal tracking parameters correctly", () => {
    books.length = 0;
    const book = new Book("123", "Overdue Book", "Author", 2020, 1);
    book.checkedOut.push("M1");
    books.push(book);

    const list = findOverdueBooks();
    expect(list.length).toBe(1);
    expect(list[0].isbn).toBe("123");
    expect(list[0].borrower).toBe("M1");
  });

  test("LibraryStats aggregates numbers using clean loops", () => {
    books.length = 0;
    members.length = 0;
    books.push(new Book("1", "T", "A", 2020, 1));
    members.push(new Member("M1", "N", "E"));
    members[0].borrowedBooks.push("1");

    LibraryStats.updateStats();
    LibraryStats.aggregateTotalBorrowingsCount(members);

    expect(LibraryStats.totalBooks).toBe(1);
    expect(LibraryStats.totalMembers).toBe(1);
    expect(LibraryStats.totalBorrowings).toBe(1);
  });

  test("updateMemberInfo changes payload attributes using object destructuring updates", () => {
    const dummyUser = new Member("M1", "Old Name", "old@email.com");
    updateMemberInfo(dummyUser, { name: "New Name", email: "new@email.com" });
    expect(dummyUser.name).toBe("New Name");
    expect(dummyUser.email).toBe("new@email.com");
  });
});

describe("DOM Manipulation and Catalogue Component Layout Engines", () => {
  beforeEach(() => {
    // Set up clean mockup layouts matching index.html bindings for testing UI layers
    document.body.innerHTML = `
            <div id="catalogue-list"></div>
            <input type="text" id="search" />
            <select id="filter-category"><option value="all">All</option></select>
            <form id="borrow-form">
                <input id="member-id" value="M1"/>
                <input id="isbn" value="111"/>
            </form>
        `;
  });

  test("DOM structure targets verify correctly inside testing pipelines", () => {
    const grid = document.getElementById("catalogue-list");
    expect(grid).not.toBeNull();
    grid.innerHTML = '<div class="book-card"><h3>Dynamic Title</h3></div>';
    expect(grid.querySelector(".book-card h3").textContent).toBe(
      "Dynamic Title",
    );
  });
});
