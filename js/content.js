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
   Цвета района — из общей палитры, разбавленные бумагой: sky — небо, farColor — силуэты,
   walls — стены ближнего ряда. fore — что висит над головой на переднем плане.
   Как часто попадаются магазины, реклама и знаковые места — CONFIG.city в config.js. */
K.LOCATIONS = [
  {
    id: 'yard', name: 'ОБЫЧНЫЙ ДВОР', short: 'Двор', note: 'заборчик, лавочка, ПВЗ', street: 'Тупиковый пр.',
    tags: ['yard', 'residential'],
    sky: '#E6E7DD', farColor: '#C7CDC8', foliage: ['#7F9A6A', '#98AE81'],
    far: [['blocks', 5], ['chimneys', 2], ['ostankino', 0.3]],
    back: { kinds: [['panel', 5], ['panelTall', 3], ['khrush', 2]], colors: ['#C6CAC6', '#BBC1C0', '#CFC9BB'], win: '#9AA3A6' },
    front: { styles: [['panel', 4], ['panelShop', 3.5], ['khrush', 2], ['garages', 1.2]], walls: ['#CFCBBE', '#C3C9CA', '#D8CFB8'], trim: '#E7E1D2', glass: '#8FA3AC', roof: '#A9A396' },
    props: [['tree', 3], ['birch', 3], ['granny', 1.4], ['bench', 1], ['playground', 2.2], ['lamp', 3], ['parkedCar', 3], ['parkedVan', 1], ['yardFence', 3], ['trashYard', 1.6], ['kiosk', 0.6]],
    fore: [['wires', 3]],
    brands: ['Шестёрочка', 'Пыжик', 'Дикие ягоды', 'Перекос', 'СДАЙ', 'Обзвон', 'Белое & Красное', '36,6 м²', 'Fix Rent', 'Съём'],
    traffic: [['car', 5], ['van', 2], ['taxi', 1]],
  },
  {
    id: 'textil', name: 'ТЕКСТИЛЬЩИКИ', short: 'Текстильщики', note: 'гаражи, промзона и новостройка между ними', street: 'Волгоградский пр-т',
    tags: ['industrial', 'residential'],
    sky: '#E3DCCD', farColor: '#C5BDAF', foliage: ['#7C8F62', '#94A57A'],
    far: [['chimneys', 4], ['blocks', 3], ['cranes', 2]],
    back: { kinds: [['factory', 3], ['panel', 3], ['newblock', 2.5], ['khrush', 2], ['site', 1.5]], colors: ['#C2B9A9', '#B6ADA0', '#C9A593'], win: '#93897B' },
    front: { styles: [['panel', 2.5], ['panelShop', 2.5], ['garages', 2.5], ['fence', 2], ['newShop', 1.5], ['khrush', 2]], walls: ['#CBC2B1', '#C99E8B', '#BDB7AC'], trim: '#DDD4C2', glass: '#8C989B', roof: '#9E9485' },
    props: [['lamp', 4], ['tree', 2], ['birch', 1], ['billboard', 2], ['busstop', 2], ['parkedCar', 2.5], ['parkedVan', 1.5], ['heatPipe', 1.6], ['trashYard', 1], ['yardFence', 1.5], ['metro', 1]],
    fore: [['wires', 4]],
    brands: ['Компас', 'Перекос', 'Шестёрочка', 'Fix Rent', 'Белое & Красное', 'Дикие ягоды', 'СДАЙ', 'Жилайн', 'Додо Дом', 'Пыжик'],
    traffic: [['car', 4], ['van', 3], ['bus', 2], ['taxi', 1]],
  },
  {
    id: 'sokol', name: 'СОКОЛ', short: 'Сокол', note: 'сталинки, широкий проспект и самолёты', street: 'Ленинградский пр-т',
    tags: ['residential', 'stalin'],
    sky: '#EFE5CF', farColor: '#D0C5AD', foliage: ['#77935F', '#92AA77'], skyFx: 'plane',
    far: [['blocks', 3], ['roofs', 2]], skyline: ['rechnoy', 'vysotka'],
    back: { kinds: [['stalin', 4], ['old', 2], ['panelTall', 1.5]], colors: ['#D3C19A', '#C9B58C'], win: '#9C8C6C', lit: '#F6E3A1' },
    front: { styles: [['stalin', 4], ['stalinShop', 4], ['old', 1]], walls: ['#DCC592', '#D2B988', '#E0CDA6'], trim: '#F1E7CF', glass: '#8E9EA0', roof: '#A8956E' },
    props: [['lamp', 4], ['treeBig', 4], ['busstop', 2], ['metro', 1.5], ['billboard', 1.5], ['bench', 1.5], ['parkedCar', 2], ['crossSign', 1.2], ['bollards', 1]],
    fore: [['wires', 2], ['lampWire', 2]],
    brands: ['ВкусВилли', 'Белое & Красное', 'Кофиксцен', 'Перекос', 'АвиСдано', 'Съём', '36,6 м²', 'Аренда-Банк', 'Шестёрочка'],
    traffic: [['car', 5], ['bus', 2], ['taxi', 2], ['van', 1]],
  },
  {
    id: 'vdnh', name: 'ВДНХ', short: 'ВДНХ', note: 'аллеи, павильоны и башня', street: 'пр-т Мира',
    tags: ['park', 'tourist', 'pedestrian'],
    sky: '#DDE8E4', farColor: '#BDCDCB', foliage: ['#6F9460', '#8DAE79'],
    far: [['treeline', 4], ['blocks', 2]], skyline: ['ostankino', 'ferris'],
    back: { kinds: [['pavilionBack', 5], ['old', 1.5], ['panelTall', 0.5]], colors: ['#E6DFCB', '#DAD2BC'], win: '#B3A888' },
    front: { styles: [['pavilion', 3], ['parkFence', 4.5]], walls: ['#EDE6D2', '#E3DBC4'], trim: '#F7F1E1', glass: '#9FB3B8', roof: '#E2BC4A' },
    props: [['treeBig', 5], ['poplar', 1.5], ['lamp', 3], ['bench', 2], ['fountain', 1.6], ['kiosk', 2], ['flower', 2.5], ['citylight', 1.2], ['tourists', 1.4]],
    fore: [['garland', 2], ['lampWire', 1]],
    landmarks: ['vdnhArch', 'rocket'],
    brands: ['Вкусно и запятая', 'StarБакс', 'Додо Дом', 'Кофиксцен', 'Бургер Царь'],
    traffic: [['car', 3], ['bus', 3], ['taxi', 2]],
  },
  {
    id: 'zil', name: 'ЗИЛ', short: 'ЗИЛ', note: 'был завод, стал «квартал у набережной»', street: 'б-р Братьев Весниных',
    tags: ['construction', 'newbuild', 'embankment'],
    sky: '#DEE4E3', farColor: '#BCC6CA', foliage: ['#77936A', '#93AB84'], accent: '#B9553B',
    far: [['cranes', 4], ['blocks', 3]], skyline: ['shater'],
    back: { kinds: [['newblock', 5], ['site', 3], ['glass', 1.5], ['factory', 1]], colors: ['#C5CCCE', '#B8C1C6', '#D2CDC2'], win: '#8F9BA3', lit: '#FFFDF6' },
    front: { styles: [['newbuild', 4], ['newShop', 3], ['stroyka', 2], ['embankment', 1.6]], walls: ['#D6D5CC', '#C48F78', '#BFC8CC'], trim: '#E6E3D8', glass: '#88A0AE', roof: '#9AA3A6' },
    props: [['lamp', 4], ['tree', 2], ['billboard', 2.5], ['citylight', 2], ['parkedCar', 2], ['busstop', 1], ['crossSign', 1.2], ['heatPipe', 0.8], ['bollards', 1.5]],
    fore: [['wires', 2]],
    landmarks: ['embankment'],
    brands: ['Мегаквартир', 'Fix Rent', 'Домтык', 'ЦИАНЧИК', 'ВкусВилли', 'Ипотекеа', 'Обзвон', 'Т-Залог', 'Додо Дом', 'Пшик'],
    traffic: [['car', 4], ['van', 3], ['taxi', 2]],
  },
  {
    id: 'arbat', name: 'АРБАТ', short: 'Арбат', note: 'туристы, музыканты, портреты за пять минут', street: 'ул. Арбат',
    tags: ['tourist', 'center', 'pedestrian'],
    sky: '#F1E3C6', farColor: '#D6C5A4', foliage: ['#7F9560', '#9BAE7A'],
    far: [['roofs', 4], ['blocks', 1]], skyline: ['vysotka'],
    back: { kinds: [['old', 4], ['stalin', 2], ['tower', 1.2]], colors: ['#D9C08E', '#CDB58A', '#D3A892'], win: '#A08B67' },
    front: { styles: [['old', 3], ['stalin', 0.8], ['oldShop', 5]], walls: ['#E2C56E', '#D49E88', '#B7C7A2', '#E6D7B2'], trim: '#F6EEDA', glass: '#8F9E9C', roof: '#8E6F5C' },
    props: [['lampOld', 6], ['bench', 2], ['kiosk', 1.5], ['flower', 1.5], ['citylight', 1], ['tourists', 2], ['artist', 2], ['terrace', 1.6]],
    fore: [['lampWire', 3], ['garland', 3]],
    landmarks: ['wall', 'theatre'],
    brands: ['Вкусно и запятая', 'StarБакс', 'Бургер Царь', 'Кофиксцен', 'Додо Дом', 'Грабёж', 'АвиСдано'],
    traffic: [['taxi', 3], ['car', 3], ['courier', 2]],
  },
  {
    id: 'kitay', name: 'КИТАЙ-ГОРОД', short: 'Китай-город', note: 'до Кремля рукой подать', street: 'ул. Варварка',
    tags: ['tourist', 'center'],
    sky: '#EFE2CB', farColor: '#C99A8B', foliage: ['#748F5C', '#90A974'],
    far: [['roofs', 4], ['blocks', 0.6]], skyline: ['kremlin', 'basil'],
    back: { kinds: [['old', 4], ['church', 2], ['stalin', 1.5]], colors: ['#D8C6A2', '#CDB992', '#C9A08E'], win: '#9A8868' },
    front: { styles: [['old', 4], ['oldShop', 4], ['stalin', 1.5], ['stalinShop', 1], ['parkFence', 1.6]], walls: ['#E3CE9E', '#D8BC8F', '#EADBB7', '#C9A692'], trim: '#F5ECD6', glass: '#8D9C9B', roof: '#8B6B58' },
    props: [['lampOld', 4], ['lamp', 2], ['tree', 2], ['metro', 2], ['bench', 1.5], ['citylight', 1.5], ['tourists', 1.5], ['bollards', 1.5], ['crossSign', 1]],
    fore: [['lampWire', 3], ['garland', 1.5], ['wires', 1]],
    landmarks: ['bridge'],
    brands: ['Белое & Красное', 'StarБакс', 'Вкусно и запятая', 'Кофиксцен', 'АвиСдано', 'Аренда-Банк', 'Грабёж'],
    traffic: [['taxi', 4], ['car', 3], ['bus', 1.5]],
  },
  {
    id: 'khamovniki', name: 'ХАМОВНИКИ', short: 'Хамовники', note: 'тихие дворы по цене громких', street: 'ул. Остоженка',
    tags: ['premium', 'center', 'construction'],
    sky: '#E8E4D6', farColor: '#C7C2B1', foliage: ['#6F8F5B', '#8BA775'],
    far: [['roofs', 3], ['blocks', 1.5]], skyline: ['hhs', 'luzhniki'],
    back: { kinds: [['old', 3], ['newblock', 2], ['stalin', 2]], colors: ['#CFC6B3', '#C2B7A2', '#C59A86'], win: '#93897A' },
    front: { styles: [['old', 2.5], ['stalin', 1.5], ['newbuild', 2], ['newShop', 1.5], ['stroyka', 1], ['parkFence', 1.6], ['embankment', 1.4]], walls: ['#C9937C', '#D5CBB6', '#BFB5A2', '#DCD5C2'], trim: '#EDE6D4', glass: '#8A9A9C', roof: '#8F8474' },
    props: [['treeBig', 4], ['lamp', 3], ['parkedCar', 3], ['bench', 1], ['citylight', 1.5], ['billboard', 1], ['bollards', 1.5], ['terrace', 0.8], ['crossSign', 1]],
    fore: [['wires', 2], ['lampWire', 1.5]],
    landmarks: ['ges2'],
    brands: ['ВкусВилли', 'Белое & Красное', 'Кофиксцен', 'Мегаквартир', 'СДАЙ', 'Съём', 'ЦИАНЧИК', 'Домтык'],
    traffic: [['car', 5], ['taxi', 2], ['van', 1]],
  },
  {
    id: 'patriki', name: 'ПАТРИКИ', short: 'Патрики', note: 'кофе по цене аренды', street: 'ул. Малая Бронная',
    tags: ['premium', 'center', 'park'],
    sky: '#EFE6D2', farColor: '#D1C6AE', foliage: ['#5F8552', '#7FA06C'],
    far: [['roofs', 4], ['blocks', 1]], skyline: ['vysotka'],
    back: { kinds: [['old', 4], ['stalin', 2]], colors: ['#C9957D', '#D6C29A', '#BE8A74'], win: '#8F6F5E' },
    front: { styles: [['old', 2], ['oldShop', 5], ['stalin', 1]], walls: ['#C4775C', '#B9694F', '#DCC69A', '#C98C72'], trim: '#F1E6CE', glass: '#8C9C9A', roof: '#6E5346' },
    props: [['treeBig', 4], ['lampOld', 4], ['bench', 2], ['parkedCar', 3], ['flower', 1.5], ['kiosk', 0.8], ['terrace', 3], ['bollards', 1.5]],
    fore: [['lampWire', 3], ['garland', 1.5]],
    landmarks: ['pond'],
    brands: ['StarБакс', 'Кофиксцен', 'ВкусВилли', 'Вкусно и запятая', 'Белое & Красное', 'Грабёж', 'Т-Залог'],
    traffic: [['car', 5], ['taxi', 3], ['courier', 2]],
  },
  {
    id: 'city', name: 'МОСКВА-СИТИ', short: 'Сити', note: 'стекло, сталь и переговорки', street: 'Пресненская наб.',
    tags: ['business', 'construction', 'premium', 'embankment'],
    sky: '#D7E2E8', farColor: '#A7BBC9', foliage: ['#6F8E73', '#8BA58C'], accent: '#7DB1D6',
    far: [['blocks', 3], ['cranes', 2]], skyline: ['city'],
    back: { kinds: [['cityTower', 6], ['glass', 2], ['site', 1]], colors: ['#A9C0D0', '#9DB4C6', '#B9C8D0'], win: '#7E99AE', lit: '#FFFDF6' },
    front: { styles: [['glass', 5], ['newShop', 1.5], ['stroyka', 1.5], ['embankment', 1.5]], walls: ['#A7BFD0', '#98B1C4', '#B6C6CF'], trim: '#D5E0E6', glass: '#7F9FB6', roof: '#8AA2B4' },
    props: [['lamp', 4], ['citylight', 3], ['billboard', 2], ['parkedCar', 3], ['tree', 1], ['metro', 1.5], ['bollards', 2], ['crossSign', 1.2]],
    fore: [['wires', 1]],
    landmarks: ['embankment'],
    brands: ['StarБакс', 'Бургер Царь', 'Мегаквартир', 'ЦИАНЧИК', 'Домтык', 'Т-Залог', 'Аренда-Банк', 'Съём', 'Жилайн'],
    traffic: [['car', 4], ['taxi', 4], ['van', 1]],
  },
];

/* Объявления на стенах: [шапка, главное, приписка, мелким шрифтом] */
K.NOTICES = [
  ['СДАЁТСЯ', '45 000 ₽', '1-КОМН.', '5 мин до метро'],
  ['15 МИНУТ', 'ДО МЕТРО', 'на машине', 'ночью'],
  ['СДАМ', 'СТУДИЮ', '11 м²', 'есть окно'],
  ['СНИМУ', 'КВАРТИРУ', 'порядочный', 'без в/п и кота'],
  ['БЕЗ', 'ЗАЛОГА*', '*залог', 'два месяца'],
  ['ХОЗЯИН', 'НЕ АГЕНТ', 'агент', 'хозяина'],
  ['КОМИССИЯ', '0 %*', '*плюс 100 %', ''],
  ['КУПЛЮ', 'ГАРАЖ', 'дорого', 'или сниму'],
  ['ЕВРОДВУШКА', '19 м²', 'вторая комната', '— лоджия'],
];

/* Растяжки на фасадах */
K.BANNERS = ['АРЕНДА', 'СДАЁТСЯ', 'АРЕНДА ОТ СОБСТВЕННИКА*', 'ПРОДАЖА', 'ОФИСЫ · АРЕНДА', 'СДАМ · 8-800-СДАМ'];

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
  { id: 'terminal', name: 'Паркомат', size: 'M', type: 'jump', w: 24, h: 50, hit: [4, 0, 45], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ANY, not: ['pedestrian', 'park'],
    messages: ['Парковка 380 ₽ в час. Ты даже не на машине', 'Паркомат принял оплату. За соседнюю зону'] },
  { id: 'contract', name: 'Договор аренды', size: 'M', type: 'jump', w: 36, h: 48, hit: [6, 0, 42], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ANY,
    messages: ['Пункт 7.3: «и ещё одна комиссия»', 'Договор на 11 месяцев. Сам знаешь почему'] },
  { id: 'scooter', name: 'Брошенный самокат', size: 'S', type: 'jump', w: 60, h: 24, hit: [6, 0, 19], rarity: 'common', minimumDistance: 100, difficulty: 1, biome: ['premium', 'center', 'business', 'tourist', 'park', 'newbuild', 'stalin'],
    messages: ['Самокат бросили поперёк тротуара. Поездка завершена, твоя тоже', 'Парковка самоката запрещена. Он и не парковался — он упал'] },
  { id: 'scooters', name: 'Стоянка самокатов', size: 'M', type: 'jump', w: 98, h: 48, hit: [9, 0, 42], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['premium', 'center', 'business', 'tourist', 'park', 'newbuild', 'stalin'],
    messages: ['Стоянка самокатов. Занято всё, включая тротуар', 'Четыре самоката на одном месте. Плотнее, чем в твоей студии'] },
  { id: 'tiles', name: 'Поддон с плиткой', size: 'S', type: 'jump', w: 44, h: 30, hit: [5, 0, 25], rarity: 'common', minimumDistance: 0, difficulty: 1, biome: ANY,
    messages: ['Плитку перекладывают. Опять', 'Эту плитку положили весной. Теперь кладут осеннюю'] },
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
  { id: 'ebus', name: 'Электробус', size: 'L', type: 'platform', w: 300, h: 104, profile: [[6, 294, 100]], rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ANY, not: ['pedestrian', 'yard', 'park'], score: 50,
    messages: ['Электробус. Тихий, чистый и стоит у тебя на пути', 'Следующая остановка — «Конечная»'] },

  /* ── Подвижные ── */
  { id: 'dog', name: 'Собака', size: 'M', type: 'jump', w: 46, h: 30, hit: [6, 0, 24], vx: 90, rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential', 'premium', 'park'],
    messages: ['С животными нельзя. Это собака хозяина'] },
  { id: 'courier', name: 'Курьер на самокате', size: 'L', type: 'jump', w: 46, h: 64, hit: [9, 0, 57], vx: 150, rarity: 'uncommon', minimumDistance: 700, difficulty: 3, biome: ['center', 'premium', 'business', 'tourist', 'newbuild'],
    messages: ['Курьер успел. Ты — нет'] },
  { id: 'pvzman', name: 'Человек из ПВЗ', size: 'L', type: 'jump', w: 40, h: 64, hit: [8, 0, 57], vx: 70, rarity: 'rare', minimumDistance: 700, difficulty: 3, biome: ['yard', 'residential'], score: 50,
    messages: ['Он забрал семь заказов. Вернёт шесть'] },
  { id: 'rover', name: 'Робот-доставщик', size: 'M', type: 'jump', w: 40, h: 48, hit: [5, 0, 29], vx: 55, rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ['center', 'premium', 'business', 'newbuild', 'stalin', 'park'], score: 50,
    messages: ['Робот вёз кому-то суши. Теперь везёт тебя на разбор', 'У робота есть маршрут. У тебя — нет'] },

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
  { id: 'roadsign', name: 'Знак «Работает эвакуатор»', size: 'HIGH', type: 'duck', w: 46, h: 62, hit: [3, 38, 97], rarity: 'uncommon', minimumDistance: 300, difficulty: 2, biome: ANY, not: ['pedestrian', 'park', 'yard'],
    messages: ['Остановка запрещена. Особенно лбом об знак', 'Работает эвакуатор. Голову тоже увезут'] },

  /* ── Не убивают ── */
  { id: 'puddle', name: 'Огромная лужа', size: 'S', type: 'soft', w: 88, h: 6, hit: [10, 0, 4], rarity: 'common', minimumDistance: 300, difficulty: 2, biome: ['yard', 'residential', 'industrial'], messages: [] },
  { id: 'keys', name: 'Связка ключей', size: 'S', type: 'pickup', w: 26, h: 18, hit: [2, 0, 30], rarity: 'uncommon', minimumDistance: 200, difficulty: 1, biome: ANY, messages: [] },
];

/* Чьи фургоны ездят по городу. Не бренд — просто надпись на белом борту */
K.VAN_PLAIN = ['ПЕРЕЕЗДЫ', 'ГРУЗЧИКИ', 'ПЕРЕЕЗДЫ'];
K.VAN_BRANDS = ['Дикие ягоды', 'Обзвон', 'СДАЙ', 'Самокатик', 'Ипотекеа', 'Fix Rent'];        // фирменный борт — изредка (CONFIG.city.brandVans)

})(window.KTM = window.KTM || {});
