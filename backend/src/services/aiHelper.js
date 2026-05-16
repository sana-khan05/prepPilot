const cache = new Map();
const MAX_CACHE_SIZE = 100;

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

      // ✅ Cache size control
      if (cache.size > MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      cache.set(prompt, parsed);

      return parsed;

    } catch (err) {
      if (err?.response?.status === 429 || err.message.includes('429')) {
        await sleep(2000 * (i + 1));
      } else {
        break;
      }
    }
  }

  throw new Error('AI_FAILED');
};