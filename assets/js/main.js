/* Förderverein Kirchenmusik in der Karthäuserkirche — main.js */

// ─── Easter date (Gregorian anonymous algorithm) ────────────────────────────
function calcEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// First Sunday of Advent = Sunday between Nov 27–Dec 3
function getAdventStart(year) {
  const d = new Date(year, 10, 27);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return d;
}

// Same-day comparison (ignores time)
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate();
}

// ─── Liturgical season + color ───────────────────────────────────────────────
// Based on kirchenjahr_2025_2026.md (Lutherisches Kirchenjahr)
function getLiturgicalSeason(date) {
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;
  const day   = date.getDate();

  const easter = calcEaster(year);
  const diff   = Math.round((date - easter) / 86400000); // days relative to Easter

  // ── Moving feasts relative to Easter ──────────────────────────────────────

  // Karfreitag (Good Friday) → Schwarz
  if (diff === -2) return { season: 'Karfreitag', color: 'black' };

  // Gründonnerstag + Karwoche → Violett (Passionszeit runs through Gründonnerstag)
  if (diff >= -7 && diff <= -3) return { season: diff === -3 ? 'Gründonnerstag' : 'Karwoche', color: 'violet' };

  // Österliche Freudenzeit: Easter Sunday through Himmelfahrt eve (diff 0–48) → Weiß
  // Himmelfahrt = diff 39
  if (diff >= 0 && diff < 49) {
    if (diff === 39) return { season: 'Himmelfahrt', color: 'white' };
    return { season: diff === 0 ? 'Ostern' : 'Österliche Freudenzeit', color: 'white' };
  }

  // Pfingsten (Pentecost) → Rot
  if (diff === 49) return { season: 'Pfingsten', color: 'red' };

  // Trinitatis → Weiß
  if (diff === 56) return { season: 'Trinitatis', color: 'white' };

  // Passionszeit: Ash Wednesday (diff −46) through Palm Sunday eve → Violett
  if (diff >= -46 && diff < -7) return { season: 'Passionszeit', color: 'violet' };

  // Sonntage vor der Passionszeit (8.–15. Feb 2026) = diff roughly −25 to −18 → Weiß
  // These are already covered by the Passionszeit check above if diff >= -46.
  // The two white Sundays before Ash Wednesday: diff -18 and -11 — caught by the
  // general fallback below (Epiphaniaszeit / white).

  // ── Fixed-date feasts ──────────────────────────────────────────────────────

  // Weihnachten (Dec 25 – Jan 5) → Weiß
  if ((month === 12 && day >= 25) || (month === 1 && day <= 5))
    return { season: 'Weihnachten', color: 'white' };

  // Epiphanias & Epiphaniaszeit (Jan 6 – last Sunday after Epiphany) → Weiß
  // The last Sunday after Epiphany (before Passionszeit) is also white.
  // We treat all of January and early February (until Ash Wed) as white here.
  if (month === 1 || (month === 2 && diff < -46))
    return { season: month === 1 && day === 6 ? 'Epiphanias' : 'Epiphaniaszeit', color: 'white' };

  // Johannis (24 Jun) → Weiß
  if (month === 6 && day === 24) return { season: 'Johannis', color: 'white' };

  // Michaelistag (29 Sep) → Weiß
  if (month === 9 && day === 29) return { season: 'Michaelistag', color: 'white' };

  // Reformationstag (31 Oct) → Rot
  if (month === 10 && day === 31) return { season: 'Reformationstag', color: 'red' };

  // Advent → Violett (check after Christmas to avoid Dec 25+ clash)
  const adventStart = getAdventStart(year);
  if (date >= adventStart) return { season: 'Advent', color: 'violet' };

  // Buß- und Bettag: Wednesday before Ewigkeitssonntag (last Sunday before Advent)
  const ewigkeit = new Date(adventStart);
  ewigkeit.setDate(adventStart.getDate() - 7);
  const bussBettag = new Date(ewigkeit);
  bussBettag.setDate(ewigkeit.getDate() - 4); // Wed before Ewigkeitssonntag
  if (sameDay(date, bussBettag))  return { season: 'Buß- und Bettag',   color: 'violet' };
  if (sameDay(date, ewigkeit))    return { season: 'Ewigkeitssonntag',  color: 'green'  };

  // Trinitatiszeit (ordinary time after Trinity Sunday) → Grün
  return { season: 'Trinitatiszeit', color: 'green' };
}

// ─── Apply liturgical color to <html> ───────────────────────────────────────
function applyLiturgicalColor() {
  const { season, color } = getLiturgicalSeason(new Date());
  document.documentElement.dataset.liturgical = color;
  document.querySelectorAll('[data-season-label]').forEach(el => {
    el.textContent = season;
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyLiturgicalColor();
});
