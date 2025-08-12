
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1;
let pdfDoc = null;

//adding consistent zoom accros  reload (i.e compilation)
let zoomScale = parseFloat(localStorage.getItem('zoomScale')) || 1;

function saveZoomScale() {
    localStorage.setItem('zoomScale', zoomScale);
}


window.addEventListener('message', event => {
    const message = event.data; 
    if(message.type === 'pdfData'){
        const base64 = message.data; 
        const pdfData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        pdfjsLib.getDocument({ data: pdfData}).promise.then(pdf => {
            pdfDoc = pdf;
            renderView();
        });
    }
})


let keyboardZoomScale = 0.5; 
window.addEventListener('keydown', (e) => {
    // check if cmd/ctrl is pressed 
    if((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '-')){

        if(document.hasFocus()){
            
            e.preventDefault();
            if (e.key === '='){
                zoomScale += keyboardZoomScale;
                renderView();  
            }
            else if( e.key === '-'){
                zoomScale -= keyboardZoomScale;
                renderView();  
            }
            saveZoomScale();
        }
    }
})

const pinchZoomScale = 0.08;
window.addEventListener('wheel', (e) => {
    // Check for pinch zoom 
    if(e.ctrlKey || e.metaKey) { 
        
        e.preventDefault(); //stop default zoom behaviour
        
        if (e.deltaY < 0) { 
            zoomScale += pinchZoomScale; //zoom in 
        } else {
            zoomScale = Math.max(0.2, zoomScale - pinchZoomScale); //zoom out
        }
        saveZoomScale();
        renderView(); 
    }
}, {passive: false});


window.addEventListener('resize', () => {
    renderView();
});

window.addEventListener('message', event => {
    const message = event.data; 
    console.log("storage clear")
    if(message.type === 'clearZoomScale'){
        console.log("message")
        localStorage.removeItem('zoomScale');
    }
})


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
