
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1.5; 
const loadingTask = pdfjsLib.getDocument(window.pdfFileUri);

loadingTask.promise.then(pdf => {
    const numberOfPages = pdf.numPages; 
    for(let pageNum=1; pageNum<=numberOfPages; pageNum++){
        console.log(pageNum); 
        pdf.getPage(pageNum).then(page => {

            const viewport = page.getViewport({ scale });

            //create new canvas for each page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            document.body.appendChild(canvas); 

            page.render({ canvasContext: ctx, viewport });
        });
    }
}) ;
