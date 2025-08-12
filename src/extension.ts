import * as vscode from 'vscode';
import { renderPreview } from './preview';
import { sendToServer } from './compilerService';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

	let initiated = false;

	//start Inital rendering. 
	const startRenderCmd = vscode.commands.registerCommand('keplertex.startRender', async () => {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('No active editor found.');
			return;
		}

		const document = editor.document;
		const texRaw = document.getText();

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Compiling",
			cancellable: true
		}, async (progress, token) => {
			progress.report({ increment: 0, message: "Starting..." });

			// Check token periodically to abort if user cancels
			if (token.isCancellationRequested) {
				return;
			}

			const pdfBufferReturn = await sendToServer(texRaw, document.fileName);

			if (!token.isCancellationRequested) {
				renderPreview(context, pdfBufferReturn);
				progress.report({ increment: 100, message: "Done" });
			}
		})

		// renderPreview(context); 
		initiated = true;
	})


	vscode.workspace.onDidSaveTextDocument(async (document) => {

		if (initiated && (document.languageId == 'latex' || document.fileName.endsWith('.tex'))) {
			const texRaw = document.getText();
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Compiling",
				cancellable: true
			}, async (progress, token) => {
				progress.report({ increment: 0, message: "Starting..." });

				// Check token periodically to abort if user cancels
				if (token.isCancellationRequested) {
					return;
				}

				const pdfBufferReturn = await sendToServer(texRaw, document.fileName);

				if (!token.isCancellationRequested) {
					renderPreview(context, pdfBufferReturn);
					progress.report({ increment: 100, message: "Done" });
				}
			})
		}
	})
}

// This method is called when your extension is deactivated
export function deactivate() { }


