import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


export function renderPreview(context: vscode.ExtensionContext, pdfBuffer?: Uint8Array | Buffer) {
    // Dispose old panel before render. 
    if (panel) {
        try {
            panel.dispose();
        } catch (err) {
            console.error("Error disposing old panel:", err);
        }
        panel = undefined;
    }

    panel = vscode.window.createWebviewPanel(
        'pdfPreview',
        'PDF Preview',
        vscode.ViewColumn.Two,
        {
            enableScripts: true,
            retainContextWhenHidden: false,
            localResourceRoots: [
                vscode.Uri.joinPath(context.extensionUri, 'lib')
            ]
        }
    );

    panel.onDidDispose(() => {
        panel = undefined;
    });

    panel.onDidChangeViewState(e => {
        if (!e.webviewPanel.visible) {
            panel?.webview.postMessage({ type: 'clearZoomScale' });
        }
    });


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

    const downloadIconUri = webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'lib/renderjs', 'dl.png')
    );
    // Set webview HTML
    // webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, pdfFileUri, renderScriptUri, renderCSSUri);
    webview.html = getWebviewHtml(webview, pdfJsUri, workerUri, downloadIconUri, renderScriptUri, renderCSSUri);

    if (pdfBuffer) {
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
        panel.webview.postMessage({ type: 'pdfData', data: base64Pdf });
    }
    // Pause / UnPause compiler
    // let pauseState = false; 
    // webview.onDidReceiveMessage(async message=> {
    //     switch (message.command){
    //         case 'pauseState': 
    //             pauseState = message.data; 

    //             if (pauseState === true){

    //             }
    //     }
    // });

}


// <link rel="stylesheet" type="text/css" href="${renderCSSUri}">
function getWebviewHtml(
    webview: vscode.Webview,
    pdfJsUri: vscode.Uri,
    workerUri: vscode.Uri,
    // pdfFileUri: vscode.Uri,
    downloadIconUri: vscode.Uri,
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

    <link nonce="${nonce}" rel="stylesheet" href="${renderCSSUri}">
	</style>
    </head>
        <body>
            <script type="module">
                import * as pdfjsLib from '${pdfJsUri}';
                window.pdfJsUri='${pdfJsUri}';
                window.workerUri='${workerUri}';
            </script>

            <script type="module" src="${renderUri}"></script>

            <div id="toolbar">
                <div id="pauseIndicator">Pause Compiler</div>
                <div id="pageIndicator">
                    <input type="text" id="currentPageIndicator">
                    <span id="totalPages"></span>
                </div>
                <div  id="downloadButton">
                    <img src="${downloadIconUri}" height=30 width=30>
                </div>
            </div>

            <div id="canvasContainer"></div>
        </body>
    </html>
  `;
}