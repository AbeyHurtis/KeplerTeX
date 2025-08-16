import * as vscode from 'vscode';
import { renderPreview } from './preview';
import { sendToServer } from './compilerService';
import { checkLogin, promptLogin } from './loginService';

function renderWithProgress(context: vscode.ExtensionContext, document: vscode.TextDocument){
	const texRaw = document.getText();
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Compiling",
				cancellable: true
			}, async (progress, token) => {
				progress.report({ increment: 0 });

				if (token.isCancellationRequested) return;

				const pdfBufferReturn = await sendToServer(context,texRaw, document.fileName);
				if (!token.isCancellationRequested && pdfBufferReturn) {
					renderPreview(context, pdfBufferReturn);
					progress.report({ increment: 100, message: "Done" });
				}
			})
}

export function activate(context: vscode.ExtensionContext) {
	let initiated = false;

	const startRenderCmd = vscode.commands.registerCommand('keplertex.startRender', async () => {
		if (!initiated) {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor found.');
				return;
			}
			// Check if user is logged in
			let loggedIn = await checkLogin(context);

			if (!loggedIn) {
				const token = await promptLogin(context);
				if (!token) {
					vscode.window.showErrorMessage('Login required to compile.');
					return;
				}
				loggedIn = true;
			}

			if (loggedIn) {
				const document = editor.document;
				renderWithProgress(context, document); 

				initiated = true;
			}
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document) => {
		if (initiated && (document.languageId !== 'latex' && !document.fileName.endsWith('.tex'))) return;

		// Check login before compilation
		let loggedIn = await checkLogin(context);
		if (!loggedIn) {
			const token = await promptLogin(context);
			if (!token) {
				vscode.window.showErrorMessage('Login required to compile(OnSave).');
				return;
			}
			loggedIn = true;
		}

		if (loggedIn) {
				renderWithProgress(context, document); 
		}
	});

	context.subscriptions.push(startRenderCmd);
}

export function deactivate() { }
