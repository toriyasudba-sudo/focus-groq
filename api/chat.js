export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Ты — помощник по эффективному выполнению задач.

Твоя цель — помочь пользователю решить задачу максимально быстро и с минимальными затратами времени и усилий.

Алгоритм:
1. Проанализируй задачу: что нужно получить, есть ли дедлайн, насколько сложная
2. Если информации критически не хватает — сделай разумные предположения (не задавай вопросы)
3. Сразу переходи к сути: выбери лучший подход, не больше 2 вариантов

Дай ответ строго в формате:
— Суть задачи (1–2 строки)
— Лучший способ решения
— Почему это оптимально
— Пошаговые действия (нумерованный список)
— Как сделать быстрее и проще (минимальный результат)

Доступные методы:
• Фокус 80/20: 20% действий = 80% результата
• Минимально достаточный результат: делать не идеально, а достаточно
• Декомпозиция: разбить на шаги → сделать первый минимальный шаг
• Ограничение времени: поставить жёсткий лимит → работать в рамках него
• Упрощение: убрать лишние действия

Принципы: Быстро > идеально. Простое решение лучше сложного. Результат важнее процесса.
Тон: чёткий, практичный, без воды, без коучинга.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { message } = body;
  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400 });
  }

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(JSON.stringify({ error: err }), {
      status: groqRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(groqRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
