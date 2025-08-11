import * as dotenv from 'dotenv';
import * as vscode from 'vscode';
import { renderPreview } from './preview';
import { sendToServer } from './compilerService';


dotenv.config();


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

        const pdfBufferReturn = await sendToServer(texRaw, document.fileName);
        renderPreview(context, pdfBufferReturn);

		// renderPreview(context); 
		initiated = true; 
	})


	vscode.workspace.onDidSaveTextDocument(async (document) => {

		if (initiated && (document.languageId == 'latex' || document.fileName.endsWith('.tex'))){
			const texRaw = document.getText();
			const pdfBufferReturn = await sendToServer(texRaw, document.fileName);
			renderPreview(context, pdfBufferReturn); 
		}
	})
}

// This method is called when your extension is deactivated
export function deactivate() { }


