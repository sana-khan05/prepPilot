const { GoogleGenerativeAI } = require('@google/generative-ai');

const cache = new Map();
const MAX_CACHE_SIZE = 100;

const getModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanJSON = (content) => {
  return content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
};

const extractJSON = (content, type) => {
  try {
    if (type === 'array') {
      const match = content.match(/\[[\s\S]*\]/);
      return match ? JSON.parse(match[0]) : null;
    } else {
      const match = content.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    }
  } catch {
    return null;
  }
};

const generateAI = async (prompt, type = 'object') => {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const model = getModel();

  for (let i = 0; i < 3; i++) {
    try {
      const result = await model.generateContent(prompt);
      const content = result.response.text().trim();
      const cleaned = cleanJSON(content);
      const parsed = extractJSON(cleaned, type);

      if (!parsed) throw new Error('EMPTY_RESPONSE');

      if (cache.size > MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(prompt, parsed);
      return parsed;

    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 429 || err.message?.includes('429')) {
        console.log(`Rate limited, retrying in ${2000 * (i + 1)}ms...`);
        await sleep(2000 * (i + 1));
      } else {
        console.error('AI Error:', err.message);
        break;
      }
    }
  }

  throw new Error('AI_FAILED');
};

module.exports = { generateAI };