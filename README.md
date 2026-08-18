# KeplerTeX

KeplerTeX lets you compile **LaTeX** documents directly inside VS Code - no local TeX installation required.
Simply log in, write your LaTeX code, and compile instantly.

---

## Requirements

* An active internet connection.
* VS Code version: ^1.100.0

---

## How to Use

1. Open a `.tex` file in VS Code.
2. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux).
   This opens the login page for KeplerTeX.
3. Once logged in, your LaTeX document will compile automatically and the first PDF preview will appear.
4. After the initial login and compile, use:
   * `Cmd + S` (Mac) or `Ctrl + S` (Windows/Linux) to trigger subsequent compiles and update the preview.
   * `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) to **pause** the compiler. Press again to **unpause** and resume compiling.

**Tip:** Keep your `.tex` file open while editing. Each save updates the preview without additional setup.

---

## Try It Out - Hello World Example

Create a file named `hello.tex` and paste the following code:

```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}
Hello, World!

This is your first document compiled with KeplerTeX.

Here is a simple equation:

\[
E = mc^2
\]

\end{document}
```

Log in with KeplerTeX (`Cmd + K` on Mac / `Ctrl + K` on Windows/Linux).
Save your `.tex` file (`Cmd + S` on Mac / `Ctrl + S` on Windows/Linux). Your first PDF will render instantly.

---

## Features

* Zero local setup - start compiling without installing TeXLive or other LaTeX distributions.
* Seamless workflow - edit, compile, and preview without leaving VS Code.
* Fast PDF rendering - preview your LaTeX output in seconds.

---

## Usage Limits and Plans

* **Free Tier**: Each user has a limit of **1000 compilations per day**.
* **Pro Tier (coming soon)**: For heavy users, a paid plan will get unlimited compilations and include additional benefits such as faster queue priority.

These limits help us manage infrastructure costs while keeping KeplerTeX accessible to everyone.

---

## Development Setup

### Prerequisites

* Node.js (v18 or later recommended)
* npm (v9 or later)
* Visual Studio Code

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AbeyHurtis/keplertex.git
   cd keplertex
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Building the Extension

* To compile the extension:
  ```bash
  npm run compile
  ```
* To compile and watch for file changes automatically:
  ```bash
  npm run watch
  ```

### Running and Debugging Locally

1. Open the project folder in Visual Studio Code.
2. Press `F5` (or navigate to the "Run and Debug" view and click "Run Extension") to open a new VS Code window ("Extension Development Host") with KeplerTeX loaded.
3. Open a `.tex` file in the new window.
4. Use the shortcut `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux) to trigger the `keplertex.startRender` command and start the rendering process.
5. Set breakpoints in `src/extension.ts` or other source files in the main VS Code window to debug.

---

## Testing

### Running Tests

The project uses the official VS Code Extension Test Runner (`@vscode/test-cli`) for testing.

* To run compile checks, linting, and all tests:
  ```bash
  npm test
  ```
* To run tests directly via command line:
  ```bash
  npx vscode-test
  ```
* To run tests inside VS Code:
  1. Install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner) extension.
  2. Run the `watch` task using the **Tasks: Run Task** command.
  3. Open the **Testing** view in the sidebar and click **Run Test**, or use the shortcut `Cmd + ;` followed by `A` (Mac) or `Ctrl + ;` followed by `A` (Windows/Linux).

### Linting

To run the linter and check for syntax or style issues:
```bash
npm run lint
```
---

## Packaging

To package the extension into a `.vsix` file for distribution or manual installation:

1. Ensure the extension is compiled:
   ```bash
   npm run compile
   ```
2. Package the extension using `@vscode/vsce`:
   ```bash
   npx @vscode/vsce package
   ```
   This command will bundle the extension and output a `keplertex-<version>.vsix` file in the root directory.

3. Install the generated `.vsix` package manually in VS Code (optional):
   * Run the following command in your terminal:
     ```bash
     code --install-extension keplertex-<version>.vsix
     ```
   * Or open the **Extensions** view in VS Code (`Cmd+Shift+X` or `Ctrl+Shift+X`), click the `...` menu in the top-right corner, select **Install from VSIX...**, and choose the generated `.vsix` file.

---

## Contribution

We welcome contributions to improve KeplerTeX.

* **Repository**: [KeplerTeX on GitHub](https://github.com/AbeyHurtis/keplertex)
* To contribute:
  1. Fork the repository.
  2. Create a new branch for your feature or bug fix.
  3. Submit a pull request with a clear description of your changes.

If you encounter any issues or have feature requests, please [open an issue](https://github.com/AbeyHurtis/keplertex/issues).

---

## Known Issues

* Initial Release - N/A
