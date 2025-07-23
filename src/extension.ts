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



async function showPdf(pdfBuffer: Buffer) {

	const tempDir = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri ?? vscode.Uri.file(__dirname), '.vscode', 'latex-cache');
	await vscode.workspace.fs.createDirectory(tempDir);

	const pdfPath = vscode.Uri.joinPath(tempDir, '_tmp.pdf'); 
	await vscode.workspace.fs.writeFile(pdfPath, pdfBuffer)


	// const panel = vscode.window.createWebviewPanel(
	// 	'Preview', 
	// 	'PDF Preview', 
	// 	vscode.ViewColumn.One, 
	// 	{
	// 		enableScripts: true, 
	// 		localResourceRoots: [tempDir],
	// 	}
	// ); 

	// const pdfWebViewUri = panel.webview.asWebviewUri(pdfPath); 

	// panel.webview.html= `
	// 	<!DOCTYPE html>
	// 	<html>
	// 		<body style="margin:0;padding:0">
	// 			<iframe src="${pdfWebViewUri}" style="width:100%; height:100vh;" frameborder="0">
	// 			</iframe>
	// 		</body>
	// 	</html>
	// `

	const panel2 = vscode.window.createWebviewPanel('pdfPreviewDebugger', 
		'Debugging console', 
		vscode.ViewColumn.Two, {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
		}
	);

	
	const testpath = vscode.Uri.file(path.join(__dirname, './download.pdf'));
	
	const htmlPath = path.join(context.extensionPath, 'media', 'viewer.html');
	let html = fs.readFileSync(htmlPath, 'utf8');


	const pdfWebViewUri2 = panel2.webview.asWebviewUri(testpath);

	html = html.replace('{{PDF_URI}}', testpath.toString());

	panel2.webview.html = html;


// 	panel2.webview.html = `
// 	<!DOCTYPE html>
// <html>

// <body style="margin:0;padding:0">
// 	<iframe src="./download.pdf" style="width:100vw; height:100vh;" frameborder="0">
// 	</iframe>
// </body>

// </html>
// 	`

//   const panel = vscode.window.createWebviewPanel(
//     'pdfPreview',
//     'Compiled PDF Preview',
//     vscode.ViewColumn.One,
//     {
//       enableScripts: true
//     }
//   );
//   vscode.window.showInformationMessage(`panel Created ..`)
//   panel.webview.html = getWebviewHtml(base64Uri);
}

// function getWebviewHtml(base64Pdf: string): string {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <body style="margin:0;padding:0;overflow:hidden;">
//       <iframe 
//         src="data:application/pdf;base64,${base64Pdf}"
//         type="application/pdf" 
//         style="width:100%; height:100vh;" 
//         frameborder="0">
//       </iframe>
// 	  Test
//     </body>
//     </html>
//   `;
// }


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

		// const compileURL = process.env.COMPILE_URL;
		const compileURL = 'https://texlive-latest.onrender.com/compile';
		const response = await fetch(compileURL||'', {
			method: 'POST', 
			body: form as any, 
			headers: form.getHeaders()
		})

		// vscode.window.showInformationMessage(`${compileURL}`);
		if(!response.ok){
			const errorText = await response.text(); 
			vscode.window.showErrorMessage("Failed to Compile",errorText);
			return; 
		}

		//read buffer
		const pdfBuffer = await response.buffer();

		// const base64Pdf = pdfBuffer.toString('base64');

		// const dataUri = `data:application/pdf;base64,${base64Pdf}`;

		// vscode.window.showInformationMessage(`${pdfBuffer}`);
		// vscode.window.showInformationMessage(`${base64Pdf}`);
		// vscode.window.showInformationMessage(`${dataUri}`);

		// showPdf(pdfBuffer);

		//Testing saved pdf

		// // Save PDF to temp location and open
		// const tempPath = vscode.Uri.joinPath(
		// 	vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file(require('os').tmpdir()),
		// 	'output.pdf'
		// ).fsPath;

		// require('fs').writeFileSync(tempPath, pdfBuffer);

		// vscode.window.showInformationMessage('PDF compiled successfully!');
		// vscode.env.openExternal(vscode.Uri.file(tempPath));

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
			// sendToServer(texRaw, document.fileName);

			
		const panel2 = vscode.window.createWebviewPanel('pdfPreviewDebugger', 
			'Debugging console', 
			vscode.ViewColumn.Two, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
			}
		);

		
		const testpath = vscode.Uri.file(path.join(__dirname, 'download.pdf'));
		vscode.window.showInformationMessage(`${testpath}`);

		const htmlPath = path.join(context.extensionPath, 'media', 'viewer.html');
		let html = fs.readFileSync(htmlPath, 'utf8');


		const pdfWebViewUri2 = panel2.webview.asWebviewUri(testpath);

		html = html.replace('{{PDF_URI}}', testpath.toString());

		panel2.webview.html = html;

		}
	})

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
