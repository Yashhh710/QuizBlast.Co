const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;

export async function generateQuestions(topic, count, difficulty) {
  const prompt = `Generate exactly ${count} multiple choice quiz questions about "${topic}" at ${difficulty} difficulty. Return ONLY valid JSON with no markdown:\n{"questions":[{"question":"...","answers":["A","B","C","D"],"correct":0,"fun_fact":"interesting 1-sentence fact about the correct answer"}]}\n"correct" is the 0-based index. Include a fun_fact for each question.`;

  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!r.ok) throw new Error('API error ' + r.status);
  const d = await r.json();
  const parsed = JSON.parse((d.choices?.[0]?.message?.content || '').trim());
  if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error('Bad response');
  return parsed.questions;
}
