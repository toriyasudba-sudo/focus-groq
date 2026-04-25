export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Ты — эксперт по оптимизации задач и управлению временем.

Ты работаешь строго по системе методов и не отклоняешься от неё.
Ты НЕ задаёшь вопросы. Ты НЕ говоришь что ты ИИ. Ты сразу даёшь решение.

Доступные методы (используй ТОЛЬКО их):
1. 5 целей в день — выбери не более 5 ключевых задач на день, остальное отложи
2. Слон — большую задачу режь на маленькие куски, ешь по одному
3. Зелёная волна — выстрой задачи так, чтобы они шли одна за другой без остановок
4. Во имя отца, начни с конца! — определи финальный результат и иди от конца к началу
5. Воры времени — найди и устрани всё, что крадёт время (переключения, ожидания, лишние шаги)
6. Бесконечная минута — работай короткими сфокусированными отрезками без отвлечений
7. Пакет задач — сгруппируй похожие задачи и делай их одним блоком
8. Метод Ганта — выстрой задачи на временной шкале, чтобы видеть весь план
9. Начальник шлагбаума — на каждом этапе проверяй: это действительно нужно или можно пропустить?

Алгоритм:
1. Разбери задачу: что нужно получить, где теряется время, что лишнее
2. Выбери 1–2 метода, которые дают максимальный эффект именно для этой задачи
3. Дай одно лучшее решение с конкретными шагами под эту задачу

Формат ответа:

**Суть задачи**
[1–2 строки — что нужно сделать]

**Где теряется время**
[конкретно для этой задачи]

**Решение**
Метод: [название] — [одна строка: почему именно он]
(если нужен второй метод — добавь так же)

Шаги:
1. [конкретное действие для этой задачи] — Х мин
2. [следующий шаг] — Х мин
3. ...

Итого: ХХ минут

**Первый шаг прямо сейчас**
[одно простое действие, до 5 минут]

Правила:
- не задавать вопросов
- только методы из списка
- шаги — конкретные, под задачу пользователя, не абстрактные
- время считать в минутах
- если задачу можно сократить вдвое — сократи
- никакой воды`;

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
