
pdfjsLib.GlobalWorkerOptions.workerSrc = window.workerUri;
const scale = 1;
let pdfDoc = null;
let numberOfPages = null;

//adding consistent zoom accros  reload (i.e compilation)
let zoomScale = parseFloat(localStorage.getItem('zoomScale')) || 1;
let currentBase64 = null;

let pdfWorker = null;

async function resetPdfWorker() {
    if (pdfDoc) {
        await pdfDoc.destroy(); // frees page resources
        pdfDoc = null;
    }

    if (pdfWorker) {
        await pdfWorker.destroy(); // frees worker thread
        pdfWorker = null;
    }

    // Create a new worker explicitly
    pdfWorker = new pdfjsLib.PDFWorker({ name: "keplertex-worker" });
}

function saveZoomScale() {
    localStorage.setItem('zoomScale', zoomScale);
}


window.addEventListener('message', event => {
    const message = event.data; 
    if(message.type === 'pdfData'){
        const base64 = message.data; 
        currentBase64 = base64; 

        // resetPdfWorker();

        const pdfData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        pdfjsLib.getDocument({ data: pdfData}).promise.then(pdf => {
            pdfDoc = pdf;
            numberOfPages = pdfDoc.numPages; 
            renderView();
        });
    }
});

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
});

const pinchZoomScale = 0.05;
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

const pauseIndicator = document.getElementById('pauseIndicator'); 
let pauseState = false; 

pauseIndicator.addEventListener('click', () => {
    if (pauseState === true) {
        pauseIndicator.classList.add('active');
        pauseIndicator.textContent = "Compiler Paused";
    } else if (pauseState === false) {
        pauseIndicator.classList.remove('active');
        pauseIndicator.textContent = "Pause Compiler";
    }
    // console.log("Pause State : ", pauseState);
    pauseState=!pauseState; 
});


window.addEventListener('message', event => {
    const message = event.data; 

    if(message.type === 'clearZoomScale'){
        localStorage.removeItem('zoomScale');
    }
});


document.getElementById('downloadButton').addEventListener('click', () => {
    if (!currentBase64){ return; };
    const linkSource = `data:application/pdf;base64,${currentBase64}`;
    const downloadLink = document.createElement("a");
    const fileName = "keplertex-output.pdf";
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
    URL.revokeObjectURL(linkSource); 
});



const totalPages = document.getElementById("totalPages");

function renderView() {
    if (!pdfDoc) {return null;};
    // document.body.innerHTML = '<button id="downloadButton" style="z-index:100;position:absolute;left:0;top:0;color:#000000;">Download</button>'; 
    
    const container = document.getElementById("canvasContainer");
    container.innerHTML = ''; 

    totalPages.textContent = `/ ${numberOfPages}`;

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
            canvas.classList.add("page");
            canvas.setAttribute("data-page", pageNum);

            const ctx = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;


            // Set the CSS display size of the canvas
            // This controls how big it appears in the webview (layout size)
            // Dividing by `outputScale` keeps the display size normal even when rendering at higher resolution
            // Without this, the canvas would look zoomed in and cause horizontal scrolling
            canvas.style.height = `${viewport.height / outputPixelRatio}px`;
            canvas.style.width = `${viewport.width / outputPixelRatio}px`;

            container.appendChild(canvas);

            page.render({ canvasContext: ctx, viewport });
        });
    }
}




// Page Number View
const canvasContainer = document.getElementById("canvasContainer");
const currentPageIndicator = document.getElementById("currentPageIndicator");

currentPageIndicator.placeholder = 1; 
canvasContainer.addEventListener("scroll", ()=> {
    
    const pages = document.querySelectorAll(".page");
    // let scrollTop = canvasContainer.scrollTop;
    let currentPage = 1;
    
    pages.forEach((page, index) => {
        const rect = page.getBoundingClientRect(); 
        const viewerPort = canvasContainer.getBoundingClientRect();
        if (rect.top >= viewerPort.top && rect.top < viewerPort.bottom ){
            currentPage = index + 1;
            currentPageIndicator.placeholder = currentPage; 
        } 
    });
});



function updatePageFromInput() {
    const value = parseInt(currentPageIndicator.value, 10);
    if (!pdfDoc || isNaN(value)){ return;};

    if( (value > numberOfPages) || (value < 1)){
        currentPageIndicator.placeholder = currentPageIndicator.placeholder;
        currentPageIndicator.value = currentPageIndicator.placeholder;
        return;
    }

    const pageNum = Math.min(Math.max(value, 1), numberOfPages); // clamp 1..total

    // Update placeholder
    currentPageIndicator.placeholder = pageNum;

    // Clear the input field so only placeholder shows
    currentPageIndicator.value = "";

    // Scroll to that page
    const targetCanvas = document.querySelector(`.page[data-page="${pageNum}"]`);
    if (targetCanvas) {
        targetCanvas.scrollIntoView({ behavior: "smooth" });
    }
}

currentPageIndicator.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        updatePageFromInput();
    }
});

currentPageIndicator.addEventListener("blur", () => {
    if (currentPageIndicator.value.trim() !== "") {
        updatePageFromInput();
    }
});