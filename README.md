# AI StyleMate

AI StyleMate is an AI-based web service that provides personalized hairstyle and hair color recommendations based on a user’s face shape and personal skin tone. The system runs entirely in the browser, ensuring fast response times and strong privacy protection.

---

## Quick Start

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
2. Run locally:

   ```bash
   python -m http.server
   ```
3. Open browser:

   ```
   http://localhost:8000
   ```

---

## Live Demo

🔗 [[https://dadin06-arch.github.io/Pro2/?v=2](https://dadin06-arch.github.io/Pro2/?v=2)

---

## Dataset

* **Sources**:

  * Face Shape: Public datasets from platforms such as Kaggle, combined with limited self-captured experimental data for real-world testing
  * Personal Tone: Public skin tone datasets from open research repositories
* **Size**: A total of 8,720 images

  * Face Shape: 4,000 images (800 samples per class: Heart, Oblong, Oval, Round, Square)
  * Personal Tone: 4,720 images (2,334 Cool / 2,386 Warm)
* **License**: Usage is restricted to academic and non-commercial purposes, in accordance with the original dataset licenses

---

## Model

* **Tool**: Google Teachable Machine
* **Architecture / Export**: TensorFlow.js
* **Accuracy**:

  * Face Shape Classification: 88% overall accuracy (Oval class reached 100%)
  * Personal Tone Classification: 88% accuracy
* **Latency**: Inference results are generated in under 0.5 seconds
* **Face Detection**: BlazeFace is integrated to improve real-time face tracking and detection accuracy

---

## Workflow

1. **Input**: User provides a facial image via webcam or image upload
2. **Detection**: Face detection is performed using BlazeFace
3. **Analysis**: The system analyzes face shape or personal tone
4. **Prediction**: AI models classify features (Heart, Oblong, Oval, Round, Square or Cool/Warm)
5. **Suggestion**: Personalized hairstyle or color palette recommendations are displayed
6. **Preview**: An AR-based virtual try-on overlay shows the suggested style in real time

---

## Credits

* **Team**: [Kyungmin Lee, Dahye Kim, Hyojin Kim, Kyuwon Lee, Yerim Seok]
* **Data**: Kaggle, Open Research Skin Tone Datasets
* **Tools**: TensorFlow.js, Google Teachable Machine, BlazeFace, HTML/CSS/JavaScript

---

## Notes

* All inference runs locally in the browser; no user images are stored or transmitted.
* The project is intended for academic and non-commercial use only.
