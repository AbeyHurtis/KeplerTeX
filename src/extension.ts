import * as vscode from 'vscode';
import { renderLogin } from './loginService';
import { renderPreview } from './preview';
import { sendToServer } from './compilerService';
import { checkLogin } from './loginService';

function renderWithProgress(context: vscode.ExtensionContext,
	document: vscode.TextDocument,
	hasBibFile: boolean | undefined,
	texCached: { value: string | undefined }, 
	pauseState?: boolean|undefined) {

	const texRaw = document.getText();

	if(pauseState!==undefined || context.globalState.get('pauseState')===true){
		renderPreview(context, undefined, pauseState);
		return; 
	}

	if (texRaw === texCached.value) {
		vscode.window.showInformationMessage('No change in source code');
		return;
	}
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Compiling",
		cancellable: true
	}, async (progress, token) => {
		progress.report({ increment: 0 });

		if (token.isCancellationRequested) { return; };

		if (!token.isCancellationRequested) {
			const pdfBufferReturn = await sendToServer(context, texRaw, document.fileName);
			if(pdfBufferReturn){
				renderPreview(context, pdfBufferReturn, pauseState);
				texCached.value = texRaw;
				progress.report({ increment: 100, message: "Done" });
			}
		}
	});
}

export function activate(context: vscode.ExtensionContext) {
	// let initiated = false;
	let hasBibFile: boolean | undefined = undefined; // undefined until first computation
	let bibWarningShown = false; // track if we already warned
	const token = undefined;
	let texCached = { value: undefined as string | undefined };
	context.globalState.update('pauseState', false);
	let initialRender = true; 

	const startRenderCmd = vscode.commands.registerCommand('keplertex.startRender', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No Active editor found');
			return;
		}
		const document = editor.document;
		const token = undefined;

		if ((document.languageId === 'latex' && document.fileName.endsWith('.tex'))) {
			// check login window , remove the comment when needed
			// await context.globalState.update("authToken", undefined);
			let loggedIn = await checkLogin(context);
			if (!loggedIn) {
				const token = await renderLogin(context);
				loggedIn = true;
				if (!token) {
					vscode.window.showErrorMessage('Login required to start the compiler');
					return;
				}
				renderWithProgress(context, document, hasBibFile, texCached);
			}
			if (loggedIn) {
				if(initialRender===true){
					initialRender = false; 
					renderWithProgress(context, document, hasBibFile, texCached);
					return; 
				}
				const currentPause = context.globalState.get('pauseState') as boolean;
				const pauseState = !currentPause;
				context.globalState.update('pauseState', pauseState);
				renderWithProgress(context, document, hasBibFile, texCached, 
					context.globalState.get('pauseState'));
				// initiated = true;
			}
		}
	});
	vscode.workspace.onDidSaveTextDocument(async (document) => {
		if ((document.languageId !== 'latex' || !document.fileName.endsWith('.tex'))) { return; };
		// Check login before compilation
		let loggedIn = await checkLogin(context);
		if (!loggedIn) {
			const token = await renderLogin(context);
			loggedIn = true;
			if (!token) {
				vscode.window.showErrorMessage('Login required to compile.');
				return;
			}
			loggedIn = true;
		}

		if (loggedIn) {
			renderWithProgress(context, document, hasBibFile, texCached);
			if(initialRender===true){
					initialRender = false; 
			}
		}
	});

	context.subscriptions.push(startRenderCmd);
}

export function deactivate() { }
