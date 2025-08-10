
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1; 
const loadingTask = pdfjsLib.getDocument(window.pdfFileUri);

loadingTask.promise.then(pdf => {
    const numberOfPages = pdf.numPages; 

    const containerWidth = document.documentElement.clientWidth; 

    for(let pageNum=1; pageNum<=numberOfPages; pageNum++){

        pdf.getPage(pageNum).then(page => {

            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = containerWidth / unscaledViewport.width;
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
