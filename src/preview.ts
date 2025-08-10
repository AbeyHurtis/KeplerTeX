import * as vscode from 'vscode'; 
import * as path from 'path'; 


function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}


export function renderPreview(context: vscode.ExtensionContext){
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

    const pdfPath = path.join(context.extensionPath, 'lib', 'tm2.pdf');
			

    const webview = panel.webview;
    
                const pdfJsUri = webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'lib/pdfjs', 'pdf.mjs')
                );
    
                const workerUri = webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'lib/pdfjs', 'pdf.worker.mjs')
                );
    
                const pdfFileUri = webview.asWebviewUri(
                    vscode.Uri.file(pdfPath)
                );
                
                const renderScriptUri = webview.asWebviewUri( 
                    vscode.Uri.joinPath( context.extensionUri, 'lib/renderjs', 'render.js')
                );
    
                // Set webview HTML
                panel.webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, pdfFileUri, renderScriptUri);
    
}


function getWebviewHtml(
	webview: vscode.Webview,
	pdfJsUri: vscode.Uri,
	workerUri: vscode.Uri,
	pdfFileUri: vscode.Uri,
    renderUri: vscode.Uri
) {
	const nonce = getNonce();

	return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
		content="default-src 'none';
		connect-src ${webview.cspSource};
		script-src 'unsafe-inline' ${webview.cspSource};
		worker-src blob:;
		style-src ${webview.cspSource} 'nonce-${nonce}';
		img-src ${webview.cspSource};
		font-src ${webview.cspSource};
		">

	<style nonce="${nonce}">
	body { margin: 0; padding: 0; }
	canvas { display: block; margin: auto; }
	</style>
    </head>
    <body>
      <script type="module">
        import * as pdfjsLib from '${pdfJsUri}';
        window.pdfJsUri='${pdfJsUri}';
        window.workerUri='${workerUri}';
        window.pdfFileUri='${pdfFileUri}';
        </script>

        <script type="module" src="${renderUri}"></script>
    </body>
    </html>
  `;
}