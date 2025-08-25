import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { renderLogin } from './loginService';
import { renderPreview } from './preview';
import { sendToServer } from './compilerService';
import { checkLogin, promptLogin } from './loginService';

function renderWithProgress(context: vscode.ExtensionContext, document: vscode.TextDocument, hasBibFile: boolean|undefined) {
	const texRaw = document.getText();
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Compiling",
		cancellable: true
	}, async (progress, token) => {
		progress.report({ increment: 0 });

		if (token.isCancellationRequested) return;

		const pdfBufferReturn = await sendToServer(context, texRaw,document.fileName, hasBibFile);
		if (!token.isCancellationRequested && pdfBufferReturn) {
			renderPreview(context, pdfBufferReturn);
			progress.report({ increment: 100, message: "Done" });
		}
	})
}

export function activate(context: vscode.ExtensionContext) {
	let initiated = false;
	let hasBibFile: boolean | undefined = undefined; // undefined until first computation
	let bibWarningShown = false; // track if we already warned

	const startRenderCmd = vscode.commands.registerCommand('keplertex.startRender', async () => {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No Active editor found');
			return;
		}
		const document = editor.document;
		const token = undefined;


		if (!initiated && (document.languageId === 'latex' && document.fileName.endsWith('.tex'))) {
			await context.globalState.update("authToken", undefined);

			const dir = path.dirname(document.fileName);
			const files = fs.readdirSync(dir);
			hasBibFile = files.some(file => file.endsWith('.bib'));

			if (!hasBibFile && !bibWarningShown) {
				vscode.window.showWarningMessage('No .bib file found in the current directory. BibTeX compilation may fail.');
				bibWarningShown = true; // ensure we warn only once
			}

			let loggedIn = await checkLogin(context);
			if (!loggedIn) {
				const token = await renderLogin(context);
				loggedIn = true;
				if (token) {
					renderWithProgress(context, document, hasBibFile);
					initiated = true;
				}
				if (!token) {
					vscode.window.showErrorMessage('Login required to start the compiler');
					return;
				}
			}
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document) => {
		if (initiated && (document.languageId !== 'latex' || !document.fileName.endsWith('.tex'))) return;
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
			renderWithProgress(context, document, hasBibFile);
		}
	});

	context.subscriptions.push(startRenderCmd);
}

export function deactivate() { }
