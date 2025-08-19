const vscode = acquireVsCodeApi();


const buttonDiv = document.querySelector(".buttonDiv");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

document.querySelector('.githubLoginButton').addEventListener('click', () => {
    vscode.postMessage({ command: 'githubLogin' });
});

document.querySelector('.emailLoginButton').addEventListener('click', () => {
    buttonDiv.style.display = "none";
    document.getElementById('loginForm').classList.add('active');
});


// LOGIN submission
document.getElementById('submitLoginForm').addEventListener('click', () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }
    vscode.postMessage({
        command: 'emailLogin',
        data: { email, password }
    });
});



document.getElementById('signupForm').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const repassword = document.getElementById('repassword').value.trim();

    if (!email || !password || !repassword) {
        vscode.postMessage({
            command: "fillAllFields",
        })
        return;
    }
    if (password !== repassword) {
        alert("Passwords do not match.");
        vscode.postMessage({
            command: 'wrongPassword', 
        })
        return;
    }

    vscode.postMessage({
        command: 'submitEmailForm',
        data: { username, email, password }
    });
});


// Toggle login <-> signup
document.getElementById('goToSignup').addEventListener('click', () => {
    loginForm.classList.remove("active");
    signupForm.classList.add("active");
});

document.getElementById('goToLogin').addEventListener('click', () => {
    signupForm.classList.remove("active");
    loginForm.classList.add("active");
});

// Back Arrow
document.getElementById('backArrowLogin').addEventListener('click', () => {
    loginForm.classList.remove("active");
    buttonDiv.style.display = "flex";
});

document.getElementById('backArrowSignup').addEventListener('click', () => {
    signupForm.classList.remove("active");
    buttonDiv.style.display = "flex";
});

// window.addEventListener("DOMContentLoaded", () => {
//     const emailLoginButton = document.querySelector(".emailLoginButton");
//     const buttonDiv = document.querySelector(".buttonDiv");
//     const emailForm = document.getElementById("emailForm");
//     const backArrow = document.getElementById("backArrow");

//     // Show email signup form
//     emailLoginButton.addEventListener("click", () => {
//         buttonDiv.style.display = "none";
//         emailForm.classList.add("active");
//     });

//     // Go back when clicking arrow
//     backArrow.addEventListener("click", () => {
//         emailForm.classList.remove("active");
//         buttonDiv.style.display = "flex";
//     });

//     // emailLoginButton.addEventListener("click", () => {
//     //     buttonDiv.classList.remove("active");
//     //     buttonDiv.style.display = "none";
//     //     emailForm.classList.add("active");
//     // });

//     // backArrow.addEventListener("click", () => {
//     //     emailForm.classList.remove("active");
//     //     buttonDiv.style.display = "flex";   
//     //     buttonDiv.classList.add("active");
//     // });

// });
