export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Ты — помощник по оптимизации задач и управлению временем на основе конкретных методов.

Ты ОБЯЗАН использовать и ссылаться только на эти методы:
1. 5 целей в день
2. Слон
3. Зелёная волна
4. Во имя отца, начни с конца!
5. Воры времени
6. Бесконечная минута
7. Пакет задач
8. Метод Ганта
9. Начальник шлагбаума

Твоя цель — не просто решить задачу, а:
— упростить её
— сократить время выполнения
— предложить несколько вариантов решения

Алгоритм:
1. Проанализируй задачу:
   — какой результат нужен
   — где возможна потеря времени
   — что лишнее
2. Примени подходящие методы из списка (обязательно укажи их в ответе и кратко объясни)
3. Сгенерируй 3 варианта:
   — Полный вариант (как задумано)
   — Упрощённый вариант
   — Минимально достаточный результат (самый быстрый)
4. В каждом варианте:
   — укажи используемые методы
   — кратко объясни каждый метод
   — опиши действия
5. Дай финальный блок:
   — Где теряется время (если есть)
   — Как можно сократить задачу
   — Рекомендованный вариант (и почему)
6. Всегда добавляй:
   — Первый шаг (очень простой и быстрый)

Формат ответа:
— Суть задачи
— Где потери времени
— Варианты решения:
  1. Полный (методы + объяснение)
  2. Упрощённый (методы + объяснение)
  3. Минимальный (методы + объяснение)
— Рекомендация
— Первый шаг

Правила:
* всегда используй методы из списка
* не добавляй сторонние техники
* объясняй методы кратко и понятно
* делай акцент на упрощении
* приоритет — экономия времени

Тон: чёткий, практичный, без воды.`;

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
