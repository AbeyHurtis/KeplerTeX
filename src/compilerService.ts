import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';
import * as vscode from 'vscode';



// function getBibFilesFromText(texRaw: string): string[] {
//     const bibFiles: string[] = [];

//     // Check source with \bibliography{} 
//     const bibRegex = /^(?!\s*%).*\\bibliography\{([^}]+)\}/gm;
//     const bibMatch = texRaw.match(bibRegex);
//     if (bibMatch) {
//         const files = bibMatch[1].split(',').map(f => f.trim());
//         bibFiles.push(...files.map(f => f.endsWith('.bib') ? f : `${f}.bib`));
//     }
    
//     //check source with \addbibresource{}
//     // const addBibMatch = texRaw.matchAll(/\\addbibresource\{([^}]+)\}/g); 
//     // console.log("add bib match : ",addBibMatch);
//     // if(addBibMatch){
//     //     vscode.window.showWarningMessage("Please replace \\addbibresource with \\bibliograph, biber support not supported yet");
//     //     return [];
//     // }
//     // for (const match of addBibMatch) {
//     //     bibFiles.push(match[1].trim());
//     // }

//     return bibFiles; 
// }

function getBibFilesFromText(texRaw: string): string[] {
    const bibFiles: string[] = [];

    // Match \bibliography{file1,file2}
    const bibRegex = /\\bibliography\{([^}]+)\}/g;
    let match: RegExpExecArray | null;

    while ((match = bibRegex.exec(texRaw)) !== null) {
        const files = match[1].split(',').map(f => f.trim());
        bibFiles.push(...files.map(f => f.endsWith('.bib') ? f : `${f}.bib`));
    }
    return bibFiles;
}



export async function sendToServer(context: vscode.ExtensionContext, texRaw: string, fileName: string, onProgress?: (percent: number) => void): Promise<Buffer | undefined> {
    try {
        // Remove commented lines from tex files 
        texRaw = texRaw.split("\n").filter(line => !line.trim().startsWith("%")).join("\n");

        const tokenObject = await context.globalState.get<any>('authToken');
        const token = typeof tokenObject === 'string' ? tokenObject : tokenObject?.S;
        
        const form = new FormData();

        const bibFiles = getBibFilesFromText(texRaw);


        if(bibFiles.length > 0){

            const dir = path.dirname(fileName);
            for(const bibMatch of bibFiles){
                try{
                    const bibPath = path.resolve(dir, bibMatch);
                    if (!fs.existsSync(bibPath)) {
                        vscode.window.showWarningMessage(`Bib file not found: ${bibMatch}`);
                        continue;
                    }

                    const bibStream = fs.createReadStream(bibPath);
                    form.append('bib_files', bibStream, {
                        filename: bibMatch,
                        contentType: 'application/x-bib'
                    });
                }
                catch(err) {
                    vscode.window.showWarningMessage(`${err}: Please make sure all **.bib** files are present in same directory and the names are matching`);
                }
            }
        }
        const latexStream = Readable.from(texRaw);

        form.append('tex_file', latexStream, {
            filename: fileName || 'manuscript.tex',
            contentType: 'application/x-tex'
        });

        const headers: Record<string, string> = {
            ...form.getHeaders()
        };

        if (token) {
            headers.Authorization = token.toString();
        }

        const compileURL = 'https://jnlyosvinbj4ebypmosfqgdvha0fkhzo.lambda-url.us-east-2.on.aws/compile';
        const response = await fetch(compileURL, {
            method: 'POST',
            body: form as any,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            if(response.status === 429){
                vscode.window.showInformationMessage(`Daily Limit exceeded, Please upgraded to a Pro Account. Thank you!`);
            }
            else{
                vscode.window.showErrorMessage(`Failed to Compile: ${errorText}`);
            }
            return;
        }

        return await response.buffer();
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to connect: ${error.message}`);
    }
}