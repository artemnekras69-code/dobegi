/* =====================================================================
   КВАРТИРЫ ДЛЯ ИГРЫ

   Сейчас это тестовые данные. Позже массив можно целиком заменить
   реальными объявлениями из канала — формат тот же.

   id               — любой уникальный идентификатор
   district         — округ или район
   metro            — станция метро
   rooms            — число комнат, 0 = студия
   area             — площадь, м²
   price            — цена в рублях в месяц
   commission       — комиссия в процентах (0 = без комиссии)
   distanceToMetro  — минут пешком до метро
   quality          — 'good' (стоит снять) или 'bad' (ловушка: минус очки)
   rarity           — 'common' +100 · 'good' +250 · 'rare' +500 · 'jackpot' +1000
   ===================================================================== */
window.APARTMENTS = [
  // Обычные
  { id: 'a01', district: 'ЮЗАО', metro: 'Беляево',         rooms: 1, area: 36, price: 58000,  commission: 50,  distanceToMetro: 10, quality: 'good', rarity: 'common' },
  { id: 'a02', district: 'ВАО',  metro: 'Первомайская',    rooms: 2, area: 45, price: 72000,  commission: 50,  distanceToMetro: 8,  quality: 'good', rarity: 'common' },
  { id: 'a03', district: 'СВАО', metro: 'Бабушкинская',    rooms: 1, area: 34, price: 55000,  commission: 50,  distanceToMetro: 12, quality: 'good', rarity: 'common' },
  { id: 'a04', district: 'ЮАО',  metro: 'Царицыно',        rooms: 1, area: 33, price: 52000,  commission: 30,  distanceToMetro: 9,  quality: 'good', rarity: 'common' },
  { id: 'a05', district: 'ЗАО',  metro: 'Кунцевская',      rooms: 0, area: 24, price: 48000,  commission: 50,  distanceToMetro: 11, quality: 'good', rarity: 'common' },
  { id: 'a06', district: 'СЗАО', metro: 'Тушинская',       rooms: 2, area: 47, price: 70000,  commission: 50,  distanceToMetro: 14, quality: 'good', rarity: 'common' },

  // Хорошие варианты
  { id: 'b01', district: 'САО',  metro: 'Сокол',           rooms: 1, area: 38, price: 65000,  commission: 0,   distanceToMetro: 7,  quality: 'good', rarity: 'good' },
  { id: 'b02', district: 'ЮЗАО', metro: 'Профсоюзная',     rooms: 1, area: 37, price: 62000,  commission: 0,   distanceToMetro: 6,  quality: 'good', rarity: 'good' },
  { id: 'b03', district: 'СВАО', metro: 'ВДНХ',            rooms: 2, area: 50, price: 78000,  commission: 0,   distanceToMetro: 8,  quality: 'good', rarity: 'good' },
  { id: 'b04', district: 'ВАО',  metro: 'Измайловская',    rooms: 1, area: 35, price: 57000,  commission: 0,   distanceToMetro: 5,  quality: 'good', rarity: 'good' },
  { id: 'b05', district: 'ЮАО',  metro: 'Коломенская',     rooms: 2, area: 52, price: 76000,  commission: 0,   distanceToMetro: 7,  quality: 'good', rarity: 'good' },

  // Редкие
  { id: 'c01', district: 'ЦАО',  metro: 'Таганская',       rooms: 1, area: 40, price: 68000,  commission: 0,   distanceToMetro: 5,  quality: 'good', rarity: 'rare' },
  { id: 'c02', district: 'ЗАО',  metro: 'Кутузовская',     rooms: 2, area: 54, price: 85000,  commission: 0,   distanceToMetro: 6,  quality: 'good', rarity: 'rare' },
  { id: 'c03', district: 'САО',  metro: 'Динамо',          rooms: 1, area: 41, price: 66000,  commission: 0,   distanceToMetro: 4,  quality: 'good', rarity: 'rare' },
  { id: 'c04', district: 'ЦАО',  metro: 'Бауманская',      rooms: 2, area: 56, price: 88000,  commission: 0,   distanceToMetro: 5,  quality: 'good', rarity: 'rare' },

  // Джекпоты
  { id: 'd01', district: 'ЦАО',  metro: 'Чистые пруды',    rooms: 1, area: 42, price: 60000,  commission: 0,   distanceToMetro: 4,  quality: 'good', rarity: 'jackpot' },
  { id: 'd02', district: 'ЦАО',  metro: 'Маяковская',      rooms: 2, area: 58, price: 75000,  commission: 0,   distanceToMetro: 3,  quality: 'good', rarity: 'jackpot' },
  { id: 'd03', district: 'ЦАО',  metro: 'Парк культуры',   rooms: 1, area: 45, price: 62000,  commission: 0,   distanceToMetro: 2,  quality: 'good', rarity: 'jackpot' },

  // Плохие объявления — лучше не подбирать
  { id: 'x01', district: 'ЮВАО', metro: 'Люблино',         rooms: 1, area: 27, price: 95000,  commission: 100, distanceToMetro: 25, quality: 'bad',  rarity: 'common' },
  { id: 'x02', district: 'ЮВАО', metro: 'Некрасовка',      rooms: 0, area: 18, price: 70000,  commission: 100, distanceToMetro: 30, quality: 'bad',  rarity: 'common' },
  { id: 'x03', district: 'ЦАО',  metro: 'Китай-город',     rooms: 1, area: 22, price: 140000, commission: 100, distanceToMetro: 9,  quality: 'bad',  rarity: 'common' },
  { id: 'x04', district: 'САО',  metro: 'Ховрино',         rooms: 0, area: 11, price: 55000,  commission: 100, distanceToMetro: 22, quality: 'bad',  rarity: 'common' },
  { id: 'x05', district: 'ЗАО',  metro: 'Саларьево',       rooms: 2, area: 39, price: 120000, commission: 100, distanceToMetro: 35, quality: 'bad',  rarity: 'common' },
];
