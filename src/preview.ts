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


export function previewRender(context: vscode.ExtensionContext){
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
    
                const htmlUri = webview.asWebviewUri(
                    vscode.Uri.joinPath(context.extensionUri, 'lib', 'viewer.html')
                );
    
                const pdfFileUri = webview.asWebviewUri(
                    vscode.Uri.file(pdfPath)
                );
    
    
                // Set webview HTML
                panel.webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, pdfFileUri);
    
}


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