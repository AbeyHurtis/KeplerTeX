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