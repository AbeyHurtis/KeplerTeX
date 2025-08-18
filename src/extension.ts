import * as vscode from 'vscode';
import { renderLogin } from './loginService';
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
			await context.globalState.update("authToken", undefined);
			const editor = vscode.window.activeTextEditor;
			if(!editor){
				vscode.window.showErrorMessage('No Active editor found');
				return;
			}
			const document = editor.document;
			const token = undefined; 


			let loggedIn = await checkLogin(context); 
			if(!loggedIn) {
				const token = await renderLogin(context);
				loggedIn = true; 
				if(token){
					renderWithProgress(context, document);
					initiated = true; 
				}
				if(!token){
					vscode.window.showErrorMessage('Login required to start the compiler');
					return; 
				}
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
				vscode.window.showErrorMessage('Login required to compile.');
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
