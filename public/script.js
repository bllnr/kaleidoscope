
// UI elements
let topContainer, controlsContainer, colorControlsContainer, symmetryControlsContainer, brushControlsContainer, fileControlsContainer;
let saveButton, clearButton, rainbowButton, randomColorButton, colorIndicator;
let symmetryLabel, brushSizeLabel, brushSizeValueLabel;
let symmetryDropdown;
let brushSizeSlider;

let hasFocusHistory;

let mouse = {
    x: 0,
    y: 0,
    img: null
};

// parameters for drawing
let canvasWidth;
let canvasHeight;
let symmetry; // Symmetry - number of reflections   
let angle;
let outputColor;
let hue;
let saturation; // remove colors that look too samey
let lightness;
let rainbowStatus = 'Inactive';
let colorIndex = 0;
let brushSize = 8;
let pg;

// color gradients
let scaleTrueRainbow;
let trueRainbowColors;
let trueRainbowColorsFull;
let scaleCloud;
let cloudColors;
let cloudColorsFull;
let scaleStrawberryDream;
let berryDreamColors;
let berryDreamColorsFull;
let scaleMystic;
let mysticColors;
let mysticColorsFull;

const root = document.documentElement;
const sketchContainer = document.getElementById("sketch-container");

//get socket which only uses websockets as a means of communication
const socket = io({
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5
});

const sketch = (p5) => {
    // mouse positions for all users
    let positions = {}; 
    
    // previous mouse positions
    let xPosPrevious = 0;
    let yPosPrevious = 0;

    p5.setup = () => { 
        const containerPos = sketchContainer.getBoundingClientRect();
        canvasWidth = Math.min(containerPos.width, containerPos.height)*0.75;
        canvasHeight = canvasWidth;
        const canvas = p5.createCanvas(canvasWidth, canvasHeight);
        canvas.id('canvas');

        p5.angleMode(p5.DEGREES);
        p5.colorMode(p5.HSL);
        p5.background(60, 3, 97);
        p5.frameRate(60); // framerate same as the server
    
        setupUI(); // UI elements
        prepareColorScales(); //gradients

        socket.on("sharedDataColor", (data) => {
            // get the data from the server to continually update the color
            //console.log('sharedDataColor', data.hue, data.saturation, data.lightness);
            hue = data.hue;
            saturation = data.saturation;
            lightness = data.lightness;

            //only run at the first session connected
            if(hue == 0 && saturation == 0 && lightness == 0){
                console.log('initiate color')
                setRandomColor();
            }
        });

        socket.on("sharedDataRainbowStatus", (data) => {
            // get the data from the server to continually update the rainbowStatus
            // also update the color indicator and rainbowButton text
            rainbowStatus = data.rainbowStatus;
            if(rainbowStatus != 'Inactive'){
                changeColorIndicatorRainbow();
            } else {
                changeColorIndicatorRandom();
            }
            changeRainbowButtonText();
        });

        socket.on("positions", (data) => {
            // get the data from the server to continually update the positions
            positions = data;
        });

        socket.on("sharedDataBrushSize", (data) => {
            brushSize = data.brushSize;
            sizeSlider.value(brushSize);
        });

        socket.on("sharedDataSymmetry", (data) => {
            symmetry = data.symmetry;
            symmetryDropdown.selected(symmetry);
        });

        window.addEventListener("resize", () => {
            console.log("Window size changed");
        });

        function checkWindowFocus(){
            //console.log(document.hasFocus())
            if (document.hasFocus() && hasFocusHistory) {
                //console.log('✅ window has focus');
              } 
            else if(document.hasFocus() && hasFocusHistory == false) {
                //console.log("♻️ regained focus")
                hasFocusHistory = true;
              }
            else if(document.hasFocus() && hasFocusHistory == undefined) {
                //console.log("➕ new session, window has focus")
                hasFocusHistory = true;
              }
            else if(!document.hasFocus()){
                //console.log('⛔️ window does NOT have focus');
                hasFocusHistory = false;
            }
        }

        setInterval(checkWindowFocus, 1500);

        function setupUI() {
            topContainer = p5.createDiv();
            topContainer.id('topContainer');

            controlsContainer = p5.createDiv();
            controlsContainer.id('controlsContainer');

            colorControlsContainer = p5.createDiv();
            colorControlsContainer.id('colorControlsContainer');

            symmetryControlsContainer = p5.createDiv();
            symmetryControlsContainer.id('symmetryControlsContainer');

            brushControlsContainer = p5.createDiv();
            brushControlsContainer.id('brushControlsContainer');

            fileControlsContainer = p5.createDiv();
            fileControlsContainer.id('fileControlsContainer');

            saveButton = p5.createButton('Save');
            saveButton.mousePressed(saveFile);

            clearButton = p5.createButton('Clear Drawing');
            clearButton.mousePressed(clearScreen);

            rainbowButton = p5.createButton('Rainbow Mode');
            rainbowButton.mousePressed(toggleRainbowMode);
            rainbowButton.id('rainbowButton');

            colorIndicator = p5.createDiv();
            colorIndicator.class('colorIndicator');

            randomColorButton = p5.createButton('Random Color');
            randomColorButton.mousePressed(setRandomColor);
            randomColorButton.id('randomColorButton');

            // Dropdown for degrees of symmetry
            symmetryLabel = p5.createSpan('Symmetry: ');
            symmetryDropdown = p5.createSelect('Symmetry');
            symmetryDropdown.option(6);
            symmetryDropdown.option(8);
            symmetryDropdown.option(12);
            symmetryDropdown.option(20);

            // Set default value for dropdown
            symmetryDropdown.selected(20);
            symmetryDropdown.changed(updateSharedDataSymmetry); //event listener

            // The slider controls the thickness of the brush
            brushSizeLabel = p5.createSpan('Brush Size');
            sizeSlider = p5.createSlider(1, 32, brushSize, 1);
            sizeSlider.changed(updateSharedDataBrushSize); //event listener

            // Label which shows the current value of slider
            brushSizeValueLabel = p5.createSpan('');
            brushSizeValueLabel.id('brushSizeValueLabel');
            brushSizeValueLabel.html(sizeSlider.value());

            // Child elements of topContainer
            canvas.parent('topContainer');
            controlsContainer.parent('topContainer');

            // Child elements of controlsContainer
            colorControlsContainer.parent('controlsContainer');
            symmetryControlsContainer.parent('controlsContainer');
            brushControlsContainer.parent('controlsContainer');
            fileControlsContainer.parent('controlsContainer');

            rainbowButton.parent('colorControlsContainer');
            colorIndicator.parent('colorControlsContainer');
            randomColorButton.parent('colorControlsContainer');
            symmetryLabel.parent('symmetryControlsContainer');
            symmetryDropdown.parent('symmetryControlsContainer');
            brushSizeLabel.parent('brushControlsContainer');
            sizeSlider.parent('brushControlsContainer');
            brushSizeValueLabel.parent('brushControlsContainer');
            saveButton.parent('fileControlsContainer');
            clearButton.parent('fileControlsContainer');
        }
    };
    
    function prepareColorScales() {
        scaleTrueRainbow = chroma.scale([
            chroma.hsl(0, 1, 0.7), 
            chroma.hsl(90, 1, 0.7), 
            chroma.hsl(180, 1, 0.7), 
            chroma.hsl(270, 1, 0.7), 
            chroma.hsl(360, 1, 0.7)]);
        trueRainbowColors = scaleTrueRainbow.colors(8); // array of colors from scale, for button
        trueRainbowColorsFull = scaleTrueRainbow.colors(360); // array of colors from scale, for output on canvas
    
        scaleCloud = chroma.scale([
            chroma.hsl(240, 0.76, 0.8), 
            chroma.hsl(209, 0.65, 0.8), 
            chroma.hsl(191, 0.55, 0.9), 
            chroma.hsl(267, 0.6, 0.9), 
            chroma.hsl(275, 0.79, 0.9), 
            chroma.hsl(260, 0.79, 0.8), 
            chroma.hsl(240, 0.76, 0.8)]);
        cloudColors = scaleCloud.colors(8);
        cloudColorsFull = scaleCloud.colors(360); 
    
        scaleStrawberryDream = chroma.scale([
            chroma.hsl(348, 0.85, 0.6), 
            chroma.hsl(346, 0.9, 0.7), 
            chroma.hsl(336, 0.9, 0.8), 
            chroma.hsl(318, 0.95, 0.9), 
            chroma.hsl(333, 0.8, 0.9), 
            chroma.hsl(20, 0.6, 0.91), 
            chroma.hsl(55, 0.45, 0.9), 
            chroma.hsl(94, 0.55, 0.86), 
            chroma.hsl(346, 0.9, 0.7), 
            chroma.hsl(348, 0.85, 0.6)
        ]);
        berryDreamColors = scaleStrawberryDream.colors(8);
        berryDreamColorsFull = scaleStrawberryDream.colors(360);
    
        scaleMystic = chroma.scale([
            chroma.hsl(308, 0.50, 0.3), 
            chroma.hsl(312, 0.7, 0.1), 
            chroma.hsl(306, 0.6, 0.4), 
            chroma.hsl(292, 0.65, 0.4), 
            chroma.hsl(265, 0.8, 0.3), 
            chroma.hsl(232, 0.7, 0.25), 
            chroma.hsl(205, 0.9, 0.1)]);
        mysticColors = scaleMystic.colors(8);
        mysticColorsFull = scaleMystic.colors(360);
    }
    
    // Save File Function
    function saveFile() {
      p5.save('kaleidoscope.png');
    }
    
    // Clear Screen function
    function clearScreen() {
        p5.background(60, 3, 97)
    }
    
    function toggleRainbowMode(){
        switch(rainbowStatus){
            case 'Inactive':
                rainbowStatus = 'True Rainbow';
                break;
            case 'True Rainbow':
                rainbowStatus = 'Soft Clouds';
                break;
            case 'Soft Clouds':
                rainbowStatus = 'Berry Dream';
                break;
            case 'Berry Dream':
                rainbowStatus = 'Mystic Night';
                break;
            case 'Mystic Night':
                rainbowStatus = 'True Rainbow';
                break;
        }
        updateSharedDataRainbowStatus(rainbowStatus);
        //changeColorIndicatorRainbow();
        //changeRainbowButtonText(rainbowStatus);
    }
    
    function changeRainbowButtonText(){
        if(rainbowStatus != 'Inactive'){
            rainbowButton.html(rainbowStatus);
        }
        else {
            rainbowButton.html('Rainbow Mode');
        }
    }

    function changeColorIndicatorRainbow(){
        colorIndicator.id('colorIndicatorRainbow');

        //set gradient background on colorIndicator
        switch(rainbowStatus){
            case 'True Rainbow':
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, trueRainbowColors[i]);
                }
                break;
            case 'Soft Clouds':
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, cloudColors[i]);
                }
                break;
            case 'Berry Dream':
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, berryDreamColors[i]);
                }    
                break;
            case 'Mystic Night':
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, mysticColors[i]);
                }
                break;
        }
    }

    function setRandomColor(){
        rainbowStatus = 'Inactive';
        updateSharedDataRainbowStatus(rainbowStatus);

        hue = Math.random()*360;
        saturation = (Math.random()*80) + 20; // remove colors that look too samey
        lightness = (Math.random()*60) + 35;

        updateSharedDataColor(hue, saturation, lightness);
    }

    function changeColorIndicatorRandom(){
        colorIndicator.id('colorIndicatorRandom');

        root.style.setProperty('--random-btn-hue', hue);
        root.style.setProperty('--random-btn-saturation', saturation + "%");
        root.style.setProperty('--random-btn-lightness', lightness + "%");
    }
    
    //runs at every frame
    p5.draw = () => {

        //request the color to keep drawings in sync on color
        //socket.emit("requestSharedDataColor");
        
        // move the coordinate system origin to the center of the canvas
        console.log('width', Math.round(canvasWidth), Math.round(p5.width), 'height', Math.round(canvasHeight), Math.round(p5.height));
        centerPointX = p5.width / 2;
        centerPointY = p5.height / 2;
        p5.translate(centerPointX, centerPointY);

        //scale so that the drawings are relatively the same size for different windows
        p5.scale(p5.width/500, p5.height/500);

        //update mouse positions at every frame
        socket.emit("updatePosition", {
            x: p5.mouseX - p5.width / 2, // always send relative number of position between 0 and 1
            y: p5.mouseY - p5.height/ 2, //so the positions are the relatively the same on different screen sizes.
            px: xPosPrevious,
            py: yPosPrevious,
            isPressed: p5.mouseIsPressed
        });
        xPosPrevious = p5.mouseX - p5.width / 2; 
        yPosPrevious = p5.mouseY - p5.height / 2;

        if(rainbowStatus != 'Inactive'){
            determineRainbowOutput();
        };

        //for every position (each user)
        for (const id in positions) {
            const position = positions[id];

            // update the brush size slider label
            brushSizeValueLabel.html(brushSize);
        
            // update symmetry to current value of dropdown
            symmetry = symmetryDropdown.selected();
            
            // check that the mouse is inside the canvas, and that the mouse was also previously on the canvas
            //console.log(position.x, position.y, position.px, position.py);
            if (position.isPressed && position.x > -p5.width && position.x < p5.width && position.y > -p5.height && position.y < p5.height &&
                position.px > -p5.width && position.px < p5.width && position.py > -p5.height && position.py < p5.height) {

                angle = 360 / symmetry;
                for (let i = 0; i < symmetry; i++) {
                    p5.rotate(angle); //rotate the coordinate system based on chosen symmetry
    
                    p5.strokeWeight(brushSize);
                    
                    //console.log("stroke", id, hue, saturation, lightness);
                    p5.stroke(hue, saturation, lightness);
                    // Send data to server
                    updateSharedDataColor(hue, saturation, lightness);
                    
                    // draw line
                    p5.line(position.x, position.y, position.px, position.py);
    
                    p5.push(); // begin a drawing group
                    p5.scale(1, -1); //scale the coordinate system (mirror along the y-axis)
                    p5.line(position.x, position.y, position.px, position.py); // draw in the mirrored coordinate sytem
                    p5.pop(); //end drawing group
                };
            };
        };   
    };
};

// initialize the sketch
new p5(sketch, sketchContainer);

function determineRainbowOutput() {
    // determine output colors for rainbow mode
    // update shared data with hue, sat, lightness
    colorIndex = (colorIndex + 1) % 359; // to step over colors in gradient
    switch (rainbowStatus) {
        case 'True Rainbow':
            outputColor = chroma(trueRainbowColorsFull[colorIndex]).hsl();
            hue = Math.floor(outputColor[0]);
            saturation = outputColor[1].toFixed(2) * 100; // because chroma.js has sat & lightness as floats, we need int 1-100 for p5.js
            lightness = outputColor[2].toFixed(2) * 100;
            break;
        case 'Soft Clouds':
            outputColor = chroma(cloudColorsFull[colorIndex]).hsl();
            hue = Math.floor(outputColor[0]);
            saturation = outputColor[1].toFixed(2) * 100;
            lightness = outputColor[2].toFixed(2) * 100;
            break;
        case 'Berry Dream':
            outputColor = chroma(berryDreamColorsFull[colorIndex]).hsl();
            hue = Math.floor(outputColor[0]);
            saturation = outputColor[1].toFixed(2) * 100;
            lightness = outputColor[2].toFixed(2) * 100;
            break;
        case 'Mystic Night':
            outputColor = chroma(mysticColorsFull[colorIndex]).hsl();
            hue = Math.floor(outputColor[0]);
            saturation = outputColor[1].toFixed(2) * 100;
            lightness = outputColor[2].toFixed(2) * 100;
            break;
    }
}

function updateSharedDataColor(currentHue, currentSaturation, currentLightness) {
    socket.emit("updateSharedDataColor", {
        hue: currentHue,
        saturation: currentSaturation,
        lightness: currentLightness
    });
};

function updateSharedDataRainbowStatus(currentRainbowStatus) {
    socket.emit("updateSharedDataRainbowStatus", {
        rainbowStatus: currentRainbowStatus,
    });
};

function updateSharedDataSymmetry(){
    socket.emit("updateSharedDataSymmetry", {
        sharedDataSymmetry: symmetryDropdown.selected(),
    });
};

function updateSharedDataBrushSize(){
    socket.emit("updateSharedDataBrushSize", {
        sharedDataBrushSize: sizeSlider.value(),
    });
};
