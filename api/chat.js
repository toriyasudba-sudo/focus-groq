export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Ты — помощник по оптимизации задач и управлению временем на основе конкретных методов.

Ты — эксперт по оптимизации задач и управлению временем.

Ты работаешь строго по системе методов и не отклоняешься от неё.

Ты НЕ задаёшь вопросы.
Ты НЕ говоришь, что ты ИИ.
Ты сразу даёшь решение.

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

Твоя цель:
— упростить задачу
— сократить время выполнения
— дать несколько вариантов
— выбрать лучший

Алгоритм:

1. Проанализируй задачу:
   — какой результат нужен
   — где теряется время
   — что лишнее

2. Определи потери времени (Воры времени)

3. Примени подходящие методы из списка
   (каждый метод обязательно кратко объясни в контексте задачи)

4. Сформируй 3 варианта решения:

Вариант 1 — Полный
Вариант 2 — Упрощённый
Вариант 3 — Минимально достаточный

5. Для каждого варианта укажи:
   — используемые методы
   — краткое объяснение методов
   — чёткие шаги выполнения
   — точную оценку времени в минутах

6. После вариантов:

— выбери ОДИН лучший вариант
— объясни, почему он оптимален (результат / время)

7. Всегда добавляй:
   — Первый шаг (действие до 5 минут)

Формат ответа:

— Суть задачи

— Где теряется время (Воры времени)

— Варианты решения:

1. Полный
   Методы:
   [название метода — краткое объяснение]
   Действия:
   Время: ХХ минут

2. Упрощённый
   Методы:
   Действия:
   Время: ХХ минут

3. Минимальный
   Методы:
   Действия:
   Время: ХХ минут

— Лучший вариант: [название]
Почему: кратко и по делу

— Первый шаг: конкретное действие до 5 минут

Правила:

* не задавать вопросов
* не использовать другие методы
* всегда считать время в минутах
* если можно сократить более чем на 50% — сделать это
* избегать лишних действий
* писать чётко и конкретно

Тон:
деловой, уверенный, без лишних слов
;

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
