const { OpenAI } = require('openai');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com';

const DEEPSEEK_MODELS = {
  CHAT: 'deepseek-chat',
  CODER: 'deepseek-coder'
};

// Crear cliente OpenAI configurado para DeepSeek solo si hay API key
let deepseekClient = null;
if (DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'sk-your-deepseek-api-key-here' && 
    !DEEPSEEK_API_KEY.includes('invalid') && !DEEPSEEK_API_KEY.includes('expired') && 
    DEEPSEEK_API_KEY.length >= 20) {
  
  deepseekClient = new OpenAI({
    baseURL: DEEPSEEK_API_URL,
    apiKey: DEEPSEEK_API_KEY,
  });
}

const deepseek = {
  async chat(messages, model = DEEPSEEK_MODELS.CHAT) {
    try {
      // Verificar si tenemos cliente configurado
      if (!deepseekClient) {
        throw new Error('DeepSeek API not configured - using local fallback');
      }

      const response = await deepseekClient.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000
      });

      return response;
    } catch (error) {
      console.error('DeepSeek API error:', error.message);
      throw new Error('Error calling DeepSeek API');
    }
  }
};

module.exports = { deepseek, DEEPSEEK_MODELS };
