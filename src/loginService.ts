import * as vscode from 'vscode';
import fetch from 'node-fetch';

const LAMBDA_BASE_URL = "https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws/compile"; 

// -------------------- EMAIL/PASSWORD --------------------
export async function emailSignup(email: string, password: string) {
    const res = await fetch(`${LAMBDA_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    return data.token;
}

export async function emailLogin(email: string, password: string) {
    const res = await fetch(`${LAMBDA_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data.token;
}

// -------------------- GITHUB OAUTH --------------------
export async function githubLoginOrSignup(context: vscode.ExtensionContext, isSignup: boolean = false) {
    const githubSession = await vscode.authentication.getSession('github', ['read:user', 'user:email'], { createIfNone: true });
    if (!githubSession) {
        vscode.window.showErrorMessage('GitHub authentication failed');
        return null;
    }

    const code = githubSession.accessToken; // GitHub OAuth code/token

    const path = isSignup ? '/signup/github' : '/login/github';
    const res = await fetch(`${LAMBDA_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (!res.ok) {
        vscode.window.showErrorMessage(`GitHub ${isSignup ? 'signup' : 'login'} failed: ${data.error}`);
        return null;
    }

    // Save token in global state
    await context.globalState.update('authToken', data.token);
    vscode.window.showInformationMessage(`Logged in with GitHub successfully`);
    return data.token;
}

// -------------------- CHECK LOGIN --------------------
export async function checkLogin(context: vscode.ExtensionContext) {
    const token = await context.globalState.get<string>('authToken');
    if (!token) return false;

    const res = await fetch(`${LAMBDA_BASE_URL}/checklogin`, {
        method: 'GET',
        headers: { Authorization: token }
    });
    if (!res.ok) return false;

    return true;
}

// -------------------- PROMPT FOR LOGIN --------------------
export async function promptLogin(context: vscode.ExtensionContext) {
    const choice = await vscode.window.showQuickPick(
        ['Email/Password', 'GitHub OAuth'], 
        { placeHolder: 'Choose login method' }
    );
    if (!choice) return null;

    if (choice === 'Email/Password') {
        const email = await vscode.window.showInputBox({ prompt: 'Email' });
        const password = await vscode.window.showInputBox({ prompt: 'Password', password: true });
        if (!email || !password) return null;

        try {
            const token = await emailLogin(email, password);
            await context.globalState.update('authToken', token);
            vscode.window.showInformationMessage('Logged in successfully');
            return token;
        } catch (err: any) {
            vscode.window.showErrorMessage(err.message);
            return null;
        }
    } else if (choice === 'GitHub OAuth') {
        return githubLoginOrSignup(context);
    }
}
