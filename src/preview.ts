import * as vscode from 'vscode';
import * as path from 'path';


let panel: vscode.WebviewPanel | undefined;

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


export function renderPreview(context: vscode.ExtensionContext,pdfBuffer?: Uint8Array | Buffer) {
    if (!panel) {

        panel = vscode.window.createWebviewPanel(
            'pdfPreview',
            'PDF Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'lib')
                ]
            }
        );

        panel.onDidDispose(() => {
            panel = undefined;
        })
    }


    // const pdfPath = path.join(context.extensionPath, 'lib', 'tm2.pdf');

    const webview = panel.webview;

    const pdfJsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/pdfjs', 'pdf.mjs')
    );

    const workerUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/pdfjs', 'pdf.worker.mjs')
    );

    // const pdfFileUri = webview.asWebviewUri(
    //     vscode.Uri.file(pdfPath)
    // );

    const renderScriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/renderjs', 'render.js')
    );

    const renderCSSUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/renderjs', 'render.css')
    );

    // Set webview HTML
    // webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, pdfFileUri, renderScriptUri, renderCSSUri);
    webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, renderScriptUri, renderCSSUri);

    if (pdfBuffer) {
        console.log("Pdf Buffer check")
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
        panel.webview.postMessage({type: 'pdfData', data: base64Pdf});
    }

}


function getWebviewHtml(
    webview: vscode.Webview,
    pdfJsUri: vscode.Uri,
    workerUri: vscode.Uri,
    // pdfFileUri: vscode.Uri,
    renderUri: vscode.Uri,
    renderCSSUri: vscode.Uri
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

	<style nonce="${nonce}" src='${renderCSSUri}'>
	</style>
    </head>
        <body>
            <script type="module">
                import * as pdfjsLib from '${pdfJsUri}';
                window.pdfJsUri='${pdfJsUri}';
                window.workerUri='${workerUri}';
            </script>

            <script type="module" src="${renderUri}"></script>
            <button>
        </body>
    </html>
  `;
}