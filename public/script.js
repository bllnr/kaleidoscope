
// UI elements
let canvas;
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

let root = document.documentElement;

function setup() { 
    
    prepareColorScales(); // gradient color scales
    
    canvas = createCanvas(displayHeight*0.75, displayHeight*0.75);
    canvas.id('canvas');
    angleMode(DEGREES);
    colorMode(HSL);
    background(60, 3, 97);

    topContainer = createDiv();
    topContainer.id('topContainer');

    controlsContainer = createDiv();
    controlsContainer.id('controlsContainer');

    colorControlsContainer = createDiv();
    colorControlsContainer.id('colorControlsContainer');
    
    symmetryControlsContainer = createDiv();
    symmetryControlsContainer.id('symmetryControlsContainer');
    
    brushControlsContainer = createDiv();
    brushControlsContainer.id('brushControlsContainer');
    
    fileControlsContainer = createDiv();
    fileControlsContainer.id('fileControlsContainer');
    
    saveButton = createButton('Save');
    saveButton.mousePressed(saveFile);

    clearButton = createButton('Clear Drawing');
    clearButton.mousePressed(clearScreen);

    rainbowButton = createButton('Rainbow Mode');
    rainbowButton.mousePressed(toggleRainbowMode);
    rainbowButton.id('rainbowButton');

    colorIndicator = createDiv();
    colorIndicator.class('colorIndicator');

    randomColorButton = createButton('Random Color');
    randomColorButton.mousePressed(randomColor);
    randomColorButton.id('randomColorButton');

    // Dropdown for degrees of symmetry
    symmetryLabel = createSpan('Symmetry: ');
    symmetryDropdown = createSelect('Symmetry');
    symmetryDropdown.option(6);
    symmetryDropdown.option(8);
    symmetryDropdown.option(12);
    symmetryDropdown.option(20);

    // Set default value for dropdown
    symmetryDropdown.selected(20);

    // The slider controls the thickness of the brush
    brushSizeLabel = createSpan('Brush Size');
    sizeSlider = createSlider(1, 32, 8, 1);
    
    // Label which shows the current value of slider
    brushSizeValueLabel = createSpan('');
    brushSizeValueLabel.id('brushSizeValueLabel');
    brushSizeValueLabel.html(sizeSlider.value());

    // Child elements of topContainer
    canvas.parent('topContainer')
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

    randomColor();
}

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
  save('kaleidoscope.png');
}

// Clear Screen function
function clearScreen() {
    background(60, 3, 97)
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
            root.style.setProperty('--g0', trueRainbowColors[0]);
            root.style.setProperty('--g1', trueRainbowColors[1]);
            root.style.setProperty('--g2', trueRainbowColors[2]);
            root.style.setProperty('--g3', trueRainbowColors[3]);
            root.style.setProperty('--g4', trueRainbowColors[4]);
            root.style.setProperty('--g5', trueRainbowColors[5]);
            root.style.setProperty('--g6', trueRainbowColors[6]);
            root.style.setProperty('--g7', trueRainbowColors[7]);
            break;
        case 'Soft Clouds':
            rainbowButton.html('Soft Clouds');
            root.style.setProperty('--g0', cloudColors[0]);
            root.style.setProperty('--g1', cloudColors[1]);
            root.style.setProperty('--g2', cloudColors[2]);
            root.style.setProperty('--g3', cloudColors[3]);
            root.style.setProperty('--g4', cloudColors[4]);
            root.style.setProperty('--g5', cloudColors[5]);
            root.style.setProperty('--g6', cloudColors[6]);
            root.style.setProperty('--g7', cloudColors[7]);
            break;
        case 'Berry Dream':
            rainbowButton.html('Berry Dream');
            root.style.setProperty('--g0', berryDreamColors[0]);
            root.style.setProperty('--g1', berryDreamColors[1]);
            root.style.setProperty('--g2', berryDreamColors[2]);
            root.style.setProperty('--g3', berryDreamColors[3]);
            root.style.setProperty('--g4', berryDreamColors[4]);
            root.style.setProperty('--g5', berryDreamColors[5]);
            root.style.setProperty('--g6', berryDreamColors[6]);
            root.style.setProperty('--g7', berryDreamColors[7]);

            break;
        case 'Mystic Night':
            rainbowButton.html('Mystic Night');
            root.style.setProperty('--g1', mysticColors[1]);
            root.style.setProperty('--g0', mysticColors[0]);
            root.style.setProperty('--g2', mysticColors[2]);
            root.style.setProperty('--g3', mysticColors[3]);
            root.style.setProperty('--g4', mysticColors[4]);
            root.style.setProperty('--g5', mysticColors[5]);
            root.style.setProperty('--g6', mysticColors[6]);
            root.style.setProperty('--g7', mysticColors[7]);
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

function draw() {
    // update the brush size slider label
    brushSizeValueLabel.html(sizeSlider.value());
  
    // move the coordinate system origin to the center of the canvas
    centerPointX = width / 2;
    centerPointY = height / 2;
    translate(centerPointX, centerPointY);

    // update symmetry to current value of dropdown
    symmetry = symmetryDropdown.selected();
  
    // check that the mouse is inside the canvas
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let mouseEndX = mouseX - width / 2;
        let mouseEndY = mouseY - height / 2;
        let mouseStartX = pmouseX - width / 2;
        let mouseStartY = pmouseY - height / 2;

        if (mouseIsPressed) {
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
                rotate(angle); //rotate the coordinate system based on symmetry

                strokeWeight(sizeSlider.value());
                stroke(hue, saturation, lightness);
                
                // draw line
                line(mouseEndX, mouseEndY, mouseStartX, mouseStartY);

                push(); // begin a drawing group
                scale(1, -1); //scale the coordinate system (mirror along the y-axis)
                line(mouseEndX, mouseEndY, mouseStartX, mouseStartY); // draw in the mirrored coordinate sytem
                pop(); //end drawing group
            }
        }
    }
}



