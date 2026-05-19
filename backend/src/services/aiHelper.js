const Groq = require('groq-sdk');

const cache = new Map();
const MAX_CACHE_SIZE = 100;

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanJSON = (content) => {
  return content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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
  if (cache.has(prompt)) return cache.get(prompt);

  const groq = getGroq();

  for (let i = 0; i < 3; i++) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content?.trim();
      if (!content) throw new Error('EMPTY_RESPONSE');

      const cleaned = cleanJSON(content);
      const parsed = extractJSON(cleaned, type);
      if (!parsed) throw new Error('PARSE_FAILED');

      if (cache.size > MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(prompt, parsed);
      return parsed;

    } catch (err) {
      if (err?.status === 429 || err.message?.includes('429')) {
        console.log(`Rate limited, retrying in ${2000 * (i + 1)}ms...`);
        await sleep(2000 * (i + 1));
      } else {
        console.error('Groq AI Error:', err.message);
        break;
      }
    }
  }
  throw new Error('AI_FAILED');
};

module.exports = { generateAI };