const API_KEY = "AIzaSyAh1Wr-N-1v2PkVVp1uR11m8z3gMRx1qeE";
const analyzeBtn = document.getElementById('analyzeBtn');
const generateBtn = document.getElementById('generateBtn');
const imageInput = document.getElementById('imageInput');
const promptBox = document.getElementById('promptBox');
const resultImage = document.getElementById('resultImage');
const loading = document.getElementById('loading');
const preview = document.getElementById('preview');

// Preview the uploaded image
imageInput.onchange = evt => {
    const [file] = imageInput.files;
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
    }
}

// Function to convert image to Base64
async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
}

// Action 1: Image to Prompt
analyzeBtn.addEventListener('click', async () => {
    const file = imageInput.files[0];
    if (!file) return alert("Please upload an image first!");

    loading.classList.remove('hidden');
    const imagePart = await fileToGenerativePart(file);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Analyze this image and write a detailed, creative artistic prompt to recreate this style in an AI image generator." },
                        imagePart
                    ]
                }]
            })
        });
        const data = await response.json();
        promptBox.value = data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error(error);
        alert("Error analyzing image.");
    }
    loading.classList.add('hidden');
});

// Action 2: Prompt to Image
generateBtn.addEventListener('click', async () => {
    const promptText = promptBox.value;
    if (!promptText) return alert("Please get or type a prompt first!");

    loading.classList.remove('hidden');
    resultImage.classList.add('hidden');

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                config: { response_modalities: ["IMAGE"] }
            })
        });
        const data = await response.json();
        
        // Find the image part in the response
        const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
        if (imagePart) {
            resultImage.src = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
            resultImage.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        alert("Error generating image.");
    }
    loading.classList.add('hidden');
});
