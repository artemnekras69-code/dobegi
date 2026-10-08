/* =====================================================================
   КВАРТИРЫ ДЛЯ ИГРЫ

   Тестовые данные. Позже массив можно целиком заменить реальными
   объявлениями из канала — формат тот же.

   Карточки в игре выглядят одинаково: хорошую от плохой игрок отличает
   только по цифрам. Поэтому разница должна читаться сразу:
     хорошая — много метров, мало рублей, близко к метро;
     плохая  — мало метров за большие деньги или далеко от метро.

   id               — любой уникальный идентификатор
   district, metro  — округ и станция
   rooms            — число комнат, 0 = студия
   area             — площадь, м²
   price            — рублей в месяц
   commission       — комиссия в процентах (пока не показывается)
   distanceToMetro  — минут до метро
   quality          — 'great' +250 · 'good' +100 · 'bad' −50 · 'awful' −150
   label            — необязательно: заголовок вместо «1-КОМН.» («ЕВРОТРЁШКА»)
   note             — необязательно: мелкая приписка («на машине ночью»)
   tricky           — true: появляется только на большой дистанции, надо вчитаться
   ===================================================================== */
window.APARTMENTS = [
  /* Очень хорошие: около 1 100 ₽ за метр, метро рядом */
  { id: 'g01', district: 'САО',  metro: 'Сокол',          rooms: 1, area: 42, price: 45000,  commission: 0,   distanceToMetro: 4,  quality: 'great' },
  { id: 'g02', district: 'СВАО', metro: 'ВДНХ',           rooms: 2, area: 58, price: 62000,  commission: 0,   distanceToMetro: 5,  quality: 'great' },
  { id: 'g03', district: 'ЦАО',  metro: 'Таганская',      rooms: 1, area: 45, price: 48000,  commission: 0,   distanceToMetro: 3,  quality: 'great' },
  { id: 'g04', district: 'САО',  metro: 'Динамо',         rooms: 2, area: 60, price: 65000,  commission: 0,   distanceToMetro: 6,  quality: 'great' },
  { id: 'g05', district: 'ВАО',  metro: 'Измайловская',   rooms: 1, area: 40, price: 44000,  commission: 0,   distanceToMetro: 5,  quality: 'great' },
  { id: 'g06', district: 'ЮАО',  metro: 'Коломенская',    rooms: 3, area: 74, price: 79000,  commission: 0,   distanceToMetro: 6,  quality: 'great', tricky: true },

  /* Хорошие: 1 300–1 500 ₽ за метр, до метро не больше 10 минут */
  { id: 'h01', district: 'ЮЗАО', metro: 'Беляево',        rooms: 1, area: 38, price: 52000,  commission: 0,   distanceToMetro: 7,  quality: 'good' },
  { id: 'h02', district: 'ЮЗАО', metro: 'Профсоюзная',    rooms: 1, area: 36, price: 50000,  commission: 0,   distanceToMetro: 8,  quality: 'good' },
  { id: 'h03', district: 'ЮАО',  metro: 'Нагатинская',    rooms: 2, area: 52, price: 72000,  commission: 0,   distanceToMetro: 7,  quality: 'good' },
  { id: 'h04', district: 'ВАО',  metro: 'Первомайская',   rooms: 1, area: 35, price: 48000,  commission: 0,   distanceToMetro: 6,  quality: 'good' },
  { id: 'h05', district: 'СВАО', metro: 'Бабушкинская',   rooms: 0, area: 28, price: 42000,  commission: 0,   distanceToMetro: 5,  quality: 'good' },
  { id: 'h06', district: 'СЗАО', metro: 'Тушинская',      rooms: 2, area: 50, price: 70000,  commission: 0,   distanceToMetro: 9,  quality: 'good' },
  { id: 'h07', district: 'ЮАО',  metro: 'Царицыно',       rooms: 1, area: 39, price: 55000,  commission: 0,   distanceToMetro: 10, quality: 'good' },
  { id: 'h08', district: 'ЮВАО', metro: 'Текстильщики',   rooms: 1, area: 37, price: 54000,  commission: 0,   distanceToMetro: 6,  quality: 'good' },
  { id: 'h09', district: 'ЗАО',  metro: 'Кунцевская',     rooms: 0, area: 30, price: 39000,  commission: 0,   distanceToMetro: 4,  quality: 'good', tricky: true },
  { id: 'h10', district: 'САО',  metro: 'Аэропорт',       rooms: 1, area: 34, price: 46000,  commission: 0,   distanceToMetro: 9,  quality: 'good', tricky: true },

  /* Плохие: дорого за маленькую площадь или далеко от метро */
  { id: 'b01', district: 'ЮВАО', metro: 'Люблино',        rooms: 1, area: 24, price: 65000,  commission: 100, distanceToMetro: 15, quality: 'bad', note: 'на машине ночью' },
  { id: 'b02', district: 'ЮВАО', metro: 'Некрасовка',     rooms: 1, area: 27, price: 68000,  commission: 100, distanceToMetro: 18, quality: 'bad' },
  { id: 'b03', district: 'САО',  metro: 'Ховрино',        rooms: 0, area: 19, price: 52000,  commission: 50,  distanceToMetro: 12, quality: 'bad' },
  { id: 'b04', district: 'НАО',  metro: 'Саларьево',      rooms: 2, area: 38, price: 98000,  commission: 100, distanceToMetro: 20, quality: 'bad' },
  { id: 'b05', district: 'ЦАО',  metro: 'Китай-город',    rooms: 1, area: 30, price: 78000,  commission: 100, distanceToMetro: 9,  quality: 'bad' },
  { id: 'b06', district: 'ЮВАО', metro: 'Котельники',     rooms: 1, area: 26, price: 62000,  commission: 50,  distanceToMetro: 25, quality: 'bad', note: 'без животных' },
  { id: 'b07', district: 'ЮЗАО', metro: 'Лесопарковая',   rooms: 0, area: 21, price: 55000,  commission: 100, distanceToMetro: 17, quality: 'bad', note: 'вид на стену' },
  { id: 'b08', district: 'ЮАО',  metro: 'Аннино',         rooms: 2, area: 33, price: 58000,  commission: 50,  distanceToMetro: 22, quality: 'bad', tricky: true },
  { id: 'b09', district: 'НАО',  metro: 'Филатов Луг',    rooms: 1, area: 40, price: 49000,  commission: 50,  distanceToMetro: 35, quality: 'bad', note: 'на автобусе', tricky: true },
  { id: 'b10', district: 'ЦАО',  metro: 'Маяковская',     rooms: 1, area: 41, price: 119000, commission: 100, distanceToMetro: 3,  quality: 'bad', tricky: true },

  /* Очень плохие: за эти деньги — вот это */
  { id: 'x01', district: 'ЦАО',  metro: 'Курская',        rooms: 3, area: 24, price: 95000,  commission: 100, distanceToMetro: 22, quality: 'awful', label: 'ЕВРОТРЁШКА', note: '«центр»' },
  { id: 'x02', district: 'ЮВАО', metro: 'Некрасовка',     rooms: 0, area: 18, price: 70000,  commission: 100, distanceToMetro: 30, quality: 'awful', label: 'ПРОСТОРНАЯ СТУДИЯ' },
  { id: 'x03', district: 'ЦАО',  metro: 'Китай-город',    rooms: 1, area: 22, price: 140000, commission: 100, distanceToMetro: 9,  quality: 'awful', note: 'дизайнерский ремонт' },
  { id: 'x04', district: 'САО',  metro: 'Ховрино',        rooms: 2, area: 19, price: 88000,  commission: 100, distanceToMetro: 19, quality: 'awful', label: 'ЕВРОДВУШКА', note: 'залог 2 месяца' },
  { id: 'x05', district: 'ЗАО',  metro: 'Рассказовка',    rooms: 0, area: 11, price: 55000,  commission: 100, distanceToMetro: 22, quality: 'awful', label: 'УЮТНАЯ СТУДИЯ' },
  { id: 'x06', district: 'НАО',  metro: 'Саларьево',      rooms: 2, area: 31, price: 150000, commission: 100, distanceToMetro: 28, quality: 'awful', note: 'комиссия 100%' },
];
