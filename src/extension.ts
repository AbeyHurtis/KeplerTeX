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

	if(pauseState!==undefined){
		renderPreview(context, undefined, pauseState);
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
				console.log("pdfBufferReturn");
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
	context.globalState.update('pauseState', true);

	const startRenderCmd = vscode.commands.registerCommand('keplertex.startRender', async () => {

		console.log("ctrl + k trigger");
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No Active editor found');
			return;
		}
		const document = editor.document;
		const token = undefined;

		console.log("ctrl + k update pauseChange : ", 
			context.globalState.get('pauseState'));

		if ((document.languageId === 'latex' && document.fileName.endsWith('.tex'))) {
			// check login window , remove the comment when needed
			// await context.globalState.update("authToken", undefined);
			console.log("Before login");
			let loggedIn = await checkLogin(context);
			if (!loggedIn) {
				const token = await renderLogin(context);
				loggedIn = true;
				if (!token) {
					vscode.window.showErrorMessage('Login required to start the compiler');
					return;
				}
			}
			if (loggedIn) {
				console.log("logged in ");
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

		if (loggedIn && !(context.globalState.get('pauseState') === true)) {
			renderWithProgress(context, document, hasBibFile, texCached);
		}
	});

	context.subscriptions.push(startRenderCmd);
}

export function deactivate() { }
