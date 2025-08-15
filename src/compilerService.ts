import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';
import * as vscode from 'vscode';


export async function sendToServer(context: vscode.ExtensionContext, texRaw: string, fileName: string, onProgress?: (percent: number) => void): Promise<Buffer | undefined> {
    try {
        const token = await context.globalState.get<string>('authToken');
        const form = new FormData();
        const latexStream = Readable.from(texRaw);

        form.append('tex_file', latexStream, {
            filename: fileName || 'manuscript.tex',
            contentType: 'application/x-tex'
        });

        const headers: Record<string, string> = {
            ...form.getHeaders()
        };

        if (token) {
            headers.Authorization = token;
        }


        const compileURL = 'https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws/compile';
        const response = await fetch(compileURL, {
            method: 'POST',
            body: form as any,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            vscode.window.showErrorMessage(`Failed to Compile: ${errorText}`);
            return;
        }

        return await response.buffer();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
    }
}
