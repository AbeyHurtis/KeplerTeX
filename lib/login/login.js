const vscode = acquireVsCodeApi();
const LAMBDA_BASE_URL = "https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws";


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
    const email = document.getElementById('username').value.trim();
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



document.getElementById('signupForm').addEventListener('click',  () => {
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
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
        command: 'checkUsernameAndSignup',
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
