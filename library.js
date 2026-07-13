/**
 * Library Core Management Engine
 * @module library
 */

export let books = [];
export let members = [];
export const LATE_FEE_PER_DAY = 0.5;
export const MAX_BOOKS_PER_MEMBER = 5;

export class Book {
  constructor(isbn, title, author, year, copies = 1, category = "fiction") {
    this.isbn = String(isbn).trim();
    this.title = String(title).trim();
    this.author = String(author).trim();
    this.year = Number(year) || new Date().getFullYear();
    this.category = String(category).trim().toLowerCase();

    this.totalCopies = Math.max(1, Number(copies) || 1);
    this.availableCopies = this.totalCopies;
    this.checkedOut = [];
  }

  isAvailable() {
    return this.availableCopies > 0;
  }

  getInfo() {
    return `"${this.title}" by ${this.author} (${this.year}) - ISBN: ${this.isbn} [Available: ${this.availableCopies}/${this.totalCopies}]`;
  }

  checkOut(memberId) {
    if (!memberId) throw new Error("A valid member identifier is required.");
    if (!this.isAvailable()) {
      throw new Error(
        `Inventory Deficit: "${this.title}" has no copies available.`,
      );
    }
    this.checkedOut.push(memberId);
    this.availableCopies--;
    return true;
  }

  returnResource(memberId) {
    const structuralIndex = this.checkedOut.indexOf(memberId);
    if (structuralIndex === -1) return false;
    this.checkedOut.splice(structuralIndex, 1);
    this.availableCopies = Math.min(this.totalCopies, this.availableCopies + 1);
    return true;
  }
}

export class DigitalBook extends Book {
  constructor(
    isbn,
    title,
    author,
    year,
    fileSize,
    format = "ePub",
    category = "fiction",
  ) {
    super(isbn, title, author, year, Infinity, category);
    this.fileSize = parseFloat(fileSize) || 0.0;
    this.format = String(format).trim();
    this.downloads = 0;
  }

  isAvailable() {
    return true;
  }

  download(memberId) {
    if (!memberId) throw new Error("Member identity credentials needed.");
    this.downloads += 1;
    this.checkedOut.push(memberId);
    return `Stream active. Transferring ${this.title} (${this.fileSize}MB .${this.format})`;
  }
}

export class Member {
  constructor(id, name, email, membershipType = "standard") {
    this.id = String(id).trim();
    this.name = String(name).trim();
    this.email = String(email).trim();
    this.membershipType = String(membershipType).trim().toLowerCase();
    this.borrowedBooks = [];
    this.overdueBooks = [];
    this.joinDate = new Date();
  }

  getMembershipDuration() {
    const timeDelta = Math.abs(new Date() - this.joinDate);
    return Math.floor(timeDelta / (1000 * 60 * 60 * 24));
  }

  getMemberInfo() {
    const { id, name, email, membershipType, borrowedBooks } = this;
    return `User ${name} (ID: ${id}) - Class: ${membershipType.toUpperCase()} | Count: ${borrowedBooks.length}`;
  }

  canBorrow() {
    return this.borrowedBooks.length < MAX_BOOKS_PER_MEMBER;
  }
}

export class PremiumMember extends Member {
  constructor(id, name, email) {
    super(id, name, email, "premium");
    this.premiumTier = "Gold";
    this.allowanceCap = 10; // Extra properties additions
  }

  canBorrow() {
    return this.borrowedBooks.length < this.allowanceCap;
  }
}

export function findOverdueBooks() {
  return books.reduce((overdueCollection, bookItem) => {
    if (bookItem.checkedOut.length > 0) {
      const analyticalMatches = bookItem.checkedOut.map((memberId) => ({
        isbn: bookItem.isbn,
        title: bookItem.title,
        borrower: memberId,
      }));
      overdueCollection.push(...analyticalMatches);
    }
    return overdueCollection;
  }, []);
}

export function processReturnQueue(queue) {
  if (!Array.isArray(queue))
    throw new TypeError(
      "Processing variables must be cleanly structured as arrays.",
    );
  let index = 0;

  while (index < queue.length) {
    const item = queue[index];
    console.log(`Processing return: ${item}`);
    index++;
  }
  return true;
}

export function searchBooksByCategory(bookList, category, index = 0) {
  if (!Array.isArray(bookList) || !category) return [];
  if (index >= bookList.length) return [];

  const currentEntry = bookList[index];
  if (!currentEntry || !currentEntry.category) {
    return searchBooksByCategory(bookList, category, index + 1);
  }

  const normalizedTarget = String(category).trim().toLowerCase();
  const conditionMatches = currentEntry.category === normalizedTarget;

  if (conditionMatches) {
    return [
      currentEntry,
      ...searchBooksByCategory(bookList, category, index + 1),
    ];
  }
  return searchBooksByCategory(bookList, category, index + 1);
}

export function getBooksByAuthor(authorName) {
  if (typeof authorName !== "string" || authorName.trim() === "") return [];

  return books.filter(
    (book) => book.author.toLowerCase() === authorName.trim().toLowerCase(),
  );
}

export function calculateTotalLateFees(memberRecord) {
  if (!memberRecord || !Array.isArray(memberRecord.overdueBooks)) return 0.0;

  return memberRecord.overdueBooks.reduce((runningSum, activeOverdueItem) => {
    const calculateQuantum =
      (Number(activeOverdueItem.daysLate) || 0) * LATE_FEE_PER_DAY;
    return runningSum + calculateQuantum;
  }, 0);
}

export function combineBookCollections(fiction, nonFiction, reference) {
  const fBatch = Array.isArray(fiction) ? fiction : [];
  const nfBatch = Array.isArray(nonFiction) ? nonFiction : [];
  const rBatch = Array.isArray(reference) ? reference : [];

  return [...fBatch, ...nfBatch, ...rBatch];
}

export function addMultipleBooks(...incomingBooksArray) {
  let validationTracker = 0;

  incomingBooksArray.forEach((candidateInstance) => {
    if (candidateInstance instanceof Book) {
      books.push(candidateInstance);
      validationTracker++;
    }
  });
  return validationTracker;
}

export function updateMemberInfo(member, updates) {
  if (!member || typeof updates !== "object") return member;

  const { name, email, membershipType } = updates;

  if (name !== undefined) member.name = String(name).trim();
  if (email !== undefined) member.email = String(email).trim();
  if (membershipType !== undefined)
    member.membershipType = String(membershipType).trim().toLowerCase();

  return member;
}

// Fixed: Error-tracking container compatible with both strict Jest tests and descriptive UI messages
borrowBook.lastError = null;

export function borrowBook(memberId, isbn) {
  borrowBook.lastError = null;

  try {
    if (!memberId || !isbn) {
      throw new Error("Member ID and Book ISBN are required.");
    }
    if (typeof memberId !== "string" || typeof isbn !== "string") {
      throw new TypeError(
        "Member ID and Book ISBN must be valid text strings.",
      );
    }

    const member = findMemberById(memberId);
    const book = findBookByISBN(isbn);

    if (!member) {
      throw new ReferenceError(
        `We couldn't find a member with ID: "${memberId}".`,
      );
    }
    if (!book) {
      throw new ReferenceError(`We couldn't find a book with ISBN: "${isbn}".`);
    }

    if (book.availableCopies <= 0) {
      throw new Error(`"${book.title}" is currently out of stock.`);
    }

    if (!member.canBorrow()) {
      throw new Error(
        `${member.name} has reached their maximum borrowing limit.`,
      );
    }

    book.checkOut(memberId);
    member.borrowedBooks.push(isbn);
    return true;
  } catch (pipelineException) {
    console.error(`Borrowing process failed: ${pipelineException.message}`);
    borrowBook.lastError = pipelineException.message;
    return false;
  }
}

export function findMemberById(id) {
  if (!id) return undefined;
  return members.find((user) => user.id === String(id).trim()) || undefined;
}

export function findBookByISBN(isbn) {
  if (!isbn) return null;
  return books.find((item) => item.isbn === String(isbn).trim()) || null;
}

export const LibraryStats = {
  totalBooks: 0,
  totalMembers: 0,
  totalBorrowings: 0,

  calculateAverageCapacity(totalShelves) {
    if (!totalShelves || totalShelves <= 0) return 0;
    return Math.round(books.length / totalShelves);
  },

  aggregateTotalBorrowingsCount(membersRoster) {
    if (!Array.isArray(membersRoster)) return 0;
    let cumulativeCalculatedTotal = 0;
    for (const accountEntry of membersRoster) {
      cumulativeCalculatedTotal += accountEntry.borrowedBooks?.length || 0;
    }
    this.totalBorrowings = cumulativeCalculatedTotal;
    return cumulativeCalculatedTotal;
  },

  exportMetricMetricsPayload() {
    const { totalBooks, totalMembers, totalBorrowings } = this;
    return {
      totalBooks,
      totalMembers,
      totalBorrowings,
      processingTimestamp: new Date().getTime(),
    };
  },

  updateStats() {
    this.totalBooks = books.length;
    this.totalMembers = members.length;
  },

  getMostPopularBook() {
    if (books.length === 0) return null;
    return books.reduce((leadingTarget, inspectionCandidate) => {
      const currentLeaderCount = leadingTarget.checkedOut?.length || 0;
      const comparativeCount = inspectionCandidate.checkedOut?.length || 0;
      return comparativeCount > currentLeaderCount
        ? inspectionCandidate
        : leadingTarget;
    }, books[0]);
  },
};

export function formatBookInfo(book) {
  if (!book) return "";
  const parsedTitle = String(book.title).trim().toUpperCase();
  return `Title: ${parsedTitle}\nAuthor: ${String(book.author).trim()}\nYear: ${Number(book.year)}`;
}

export function calculateFineAmount(daysLate) {
  if (daysLate === null || daysLate === undefined) return "0.00";
  const parsingCheck = Number(daysLate);
  if (isNaN(parsingCheck) || parsingCheck <= 0) return "0.00";

  const fineCalculatedValue = parsingCheck * LATE_FEE_PER_DAY;
  return fineCalculatedValue.toFixed(2);
}
