// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as dotenv from 'dotenv';
dotenv.config();

import * as vscode from 'vscode';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import { error } from 'console';




function getWebviewHtml(base64Pdf: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>PDF Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        <p>Test</p>
      </body>
    </html>
  `;
}

// <iframe 
//         src="data:application/pdf;base64,${base64Pdf}"
//         type="application/pdf" 
//         style="width:100%; height:100vh;" 
//         frameborder="0">
//       </iframe>


// Send raw text to texlive server 
async function sendToServer(texRaw: string, fileName: string) {
	//TODO
	try {
		const form = new FormData();

		const latexStream = Readable.from(texRaw);

		form.append('tex_file', latexStream, {
			filename: fileName || 'manuscript.tex',
			contentType: 'application/x-tex'
		});

		// const compileURL = process.env.COMPILE_URL;
		const compileURL = 'https://texlive-latest.onrender.com/compile';
		const response = await fetch(compileURL || '', {
			method: 'POST',
			body: form as any,
			headers: form.getHeaders()
		})

		// vscode.window.showInformationMessage(`${compileURL}`);
		if (!response.ok) {
			const errorText = await response.text();
			vscode.window.showErrorMessage("Failed to Compile", errorText);
			return;
		}

		//read buffer
		const pdfBuffer = await response.buffer();

		return pdfBuffer

	}
	catch (error: any) {
		vscode.window.showErrorMessage("Failed to connect: ", error.message);
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "keplertex" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('keplertex.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from keplertex!');
	});

	vscode.workspace.onDidSaveTextDocument((document) => {
		if (document.languageId == 'latex' || document.fileName.endsWith('.tex')) {
			const texRaw = document.getText();
			// const pdfBufferReturn = sendToServer(texRaw, document.fileName);

			const panel = vscode.window.createWebviewPanel('pdfPreviewDebugger',
				'Debugging console',
				vscode.ViewColumn.Two, {
				enableScripts: true,
				// localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
			}
			);


			const pdfPath = path.join(__dirname, 'download.pdf'); // adjust if needed

			try {
			const pdfBuffer = fs.readFileSync(pdfPath);
			const base64Pdf = pdfBuffer.toString('base64'); // <-- Base64 encoded PDF

			const html = getWebviewHtml(base64Pdf);
			panel.webview.html = html;
			} catch (err) {
				const message = (err instanceof Error) ? err.message : String(err); 
				vscode.window.showErrorMessage(`Failed to read PDF file: ${message}`);
			}
			vscode.window.showInformationMessage(`${pdfPath}`);

			// const htmlPath = path.join(context.extensionPath, 'media', 'viewer.html');
			// let html = fs.readFileSync(htmlPath, 'utf8');


			// const pdfWebViewUri2 = panel.webview.asWebviewUri(testpath);

			// html = html.replace('{{PDF_URI}}', './download.pdf');

		}
	})

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
