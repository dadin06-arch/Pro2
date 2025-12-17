# ✨ AI StyleMate ✨

AI StyleMate is an **AI-powered web service** that analyzes a user’s **face shape** and **personal skin tone** to provide **personalized hairstyle and hair color recommendations**.
All analysis runs **entirely in the browser**, ensuring fast performance and strong privacy protection with no image storage.

---

## 🚀 Live Demo

🔗 **[https://dadin06-arch.github.io/Pro2/?v=2](https://dadin06-arch.github.io/Pro2/?v=2)**

> No mobile app installation required — the service runs directly in a web browser.

---

## 🧭 Project Overview

* 🎯 **Problem**
  Hairstyles and hair colors are difficult to reverse, yet most people rely on trends or subjective advice when making decisions.

* 💡 **Solution**
  AI StyleMate provides **data-driven, personalized styling guidance** by analyzing the user’s own facial features and skin tone.

* 🔐 **Privacy-First Design**
  All AI inference is performed locally in the browser using TensorFlow.js.

---

## ⚡ Quick Start (Local)

> ⚠️ No backend server or Python dependencies are required.

1. Run a simple local server

   ```bash
   python -m http.server
   ```
2. Open your browser

   ```
   http://localhost:8000
   ```

---

## 📊 Dataset

* **Sources**

  * Face Shape: Public datasets from platforms such as Kaggle, combined with limited self-captured experimental data
  * Personal Tone: Public skin tone datasets from open research repositories

* **Size**: **8,720 images** in total

  * Face Shape: 4,000 images
    (Heart / Oblong / Oval / Round / Square — 800 per class)
  * Personal Tone: 4,720 images
    (Cool: 2,334 / Warm: 2,386)

* **License**
  All datasets are used strictly for **academic and non-commercial purposes**, in compliance with the original licenses.

---

## 🧠 Model

* **Tool**: Google Teachable Machine
* **Export Format**: TensorFlow.js

### 📈 Performance

* **Face Shape Classification**

  * Overall Accuracy: **88%**
  * Oval class achieved **100% accuracy**

* **Personal Tone Classification**

  * Accuracy: **88%**

* **Latency**

  * Average inference time: **under 0.5 seconds**

* **Face Detection**

  * BlazeFace is integrated to improve real-time face detection and tracking stability

---

## 🛠️ Workflow

1. 📷 **Input**
   The user provides a facial image via webcam or image upload

2. 🧩 **Detection**
   Face detection is performed using BlazeFace

3. 🔍 **Analysis**
   The system analyzes either face shape or personal tone

4. 🤖 **Prediction**

   * Face Shape: Heart / Oblong / Oval / Round / Square
   * Personal Tone: Cool / Warm

5. 💇 **Suggestion**
   Personalized hairstyle or color palette recommendations are generated

6. 🪞 **Preview**
   A real-time AR-style overlay allows users to preview the recommended style

---

## 🔐 Ethics & Privacy

* User images are **never stored or transmitted**
* All inference runs **locally in the browser**
* Dataset limitations and bias were documented and addressed through an Error Board

---

## 🙌 Credits

* **Team**: AI StyleMate Group 21 (Kyungmin Lee, Dahye Kim, Hyojin Kim, Kyuwon Lee, Yerim Seok)
* **Data**: Kaggle, Open Research Skin Tone Datasets
* **Tools**: TensorFlow.js, Google Teachable Machine, BlazeFace

---

## 📌 Notes

* This project is intended for **academic, non-commercial use only**.
* The web interface is fully responsive for both desktop and mobile environments.
