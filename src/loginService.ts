import * as vscode from 'vscode';
import fetch from 'node-fetch';

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const LAMBDA_BASE_URL = "https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws"; 

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

    const code = githubSession.accessToken;
    const path = '/login/github';

    const res = await fetch(`${LAMBDA_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        const path = '/signup/github'
        const res = await fetch(`${LAMBDA_BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

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

let panel: vscode.WebviewPanel | undefined;

export function renderLogin(context: vscode.ExtensionContext){
    if(!panel){
        panel = vscode.window.createWebviewPanel(
            'LoginPreview', 
            'Login Preview', 
            vscode.ViewColumn.Two,
            {
                enableScripts: true, 
                retainContextWhenHidden: true, 
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'lib')
                ]
            }
        );

        panel.onDidDispose(() => {
            panel = undefined; 
        });
    }

     const webview = panel.webview; 

     const loginCSSUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/login', 'login.css')
     );

     webview.html = getLoginHtml(webview, loginCSSUri); 
}

function getLoginHtml(
    webview: vscode.Webview,
    loginCSSUri: vscode.Uri, 
){
    const nouce = getNonce(); 
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charstt="UTF-8">
            <meta name="viewport" content="with=device-width, inital-scale=1.0">
            <style nonce=${nouce} src=${loginCSSUri}><style> 
        </head>
        <body>
            <button>Github Login</button> 
            <button>Email & Password</button>
        </body>
        </html>
    `
}
