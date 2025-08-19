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
export async function emailSignup(username: string, email: string, password: string) {
    const res = await fetch(`${LAMBDA_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
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

    // const githubSession = await vscode.authentication.getSession('github', ['read:user', 'user:email'], { createIfNone: true });
    const githubSession = await vscode.authentication.getSession("github", ['read:user', 'user:email'], { forceNewSession: true });

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

export function renderLogin(context: vscode.ExtensionContext): Promise<string | null> {

    return new Promise((resolve) => {

        if (!panel) {
            panel = vscode.window.createWebviewPanel(
                'LoginPreview',
                'Login',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(context.extensionUri, 'lib')
                    ],
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

        const logoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'lib/login', 'logo.png')
        );

        const githublogoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'lib/login', 'github.png')
        );

        const emailLogoUri = webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'lib/login', 'emailLogo.png')
        );

        const loginjsUri = webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'lib/login', 'login.js')
        );

        webview.html = getLoginHtml(webview, loginjsUri, loginCSSUri, logoUri, githublogoUri, emailLogoUri);

        let token = undefined;

        webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'githubLogin':
                    token = await githubLoginOrSignup(context);
                    if (token) {
                        resolve(token);
                        panel?.dispose();
                    }
                    break;

                case 'submitEmailForm': {
                    const { username, email, password } = message.data;
                    try {
                        // first signup, then login
                        await emailSignup(username, email, password);
                        token = await emailLogin(email, password);
                        if (token) {
                            await context.globalState.update('authToken', token);
                            vscode.window.showInformationMessage(`Logged in as ${username}`);
                            resolve(token);
                            panel?.dispose();
                        } else {
                            vscode.window.showErrorMessage("Signup Failed!");
                        }

                    } catch (err: any) {
                        vscode.window.showErrorMessage(err.message);
                    }
                    break;
                }
                case 'emailLogin': {
                    const { email, password } = message.data;
                    try {
                        const token = await emailLogin(email, password);
                        if (token) {
                            await context.globalState.update('authToken', token);
                            vscode.window.showInformationMessage(`Logged in as ${email}`);
                            resolve(token);
                            panel?.dispose();
                        } else {
                            vscode.window.showErrorMessage("Login Failed!");
                        }
                    } catch (err: any) {
                        vscode.window.showErrorMessage(err.message);
                    }
                }

                case 'wrongPassword':
                    vscode.window.showErrorMessage("Passwords Does not match");
            }
        });
    })

}

function getLoginHtml(
    webview: vscode.Webview,
    loginjsUri: vscode.Uri,
    loginCSSUri: vscode.Uri,
    logoUri: vscode.Uri,
    githublogoUri: vscode.Uri,
    emailLogoUri: vscode.Uri,
) {
    const nonce = getNonce();
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy"
                content="default-src 'none';
                connect-src ${webview.cspSource};
                script-src 'unsafe-inline' ${webview.cspSource};
                worker-src blob:;
                style-src ${webview.cspSource} 'nonce-${nonce}';
                img-src ${webview.cspSource};
                font-src ${webview.cspSource};
                ">
                <meta name="viewport" content="with=device-width, inital-scale=1.0">
                <link rel="stylesheet" type="text/css" href="${loginCSSUri}"> 
            </head>
            <body>
                <script type="module" src="${loginjsUri}"> </script>
                <div class="loginElements">
                    <div class="loginCenter">

                        <div class="logo">
                            <img src="${logoUri}" height=200 width=200/>
                        </div>

                        <div class="buttonDiv">
                            <button class="githubLoginButton"><img src="${githublogoUri}" /></button>
                            <button class="emailLoginButton"><img src="${emailLogoUri}" /></button>
                        </div>
                        
                        <div id="loginForm">
                            <input type="email" id="loginEmail" placeholder="Email" />
                            <input type="password" id="loginPassword" placeholder="Password" />
                            <button id="submitLoginForm">Login</button>
                            <span id="goToSignup">Don’t have an account? Sign up</span>
                            <span id="backArrowLogin">&larr;</span>
                        </div>

                        <div id="signupForm">
                            <input type="text" id="username" placeholder="Username" />
                            <input type="email" id="signupEmail" placeholder="Email" />
                            <input type="password" id="signupPassword" placeholder="Password" />
                            <input type="password" id="repassword" placeholder="Re-enter Password" />
                            <button id="submitSignupForm">Sign Up</button>
                            <span id="goToLogin">Already have an account? Login</span>
                            <span id="backArrowSignup">&larr;</span>
                        </div>

                        <div class="textFooter">
                            Login / Sign Up 
                        </div>

                    </div>
                    
                </div>
            </body>
        </html>
    `
}
