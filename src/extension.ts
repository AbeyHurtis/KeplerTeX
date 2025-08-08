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

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
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


	vscode.workspace.onDidSaveTextDocument((document) => {


		if (document.languageId == 'latex' || document.fileName.endsWith('.tex')) {
			const texRaw = document.getText();
			// const pdfBufferReturn = sendToServer(texRaw, document.fileName);

			const pdfPath = path.join(context.extensionPath, 'lib', 'download.pdf');

			const panel = vscode.window.createWebviewPanel(
				'pdfPreview',
				'PDF Preview',
				vscode.ViewColumn.Two,
				{
					enableScripts: true,
					localResourceRoots: [
						vscode.Uri.joinPath(context.extensionUri, 'lib')
					]
				}
			);

			const webview = panel.webview;

			const pdfJsUri = webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'lib', 'pdf.mjs')
			);

			const workerUri = webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'lib', 'pdf.worker.mjs')
			);

			const htmlUri = webview.asWebviewUri(
				vscode.Uri.joinPath(context.extensionUri, 'lib', 'viewer.html')
			);

			const pdfFileUri = webview.asWebviewUri(
				vscode.Uri.file(pdfPath)
			);


			// Set webview HTML
			panel.webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, pdfFileUri);

			// const pdfPath = path.join(__dirname, 'download.pdf'); // adjust if needed

			vscode.window.showInformationMessage(`${pdfPath}`);


			// const pdfBuffer = fs.readFileSync(pdfPath);
			// fs.writeFileSync(pdfPath, pdfBuffer);
		}
	})

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }


function getWebviewHtml(
	webview: vscode.Webview,
	pdfJsUri: vscode.Uri,
	workerUri: vscode.Uri,
	pdfFileUri: vscode.Uri
) {
	const nonce = getNonce();

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; script-src 'unsafe-inline' ${webview.cspSource};
           style-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource};">

	<style nonce="${nonce}">
	body { margin: 0; padding: 0; }
	canvas { display: block; margin: auto; }
	</style>
    </head>
    <body>
      <canvas id="pdf-canvas"></canvas>
      <script type="module">
        import * as pdfjsLib from '${pdfJsUri}';
        pdfjsLib.GlobalWorkerOptions.workerSrc = '${workerUri}';

        const loadingTask = pdfjsLib.getDocument('${pdfFileUri}');
        loadingTask.promise.then(pdf => {
          pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.getElementById('pdf-canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            page.render({ canvasContext: ctx, viewport });
          });
        });
      </script>
    </body>
    </html>
  `;
}