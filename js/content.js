/* =====================================================================
   ДОБЕГИ ДО КВАРТИРЫ — содержимое мира

   Каталог препятствий, районы Москвы, пародийные бренды и реклама.
   Только данные: как всё это рисуется — в art.js и city.js.
   ===================================================================== */
(function (K) {
'use strict';

/* Пародийные бренды, их вывески и рекламные строчки — в brands.js */

/* ───────────────────────── РАЙОНЫ ─────────────────────────
   tags — по ним подбираются препятствия. front/back/far/props — что стоит в кадре
   и с каким весом ([вид, вес]). Виды описаны в city.js.
   far — рядовой силуэт вдали; skyline — знаковые силуэты района; landmarks — знаковые места в ближнем ряду.
   И те и другие встречаются не в каждый заход в район, по одному и по очереди.
   Как часто попадаются магазины, реклама и знаковые места — CONFIG.city в config.js. */
K.LOCATIONS = [
  {
    id: 'yard', name: 'ОБЫЧНЫЙ ДВОР', short: 'Двор', note: 'шлагбаум, лавочка, ПВЗ', street: 'Тупиковый пр.',
    tags: ['yard', 'residential'],
    sky: ['#F4F6F7', '#E6EBEE'], farColor: '#DADFE4', foliage: ['#BFCDB0', '#B2C1A2'],
    far: [['blocks', 5], ['chimneys', 2], ['ostankino', 0.3]],
    back: { kinds: [['panel', 5], ['panelTall', 3], ['khrush', 2]], colors: ['#D5D9DE', '#CCD1D7'], win: '#B9BFC7', lit: '#FFFFFF' },
    front: { styles: [['panel', 4], ['panelShop', 3.5], ['khrush', 2], ['garages', 1.2]], walls: ['#D9DCD6', '#D6D2C8', '#CFD6DB'], trim: '#C4C8C2', glass: '#BCC9D0', roof: '#B9BDB8' },
    props: [['tree', 5], ['granny', 1.4], ['bench', 1], ['playground', 2.2], ['lamp', 3], ['parkedCar', 3], ['parkedVan', 1], ['kiosk', 0.6]],
    brands: ['Шестёрочка', 'Пыжик', 'Дикие ягоды', 'Перекос', 'СДАЙ', 'Обзвон', 'Белое & Красное', '36,6 м²', 'Fix Rent', 'Съём'],
    traffic: [['car', 5], ['van', 2], ['taxi', 1]],
  },
  {
    id: 'textil', name: 'ТЕКСТИЛЬЩИКИ', short: 'Текстильщики', note: 'гаражи, промзона и новостройка между ними', street: 'Волгоградский пр-т',
    tags: ['industrial', 'residential'],
    sky: ['#F3F3F1', '#E5E4DF'], farColor: '#D6D5CF', foliage: ['#BEC6A8', '#B0B99A'],
    far: [['chimneys', 4], ['blocks', 3], ['cranes', 2]],
    back: { kinds: [['factory', 3], ['panel', 3], ['newblock', 2], ['khrush', 2], ['site', 1.5]], colors: ['#D2CFC8', '#C8C5BD'], win: '#B5B1A8', lit: '#FFFFFF' },
    front: { styles: [['panel', 2.5], ['panelShop', 2.5], ['garages', 2.5], ['fence', 2], ['newShop', 1.5], ['khrush', 2]], walls: ['#D3CEC2', '#CDB7A6', '#D8D2CB'], trim: '#BDB7AA', glass: '#B8C2C6', roof: '#ADA79B' },
    props: [['lamp', 4], ['tree', 2.5], ['billboard', 2], ['busstop', 2], ['parkedCar', 2.5], ['parkedVan', 1.5], ['metro', 1]],
    brands: ['Компас', 'Перекос', 'Шестёрочка', 'Fix Rent', 'Рента', 'Белое & Красное', 'Дикие ягоды', 'СДАЙ', 'М².Видео', 'Жилайн', "Rentic's"],
    traffic: [['car', 4], ['van', 3], ['bus', 2], ['taxi', 1]],
  },
  {
    id: 'sokol', name: 'СОКОЛ', short: 'Сокол', note: 'сталинки, широкий проспект и самолёты', street: 'Ленинградский пр-т',
    tags: ['residential', 'stalin'],
    sky: ['#F6F4EE', '#EAE5D9'], farColor: '#DDD6C6', foliage: ['#BDCAA6', '#AFBD97'], skyFx: 'plane',
    far: [['blocks', 3], ['roofs', 2]], skyline: ['rechnoy', 'vysotka'],
    back: { kinds: [['stalin', 4], ['old', 2], ['panelTall', 1.5]], colors: ['#D9CFBA', '#D0C5AE'], win: '#B5A88F', lit: '#FFF6D6' },
    front: { styles: [['stalin', 4], ['stalinShop', 4], ['old', 1]], walls: ['#DCCFB6', '#D6C5A8', '#E0D4BF'], trim: '#EDE4D0', glass: '#B9C3C4', roof: '#B8AB93' },
    props: [['lamp', 4], ['treeBig', 4], ['busstop', 2], ['metro', 1.5], ['billboard', 1.5], ['bench', 1.5], ['parkedCar', 2]],
    brands: ['ВкусДом', 'Белое & Красное', 'Cofish', 'Перекос', 'АвиСдано', 'Съём', '36,6 м²', 'Ипотечница', 'Аренда-Банк', 'Снимай-город'],
    traffic: [['car', 5], ['bus', 2], ['taxi', 2], ['van', 1]],
  },
  {
    id: 'vdnh', name: 'ВДНХ', short: 'ВДНХ', note: 'павильоны, фонтаны и башня', street: 'пр-т Мира',
    tags: ['park', 'tourist', 'pedestrian'],
    sky: ['#F3F7F9', '#E3EDF2'], farColor: '#D5DFE6', foliage: ['#B9CFA6', '#A9C195'],
    far: [['treeline', 4], ['blocks', 2]], skyline: ['ostankino', 'ferris'],
    back: { kinds: [['pavilionBack', 5], ['old', 1.5], ['panelTall', 0.5]], colors: ['#E6E1D2', '#DDD7C6'], win: '#C2B99F', lit: '#FFF6D6' },
    front: { styles: [['pavilion', 3], ['parkFence', 4.5]], walls: ['#EDE9DC', '#E6E0CF'], trim: '#F6F2E6', glass: '#C4CFD2', roof: '#D9C27A' },
    props: [['treeBig', 5], ['lamp', 3], ['bench', 2], ['fountain', 1.6], ['kiosk', 2], ['flower', 2], ['citylight', 1.2]],
    landmarks: ['vdnhArch', 'rocket'],
    brands: ['Вкусно и запятая', 'StarБакс', 'Додо Крыша', 'Крошка Однушка', "Rentic's", 'Cofish'],
    traffic: [['car', 3], ['bus', 3], ['taxi', 2]],
  },
  {
    id: 'zil', name: 'ЗИЛ', short: 'ЗИЛ', note: 'был завод, стал «квартал у набережной»', street: 'б-р Братьев Весниных',
    tags: ['construction', 'newbuild', 'embankment'],
    sky: ['#F2F5F7', '#E2E8EC'], farColor: '#D5DCE2', foliage: ['#BDCBB0', '#AEBDA0'],
    far: [['cranes', 4], ['blocks', 3]], skyline: ['shater'],
    back: { kinds: [['newblock', 5], ['site', 3], ['glass', 1.5]], colors: ['#D4D9DD', '#C9CFD4'], win: '#B0B8BF', lit: '#FFFFFF' },
    front: { styles: [['newbuild', 4], ['newShop', 3], ['stroyka', 2], ['embankment', 1.6]], walls: ['#D9DDE0', '#CDB9A8', '#C9D3D9'], trim: '#BFC6CB', glass: '#B4C3CC', roof: '#A9B1B7' },
    props: [['lamp', 4], ['tree', 2], ['billboard', 2.5], ['citylight', 2], ['parkedCar', 2], ['busstop', 1]],
    brands: ['Мегаквартир', 'Fix Rent', 'Домтык', 'ЦИРАН', 'ВкусДом', 'Ипотекеа', 'СамоСнял', 'Обзвон', 'Аванс', 'Т-Залог', 'Додо Крыша'],
    traffic: [['car', 4], ['van', 3], ['taxi', 2]],
  },
  {
    id: 'arbat', name: 'АРБАТ', short: 'Арбат', note: 'туристы, музыканты, матрёшки', street: 'ул. Арбат',
    tags: ['tourist', 'center', 'pedestrian'],
    sky: ['#F8F4EC', '#EFE6D6'], farColor: '#E0D6C4', foliage: ['#C2CCA6', '#B4BF97'],
    far: [['roofs', 4], ['blocks', 1]], skyline: ['vysotka'],
    back: { kinds: [['old', 4], ['stalin', 2], ['tower', 1.2]], colors: ['#DDD1BC', '#D4C7B0'], win: '#B6A88F', lit: '#FFF6D6' },
    front: { styles: [['old', 3], ['stalin', 0.8], ['oldShop', 5]], walls: ['#E6D2B5', '#D9C3C0', '#C9D6C4', '#E3D9A8'], trim: '#F4EFE4', glass: '#BCC6C6', roof: '#A99C8C' },
    props: [['lampOld', 6], ['bench', 2], ['kiosk', 1.5], ['flower', 1.5], ['citylight', 1]],
    landmarks: ['wall', 'theatre'],
    brands: ['Вкусно и запятая', 'StarБакс', 'Burger Царь', 'Cofish', 'Додо Крыша', 'Снимай-город', 'Грабёж', "Л'Этаж", 'Ипотечница', 'Крошка Однушка'],
    traffic: [['taxi', 3], ['car', 3], ['courier', 2]],
  },
  {
    id: 'kitay', name: 'КИТАЙ-ГОРОД', short: 'Китай-город', note: 'до Кремля рукой подать', street: 'ул. Варварка',
    tags: ['tourist', 'center'],
    sky: ['#F7F3EC', '#ECE3D4'], farColor: '#DCC3B4', foliage: ['#BFCBA6', '#B0BD96'],
    far: [['roofs', 4], ['blocks', 0.6]], skyline: ['kremlin', 'basil'],
    back: { kinds: [['old', 4], ['church', 2], ['stalin', 1.5]], colors: ['#DDD2BE', '#D3C7B1'], win: '#B5A78E', lit: '#FFF6D6' },
    front: { styles: [['old', 4], ['oldShop', 4], ['stalin', 1.5], ['stalinShop', 1], ['parkFence', 1.6]], walls: ['#E2D5BD', '#D8C7B0', '#E8DFC9', '#D6CDBE'], trim: '#F3EDE0', glass: '#BAC4C4', roof: '#A7998A' },
    props: [['lampOld', 4], ['lamp', 2], ['tree', 2], ['metro', 2], ['bench', 1.5], ['citylight', 1.5]],
    landmarks: ['bridge'],
    brands: ['Белое & Красное', 'StarБакс', 'Вкусно и запятая', 'Cofish', 'АвиСдано', 'Снимай-город', 'Аренда-Банк', "Л'Этаж", 'Грабёж'],
    traffic: [['taxi', 4], ['car', 3], ['bus', 1.5]],
  },
  {
    id: 'khamovniki', name: 'ХАМОВНИКИ', short: 'Хамовники', note: 'тихие дворы по цене громких', street: 'ул. Остоженка',
    tags: ['premium', 'center', 'construction'],
    sky: ['#F5F5F0', '#E8E8DC'], farColor: '#DAD9CC', foliage: ['#B9C9A4', '#AABB94'],
    far: [['roofs', 3], ['blocks', 1.5]], skyline: ['hhs', 'luzhniki'],
    back: { kinds: [['old', 3], ['newblock', 2], ['stalin', 2]], colors: ['#D8D3C5', '#CEC8B9'], win: '#B3AC9A', lit: '#FFF6D6' },
    front: { styles: [['old', 2.5], ['stalin', 1.5], ['newbuild', 2], ['newShop', 1.5], ['stroyka', 1], ['parkFence', 1.6], ['embankment', 1.4]], walls: ['#DAD3C3', '#C8AE9B', '#E0DACB', '#CFC8B8'], trim: '#EFEADD', glass: '#B7C2C4', roof: '#A59E90' },
    props: [['treeBig', 4], ['lamp', 3], ['parkedCar', 3], ['bench', 1], ['citylight', 1.5], ['billboard', 1]],
    landmarks: ['ges2'],
    brands: ['ВкусДом', 'Белое & Красное', 'Cofish', 'Мегаквартир', 'СДАЙ', 'Азбука Съёма', 'Золотой Метр', 'Съём', 'ЦИРАН'],
    traffic: [['car', 5], ['taxi', 2], ['van', 1]],
  },
  {
    id: 'patriki', name: 'ПАТРИКИ', short: 'Патрики', note: 'кофе по цене аренды', street: 'ул. Малая Бронная',
    tags: ['premium', 'center', 'park'],
    sky: ['#F8F5EE', '#EEE7D8'], farColor: '#DFD7C6', foliage: ['#B7CBA3', '#A8BD93'],
    far: [['roofs', 4], ['blocks', 1]], skyline: ['vysotka'],
    back: { kinds: [['old', 4], ['stalin', 2]], colors: ['#DCD2BE', '#D2C7B2'], win: '#B5A78F', lit: '#FFF6D6' },
    front: { styles: [['old', 2], ['oldShop', 5], ['stalin', 1]], walls: ['#E3D6BC', '#D8CDB9', '#E6DCC6', '#CDBFAE'], trim: '#F5EFE2', glass: '#BBC6C6', roof: '#A89B8B' },
    props: [['treeBig', 4], ['lampOld', 4], ['bench', 2], ['parkedCar', 3], ['flower', 1.5], ['kiosk', 0.8]],
    landmarks: ['pond'],
    brands: ['StarБакс', 'Cofish', 'ВкусДом', 'Вкусно и запятая', 'Белое & Красное', 'Азбука Съёма', 'Золотой Метр', "Л'Этаж", 'Грабёж'],
    traffic: [['car', 5], ['taxi', 3], ['courier', 2]],
  },
  {
    id: 'city', name: 'МОСКВА-СИТИ', short: 'Сити', note: 'стекло, бетон и переговорки', street: 'Пресненская наб.',
    tags: ['business', 'construction', 'premium', 'embankment'],
    sky: ['#EEF3F7', '#DCE6EE'], farColor: '#CFDAE4', foliage: ['#B9C9B4', '#AABBA5'],
    far: [['blocks', 3], ['cranes', 2]], skyline: ['city'],
    back: { kinds: [['cityTower', 6], ['glass', 2], ['site', 1]], colors: ['#C9D4DD', '#BCC9D4'], win: '#A4B5C3', lit: '#FFFFFF' },
    front: { styles: [['glass', 5], ['newShop', 1.5], ['stroyka', 1.5], ['embankment', 1.5]], walls: ['#C3D0DB', '#B4C4D1', '#CBD6DE'], trim: '#DDE6EC', glass: '#A9BCCB', roof: '#9FB2C2' },
    props: [['lamp', 4], ['citylight', 3], ['billboard', 2], ['parkedCar', 2.5], ['tree', 1], ['metro', 1.5]],
    brands: ['StarБакс', 'Burger Царь', 'Мегаквартир', 'ЦИРАН', 'Домтык', 'Т-Залог', 'Аренда-Банк', 'Съём', 'Жилайн', 'М².Видео'],
    traffic: [['car', 4], ['taxi', 4], ['van', 1]],
  },
];

/* ───────────────────────── КАТАЛОГ ПРЕПЯТСТВИЙ ─────────────────────────
   size       S / M / L — наземные, HIGH — над головой
   type       jump     — перепрыгнуть
              platform — можно запрыгнуть сверху и пробежать (машины, блоки, диван)
              duck     — пригнуться
              soft     — не убивает (лужа)
              pickup   — бонус (ключи)
   w, h       размер картинки в юнитах (33 юнита ≈ 1 метр)
   hit        зона столкновения [отступ по бокам, низ, верх]
   profile    для platform: участки крыши [от, до, высота]
   rarity     common / uncommon / rare / epic — как часто встречается
   minimumDistance, difficulty (1–5) — с какой дистанции и уровня сложности
   biome      где встречается: теги районов или 'any'; not — где не встречается
   score      бонус за редкий объект, увиденный впервые
   vx         своя скорость навстречу игроку
   text       что написано: 'meme' — риелторский мем, 'brand' — вывеска заведения из района, 'van' — борт фургона
   messages   что пишем, если игрок врезался */
const ANY = ['any'];

K.OBSTACLES = [
  /* ── S: маленькие ── */
  { id: 'cone', name: 'Дорожный конус', size: 'S', type: 'jump', w: 22, h: 28, hit: [5, 0, 23], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Тут ремонт. Третий год', 'Плитку перекладывают. Опять'] },
  { id: 'box', name: 'Коробка', size: 'S', type: 'jump', w: 34, h: 30, hit: [5, 0, 25], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Переезд. Опять. Третий раз за год', 'Коробки прошлого жильца. Хозяин просил не трогать'] },
  { id: 'bags', name: 'Мусорные пакеты', size: 'S', type: 'jump', w: 42, h: 24, hit: [6, 0, 19], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ['yard', 'residential', 'industrial'],
    messages: ['Мусор вывозят по вторникам. Сегодня среда'] },
  { id: 'suitcase', name: 'Чемодан', size: 'S', type: 'jump', w: 28, h: 44, hit: [4, 0, 32], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ['tourist', 'center', 'business'],
    messages: ['Турист ищет хостел. Нашёл тебя'] },
  { id: 'aboard', name: 'Штендер', size: 'S', type: 'jump', w: 30, h: 42, hit: [5, 0, 37], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY, text: 'meme',
    messages: ['«Агентам не звонить». Ты не агент, но всё равно больно'] },
  { id: 'washer', name: 'Стиральная машина', size: 'S', type: 'jump', w: 26, h: 32, hit: [4, 0, 28], rarity: 'uncommon', minimumDistance: 100, difficulty: 1, biome: ANY,
    messages: ['Стиралка есть. Не работает, но есть'] },

  /* ── M: средние ── */
  { id: 'bin', name: 'Урна', size: 'M', type: 'jump', w: 30, h: 42, hit: [5, 0, 37], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Урна. Единственная на весь район'] },
  { id: 'barrier', name: 'Ограждение', size: 'M', type: 'jump', w: 52, h: 42, hit: [5, 0, 37], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Хозяин решил сделать ремонт за твой счёт'] },
  { id: 'block', name: 'Бетонный блок', size: 'M', type: 'platform', w: 64, h: 30, profile: [[3, 61, 27]], rarity: 'common', minimumDistance: 60, difficulty: 1, biome: ['construction', 'industrial', 'newbuild', 'business', 'yard'],
    messages: ['Вид из окна: стройка до 2031 года'] },
  { id: 'terminal', name: 'Платёжный терминал', size: 'M', type: 'jump', w: 24, h: 50, hit: [4, 0, 45], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['Оплата только наличными. Терминал для красоты'] },
  { id: 'contract', name: 'Договор аренды', size: 'M', type: 'jump', w: 36, h: 48, hit: [6, 0, 42], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['Пункт 7.3: «и ещё одна комиссия»', 'Договор на 11 месяцев. Сам знаешь почему'] },
  { id: 'scooter', name: 'Самокат', size: 'M', type: 'jump', w: 42, h: 46, hit: [7, 0, 39], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['premium', 'center', 'business', 'tourist', 'park'],
    messages: ['Самокат припаркован по правилам. По своим'] },
  { id: 'bike', name: 'Велосипед', size: 'M', type: 'jump', w: 60, h: 40, hit: [8, 0, 33], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['park', 'premium', 'embankment', 'tourist'],
    messages: ['Велопрокат. Первые полчаса бесплатно, остальные — нет'] },
  { id: 'sofa', name: 'Диван', size: 'M', type: 'platform', w: 74, h: 34, profile: [[5, 69, 25]], rarity: 'rare', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['Диван хозяйский. Выбрасывать нельзя, сидеть тоже'] },
  { id: 'boxes', name: 'Стопка коробок', size: 'M', type: 'jump', w: 40, h: 60, hit: [6, 0, 54], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['Переезд. Опять. Третий раз за год'] },
  { id: 'bench', name: 'Скамейка', size: 'M', type: 'platform', w: 70, h: 34, profile: [[4, 66, 22]], rarity: 'common', minimumDistance: 120, difficulty: 1, biome: ['park', 'tourist', 'pedestrian', 'premium', 'center', 'stalin'],
    messages: ['Скамейка занята. Навсегда'] },
  { id: 'planter', name: 'Вазон', size: 'M', type: 'platform', w: 56, h: 40, profile: [[4, 52, 28]], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['center', 'pedestrian', 'premium', 'business', 'tourist', 'newbuild'],
    messages: ['Благоустройство. Вазон стоит дороже твоего залога'] },
  { id: 'dumpster', name: 'Мусорный бак', size: 'M', type: 'platform', w: 68, h: 48, profile: [[4, 64, 45]], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential', 'industrial', 'construction'],
    messages: ['Контейнерная площадка. Вид из окна включён в цену'] },
  { id: 'photographer', name: 'Фотограф с широкоугольником', size: 'M', type: 'jump', w: 46, h: 54, hit: [8, 0, 47], rarity: 'rare', minimumDistance: 700, difficulty: 3, biome: ANY, score: 50,
    messages: ['Широкий угол: 18 м² превращаются в 40'] },

  /* ── L: большие ── */
  { id: 'realtor', name: 'Риелтор', size: 'L', type: 'jump', w: 32, h: 64, hit: [6, 0, 57], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['А комиссия 100%', 'Агент: «Эта ушла, но есть похожая. Дороже»'] },
  { id: 'fridge', name: 'Холодильник', size: 'L', type: 'jump', w: 28, h: 64, hit: [4, 0, 58], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ANY,
    messages: ['Холодильник «Бирюса». Старше тебя'] },
  { id: 'wardrobe', name: 'Шкаф', size: 'L', type: 'jump', w: 40, h: 68, hit: [5, 0, 62], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ANY,
    messages: ['Бабушкин шкаф. Входит в стоимость и в коридор'] },
  { id: 'mattress', name: 'Матрас', size: 'L', type: 'jump', w: 30, h: 66, hit: [6, 0, 59], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ANY,
    messages: ['Матрас с историей. Историю лучше не знать'] },
  { id: 'fence', name: 'Строительный забор', size: 'L', type: 'jump', w: 72, h: 62, hit: [5, 0, 57], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ['construction', 'newbuild', 'business', 'industrial'],
    messages: ['Будет бизнес-класс. Когда-нибудь'] },
  { id: 'musician', name: 'Уличный музыкант', size: 'L', type: 'jump', w: 38, h: 64, hit: [7, 0, 57], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['arbat'],
    messages: ['«Группа крови» в сотый раз за день'] },
  { id: 'janitor', name: 'Дворник', size: 'L', type: 'jump', w: 40, h: 64, hit: [9, 0, 57], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential'],
    messages: ['Дворник метёт. Ты мешаешь'] },
  { id: 'car', name: 'Машина', size: 'L', type: 'platform', w: 140, h: 48, profile: [[6, 38, 30], [38, 110, 46], [110, 134, 32]], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ANY, not: ['pedestrian'],
    messages: ['Парковка во дворе. Твоего места тут нет', 'Каршеринг завершил аренду. И твою тоже'] },
  { id: 'gazelle', name: 'Газель', size: 'L', type: 'platform', w: 178, h: 78, profile: [[5, 124, 76], [124, 173, 60]], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ['yard', 'residential', 'industrial', 'construction', 'newbuild'], text: 'van',
    messages: ['Внезапная Газель. Грузчики оплачиваются отдельно'] },
  { id: 'towtruck', name: 'Эвакуатор', size: 'L', type: 'platform', w: 214, h: 76, profile: [[5, 152, 72], [152, 209, 60]], rarity: 'epic', minimumDistance: 1200, difficulty: 4, biome: ANY, not: ['pedestrian'], score: 50,
    messages: ['Эвакуатор. Увёз машину, квартиру и надежду'] },

  /* ── Подвижные ── */
  { id: 'dog', name: 'Собака', size: 'M', type: 'jump', w: 46, h: 30, hit: [6, 0, 24], vx: 90, rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential', 'premium', 'park'],
    messages: ['С животными нельзя. Это собака хозяина'] },
  { id: 'courier', name: 'Курьер на самокате', size: 'L', type: 'jump', w: 46, h: 64, hit: [9, 0, 57], vx: 150, rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ['center', 'premium', 'business', 'tourist', 'newbuild'],
    messages: ['Курьер успел. Ты — нет'] },
  { id: 'pvzman', name: 'Человек из ПВЗ', size: 'L', type: 'jump', w: 40, h: 64, hit: [8, 0, 57], vx: 70, rarity: 'rare', minimumDistance: 700, difficulty: 3, biome: ['yard', 'residential'], score: 50,
    messages: ['Он забрал семь заказов. Вернёт шесть'] },

  /* ── HIGH: над головой, нужно пригнуться ── */
  { id: 'bracket', name: 'Вывеска на кронштейне', size: 'HIGH', type: 'duck', w: 88, h: 110, hit: [3, 38, 90], rarity: 'rare', minimumDistance: 0, difficulty: 1, biome: ANY, text: 'brand',
    messages: ['Вывеска висит низко. Аренда — высоко'] },
  { id: 'pigeons', name: 'Голуби', size: 'HIGH', type: 'duck', w: 58, h: 36, hit: [5, 40, 72], vx: 110, rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Голуби. Они тут прописаны, а ты нет'] },
  { id: 'gate', name: 'Шлагбаум', size: 'HIGH', type: 'duck', w: 126, h: 14, hit: [2, 38, 50], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ['yard', 'residential', 'premium', 'business', 'newbuild', 'center'], not: ['pedestrian'],
    messages: ['Шлагбаум. Пульт только у жильцов'] },
  { id: 'beam', name: 'Балка на тросах', size: 'HIGH', type: 'duck', w: 100, h: 24, hit: [4, 38, 999], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['construction', 'newbuild', 'business', 'industrial'],
    messages: ['Ремонт от застройщика. Прямо сейчас'] },
  { id: 'laundry', name: 'Бельевая верёвка', size: 'HIGH', type: 'duck', w: 116, h: 46, hit: [6, 38, 84], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential'],
    messages: ['Чужие простыни. Сушатся с 1998 года'] },
  { id: 'branch', name: 'Низкая ветка', size: 'HIGH', type: 'duck', w: 92, h: 100, hit: [6, 38, 140], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['park', 'premium', 'residential', 'yard', 'stalin', 'center'],
    messages: ['Ветку обещали спилить. Управляющая компания думает'] },
  { id: 'banner', name: 'Растяжка', size: 'HIGH', type: 'duck', w: 124, h: 46, hit: [6, 38, 999], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ANY, text: 'meme',
    messages: ['«Уже сдали». Написано же'] },
  { id: 'listing', name: 'Огромное объявление', size: 'HIGH', type: 'duck', w: 108, h: 120, hit: [4, 38, 999], rarity: 'rare', minimumDistance: 700, difficulty: 3, biome: ANY, score: 50,
    messages: ['Евротрёшка, 24 м². Третья комната — балкон'] },

  /* ── Не убивают ── */
  { id: 'puddle', name: 'Огромная лужа', size: 'S', type: 'soft', w: 88, h: 6, hit: [10, 0, 4], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential', 'industrial'], messages: [] },
  { id: 'keys', name: 'Связка ключей', size: 'S', type: 'pickup', w: 26, h: 18, hit: [2, 0, 30], rarity: 'uncommon', minimumDistance: 200, difficulty: 1, biome: ANY, messages: [] },
];

/* Чьи фургоны ездят по городу. Не бренд — просто надпись на белом борту */
K.VAN_PLAIN = ['ПЕРЕЕЗДЫ', 'ГРУЗЧИКИ', 'ПЕРЕЕЗДЫ'];
K.VAN_BRANDS = ['Дикие ягоды', 'Обзвон', 'СДАЙ', 'СамоСнял', 'Ипотекеа', 'Fix Rent'];        // фирменный борт — изредка (CONFIG.city.brandVans)

})(window.KTM = window.KTM || {});
