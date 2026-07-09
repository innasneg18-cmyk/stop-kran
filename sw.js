const CACHE_NAME = 'stop-kran-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Небольшой набор контента для показа паузы, когда приложение полностью закрыто
// (push присылает только сигнал "пора", содержимое выбирается прямо здесь)
const SW_CONTENT = {
  grounding: { label: 'Заземление', items: [
    { title:'Пять вещей вокруг', body:'Назови пять предметов, которые видишь прямо сейчас. Стол считается.' },
    { title:'Стопы на полу', body:'Почувствуй, как стопы касаются пола. Обе — левую часто забывают.' },
    { title:'Три вдоха подлиннее', body:'Сделай три вдоха медленнее обычного. Выдох длиннее вдоха.' },
    { title:'Плечи вниз', body:'Проверь плечи. Скорее всего, они у ушей. Опусти.' },
    { title:'Челюсть', body:'Проверь челюсть — она наверняка сжата. Разожми.' },
    { title:'Рука на груди', body:'Положи ладонь на грудь. Почувствуй дыхание под ней.' },
    { title:'Взгляд вдаль', body:'Найди самую дальнюю точку, которую видно отсюда, задержи взгляд.' },
    { title:'Растяни пальцы', body:'Растопырь пальцы рук как можно шире, подержи три секунды.' },
  ]},
  question: { label:'Вопрос', items: [
    { title:'Что было час назад?', body:'Опиши, чем ты занимался последний час. Если пришлось напрячься — это ответ.' },
    { title:'Сколько раз доставал телефон?', body:'Прикинь на глаз, а потом сравни с реальным числом.' },
    { title:'Где болит?', body:'Не метафора. Просканируй тело — шея, спина, глаза.' },
    { title:'Что ты откладываешь третий день подряд?', body:'Просто назови вслух, что это.' },
    { title:'Сколько раз сегодня ты правда выбирал?', body:'А не просто плыл по течению.' },
    { title:'Что сейчас происходит у тебя в теле?', body:'Не в голове — в теле. Часто это разные новости.' },
  ]},
  quote: { label:'Цитата', items: [
    { body:'Занятость — не достижение. Это просто занятость.' },
    { body:'Прокрастинация — откладываешь дело. Диссоциация — откладываешь саму жизнь.' },
    { body:'День, прожитый на автомате, всё равно засчитывается. Просто без свидетелей.' },
    { body:'Многозадачность — способ делать несколько дел одинаково невнимательно.' },
    { body:'Отдых — не награда за продуктивность. Он не обязан её заслуживать.' },
    { body:'Спешка обычно экономит минуты, а тратит дни.' },
    { body:'Усталость — это не слабость характера. Это просто усталость.' },
  ]},
  story: { label:'История', items: [
    { body:'Один человек десять лет мечтал о поездке к морю. Приехал — весь день проверял почту на пляже.' },
    { body:'Кот наблюдал за хозяином три часа: тот печатал, вздыхал, снова печатал. Кот так и не понял, зачем.' },
    { body:'Программист поставил себе напоминание «отдохнуть» — и закрыл его не глядя, как обычное уведомление.' },
    { body:'Ребёнок звал отца посмотреть на радугу. Тот ответил «секунду» — вышел, когда радуга уже ушла.' },
  ]}
};

function pickRandom(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Настоящий push с сервера — сработает, даже если приложение полностью закрыто
self.addEventListener('push', (event) => {
  const cats = Object.keys(SW_CONTENT);
  const cat = pickRandom(cats);
  const group = SW_CONTENT[cat];
  const item = pickRandom(group.items);
  const title = 'Стоп-кран · ' + group.label;
  const body = item.title ? (item.title + ' — ' + item.body) : item.body;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'stop-kran-pause',
      renotify: true,
      vibrate: [80, 40, 80]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./index.html');
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // кэшируем свежую копию на будущее
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
