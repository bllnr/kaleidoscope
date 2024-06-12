
// UI elements
let topContainer, controlsContainer, colorControlsContainer, symmetryControlsContainer, brushControlsContainer, fileControlsContainer;
let saveButton, clearButton, rainbowButton, randomColorButton, colorIndicator;
let symmetryLabel, brushSizeLabel, brushSizeValueLabel;
let symmetryDropdown;
let brushSizeSlider;

// parameters for drawing
let symmetry; // Symmetry - number of reflections   
let angle;
let outputColor;
let hue = Math.random() * 360;
let saturation = (Math.random()*80) + 20; // remove colors that look too samey
let lightness = (Math.random()*60) + 35;
let rainbowStyle = 'Inactive';
let colorIndex = 0;

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
    transports: ["websocket"]
});

const sketch = (p) => {
    let positions = {};
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
    
        prepareColorScales(); // gradient color scales
        randomColor();

        p.frameRate(300); // framerate same as the server

        socket.on("positions", (data) => {
            // get the data from the server to continually update the positions
            positions = data;
        });

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
            randomColorButton.mousePressed(randomColor);
            randomColorButton.id('randomColorButton');

            // Dropdown for degrees of symmetry
            symmetryLabel = p.createSpan('Symmetry: ');
            symmetryDropdown = p.createSelect('Symmetry');
            symmetryDropdown.option(6);
            symmetryDropdown.option(8);
            symmetryDropdown.option(12);
            symmetryDropdown.option(20);

            // Set default value for dropdown
            symmetryDropdown.selected(20);

            // The slider controls the thickness of the brush
            brushSizeLabel = p.createSpan('Brush Size');
            sizeSlider = p.createSlider(1, 32, 8, 1);

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
        scaleTrueRainbow = chroma.scale([chroma.hsl(0, 1, 0.7), chroma.hsl(90, 1, 0.7), chroma.hsl(180, 1, 0.7), chroma.hsl(270, 1, 0.7), chroma.hsl(360, 1, 0.7)]).domain([0, 0.2, 0.4, 0.8, 1]);
        trueRainbowColors = scaleTrueRainbow.colors(8); // array of colors from scale, for button
        trueRainbowColorsFull = scaleTrueRainbow.colors(360); // array of colors from scale, for output on canvas
    
        scaleCloud = chroma.scale([chroma.hsl(240, 0.76, 0.8), chroma.hsl(209, 0.65, 0.8), chroma.hsl(191, 0.55, 0.9), chroma.hsl(267, 0.6, 0.9), chroma.hsl(275, 0.79, 0.9), chroma.hsl(260, 0.79, 0.8), chroma.hsl(240, 0.76, 0.8)]);
        cloudColors = scaleCloud.colors(8);
        cloudColorsFull = scaleCloud.colors(360); 
    
        scaleStrawberryDream = chroma.scale([chroma.hsl(348, 0.85, 0.6), chroma.hsl(346, 0.9, 0.7), chroma.hsl(336, 0.9, 0.8), chroma.hsl(318, 0.95, 0.9), chroma.hsl(333, 0.8, 0.9), chroma.hsl(20, 0.6, 0.91), chroma.hsl(55, 0.45, 0.9), chroma.hsl(94, 0.55, 0.86)]);
        berryDreamColors = scaleStrawberryDream.colors(8);
        berryDreamColorsFull = scaleStrawberryDream.colors(360);
    
        scaleMystic = chroma.scale([chroma.hsl(308, 0.50, 0.3), chroma.hsl(312, 0.7, 0.1), chroma.hsl(306, 0.6, 0.4), chroma.hsl(292, 0.65, 0.4), chroma.hsl(265, 0.8, 0.3), chroma.hsl(232, 0.7, 0.25), chroma.hsl(205, 0.9, 0.1)]);
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
        switch(rainbowStyle){
            case 'Inactive':
                rainbowStyle = 'True Rainbow';
                break;
            case 'True Rainbow':
                rainbowStyle = 'Soft Clouds';
                break;
            case 'Soft Clouds':
                rainbowStyle = 'Berry Dream';
                break;
            case 'Berry Dream':
                rainbowStyle = 'Mystic Night';
                break;
            case 'Mystic Night':
                rainbowStyle = 'True Rainbow';
                break;
        }
        rainbowMode();
    }
    
    function rainbowMode(){
        colorIndicator.id('colorIndicatorRainbow');
        
        //set gradient background on colorIndicator
        switch(rainbowStyle){
            case 'True Rainbow':
                rainbowButton.html('True Rainbow');
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, trueRainbowColors[i]);
                }
                break;
            case 'Soft Clouds':
                rainbowButton.html('Soft Clouds');
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, cloudColors[i]);
                }
                break;
            case 'Berry Dream':
                rainbowButton.html('Berry Dream');
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, berryDreamColors[i]);
                }    
                break;
            case 'Mystic Night':
                rainbowButton.html('Mystic Night');
                for(let i = 0; i < 8; i++){
                    root.style.setProperty(`--g${i}`, mysticColors[i]);
                }
                break;
        }
    }
    
    function randomColor(){
        colorIndicator.id('colorIndicatorRandom');
        rainbowButton.html('Rainbow Mode');
        rainbowStyle = 'Inactive';
        hue = Math.random()*360;
        saturation = (Math.random()*80) + 20; // remove colors that look too samey
        lightness = (Math.random()*60) + 35;
    
        root.style.setProperty('--random-btn-hue', hue);
        root.style.setProperty('--random-btn-saturation', saturation + "%");
        root.style.setProperty('--random-btn-lightness', lightness + "%");
    }
    
    //runs at every frame
    p.draw = () => {

        //update positions at every frame
        socket.emit("updatePosition", {
            x: p.mouseX - p.width / 2, // always send relative number of position between 0 and 1
            y: p.mouseY - p.height/2, //so the positions are the relatively the same on different screen sizes.
            px: xPosPrevious,
            py: yPosPrevious
            
        });
        xPosPrevious = p.mouseX - p.width / 2; 
        yPosPrevious = p.mouseY - p.height / 2;

        //for every position (each user)
        for (const id in positions) {
            const position = positions[id];

            // move the coordinate system origin to the center of the canvas
            centerPointX = p.width / 2;
            centerPointY = p.height / 2;
            p.translate(centerPointX, centerPointY);

            // update the brush size slider label
            brushSizeValueLabel.html(sizeSlider.value());
        
            // update symmetry to current value of dropdown
            symmetry = symmetryDropdown.selected();
            
            // check that the mouse is inside the canvas, and that the mouse was also previously on the canvas
            //console.log(position.x, position.y, position.px, position.py);
            if (position.x > 0 && position.x < p.width && position.y > 0 && position.y < p.height &&
                position.px > 0 && position.px < p.width && position.py > 0 && position.py < p.height) {
        
                if (p.mouseIsPressed) {

                    if(rainbowStyle != 'Inactive'){
                        colorIndex = (colorIndex + 1) % 359; // to step over colors in gradient
            
                        // determine output colors for rainbow mode
                        switch(rainbowStyle){
                            case 'True Rainbow':
                                outputColor = chroma(trueRainbowColorsFull[colorIndex]).hsl();
                                hue = Math.floor(outputColor[0]);
                                saturation = outputColor[1].toFixed(2)*100; // because chroma.js has sat & lightness as floats, we need int 1-100 for p5.js
                                lightness = outputColor[2].toFixed(2)*100;
                                break;
                            case 'Soft Clouds':
                                outputColor = chroma(cloudColorsFull[colorIndex]).hsl();
                                hue = Math.floor(outputColor[0]);
                                saturation = outputColor[1].toFixed(2)*100;
                                lightness = outputColor[2].toFixed(2)*100;
                                break;
                            case 'Berry Dream':
                                outputColor = chroma(berryDreamColorsFull[colorIndex]).hsl();
                                hue = Math.floor(outputColor[0]);
                                saturation = outputColor[1].toFixed(2)*100;
                                lightness = outputColor[2].toFixed(2)*100;
                                break;
                            case 'Mystic Night':
                                outputColor = chroma(mysticColorsFull[colorIndex]).hsl();
                                hue = Math.floor(outputColor[0]);
                                saturation = outputColor[1].toFixed(2)*100;
                                lightness = outputColor[2].toFixed(2)*100;
                                break;
                        }
                    }

                    angle = 360 / symmetry;
                    for (let i = 0; i < symmetry; i++) {
                        p.rotate(angle); //rotate the coordinate system based on chosen symmetry
        
                        p.strokeWeight(sizeSlider.value());
                        p.stroke(hue, saturation, lightness);
                        
                        // draw line
                        p.line(position.x, position.y, position.px, position.py);
        
                        p.push(); // begin a drawing group
                        p.scale(1, -1); //scale the coordinate system (mirror along the y-axis)
                        p.line(position.x, position.y, position.px, position.py); // draw in the mirrored coordinate sytem
                        p.pop(); //end drawing group
                    }
                }
            }
        };


        
    }
    
}

// initialize the sketch
new p5(sketch, sketchContainer);