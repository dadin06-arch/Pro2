// script.js - AI StyleMate Logic (Final Version with Face Detection + AR Try-On)

// ----------------------------------------------------
// 1. MODEL PATHS, VARIABLES & DATA DEFINITION
// ----------------------------------------------------
const URL_MODEL_1 = "./models/model_1/"; 
const URL_MODEL_2 = "./models/model_2/"; 

let model1, model2, webcam;
let faceDetectorModel; // 💡 얼굴 감지 모델 변수
let labelContainer = document.getElementById("label-container");
let currentModel = 0; 
let requestID; 
let isRunning = false; 
let isInitialized = false; 
let currentSource = 'webcam'; 

// 💡 AR Try-On 관련 변수
let arWebcamStream = null;
const arWebcamVideo = document.getElementById("ar-webcam-video");
const arStickerOverlay = document.getElementById("ar-sticker-overlay");
const arContainer = document.getElementById("ar-container");
// 💡 AR 컬러 변경 관련 변수 추가
let currentStickerBaseName = ''; // 현재 스타일의 기본 이름 (예: oval_long)
let currentStickerLength = ''; // 현재 스타일의 길이 (예: short 또는 long)
// 🌟 스크린샷 버튼 DOM 요소 추가
const arScreenshotBtn = document.getElementById("ar-screenshot-btn");

// 💡 AR 스티커 변형 상태 변수
const arStickerTransformContainer = document.getElementById('ar-sticker-transform-container');
let currentScale = 1.0;
let currentOffsetX = 0;
let currentOffsetY = 0;
const ZOOM_STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;

// 💡 드래그(이동) 관련 변수
let isDragging = false;
let startX, startY;

// 💡 DOM 이벤트 리스너 함수
function setupStickerControls() {
    // 1. 확대/축소/리셋 버튼
    document.getElementById("zoom-in-btn").addEventListener("click", () => adjustStickerTransform(ZOOM_STEP, 'zoom'));
    document.getElementById("zoom-out-btn").addEventListener("click", () => adjustStickerTransform(-ZOOM_STEP, 'zoom'));
    document.getElementById("reset-transform-btn").addEventListener("click", resetStickerTransform);

    // 2. 이동 (마우스/터치)
    arStickerTransformContainer.addEventListener('mousedown', startDrag);
    arStickerTransformContainer.addEventListener('touchstart', startDrag);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

// 💡 얼굴 감지 임계값 (필요 시 조정 가능)
const FACE_DETECTION_THRESHOLD = 0.9; // 얼굴 감지 신뢰도
const MIN_FACE_SIZE = 50; // 최소 얼굴 크기 (픽셀)

// 💡 얼굴형별 추천 데이터 및 이미지 URL 정의
const faceTypeData = {
    "Oval": {
        summary: "The most versatile face shape. Naturally suits most hairstyles.",
        short: "Crop cut, undercut, bob.",
        long: "Layered cuts, natural waves.",
        shortImage: 'images/oval_short.png',
        longImage: 'images/oval_long.png',
        // 💡 AR 스티커 파일명 추가
        shortSticker: 'images/oval_short_sticker.png',
        longSticker: 'images/oval_long_sticker.png'
    },
    "Round": {
        summary: "Styles that look longer and sharper work well. Best with styles that add vertical length and slim the sides.",
        short: "Asymmetrical cuts, volume on top.",
        long: "Long bob, side-flowing layers.",
        shortImage: 'images/round_short.png',
        longImage: 'images/round_long.png',
        // 💡 AR 스티커 파일명 추가
        shortSticker: 'images/round_short_sticker.png',
        longSticker: 'images/round_long_sticker.png'
    },
    "Square": {
        summary: "Reduce sharp angles and add soft lines. Softens a strong jawline with gentle curves.",
        short: "Textured cuts, side-swept styles.",
        long: "Waves with face-framing layers.",
        shortImage: 'images/square_short.png',
        longImage: 'images/square_long.png',
        // 💡 AR 스티커 파일명 추가
        shortSticker: 'images/square_short_sticker.png',
        longSticker: 'images/square_long_sticker.png'
    },
    "Heart": {
        summary: "Keep the top light and add volume toward the bottom. Balances a wider forehead and narrower chin.",
        short: "Side bangs, face-hugging layers.",
        long: "Heavier layers below the chin, side parts.",
        shortImage: 'images/heart_short.png',
        longImage: 'images/heart_long.png',
        // 💡 AR 스티커 파일명 추가
        shortSticker: 'images/heart_short_sticker.png',
        longSticker: 'images/heart_long_sticker.png'
    },
    "Oblong": {
        summary: "Shorten the appearance of length and widen the silhouette. Works best with styles that reduce length and increase width.",
        short: "Jaw-line bobs, forehead-covering bangs.",
        long: "Medium-length layers, styles with side volume.",
        shortImage: 'images/oblong_short.png',
        longImage: 'images/oblong_long.png',
        // 💡 AR 스티커 파일명 추가
        shortSticker: 'images/oblong_short_sticker.png',
        longSticker: 'images/oblong_long_sticker.png'
    }
};

// 💡 퍼스널 톤 추천 데이터 및 이미지 URL 정의 (파일명 최종 수정됨)
const personalToneData = {
    "Cool": {
        summary: "Blue-based and purple-based cool hues make the skin look clearer and brighter.",
        hair: "Ash brown, ash blonde, blue-black",
        clothing: "Light tones: Ice blue, lavender, lilac pink | Dark tones: Navy, charcoal gray, burgundy | Neutrals: White, cool gray",
        makeup: "Lips: Raspberry, fuchsia, cool pink | Eyes: Mauve, silver, cool brown | Blush: Rose pink, lilac pink",
        image: 'images/cool_tone.png' 
    },
    "Warm": {
        summary: "Yellow-based and orange-based warm hues enhance natural warmth and give a healthy glow.",
        hair: "Golden brown, copper brown",
        clothing: "Light tones: Coral, peach, salmon | Dark tones: Olive, khaki, mustard | Neutrals: Beige, ivory, cream",
        makeup: "Lips: Coral, orange-red, brick | Eyes: Gold, bronze, warm brown | Blush: Peach, coral, apricot",
        image: 'images/warm_tone.png' 
    }
};


// ===============================================
// 2. Event Listeners and Setup
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("start-button").addEventListener("click", toggleAnalysis);
    
    document.getElementById("model1-btn").addEventListener("click", () => handleModelChange(1));
    document.getElementById("model2-btn").addEventListener("click", () => handleModelChange(2));
    
    document.getElementById("mode-webcam").addEventListener("click", () => switchMode('webcam'));
    document.getElementById("mode-upload").addEventListener("click", () => switchMode('image'));

    document.getElementById("image-upload").addEventListener("change", handleImageUpload);
    document.getElementById("process-image-btn").addEventListener("click", processUploadedImage);
    
    document.querySelectorAll('.face-select-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.face-select-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tone-select-btn').forEach(btn => btn.classList.remove('active')); 
            e.target.classList.add('active');
            const faceType = e.target.getAttribute('data-facetype');
            showRecommendation(faceType); 
            // 💡 AR Try-On 정지
            stopArTryOn();
        });
    });

    // 💡 컬러 선택 버튼 리스너 추가
    document.getElementById("color-original-btn").addEventListener("click", () => changeStickerColor("original"));
    document.getElementById("color-warm-btn").addEventListener("click", () => changeStickerColor("warm"));
    document.getElementById("color-cool-btn").addEventListener("click", () => changeStickerColor("cool"));
    
    document.querySelectorAll('.tone-select-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.face-select-btn').forEach(btn => btn.classList.remove('active')); 
            document.querySelectorAll('.tone-select-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const toneType = e.target.getAttribute('data-tonetype');
            showToneRecommendation(toneType); 
             // 💡 AR Try-On 정지
            stopArTryOn();
        });
    });
    
    // 💡 AR Stop Button Listener
    document.getElementById("ar-stop-button").addEventListener('click', stopArTryOn);
    
    // 🌟 AR Screenshot Button Listener 등록
    if (arScreenshotBtn) {
        arScreenshotBtn.addEventListener('click', captureArScreenshot);
    }
    setupStickerControls();
    switchMode('webcam');
    
    document.getElementById("style-selection-controls").style.display = 'none';
    document.getElementById("tone-selection-controls").style.display = 'none';
});


// ===============================================
// 3. Mode Switching Logic 
// ===============================================

function switchMode(mode) {
    if (currentSource === mode) return;

    if (isRunning) {
        toggleAnalysis(); 
    }
    
    // 💡 AR Try-On 정지
    stopArTryOn();
    
    const webcamContainer = document.getElementById("webcam-container");
    webcamContainer.innerHTML = '';
    
    currentSource = mode;
    
    document.getElementById("mode-webcam").classList.remove('active');
    document.getElementById("mode-upload").classList.remove('active');
    
    const webcamControls = document.getElementById("webcam-controls");
    const uploadControls = document.getElementById("upload-controls");

    if (mode === 'webcam') {
        document.getElementById("mode-webcam").classList.add('active');
        webcamControls.style.display = 'block';
        uploadControls.style.display = 'none';
        webcamContainer.innerHTML = '<p id="initial-message">Click "Start Analysis" to load webcam.</p>';
        
        if(webcam && webcam.canvas) {
            webcamContainer.appendChild(webcam.canvas);
        }

    } else if (mode === 'image') {
        document.getElementById("mode-upload").classList.add('active');
        webcamControls.style.display = 'none';
        uploadControls.style.display = 'block';
        webcamContainer.innerHTML = '<p id="initial-message">Please upload an image.</p>';
        
        if(webcam) {
            webcam.pause();
        }
    }
    
    labelContainer.innerHTML = (mode === 'webcam' && isRunning) ? 'Running analysis...' : 'Waiting for analysis...';
    document.getElementById("recommendation-output").innerHTML = '<p>Select a model to begin the analysis or selection.</p>';
}


// ===============================================
// 4. Initialization, Webcam Loop Control (toggleAnalysis)
// ===============================================

async function toggleAnalysis() {
    const startButton = document.getElementById("start-button");
    
    if (isRunning) {
        window.cancelAnimationFrame(requestID);
        startButton.innerText = "▶️ Resume Analysis";
        startButton.classList.replace('primary-btn', 'secondary-btn');
        isRunning = false;
        return; 
    }
    
    // 💡 AR Try-On 정지
    stopArTryOn();
    
    if (!isInitialized) {
        startButton.innerText = "LOADING...";
        startButton.disabled = true;
        document.getElementById("webcam-container").innerHTML = "Loading models and setting up webcam. Please wait...";
        
        try {
            model1 = await tmImage.load(URL_MODEL_1 + "model.json", URL_MODEL_1 + "metadata.json");
            model2 = await tmImage.load(URL_MODEL_2 + "model.json", URL_MODEL_2 + "metadata.json");
            
            // 💡 얼굴 감지 모델 로드 추가
            faceDetectorModel = await blazeface.load();

            const flip = true; 
            webcam = new tmImage.Webcam(400, 300, flip); 
            await webcam.setup(); 
            await webcam.play();
            
            document.getElementById("webcam-container").innerHTML = ''; 
            document.getElementById("webcam-container").appendChild(webcam.canvas);
            
            currentModel = 1; 
            updateModelInfo();
            isInitialized = true;

        } catch (error) {
            console.error("Initialization error:", error);
            document.getElementById("webcam-container").innerHTML = "<p style='color:red;'>⚠️ Error! Check console. (Ensure files are present and running on HTTPS)</p>";
            startButton.innerText = "⚠️ Error. Retry";
            startButton.disabled = false;
            return;
        }
        startButton.disabled = false;
    }

    if(webcam) webcam.play(); 
    startButton.innerText = "⏸️ Pause & Lock Result";
    startButton.classList.replace('secondary-btn', 'primary-btn');
    isRunning = true;
    loop(); 
}


// ===============================================
// 5. Webcam Prediction Loop and Model Change Handler 
// ===============================================

function loop() {
    if (currentSource === 'webcam') {
        webcam.update(); 
        
        if (currentModel === 1 && model1) {
            predict(model1, "Face Type Analysis", webcam.canvas);
        } else if (currentModel === 2 && model2) {
            predict(model2, "Personal Tone Analysis", webcam.canvas);
        }
    }
    
    requestID = window.requestAnimationFrame(loop); 
}


function handleModelChange(newModel) {
    if (currentModel === newModel) return;

    currentModel = newModel;
    updateModelInfo();
    
    const styleControls = document.getElementById("style-selection-controls");
    const toneControls = document.getElementById("tone-selection-controls"); 
    const recommendationOutput = document.getElementById("recommendation-output");
    
    // 💡 AR Try-On 정지
    stopArTryOn();
    
    if (newModel === 1) { 
        styleControls.style.display = 'block';
        toneControls.style.display = 'none';
        recommendationOutput.innerHTML = '<p>Select a Face Type button from the **Hair Style Guide** to see recommendations.</p>';
        document.querySelectorAll('.tone-select-btn').forEach(btn => btn.classList.remove('active'));
        
    } else { 
        styleControls.style.display = 'none'; 
        toneControls.style.display = 'block'; 
        recommendationOutput.innerHTML = '<p>Select a Personal Tone button from the **Personal Tone Guide** to see recommendations.</p>';
        document.querySelectorAll('.face-select-btn').forEach(btn => btn.classList.remove('active'));
    }
    
    if ((currentSource === 'webcam' && !isRunning && isInitialized) || currentSource === 'image') {
        const modelToUse = (currentModel === 1) ? model1 : model2;
        const modelName = (currentModel === 1) ? "Face Type Analysis" : "Personal Tone Analysis";
        const element = (currentSource === 'webcam') ? webcam.canvas : document.getElementById('uploaded-image');
        
        if(element) {
            predict(modelToUse, modelName, element);
        }
    } 
}


// ===============================================
// 6. Image Upload Logic
// ===============================================

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 💡 AR Try-On 정지
    stopArTryOn();

    const reader = new FileReader();
    reader.onload = (e) => {
        const imgElement = document.createElement('img');
        imgElement.id = 'uploaded-image';
        imgElement.src = e.target.result;
        
        const container = document.getElementById("webcam-container");
        container.innerHTML = ''; 
        container.appendChild(imgElement);

        document.getElementById("process-image-btn").disabled = false;
        labelContainer.innerHTML = 'Image uploaded. Click "Process Uploaded Image" to analyze.';
    };
    reader.readAsDataURL(file);
}

async function processUploadedImage() {
    const imgElement = document.getElementById('uploaded-image');
    if (!imgElement) return;
    
    // 💡 AR Try-On 정지
    stopArTryOn();
    
    if (!isInitialized) {
        labelContainer.innerHTML = 'Loading models... Please wait.';
        try {
            model1 = await tmImage.load(URL_MODEL_1 + "model.json", URL_MODEL_1 + "metadata.json");
            model2 = await tmImage.load(URL_MODEL_2 + "model.json", URL_MODEL_2 + "metadata.json");
            faceDetectorModel = await blazeface.load(); // 💡 얼굴 감지 모델 로드
            isInitialized = true;
        } catch(e) {
            labelContainer.innerHTML = 'Error loading models. Check console.';
            return;
        }
    }

    const modelToUse = (currentModel === 1) ? model1 : model2;
    const modelName = (currentModel === 1) ? "Face Type Analysis" : "Personal Tone Analysis";

    labelContainer.innerHTML = 'Analyzing image...';
    await predict(modelToUse, modelName, imgElement); 
    
    document.getElementById("process-image-btn").innerText = 'Analysis Complete (Click to re-analyze)';
}


// ===============================================
// 7. Core Prediction and UI Update
// ===============================================

async function predict(modelToUse, modelName, element) {
    if (!modelToUse || !faceDetectorModel) {
        labelContainer.innerHTML = `Error: ${modelName} or Face Detector is not loaded.`;
        return;
    }
    
    // ----------------------------------------------------------------
    // 💡 1. 얼굴 감지(Face Detection) 로직: 얼굴의 명확성 확인
    // ----------------------------------------------------------------
    const predictions = await faceDetectorModel.estimateFaces(element, FACE_DETECTION_THRESHOLD);

    if (predictions.length === 0) {
        labelContainer.innerHTML = '<div style="color: red; font-weight: bold; padding: 10px;">⚠️ Warning: A clear face was not detected!</div><p>Please make sure your face is facing the camera, well-lit, unobstructed, and fully visible before continuing the analysis.</p>';
        document.getElementById("recommendation-output").innerHTML = '<p>Face detection failed: A clear face could not be detected.</p>';
        
        document.getElementById("style-selection-controls").style.display = 'none';
        document.getElementById("tone-selection-controls").style.display = 'none';
        return; 
    }
    
    // 선택적: 얼굴 크기 검사 (너무 멀리 있거나 작게 찍힌 경우)
    const largestFace = predictions[0]; 
    const faceWidth = largestFace.bottomRight[0] - largestFace.topLeft[0];
    const faceHeight = largestFace.bottomRight[1] - largestFace.topLeft[1];

    if (faceWidth < MIN_FACE_SIZE || faceHeight < MIN_FACE_SIZE) {
        labelContainer.innerHTML = '<div style="color: orange; font-weight: bold; padding: 10px;">⚠️ Warning: Your face appears too small!</div><p>Please move closer to the camera or adjust the image so your face appears larger.</p>';
        document.getElementById("recommendation-output").innerHTML = '<p>Face detection failed: The face is too small.</p>';
        
        document.getElementById("style-selection-controls").style.display = 'none';
        document.getElementById("tone-selection-controls").style.display = 'none';
        return;
    }
    
    // ----------------------------------------------------------------
    // 💡 2. 분류(Classification) 로직: 얼굴이 명확할 때만 실행
    // ----------------------------------------------------------------
    
    const currentMaxPredictions = modelToUse.getTotalClasses(); 
    const prediction = await modelToUse.predict(element);

    let resultHTML = `<div class="model-name-title"><h3>${modelName} Results:</h3></div>`;
    
    for (let i = 0; i < currentMaxPredictions; i++) {
        const classPrediction = 
            `<strong>${prediction[i].className}</strong>: ${(prediction[i].probability * 100).toFixed(1)}%`;
        resultHTML += `<div class="prediction-item">${classPrediction}</div>`;
    }
    labelContainer.innerHTML = resultHTML;
    
    if (currentModel === 1) {
        document.getElementById("style-selection-controls").style.display = 'block';
        document.getElementById("tone-selection-controls").style.display = 'none'; 
    } else if (currentModel === 2) {
        document.getElementById("tone-selection-controls").style.display = 'block';
        document.getElementById("style-selection-controls").style.display = 'none'; 
    }
}


// ===============================================
// 8. Manual Recommendation Output 
// ===============================================

// 얼굴형 추천 출력
function showRecommendation(faceType) {
    const data = faceTypeData[faceType]; 
    const outputContainer = document.getElementById("recommendation-output");
    
    if (!data) {
        outputContainer.innerHTML = `<p style="color:red;">Error: No recommendation data found for ${faceType}.</p>`;
        return;
    }

    const recommendationHTML = `
        <div class="recommendation-content">
            <h4>✨ Hairstyle Guide for ${faceType} Face Shape</h4>
            
            <p class="summary-text">${data.summary}</p>
            
            <div class="hair-styles-container">
                <div class="style-column">
                    <h5><i class="fas fa-cut"></i> Short Hair: ${data.short}</h5>
                    <img src="${data.shortImage}" alt="${faceType} Short Hairstyle">
                    <button class="btn ar-try-on-btn" data-sticker="${data.shortSticker}" data-face="${faceType}" data-length="short">AR sticker photo experience (Short)</button>
                </div>
                
                <div class="style-column">
                    <h5><i class="fas fa-spa"></i> Long Hair: ${data.long}</h5>
                    <img src="${data.longImage}" alt="${faceType} Long Hairstyle">
                    <button class="btn ar-try-on-btn" data-sticker="${data.longSticker}" data-face="${faceType}" data-length="long">AR sticker photo experience (Long)</button>
                </div>
            </div>
        </div>
    `;
    outputContainer.innerHTML = recommendationHTML; 
    
    // 💡 합성 버튼 이벤트 리스너 할당
    document.querySelectorAll('.ar-try-on-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const stickerPath = e.target.getAttribute('data-sticker');
            startArTryOn(stickerPath);
        });
    });
}

// 퍼스널 톤 추천 출력
function showToneRecommendation(toneType) {
    const data = personalToneData[toneType]; 
    const outputContainer = document.getElementById("recommendation-output");
    
    if (!data) {
        outputContainer.innerHTML = `<p style="color:red;">Error: No recommendation data found for ${toneType}.</p>`;
        return;
    }
    
    // 💡 AR Try-On 정지
    stopArTryOn();

    const recommendationHTML = `
        <div class="recommendation-content">
            <h4>✨ Personal Color Guide for ${toneType} Tone</h4>
            
            <p class="summary-text">${data.summary}</p>
            
            <div class="tone-styles-container">
                <div class="tone-text-column">
                    <div class="tone-category">
                        <h5><i class="fas fa-cut"></i> Hair Colors</h5>
                        <p>${data.hair}</p>
                    </div>
                    <div class="tone-category">
                        <h5><i class="fas fa-tshirt"></i> Clothing Colors</h5>
                        <p>${data.clothing}</p>
                    </div>
                    <div class="tone-category">
                        <h5><i class="fas fa-gem"></i> Makeup Colors</h5>
                        <p>${data.makeup}</p>
                    </div>
                </div>
                <div class="tone-image-column">
                    <img src="${data.image}" alt="${toneType} Color Palette">
                </div>
            </div>
        </div>
    `;
    outputContainer.innerHTML = recommendationHTML; 
}


function updateModelInfo() {
    const infoElement = document.getElementById("current-model-info");
    const btn1 = document.getElementById("model1-btn");
    const btn2 = document.getElementById("model2-btn");

    if (currentModel === 1) {
        infoElement.innerHTML = "Active Model: **Face Type Analysis**";
        btn1.classList.add('active');
        btn2.classList.remove('active');
    } else if (currentModel === 2) {
        infoElement.innerHTML = "Active Model: **Personal Tone Analysis**";
        btn1.classList.remove('active');
        btn2.classList.add('active');
    }

    if (currentSource === 'image' && document.getElementById('uploaded-image')) {
         document.getElementById("process-image-btn").innerText = 'Re-Analyze Image';
    }
}


// ===============================================
// 9. AR Try-On Logic (기존 핵심 기능)
// ===============================================

// AR 웹캠 활성화 및 스티커 오버레이
async function startArTryOn(stickerPath) {
    // 분석 웹캠이 실행 중이면 정지
    if (isRunning) {
        toggleAnalysis();
    }
    
    // AR 컨테이너 표시
    arContainer.style.display = 'block';
    // 💡 [추가]: 스티커 변형 상태 초기화
    resetStickerTransform();
    
    // 스티커 이미지 설정
    arStickerOverlay.src = stickerPath;
    arStickerOverlay.style.display = 'block';

    // 💡 [수정] 현재 스티커 기본 이름 및 길이 정보 저장 (파일명: oval_long_sticker.png 가정)
    const parts = stickerPath.split('/');
    const fileName = parts[parts.length - 1]; // 파일명 (예: oval_long_sticker.png)
    
    // 파일명에서 ".png"와 "_sticker"를 제거한 기본 스타일 이름 저장 (예: oval_long)
    currentStickerBaseName = fileName.replace('.png', '').replace('_sticker', ''); 
    
    // 길이 정보 저장
    currentStickerLength = currentStickerBaseName.includes('short') ? 'short' : 'long'; 

    // 컬러 버튼 초기화 및 'Original' 활성화
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById("color-original-btn").classList.add('active');
    
    // 웹캠 스트림 설정
    try {
        if (arWebcamStream) {
            stopArWebcamStream(); // 기존 스트림이 있다면 정지
        }
        
        arWebcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 400,
                height: 300,
                facingMode: "user" // 전면 카메라 사용
            }
        });

        arWebcamVideo.srcObject = arWebcamStream;
        arWebcamVideo.play();
        
        // 거울 효과를 위해 비디오 플립 (CSS에서 처리)
        arWebcamVideo.style.transform = 'scaleX(-1)';
        
    } catch (err) {
        console.error("AR Webcam activation error: ", err);
        arContainer.innerHTML = '<p style="color:red;">⚠️ Unable to activate the webcam required for the AR experience. Please check your camera permissions.</p>';
        stopArTryOn();
    }
}

// AR 웹캠 스트림 정지
function stopArWebcamStream() {
    if (arWebcamStream) {
        arWebcamStream.getTracks().forEach(track => {
            track.stop();
        });
        arWebcamStream = null;
    }
    arWebcamVideo.srcObject = null;
}

// AR Try-On 전체 정지 및 UI 정리
function stopArTryOn() {
    stopArWebcamStream();
    arContainer.style.display = 'none';
    arStickerOverlay.style.display = 'none';
    arStickerOverlay.src = "";
    // 💡 [추가]: 스티커 변형 컨테이너 숨기기/초기화 (선택 사항)
    resetStickerTransform();
}

// script (9).js 파일 (9. AR Try-On Logic 부분에 추가)

// AR 스티커 컬러를 변경하는 함수
function changeStickerColor(colorType) {
    if (!currentStickerBaseName) {
        alert('AR Try-On을 먼저 시작해 주세요.');
        return;
    }
    
    // 버튼 클래스 업데이트
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.color-btn[data-color="${colorType}"]`).classList.add('active');

    let newStickerPath = '';
    
    if (colorType === 'original') {
        // 기본 이미지 경로: images/oval_long_sticker.png
        // (기존 스티커 이미지는 여전히 "_sticker" 접미사를 가지고 있다고 가정)
        newStickerPath = `images/${currentStickerBaseName}_sticker.png`; 
    } else {
        // 컬러 이미지 경로: images/oval_long_warm.png (고객님 규칙 반영)
        // currentStickerBaseName (예: oval_long) + colorType (예: warm)
        newStickerPath = `images/${currentStickerBaseName}_${colorType}.png`;
    }
    
    // 이미지 스티커 소스 업데이트
    arStickerOverlay.src = newStickerPath;
}


// 스티커 변형을 적용하는 핵심 함수
function applyStickerTransform() {
    arStickerTransformContainer.style.transform = 
        `translate(${currentOffsetX}px, ${currentOffsetY}px) scale(${currentScale})`;
}

// 확대/축소 실행 함수
function adjustStickerTransform(value, type) {
    if (arContainer.style.display === 'none') return;

    if (type === 'zoom') {
        let newScale = currentScale + value;
        // 최소/최대 확대/축소 비율 제한
        if (newScale < MIN_SCALE) newScale = MIN_SCALE;
        if (newScale > MAX_SCALE) newScale = MAX_SCALE;
        currentScale = newScale;
    }
    // 'move' 타입은 드래그 로직에서 처리
    
    applyStickerTransform();
}

// 변형 리셋 함수
function resetStickerTransform() {
    if (arContainer.style.display === 'none') return;
    
    currentScale = 1.0;
    currentOffsetX = 0;
    currentOffsetY = 0;
    applyStickerTransform();
}


// ------------------------------------
// 드래그(이동) 로직
// ------------------------------------

function getClientPos(e) {
    return e.touches ? {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
    } : {
        x: e.clientX,
        y: e.clientY
    };
}

function startDrag(e) {
    if (arContainer.style.display === 'none') return;
    
    const target = e.target.id;
    // 스티커 오버레이를 드래그할 때만 작동
    if (target !== 'ar-sticker-overlay' && target !== 'ar-sticker-transform-container') return;

    e.preventDefault(); 
    isDragging = true;
    
    const pos = getClientPos(e);
    // 현재 마우스/터치 위치 저장
    startX = pos.x;
    startY = pos.y;
    
    // 드래그 중 커서 변경
    arStickerTransformContainer.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault(); 
    
    const pos = getClientPos(e);
    
    // 이동 거리 계산
    const deltaX = pos.x - startX;
    const deltaY = pos.y - startY;
    
    // AR 웹캠 래퍼의 크기 (400x300) 대비 이동 비율을 적용
    // (선택 사항: 더욱 부드러운 제어를 위해)
    const factor = 1.5; 
    currentOffsetX += deltaX * factor;
    currentOffsetY += deltaY * factor;
    
    // 현재 위치 업데이트
    startX = pos.x;
    startY = pos.y;
    
    applyStickerTransform();
}

function stopDrag() {
    isDragging = false;
    arStickerTransformContainer.style.cursor = 'move';
}



// ===============================================
// 10. AR Screenshot Logic (새로 추가된 기능)
// ===============================================

// 다운로드 처리 도우미 함수
function triggerDownload(canvas) {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'AI_StyleMate_AR_Screenshot_' + new Date().toISOString().slice(0, 10) + '.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // canvas.remove(); // 캔버스 제거는 호출 측에서 처리
}

function captureArScreenshot() {
    if (!arWebcamVideo || arWebcamVideo.paused || arWebcamVideo.ended || arContainer.style.display === 'none') {
        alert('AR 웹캠이 실행 중이지 않습니다.');
        return;
    }

    // 1. 캔버스 생성 및 크기 설정
    // 비디오의 실제 표시 크기(400x300)를 사용
    const videoWidth = arWebcamVideo.offsetWidth; 
    const videoHeight = arWebcamVideo.offsetHeight;
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');

    // 2. 웹캠 비디오 그리기 (거울 효과 적용)
    ctx.save();
    ctx.scale(-1, 1); // 좌우 반전
    ctx.drawImage(arWebcamVideo, -videoWidth, 0, videoWidth, videoHeight);
    ctx.restore();

    // 3. 스티커 이미지 그리기 (⭐ 왜곡 방지 및 변형 적용 핵심 수정 ⭐)
    if (arStickerOverlay.style.display !== 'none' && arStickerOverlay.src) {
        const stickerImg = new Image();
        stickerImg.crossOrigin = "anonymous";
        
        stickerImg.onload = () => {
            
            ctx.save(); // 스티커 변형을 위한 캔버스 상태 저장
            
            // 캔버스 중앙으로 이동 (변형의 기준점)
            ctx.translate(videoWidth / 2, videoHeight / 2);
            
            // 사용자 확대/축소(Scale) 적용
            ctx.scale(currentScale, currentScale);
            
            // 사용자 이동(Translate) 적용
            // 이동 값은 이미 캔버스 중앙(0,0)을 기준으로 적용되도록 설계되었지만, 
            // 캔버스 좌표계가 scale되었으므로 오프셋도 scale된 값으로 나누어 적용해야 합니다.
            // 하지만 JS 로직에서 offset을 직접 currentOffsetX/Y로 저장했으므로, 
            // 캔버스 중앙을 기준으로 이동시킵니다.
            ctx.translate(currentOffsetX / currentScale, currentOffsetY / currentScale);
            
            // 4. 스티커 이미지 종횡비 유지하며 그리기
            // 스티커 이미지는 object-fit: cover와 동일하게 래퍼(400x300)에 꽉 채워져야 합니다.
            
            const imgW = stickerImg.naturalWidth;
            const imgH = stickerImg.naturalHeight;
            const containerRatio = videoWidth / videoHeight;
            const imageRatio = imgW / imgH;
            
            let drawW, drawH;

            if (imageRatio > containerRatio) {
                // 이미지가 컨테이너보다 넓음 -> 높이를 꽉 채움 (cover 모드)
                drawH = videoHeight;
                drawW = videoHeight * imageRatio;
            } else {
                // 이미지가 컨테이너보다 좁거나 같음 -> 너비를 꽉 채움 (cover 모드)
                drawW = videoWidth;
                drawH = videoWidth / imageRatio;
            }

            // 변형된 캔버스 중앙(0,0)을 기준으로 이미지 그리기
            ctx.drawImage(stickerImg, 
                -drawW / 2, // X 시작 위치
                -drawH / 2, // Y 시작 위치
                drawW, drawH);

            ctx.restore(); // 변형 상태 초기화

            // 5. 다운로드 실행
            triggerDownload(canvas);
            canvas.remove();
        };
        stickerImg.src = arStickerOverlay.src;
    } else {
        // 스티커가 없는 경우 비디오만 다운로드
        triggerDownload(canvas);
        canvas.remove();
    }
}



