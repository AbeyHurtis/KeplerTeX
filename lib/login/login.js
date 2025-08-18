const vscode = acquireVsCodeApi();

document.querySelector('.githubLoginButton').addEventListener('click', () => {
    vscode.postMessage({ command: 'githubLogin' });
});

document.querySelector('.emailLoginButton').addEventListener('click', () => {
    document.getElementById('emailForm').classList.add('active');
});


document.getElementById('submitEmailForm').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const repassword = document.getElementById('repassword').value.trim();

    if (!email || !password || !repassword) {
        alert("Please fill in all fields.");
        return;
    }
    if (password !== repassword) {
        alert("Passwords do not match.");
        return;
    }

    vscode.postMessage({
        command: 'submitEmailForm',
        data: { username, email, password }
    });
});


// window.addEventListener("DOMContentLoaded", () => {
//     const emailLoginButton = document.querySelector(".emailLoginButton");
//     const buttonDiv = document.querySelector(".buttonDiv");
//     const emailForm = document.getElementById("emailForm");
//     const backButton = document.getElementById("backButton");

//     // Show email signup form
//     emailLoginButton.addEventListener("click", () => {
//         buttonDiv.style.display = "none";    // hide login buttons
//         emailForm.classList.add("active");  // show form
//     });

//     // Go back to login buttons
//     backButton.addEventListener("click", () => {
//         emailForm.classList.remove("active"); 
//         buttonDiv.style.display = "flex";   // show login buttons again
//     });
// });


window.addEventListener("DOMContentLoaded", () => {
    const emailLoginButton = document.querySelector(".emailLoginButton");
    const buttonDiv = document.querySelector(".buttonDiv");
    const emailForm = document.getElementById("emailForm");
    const backArrow = document.getElementById("backArrow");

    // Show email signup form
    emailLoginButton.addEventListener("click", () => {
        buttonDiv.style.display = "none";
        emailForm.classList.add("active");
    });

    // Go back when clicking arrow
    backArrow.addEventListener("click", () => {
        emailForm.classList.remove("active");
        buttonDiv.style.display = "flex";
    });
});
