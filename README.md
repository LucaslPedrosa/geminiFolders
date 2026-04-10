# Gemini Folders

A simple browser extension to organize your Gemini AI chats into custom folders using drag-and-drop. Keep your workspace clean and find your conversations faster.

---

## 🚀 How to Install

### Step 1: Download the Project Files
Download and extract the ZIP or clone this repository to your local machine.

<video src="https://github.com/user-attachments/assets/ac09fa2e-6287-4845-b074-4425e35fe688" width="500" autoplay muted loop></video>

**Extract the files:**
<img width="400" alt="Extracting files" src="https://github.com/user-attachments/assets/88156a6c-5d1a-4883-9e99-22ccaecfd258" />

### Step 2: Access Chrome Extensions
1. Open Google Chrome and navigate to: `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top right corner).
3. Click on **Load unpacked** and select the folder where you extracted the project.

<video src="https://github.com/user-attachments/assets/db74d6dd-c3d7-4cd9-8b9f-c9563bd026fc" width="500" autoplay muted loop></video>

---

## How to use in

To create folders simply click the "Create Folder" button, and start dragging your Gemini AI chats into it. You can create as many folders as you like to keep your conversations organized.

To rename folders double click them

To remove a chat from a folder, simply drag it back to the same folder

### With / Without the extension

<img width="578" height="408" alt="image" src="https://github.com/user-attachments/assets/79526d7f-ad97-4d63-8e63-09c85b7028a5" />


## 📄 License
This project is under the [MIT License](LICENSE).

---

## Development

Source code is now modularized under `src/content/**` and bundled into `index.js` for the extension.

1. Install dependencies:
	- `npm install`
2. Build once:
	- `npm run build`
3. Watch and rebuild on changes:
	- `npm run watch`

After building, reload the unpacked extension in `chrome://extensions`.
