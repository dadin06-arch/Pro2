// script.js - AI StyleMate Logic

// ----------------------------------------------------
// 1. MODEL PATHS (⚠️ PLEASE VERIFY THESE PATHS!)
//    These paths assume your model files are in:
//    ./models/model_1/
//    ./models/model_2/
// ----------------------------------------------------
const URL_MODEL_1 = "./models/model_1/"; 
const URL_MODEL_2 = "./models/model_2/"; 

let model1, model2, webcam;
let labelContainer = document.getElementById("label-container");
let currentModel = 0; // 0: before loading, 1: Model 1, 2: Model 2
let maxPredictions; // Number of classification classes

// ===============================================
// 2. Initialization and Model Loading
// ===============================================

document.getElementById("start-button").addEventListener("click", init);

async function init() {
    document.getElementById("start-button").innerText = "LOADING...";
    labelContainer.innerHTML = "Loading analysis models and setting up webcam. Please wait...";

    try {
        // Load both models concurrently
        model1 = await tmImage.load(URL_MODEL_1 + "model.json", URL_MODEL_1 + "metadata.json");
        model2 = await tmImage.load(URL_MODEL_2 + "model.json", URL_MODEL_2 + "metadata.json");
        maxPredictions = model1.getTotalClasses(); // Assuming both models have the same number of classes

        // Webcam setup and start
        const flip = true; 
        webcam = new tmImage.Webcam(400, 300, flip); 
        await webcam.setup(); 
        await webcam.play();
        
        // Append webcam canvas to HTML
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        // Set initial state and start the prediction loop
        currentModel = 1; // Default to Model 1 active
        updateModelInfo();
        document.getElementById("start-button").style.display = 'none'; // Hide start button
        window.requestAnimationFrame(loop);

    } catch (error) {
        console.error("Initialization error: Could be local file paths, missing files, or HTTPS environment issue.", error);
        labelContainer.innerHTML = "Error! Failed to load models or webcam. Check console for details.";
    }
}

// ===============================================
// 3. Prediction Loop and Function
// ===============================================

function loop() {
    webcam.update(); // Update webcam canvas
    
    // Perform prediction based on the currently active model
    if (currentModel === 1) {
        predict(model1, "Face Type Analysis");
    } else if (currentModel === 2) {
        predict(model2, "Personal Tone Analysis");
    }
    
    window.requestAnimationFrame(loop); // Request next frame
}

async function predict(modelToUse, modelName) {
    // Perform prediction using webcam canvas
    const prediction = await modelToUse.predict(webcam.canvas);

    // Display prediction results in HTML
    let resultHTML = `<div class="model-name-title"><h3>${modelName} Results:</h3></div>`;
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = 
            `<strong>${prediction[i].className}</strong>: ${(prediction[i].probability * 100).toFixed(1)}%`;
        resultHTML += `<div class="prediction-item">${classPrediction}</div>`;
    }
    labelContainer.innerHTML = resultHTML;
}

// ===============================================
// 4. Model Switching and UI Updates
// ===============================================

document.getElementById("model1-btn").addEventListener("click", () => {
    currentModel = 1;
    updateModelInfo();
});

document.getElementById("model2-btn").addEventListener("click", () => {
    currentModel = 2;
    updateModelInfo();
});

function updateModelInfo() {
    const infoElement = document.getElementById("current-model-info");
    if (currentModel === 1) {
        infoElement.innerHTML = "Active Model: **Face Type Analysis**";
        document.getElementById("model1-btn").classList.add('active');
        document.getElementById("model2-btn").classList.remove('active');
    } else if (currentModel === 2) {
        infoElement.innerHTML = "Active Model: **Personal Tone Analysis**";
        document.getElementById("model1-btn").classList.remove('active');
        document.getElementById("model2-btn").classList.add('active');
    }
}