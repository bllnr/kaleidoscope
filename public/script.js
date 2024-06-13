
// UI elements
let topContainer, controlsContainer, colorControlsContainer, symmetryControlsContainer, brushControlsContainer, fileControlsContainer;
let saveButton, clearButton, rainbowButton, randomColorButton, colorIndicator;
let symmetryLabel, brushSizeLabel, brushSizeValueLabel;
let symmetryDropdown;
let brushSizeSlider;

let mouse = {
    x: 0,
    y: 0,
    img: null
};

// parameters for drawing
let symmetry; // Symmetry - number of reflections   
let angle;
let outputColor;
let hue = Math.random() * 360;
let saturation = (Math.random()*80) + 20; // remove colors that look too samey
let lightness = (Math.random()*60) + 35;
let rainbowStatus = 'Inactive';
let colorIndex = 0;
let brushSize = 8;

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

const sketch = (p) => {
    // mouse positions for all users
    let positions = {}; 
    
    // previous mouse positions
    let xPosPrevious = 0;
    let yPosPrevious = 0;

    p.setup = () => { 
        const containerPos = sketchContainer.getBoundingClientRect();
        const canvas = p.createCanvas(containerPos.width*0.75, containerPos.width*0.75);
        canvas.id('canvas');

        p.angleMode(p.DEGREES);
        p.colorMode(p.HSL);
        p.background(60, 3, 97);
    
        setupUI();
    
        prepareColorScales();
        setRandomColor();

        // send shared color data to all users
        updateSharedDataColor(hue, saturation, lightness);

        p.frameRate(30); // framerate same as the server

        socket.on("sharedDataColor", (data) => {
            // get the data from the server to continually update the color
            //console.log("colors", hue, saturation, lightness);
            //console.log("data", data.hue, data.saturation, data.lightness);
            hue = data.hue;
            saturation = data.saturation;
            lightness = data.lightness;
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

        // Throttle updates when the window is not visible
        let updateInterval;
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log("Document hidden")
                clearInterval(updateInterval);
            } else {
                console.log("Document visible")
                updateInterval = setInterval(() => {
                    socket.emit("requestSharedDataColor");
                }, 1000 / 30);
            }
        });

        // Start sending updates immediately if the window is visible
        if (!document.hidden) {
            console.log("Document visible 2")
            updateInterval = setInterval(() => {
                socket.emit("requestSharedDataColor");
            }, 1000 / 30);
        }

        function setupUI() {
            topContainer = p.createDiv();
            topContainer.id('topContainer');

            controlsContainer = p.createDiv();
            controlsContainer.id('controlsContainer');

            colorControlsContainer = p.createDiv();
            colorControlsContainer.id('colorControlsContainer');

            symmetryControlsContainer = p.createDiv();
            symmetryControlsContainer.id('symmetryControlsContainer');

            brushControlsContainer = p.createDiv();
            brushControlsContainer.id('brushControlsContainer');

            fileControlsContainer = p.createDiv();
            fileControlsContainer.id('fileControlsContainer');

            saveButton = p.createButton('Save');
            saveButton.mousePressed(saveFile);

            clearButton = p.createButton('Clear Drawing');
            clearButton.mousePressed(clearScreen);

            rainbowButton = p.createButton('Rainbow Mode');
            rainbowButton.mousePressed(toggleRainbowMode);
            rainbowButton.id('rainbowButton');

            colorIndicator = p.createDiv();
            colorIndicator.class('colorIndicator');

            randomColorButton = p.createButton('Random Color');
            randomColorButton.mousePressed(setRandomColor);
            randomColorButton.id('randomColorButton');

            // Dropdown for degrees of symmetry
            symmetryLabel = p.createSpan('Symmetry: ');
            symmetryDropdown = p.createSelect('Symmetry');
            symmetryDropdown.option(6);
            symmetryDropdown.option(8);
            symmetryDropdown.option(12);
            symmetryDropdown.option(20);

            // Set default value for dropdown
            symmetryDropdown.selected(symmetry);
            symmetryDropdown.changed(updateSharedDataSymmetry);

            // The slider controls the thickness of the brush
            brushSizeLabel = p.createSpan('Brush Size');
            sizeSlider = p.createSlider(1, 32, brushSize, 1);
            sizeSlider.changed(updateSharedDataBrushSize);

            // Label which shows the current value of slider
            brushSizeValueLabel = p.createSpan('');
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
      p.save('kaleidoscope.png');
    }
    
    // Clear Screen function
    function clearScreen() {
        p.background(60, 3, 97)
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
    p.draw = () => {
        
        

        // move the coordinate system origin to the center of the canvas
        centerPointX = p.width / 2;
        centerPointY = p.height / 2;
        p.translate(centerPointX, centerPointY);

        //update mouse positions at every frame
        socket.emit("updatePosition", {
            x: p.mouseX - p.width / 2, // always send relative number of position between 0 and 1
            y: p.mouseY - p.height/ 2, //so the positions are the relatively the same on different screen sizes.
            px: xPosPrevious,
            py: yPosPrevious,
            isPressed: p.mouseIsPressed
        });
        xPosPrevious = p.mouseX - p.width / 2; 
        yPosPrevious = p.mouseY - p.height / 2;

        if(rainbowStatus != 'Inactive'){
            determineRainbowOutput();

            // Send data to server
            updateSharedDataColor(hue, saturation, lightness);
        };

        //for every position (each user)
        for (const id in positions) {
            const position = positions[id];
        

            // update the brush size slider label
            brushSizeValueLabel.html(sizeSlider.value());
        
            // update symmetry to current value of dropdown
            symmetry = symmetryDropdown.selected();
            
            // check that the mouse is inside the canvas, and that the mouse was also previously on the canvas
            //console.log(position.x, position.y, position.px, position.py);
            if (position.x > 0 && position.x < p.width && position.y > 0 && position.y < p.height &&
                position.px > 0 && position.px < p.width && position.py > 0 && position.py < p.height) {

                if(position.isPressed) {
                    angle = 360 / symmetry;
                    for (let i = 0; i < symmetry; i++) {
                        p.rotate(angle); //rotate the coordinate system based on chosen symmetry
        
                        p.strokeWeight(sizeSlider.value());
                        
                        // request the color to keep drawings in sync on color
                        //socket.emit("requestSharedDataColor");
                        
                        //console.log("stroke", id, hue, saturation, lightness);
                        p.stroke(hue, saturation, lightness);
                        
                        // draw line
                        p.line(position.x, position.y, position.px, position.py);
        
                        p.push(); // begin a drawing group
                        p.scale(1, -1); //scale the coordinate system (mirror along the y-axis)
                        p.line(position.x, position.y, position.px, position.py); // draw in the mirrored coordinate sytem
                        p.pop(); //end drawing group
                    };
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
