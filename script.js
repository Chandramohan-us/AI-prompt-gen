// Step 1: Securely ask for the key
const API_KEY = prompt("AIzaSyAh1Wr-N-1v2PkVVp1uR11m8z3gMRx1qeE");

// Config
const MODEL_NAME = "gemini-2.5-flash"; // The 2026 workhorse model
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

// UI Elements
const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const previewContainer = document.getElementById('previewContainer');
const analyzeBtn = document.getElementById('analyzeBtn');
const promptBox = document.getElementById('promptBox');
const generateBtn = document.getElementById('generateBtn');
const resultImage = document.getElementById('resultImage');
const placeholderText = document.getElementById('placeholderText');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('statusText');

// 1. Handle Image Preview
imageInput.onchange = evt => {
    const [file] = imageInput.files;
    if (file) {
        preview.src = URL.createObjectURL(file);
        previewContainer.classList.remove('hidden');
    }
};

// Helper: Convert file to Base64 for the API
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            inlineData: {
                data: reader.result.split(',')[1],
                mimeType: file.type
            }
        });
        reader.readAsDataURL(file);
    });
}

// Action 1: Get Prompt from Image
analyzeBtn.onclick = async () => {
    const file = imageInput.files[0];
    if (!file || !API_KEY) return alert("Upload an image and ensure API key is set!");

    statusDiv.classList.remove('hidden');
    statusText.innerText = "Analyzing image and writing prompt...";
    
    const imagePart = await fileToPart(file);

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Act as an AI art prompt engineer. Describe this image in a way that I can use the description as a prompt to generate a new, similar high-quality image." },
                        imagePart
                    ]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        promptBox.value = data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    } finally {
        statusDiv.classList.add('hidden');
    }
};

// Action 2: Generate New Image
generateBtn.onclick = async () => {
    const prompt = promptBox.value;
    if (!prompt || !API_KEY) return alert("Write a prompt first!");

    statusDiv.classList.remove('hidden');
    statusText.innerText = "Generating new image (takes ~5-10 seconds)...";
    resultImage.classList.add('hidden');
    placeholderText.classList.remove('hidden');

    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                config: { 
                    response_modalities: ["IMAGE"] // Tell Gemini to output pixels
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        // Find the image part in the response candidates
        const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
        if (imagePart) {
            resultImage.src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            resultImage.classList.remove('hidden');
            placeholderText.classList.add('hidden');
        }
    } catch (err) {
        console.error(err);
        alert("Generation Error: " + err.message);
    } finally {
        statusDiv.classList.add('hidden');
    }
};
