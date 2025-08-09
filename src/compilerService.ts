import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';
import * as vscode from 'vscode';

export async function sendToServer(texRaw: string, fileName: string): Promise<Buffer | undefined> {
    try {
        const form = new FormData();
        const latexStream = Readable.from(texRaw);

        form.append('tex_file', latexStream, {
            filename: fileName || 'manuscript.tex',
            contentType: 'application/x-tex'
        });

        const compileURL = 'https://texlive-latest.onrender.com/compile';
        const response = await fetch(compileURL, {
            method: 'POST',
            body: form as any,
            headers: form.getHeaders()
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
