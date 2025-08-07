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




function getWebViewHtml(pdfUri: vscode.Uri): string {
	const webviewEditor = vscode.;
	const webview = webviewEditor.webview;
	const head = `
	<!DOCTYPE html>
    <html lang="en">
      <head>
	  	<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta name="google" content="notranslate">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src ${webview.cspSource}; script-src 'unsafe-inline' ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; img-src blob: data: ${webview.cspSource};">

        <title>PDF Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: sans-serif;
          }
		  embed {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
	`

	const body = `
	<body>
		<embed 
          src="${pdfUri}" 
          type="application/pdf" />
      </body>
	`

	const tail = `
	</html>
	`
  return  head + body + tail;
}

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

	context.subscriptions.push{
		
		const pdfPath = vscode.Uri.joinPath(context.extensionPath, 'media', 'download.pdf');
		const pdfSrc = panel.webview.asWebviewUri(pdfPath);
	}

	vscode.workspace.onDidSaveTextDocument((document) => {



		if (document.languageId == 'latex' || document.fileName.endsWith('.tex')) {
			const texRaw = document.getText();
			// const pdfBufferReturn = sendToServer(texRaw, document.fileName);

			const panel = vscode.window.createWebviewPanel('pdfPreviewDebugger',
				'Debugging console',
				vscode.ViewColumn.Two, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
			}
			);


			// const pdfPath = path.join(__dirname, 'download.pdf'); // adjust if needed
			
			vscode.window.showInformationMessage(`${pdfPath}`);
			
			
			// const pdfBuffer = fs.readFileSync(pdfPath);
			// fs.writeFileSync(pdfPath, pdfBuffer);

			try {

			const pdfUri = vscode.Uri.file(pdfPath);
			const pdfWebviewUri = panel.webview.asWebviewUri(pdfUri);

			const html = getWebViewHtml(pdfWebviewUri);
			panel.webview.html = html;
			} catch (err) {
				const message = (err instanceof Error) ? err.message : String(err); 
				vscode.window.showErrorMessage(`Failed to read PDF file: ${message}`);
			}

		}
	})

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
