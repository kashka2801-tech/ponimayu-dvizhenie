/* ============================================================
   Ядро физической модели — без интерфейса.
   Модель движения: начальная координата x0 и участки
   [{vx, dt}, ...] — скорость со знаком и длительность участка.
   ============================================================ */
(function (global) {
  'use strict';

  /* Разбор числа: принимает запятую и точку, пробелы, знак.
     Пустая строка или мусор → null (НЕ ноль!). */
  function parseNum(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number') return isFinite(raw) ? raw : null;
    let s = String(raw).trim().replace(/\s+/g, '');
    s = s.replace(',', '.');
    if (s === '' || s === '-' || s === '+' || s === '.') return null;
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(s)) return null;
    const v = parseFloat(s);
    return isFinite(v) ? v : null;
  }

  /* Красивый вывод числа: до 2 знаков, без лишних нулей,
     десятичная запятая (как в русских учебниках). */
  function fmtNum(v, maxDigits) {
    if (v === null || v === undefined || !isFinite(v)) return '—';
    const md = (maxDigits === undefined) ? 2 : maxDigits;
    const factor = Math.pow(10, md);
    let r = Math.round(v * factor) / factor;
    if (r === 0) r = 0; // убирает -0
    let s = String(r);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('.', ',');
  }

  /* Сборка модели: прекомпьютинг границ участков. */
  function buildModel(x0, segments) {
    let t = 0, x = x0, L = 0;
    const marks = [{ t: 0, x: x0, L: 0 }];
    const segs = [];
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const vx = s.vx, dt = s.dt;
      const seg = {
        index: i,
        vx: vx, dt: dt,
        t0: t, t1: t + dt,
        x0: x, x1: x + vx * dt,
        L0: L, L1: L + Math.abs(vx) * dt
      };
      segs.push(seg);
      t = seg.t1; x = seg.x1; L = seg.L1;
      marks.push({ t: t, x: x, L: L });
    }
    const xs = marks.map(function (m) { return m.x; });
    const vs = segs.map(function (s) { return s.vx; });
    return {
      x0: x0,
      segments: segs,
      totalTime: t,
      marks: marks,
      minX: Math.min.apply(null, xs),
      maxX: Math.max.apply(null, xs),
      minV: Math.min.apply(null, [0].concat(vs)),
      maxV: Math.max.apply(null, [0].concat(vs))
    };
  }

  /* Состояние в момент t: координата, накопленный путь, скорость. */
  function stateAt(model, t) {
    const T = model.totalTime;
    if (!(T > 0)) {
      // вырожденный случай: нулевая суммарная длительность
      return { t: 0, x: model.x0, L: 0, vx: 0, done: true };
    }
    const tc = Math.max(0, Math.min(T, t));
    if (tc >= T - 1e-12) {
      const m = model.marks[model.marks.length - 1];
      const lastSeg = model.segments[model.segments.length - 1];
      return { t: T, x: m.x, L: m.L, vx: lastSeg ? lastSeg.vx : 0, done: true };
    }
    for (let i = 0; i < model.segments.length; i++) {
      const seg = model.segments[i];
      if (tc >= seg.t0 - 1e-12 && tc < seg.t1 - 1e-12) {
        const u = tc - seg.t0;
        return {
          t: tc,
          x: seg.x0 + seg.vx * u,
          L: seg.L0 + Math.abs(seg.vx) * u,
          vx: seg.vx,
          done: false
        };
      }
    }
    const m = model.marks[model.marks.length - 1];
    return { t: T, x: m.x, L: m.L, vx: 0, done: true };
  }

  /* Статистика промежутка [ta, tb]. */
  function intervalStats(model, ta, tb) {
    const a = stateAt(model, ta);
    const b = stateAt(model, tb);
    const dx = b.x - a.x;
    return {
      ta: ta, tb: tb,
      xa: a.x, xb: b.x,
      dx: dx,
      dispMag: Math.abs(dx),
      path: b.L - a.L,
      pathSegments: clippedSegments(model, ta, tb)
    };
  }

  /* Участки, обрезанные промежутком [ta, tb]. */
  function clippedSegments(model, ta, tb) {
    const res = [];
    for (let i = 0; i < model.segments.length; i++) {
      const seg = model.segments[i];
      const s = Math.max(seg.t0, ta);
      const e = Math.min(seg.t1, tb);
      if (e > s + 1e-9) {
        const dt = e - s;
        res.push({
          vx: seg.vx,
          t0: s, t1: e, dt: dt,
          dx: seg.vx * dt,
          path: Math.abs(seg.vx) * dt
        });
      }
    }
    return res;
  }

  /* Менялось ли направление движения на промежутке [ta, tb]
     (учитываем только участки с ненулевой длительностью и скоростью). */
  function hasTurn(model, ta, tb) {
    const segs = clippedSegments(model, ta, tb);
    let seenPos = false, seenNeg = false;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].vx > 1e-12) seenPos = true;
      if (segs[i].vx < -1e-12) seenNeg = true;
    }
    return seenPos && seenNeg;
  }

  /* Направление перемещения: 1 (вправо), -1 (влево), 0 (нулевое). */
  function displacementDirection(model, ta, tb) {
    const st = intervalStats(model, ta, tb);
    if (Math.abs(st.dx) < 1e-9) return 0;
    return st.dx > 0 ? 1 : -1;
  }

  /* Возвращалось ли тело в начальную точку (x0) после t = 0.
     Возвращает {yes, t} — момент возвращения, если был. */
  function returnsToStart(model) {
    const x0 = model.x0;
    for (let i = 1; i < model.marks.length; i++) {
      if (Math.abs(model.marks[i].x - x0) < 1e-9) return { yes: true, t: model.marks[i].t };
    }
    for (const seg of model.segments) {
      if (Math.abs(seg.vx) < 1e-12) continue;
      if ((seg.x0 - x0) * (seg.x1 - x0) < -1e-12) {
        const tc = seg.t0 + (x0 - seg.x0) / seg.vx;
        if (tc > 1e-9 && tc < model.totalTime - 1e-9) return { yes: true, t: tc };
      }
    }
    return { yes: false, t: null };
  }

  const Motion = {
    parseNum: parseNum,
    fmtNum: fmtNum,
    buildModel: buildModel,
    stateAt: stateAt,
    intervalStats: intervalStats,
    clippedSegments: clippedSegments,
    hasTurn: hasTurn,
    displacementDirection: displacementDirection,
    returnsToStart: returnsToStart
  };

  global.Motion = Motion;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Motion;
  }
})(typeof window !== 'undefined' ? window : globalThis);
