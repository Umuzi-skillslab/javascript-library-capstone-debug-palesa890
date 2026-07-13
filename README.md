[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-2e0aaae1b6195c2367325f4f02e2d04e9abb55f0b24a779b69b11b9e10269abc.svg)](https://classroom.github.com/online_ide?assignment_repo_id=24228977&assignment_repo_type=AssignmentRepo)
# 📚 Library Management System (Capstone Project)

A modern, modular Library Management System engineered with pure JavaScript (ES Modules). This application provides a full-featured dashboard for managing book inventories, tracking member accounts, handling real-time search filtering, and managing transaction logging.

---

## 🛠️ System Architecture & File Structure

The project decouples data state models, persistence layers, user interface interactions, and testing frameworks to enforce a strict **Separation of Concerns (SoC)**.

* `library.js` — **Core Engine & State Management**: Defines underlying classes (`Book`, `DigitalBook`, `Member`, `PremiumMember`) and runs loan validation rules.
* `storage.js` — **Data Persistence Layer**: Safely handles cross-session saves via `localStorage` complete with schema integrity audits and JSON parsing fail-safes.
* `ui.js` — **Interface Controller**: Orchestrates event listeners, live filters, dynamically generated creation forms, and handles render schedules safely using DOM lifecycle listeners.
* `styles.css` — **Visual Presentation Layout**: Features responsive grid distributions, interactive transition states, and high-contrast alert layers.
* `library.test.js` — **Quality Control Framework**: Contains 36 automated test definitions evaluated through the Jest test framework.

---

## 🚀 Installation & Local Environment Setup

Follow these steps to configure your local workspace environment:

### 1. Extract Project Workspace
Ensure all source tracking files are located in your target development directory:
```bash
cd C:\Users\...
````

### 2. Install Development Dependencies
Install necessary build engines, transformation rules, and virtual browser environments:

```bash
npm install --save-dev @babel/core @babel/preset-env jest jest-environment-jsdom
````
## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode for development
npm run test:coverage # Generate coverage report
```
### 🖼️ Application Dashboards (Required Captures)
* Insert actual image links below to document full suite compliance:

* Application Interface Running: ![UI Success](./screenshots/app.png)

* Search: ![Clean Console](./screenshots/search.png)

* Jest Tests Passing (29/29): ![Tests Green](./screenshots/tests-passing.png)

* Test Coverage Metrics (>80%): ![Coverage Report](./screenshots/coverage.png)

* Statitics tab: ![Statistics](./screenshots/statistics.png)

### 💡 My Reflection
* `The Toughest Bug`: Honestly, the trickiest part was figuring out why my app would occasionally load as a completely blank page on startup. It turned out to be an asynchronous "race condition." My UI components were trying to draw themselves on the screen before the data from local storage and the external API had actually finished loading!

* `How I Fixed It`: To track it down, I set up a bunch of detailed console logs and breakpoints to map out exactly what was loading and when. Once I saw the timeline clash, I used clean async/await blocks to force the app to wait until the data was fully ready before letting the interface render.

* `What I Learned`: This taught me how crucial it is to keep data management and UI rendering completely separate. Ensuring your data is fully loaded before your visual elements try to display it makes the whole app way more stable and reliable.