require('dotenv').config();
const { generateImageAnalysis } = require('./services/aiService');

const test = async () => {
    // 1x1 pixel black JPEG base64
    const base64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    const prompt = `You are an expert Indian and international food nutritionist with deep knowledge of all cuisines including Indian dishes like vermicelli (sewaiyan/sevai), poha, upma, khichdi, dal, sabzi, roti, paratha, biryani, pulao, dosa, idli, etc.

Analyze this food image carefully. You MUST try your best to identify the food. Even if the image is slightly blurry or the food is uncommon, make your best educated guess. Do NOT say you cannot identify — always attempt.

ONLY return this JSON if you are absolutely certain the image contains NO food at all (e.g., a phone, a car, a person without food):
{"error": "No food detected in this image."}

For ANY image that contains food or drink (even partially visible), respond with this JSON:
{
  "name": "Detailed name of the meal (use common Indian/English name)",
  "quantity": "Estimated total quantity (e.g., 1 bowl, 2 rotis, 150g)",
  "calories": 450,
  "protein": 30,
  "carbs": 50,
  "fats": 15,
  "fiber": 3,
  "isVegetarian": true,
  "confidence": 0.85
}

Rules:
- ALWAYS respond with valid JSON only, no markdown, no extra text
- Use realistic Indian nutritional values
- If multiple food items are visible, combine them into one total
- Never refuse to identify food — make your best guess`;

    try {
        const text = await generateImageAnalysis(prompt, base64);
        console.log("Raw Response:");
        console.log(text);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
