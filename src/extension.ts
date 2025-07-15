// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';
import * as dotenv from 'dotenv';
dotenv.config();


// Send raw text to texlive server 
async function sendToServer(texRaw: string, fileName: string){
	//TODO
	try{
		const form = new FormData();

		const latexStream = Readable.from(texRaw);
		form.append('tex_file', latexStream, { 
			filename: fileName || 'manuscript.tex',
			contentType: 'application/x-tex'
		});

		const compileURL = process.env.COMPILE_URL;
		const response = await fetch(compileURL||'', {
			method: 'POST', 
			body: form as any, 
			headers: form.getHeaders()
		})

		if(!response.ok){
			const errorText = await response.text(); 
			vscode.window.showErrorMessage("Failed to Compile",errorText);
			return; 
		}

		//read buffer
		const pdfBuffer = await response.buffer();
		
		//Testing saved pdf

		// Save PDF to temp location and open
		const tempPath = vscode.Uri.joinPath(
			vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(require('os').tmpdir()),
			'output.pdf'
		).fsPath;

		require('fs').writeFileSync(tempPath, pdfBuffer);

		vscode.window.showInformationMessage('PDF compiled successfully!');
		vscode.env.openExternal(vscode.Uri.file(tempPath));

	  //TODO : 
	//    Open file within vscode ???
		
	}
	catch(error: any) { 
		vscode.window.showErrorMessage("Failed to connect: ", error.message);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "keplertex" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('keplertex.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from keplertex!');
	});

	vscode.workspace.onDidSaveTextDocument((document) => {
		if(document.languageId == 'latex' || document.fileName.endsWith('.tex')){
			const texRaw = document.getText();
			sendToServer(texRaw, document.fileName);
		}
	})

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
