const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAR_OUcwYBRlGMuojOVOYFSVn0AS9TzVxs");
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (error) {
    console.error("Gemini Error:", error);
  }
}
test();
