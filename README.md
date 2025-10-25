# KeplerTeX

KeplerTeX lets you compile **LaTeX** documents directly inside VS Code — **no local TeX installation required**.
Simply log in, write your LaTeX code, and compile instantly.

---

## Requirement

* An active internet connection.

---

## How to Use

1. Open a `.tex` file in VS Code.
2. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux).  
   This opens the login page for KeplerTeX.
3. Once logged in, your LaTeX document will compile automatically and the first PDF preview will appear.
4. After the initial login and compile, use:

   * `Cmd + S` (Mac) or `Ctrl + S` (Windows/Linux)  
     to trigger subsequent compiles and update the preview.
   * `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)  
     to **pause** the compiler. Press again to **unpause** and resume compiling.

**Tip:** Keep your `.tex` file open while editing. Each save updates the preview without additional setup.


---

## Try It Out – Hello World Example

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

Log in with KeplerTeX (`Cmd + K`)(Mac)/(`Ctrl + K`)(Windows/Linux) 

Save your (`Cmd + S`)(Mac)/(`Ctrl + S`)(Windows/Linux) `.tex` file. Your first PDF will render instantly.

---

## Features

* Zero local setup – start compiling without installing TeXLive or other LaTeX distributions.
* Seamless workflow – edit, compile, and preview without leaving VS Code.
* Fast PDF rendering – preview your LaTeX output in seconds.

---

## Usage Limits and Plans

* **Free Tier**: Each user has a limit of **1000 compilations per day**.
* **Pro Tier (coming soon)**: For heavy users, a paid plan will get unlimited compilations and include additional benefits such as faster queue priority.

**These limits help us manage infrastructure costs while keeping KeplerTeX accessible to everyone.**

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

* Initial Release – N/A

---


