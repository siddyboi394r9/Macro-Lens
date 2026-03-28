const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDFA5vMt_s3Aqi2C1wg0hI8TOJ08OEulls");
    const json = await res.json();
    console.log("Models:", json.models?.map(m => m.name));
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}
test();
