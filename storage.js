/**
 * Library System Data Persistence Layer
 * @module storage
 */

import { Book, Member, PremiumMember, books, members } from "./library.js";


function validateImportedPayload(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.books) || !Array.isArray(data.members)) return false;
  return true;
}

export function exportLibraryData() {
  try {
    const payload = { books, members };
    return JSON.stringify(payload);
  } catch (error) {
    console.error(`Serialization Engine Failure: ${error.message}`);
    return null;
  }
}


export function importLibraryData(jsonString) {
  try {
    if (!jsonString || typeof jsonString !== "string") {
      throw new TypeError(
        "Import argument must be a valid text string blueprint.",
      );
    }

    const parsedData = JSON.parse(jsonString);

    if (!validateImportedPayload(parsedData)) {
      throw new Error(
        "Integrity Audit Failure: Core operational arrays are malformed.",
      );
    }

    books.length = 0;
    parsedData.books.forEach((b) => {
      books.push(
        new Book(b.isbn, b.title, b.author, b.year, b.totalCopies, b.category),
      );
    });

    members.length = 0;
    parsedData.members.forEach((m) => {
      let userInstance =
        m.membershipType === "premium"
          ? new PremiumMember(m.id, m.name, m.email)
          : new Member(m.id, m.name, m.email);
      userInstance.borrowedBooks = m.borrowedBooks || [];
      members.push(userInstance);
    });

    return true;
  } catch (error) {
    console.error(`Import System Blocked: ${error.message}`);
    return false;
  }
}


export function saveToLocalStorage() {
  try {
    localStorage.setItem("libraryBooks", JSON.stringify(books));
    localStorage.setItem("libraryMembers", JSON.stringify(members));
  } catch (error) {
    console.error(`Storage Registry Write Fault: ${error.message}`);
  }
}

export function loadFromLocalStorage() {
  try {
    const rawBooks = localStorage.getItem("libraryBooks");
    const rawMembers = localStorage.getItem("libraryMembers");

    if (rawBooks !== null) {
      const parsedBooks = JSON.parse(rawBooks);
      if (Array.isArray(parsedBooks)) {
        books.length = 0;
        parsedBooks.forEach((b) => {
          const restoredBook = new Book(
            b.isbn,
            b.title,
            b.author,
            b.year,
            b.totalCopies,
            b.category,
          );
          restoredBook.availableCopies =
            b.availableCopies !== undefined ? b.availableCopies : b.totalCopies;
          restoredBook.checkedOut = b.checkedOut || [];
          books.push(restoredBook);
        });
      }
    }

    if (rawMembers !== null) {
      const parsedMembers = JSON.parse(rawMembers);
      if (Array.isArray(parsedMembers)) {
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
    }
  } catch (error) {
    console.error(`Local Storage Hydration Interrupted: ${error.message}`);
  }
}
