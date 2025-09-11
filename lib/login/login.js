const vscode = acquireVsCodeApi();
const LAMBDA_BASE_URL = "https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws";


const buttonDiv = document.querySelector(".buttonDiv");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const passwordReq = document.getElementById("passwordRequirement");
const TFAVerification = document.getElementById("TFAVerification");

document.querySelector('.githubLoginButton').addEventListener('click', () => {
    vscode.postMessage({ command: 'githubLogin' });
});

document.querySelector('.emailLoginButton').addEventListener('click', () => {
    buttonDiv.style.display = "none";
    document.getElementById('loginForm').classList.add('active');
});


// LOGIN submission
document.getElementById('submitLoginForm').addEventListener('click', () => {
    const loginMessage = document.getElementById("loginMessages");
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!email || !password) {
        loginMessage.textContent = "Please fill in all fields.";
        return;
    }
    vscode.postMessage({
        command: 'emailLogin',
        data: { email, password }
    });
});

//SIGNUP submission
document.getElementById('submitSignupForm').addEventListener('click',  (e) => {
    e.preventDefault();
    const signupMessage = document.getElementById("signupMessages");
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value.trim();
    const repassword = document.getElementById('repassword').value.trim();
    const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
    const nums = /\d/;

    if (!email || !password || !repassword) {
        signupMessage.textContent = "Please fill in all fields.";
        vscode.postMessage({
            command: "fillAllFields",
        });
        return;
    }
    if (password !== repassword) {
        signupMessage.textContent = "Passwords do not match.";
        vscode.postMessage({
            command: 'wrongPassword',
        });
        return;
    }
    if(password.length <8){
        signupMessage.textContent = "Password must be at least 8 characters.";
        vscode.postMessage({
            command: "passwordLength",
        });
        return; 
    }
    const numMatches = password.match(nums);
    if(!numMatches){
        signupMessage.textContent = "Password must include at least one number.";
        vscode.postMessage({
            command: "numMatchError"
        });
        return; 
    }
    const charMatches = password.match(specialCharsRegex); 
    if(!charMatches || charMatches.length < 2){
        signupMessage.textContent = "Password must include at least 2 special characters.";
        vscode.postMessage({
            command: "specialCharError"
        });
        return; 
    }
    if(!/[A-Z]/.test(password)){
        signupMessage.textContent = "Password must include one capital letter";
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
    TFAVerification.classList.remove('active'); 

    signupForm.classList.add("active");
    passwordReq.classList.add("active");

});

document.getElementById('goToLogin').addEventListener('click', () => {
    signupForm.classList.remove("active");
    passwordReq.classList.remove("active"); 
    TFAVerification.classList.remove('active'); 

    loginForm.classList.add("active");
});

// Back Arrow
document.getElementById('backArrowLogin').addEventListener('click', () => {
    loginForm.classList.remove("active");
    TFAVerification.classList.remove('active'); 
    buttonDiv.style.display = "flex";
});

document.getElementById('backArrowSignup').addEventListener('click', () => {
    signupForm.classList.remove("active");
    passwordReq.classList.remove("active");
    TFAVerification.classList.remove('active'); 
    buttonDiv.style.display = "flex";

});

document.getElementById('submitSignupForm').addEventListener('click', () => {
    TFAVerification.classList.add('active'); 
    
}); 