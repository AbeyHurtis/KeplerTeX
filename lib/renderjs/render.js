
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1; 
const loadingTask = pdfjsLib.getDocument(window.pdfFileUri);


loadingTask.promise.then(pdf => {
    const numberOfPages = pdf.numPages; 
    
    //get device pixel ration 
    // helps to get sharper rendering 
    const outputPixelRatio = window.devicePixelRatio||1;


    //get available width in webview panel 
    // help to determines how wide the pdf should be visually 
    const containerWidth = document.documentElement.clientWidth; 

    for(let pageNum=1; pageNum<=numberOfPages; pageNum++){

        pdf.getPage(pageNum).then(page => {

            // get viewport for the page without zoom (natural width)
            const unscaledViewport = page.getViewport({ scale: 1 });

            // calculate how much scaling is needed so that it fits the avialable width
            /*
            eg: if a PDF page is 500px (i.e unscaledViewport) and 
            container width is 1000px then widthscale would be 2
            */
            const widthscale = containerWidth / unscaledViewport.width;

            // Actual rendering scale widthScale * outputPixelRatio
            // multiplying width scale with device pisxel ration returns a sharper scale
            const viewport = page.getViewport({ scale: widthscale * outputPixelRatio });

            //create new canvas for each page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;


            // Set the CSS display size of the canvas
            // This controls how big it appears in the webview (layout size)
            // Dividing by `outputScale` keeps the display size normal even when rendering at higher resolution
            // Without this, the canvas would look zoomed in and cause horizontal scrolling
            canvas.style.height = `${viewport.height/outputPixelRatio}px`;
            canvas.style.width = `${viewport.width/outputPixelRatio}px`;

            document.body.appendChild(canvas); 

            page.render({ canvasContext: ctx, viewport });
        });
    }
}) ;
