
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1;
let zoomScale = 1; 

let pdfDoc = null;
pdfjsLib.getDocument(window.pdfFileUri).promise.then(pdf => {
    pdfDoc = pdf;
    renderView();
});




function renderView() {
    if (!pdfDoc) return null;

    document.body.innerHTML = '';
    const numberOfPages = pdfDoc.numPages;

    //get device pixel ration 
    // helps to get sharper rendering 
    const outputPixelRatio = window.devicePixelRatio || 1;


    //get available width in webview panel 
    // help to determines how wide the pdf should be visually 
    const containerWidth = document.documentElement.clientWidth;

    for (let pageNum = 1; pageNum <= numberOfPages; pageNum++) {

        pdfDoc.getPage(pageNum).then(page => {

            // get viewport for the page without zoom (natural width)
            const unscaledViewport = page.getViewport({ scale: 1 });

            // calculate how much scaling is needed so that it fits the avialable width
            /*
            eg: if a PDF page is 500px (i.e unscaledViewport) and 
            container width is 1000px then widthscale would be 2
            */
            const widthscale = (containerWidth / unscaledViewport.width)*zoomScale;

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
            canvas.style.height = `${viewport.height / outputPixelRatio}px`;
            canvas.style.width = `${viewport.width / outputPixelRatio}px`;

            document.body.appendChild(canvas);

            page.render({ canvasContext: ctx, viewport });
        });
    }
}


window.addEventListener('keydown', (e) => {
    // check if cmd/ctrl is pressed 
    if(e.metaKey || e.ctrlKey){
        e.preventDefault(); 
        if (e.key === '='){
            zoomScale += 0.;
            renderView();  
        }
        else if( e.key === '-'){
            zoomScale -= 0.1;
            renderView();  
        }
    }
})


window.addEventListener('wheel', (e) => {
    // Check for pinch zoom 
    if(e.ctrlKey || e.metaKey) { 
        
        e.preventDefault(); //stop default zoom behaviour
        
        if (e.deltaY < 0) { 
            zoomScale += 0.08; //zoom in 
        } else {
            zoomScale = Math.max(0.2, zoomScale - 0.09); //zoom out
        }
        renderView(); 
    }
}, {passive: false});


window.addEventListener('resize', () => {
    renderView();
});