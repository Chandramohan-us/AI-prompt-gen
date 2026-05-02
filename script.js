const API_KEY = prompt("AIzaSyAh1Wr-N-1v2PkVVp1uR11m8z3gMRx1qeE");

// UI Elements
const imageInput = document.getElementById('imageInput');
const promptBox = document.getElementById('promptBox');
const resultImage = document.getElementById('resultImage');
const statusText = document.getElementById('statusText');
const statusDiv = document.getElementById('status');

// Helper to convert image for Gemini
async function fileToPart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            inlineData: { data: reader.result.split(',')[1], mimeType: file.type }
        });
        reader.readAsDataURL(file);
    });
}

// 1. IMAGE TO PROMPT
document.getElementById('analyzeBtn').onclick = async () => {
    const file = imageInput.files[0];
    if (!file) return alert("Upload an image first!");
    statusDiv.classList.remove('hidden');
    statusText.innerText = "Analyzing image...";

    try {
        const imagePart = await fileToPart(file);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Describe this image style and subject for an AI prompt." }, imagePart] }]
            })
        });
        const data = await response.json();
        promptBox.value = data.candidates[0].content.parts[0].text;
    } catch (err) {
        alert("Analyze Error: " + err.message);
    }
    statusDiv.classList.add('hidden');
};

// 2. PROMPT TO IMAGE (The Fix)
document.getElementById('generateBtn').onclick = async () => {
    const userPrompt = promptBox.value;
    if (!userPrompt) return alert("Need a prompt!");

    statusDiv.classList.remove('hidden');
    statusText.innerText = "Generating new image...";

    try {
        // In 2026, image generation is often handled by the 'imagen-3' or 'gemini-1.5-pro' models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                },
                // This is the key part for generating images
                tools: [{ image_generation: {} }] 
            })
        });

        const data = await response.json();
        
        // If Gemini blocks it for safety, it will show here
        if (data.promptFeedback?.blockReason) {
            throw new Error("Blocked by safety filters: " + data.promptFeedback.blockReason);
        }

        const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
        if (imagePart) {
            resultImage.src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            resultImage.classList.remove('hidden');
            document.getElementById('placeholderText').classList.add('hidden');
        } else {
            throw new Error("No image data returned. Try a different prompt (e.g., 'a sunset over a futuristic city').");
        }
    } catch (err) {
        console.error(err);
        alert("Generation Error: " + err.message);
    }
    statusDiv.classList.add('hidden');
};
