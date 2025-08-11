
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1; 
const loadingTask = pdfjsLib.getDocument(window.pdfFileUri);


loadingTask.promise.then(pdf => {
    const numberOfPages = pdf.numPages; 
    
    //get device pixel ration 
    const outputPixelRation = window.devicePixelRatio||1;

    const containerWidth = document.documentElement.clientWidth; 

    for(let pageNum=1; pageNum<=numberOfPages; pageNum++){

        pdf.getPage(pageNum).then(page => {

            const unscaledViewport = page.getViewport({ scale: 1 });
            const widthscale = containerWidth / unscaledViewport.width;
            const viewport = page.getViewport({ scale: widthscale * outputPixelRation });

            //create new canvas for each page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            canvas.style.height = `${viewport.height/outputPixelRation}px`;
            canvas.style.width = `${viewport.width/outputPixelRation}px`;

            document.body.appendChild(canvas); 

            page.render({ canvasContext: ctx, viewport });
        });
    }
}) ;
