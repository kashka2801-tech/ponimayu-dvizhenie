/* ============================================================
   Тренажёр задач: 13 типов авторских заданий со случайными
   числами, рисунками, графиками, подсказками и решениями.
   Ответы и объяснения всегда вычисляются из текущих условий.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.Motion;
  const Tk = global.Tasks;
  const P = () => global.Progress;

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[rnd(0, arr.length - 1)]; }

  /* ---------- фигура: ось с точками ---------- */
  function axisFigure(x0, marks) {
    const host = document.createElement('div');
    const mn = Math.min(x0, Math.min.apply(null, marks.map(function (m) { return m.x; })));
    const mx = Math.max(x0, Math.max.apply(null, marks.map(function (m) { return m.x; })));
    global.Lessons._miniAxis(host, { min: mn - 2, max: mx + 2, bodyX: null });
    const svg = host.firstChild;
    const vb = (svg.getAttribute('viewBox') || '0 0 640 130').split(' ');
    const W = parseFloat(vb[2]), padL = 34, padR = 26;
    const px = (x) => padL + ((x - (mn - 2)) / ((mx + 2) - (mn - 2))) * (W - padL - padR);
    marks.forEach(function (m) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', px(m.x)); c.setAttribute('cy', 60); c.setAttribute('r', 5);
      c.setAttribute('class', 'start-dot'); svg.appendChild(c);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', px(m.x)); t.setAttribute('y', 60 - 12); t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'body-label'); t.textContent = m.label;
      svg.appendChild(t);
    });
    return host;
  }

  /* ---------- генераторы типов ---------- */
  const GENERATORS = {

    /* 1. Найти изменение координаты */
    'dx-coords': function () {
      const x1 = rnd(-9, 5), x2 = x1 + pick([2, 3, 4, 5, -2, -3, -4, -5, -6]);
      const dx = x2 - x1;
      return {
        title: 'Изменение координаты',
        condition: 'Тело двигалось по прямой вдоль оси X. В начальный момент его координата была x₁ = ' + M.fmtNum(x1) + ' м, а в конечный момент стала x₂ = ' + M.fmtNum(x2) + ' м. Тело не меняло направления движения.',
        figure: axisFigure(x1, [{ x: x1, label: 'x₁' }, { x: x2, label: 'x₂' }]),
        fields: [
          { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: dx, kind: 'dx', traps: { sum: x1 + x2 } },
          { key: 's', label: 'Путь s (разворота не было)', unit: 'м', expected: Math.abs(dx), kind: 'path' }
        ],
        hints: [
          'Изменение координаты — это «конечное минус начальное». В каком порядке вычитать?',
          'Δx = x₂ − x₁. Проверь знак: если тело сместилось вправо, Δx > 0.',
          'Δx = ' + M.fmtNum(x2) + ' − ' + M.fmtNum(x1) + ' = ' + M.fmtNum(dx) + ' м; без разворота s = |Δx| = ' + M.fmtNum(Math.abs(dx)) + ' м.'
        ],
        solution: '<p>Δx = x₂ − x₁ = ' + M.fmtNum(x2) + ' − ' + M.fmtNum(x1) + ' = <b>' + M.fmtNum(dx) + ' м</b>.</p>' +
          '<p>' + (dx > 0 ? 'Δx > 0 — смещение в положительном направлении (вправо).' : 'Δx < 0 — смещение в отрицательном направлении (влево).') + '</p>' +
          '<p>Разворота не было, поэтому s = |Δx| = ' + M.fmtNum(Math.abs(dx)) + ' м.</p><p>Проверка: x₁ + Δx = ' + M.fmtNum(x1) + ' + ' + M.fmtNum(dx) + ' = ' + M.fmtNum(x2) + ' = x₂.</p>'
      };
    },

    /* 2. Направление перемещения */
    'dir': function () {
      const x1 = rnd(-8, 4), x2 = x1 + pick([3, 4, 5, 6, -3, -4, -5, -6]);
      const right = x2 > x1;
      return {
        title: 'Направление перемещения',
        condition: 'Тело перешло из точки с координатой x₁ = ' + M.fmtNum(x1) + ' м в точку с координатой x₂ = ' + M.fmtNum(x2) + ' м. Точка x₂ ' + (right ? 'правее' : 'левее') + ' точки x₁.',
        figure: axisFigure(x1, [{ x: x1, label: 'x₁' }, { x: x2, label: 'x₂' }]),
        quiz: {
          question: 'Куда направлен вектор перемещения?',
          options: ['В положительном направлении оси X (вправо)', 'В отрицательном направлении оси X (влево)', 'Перемещение равно нулю'],
          correct: right ? 0 : 1,
          explain: right ? 'x₂ > x₁, значит Δx = x₂ − x₁ > 0 — перемещение по оси.' : 'x₂ < x₁, значит Δx < 0 — перемещение против оси.'
        },
        fields: [
          { key: 'dx', label: 'Проекция перемещения Δx', unit: 'м', expected: x2 - x1, kind: 'dx' },
          { key: 'm', label: 'Модуль перемещения |Δx|', unit: 'м', expected: Math.abs(x2 - x1), kind: 'dx' }
        ],
        hints: [
          'Сравни координаты: где тело оказалось относительно старта?',
          'Знак Δx = x₂ − x₁ подскажет направление; модуль — это «длина стрелки».',
          'Δx = ' + M.fmtNum(x2 - x1) + ' м, |Δx| = ' + M.fmtNum(Math.abs(x2 - x1)) + ' м.'
        ],
        solution: '<p>Δx = x₂ − x₁ = ' + M.fmtNum(x2 - x1) + ' м — ' + (right ? 'больше нуля, движение вправо.' : 'меньше нуля, движение влево.') + '</p><p>|Δx| = ' + M.fmtNum(Math.abs(x2 - x1)) + ' м.</p>'
      };
    },

    /* 3. Путь без разворота */
    'path-direct': function () {
      const v = pick([2, 3, 4, 5]) * pick([1, -1]);
      const t = rnd(2, 8);
      const x0 = rnd(-5, 5);
      const s = Math.abs(v) * t, dx = v * t;
      return {
        title: 'Путь без разворота',
        condition: 'Тело движется равномерно ' + (v > 0 ? 'в положительном' : 'в отрицательном') + ' направлении оси X со скоростью v_x = ' + M.fmtNum(v) + ' м/с в течение Δt = ' + t + ' с. Начальная координата x₀ = ' + M.fmtNum(x0) + ' м.',
        figure: axisFigure(x0, [{ x: x0 + dx, label: 'x_кон' }]),
        fields: [
          { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: dx, kind: 'dx' },
          { key: 's', label: 'Путь s', unit: 'м', expected: s, kind: 'path', units: ['м', 'м/с'], traps: { dx: dx } },
          { key: 'x', label: 'Конечная координата', unit: 'м', expected: x0 + dx, kind: 'coord' }
        ],
        hints: [
          'Для Δx нужна скорость со знаком, для пути — модуль скорости.',
          'Δx = v_x · Δt; s = |v_x| · Δt; x = x₀ + Δx.',
          'Δx = ' + M.fmtNum(dx) + ' м, s = ' + M.fmtNum(s) + ' м, x = ' + M.fmtNum(x0 + dx) + ' м.'
        ],
        solution: '<p>Δx = v_x · Δt = ' + M.fmtNum(v) + ' · ' + t + ' = ' + M.fmtNum(dx) + ' м.</p>' +
          '<p>s = |v_x| · Δt = ' + M.fmtNum(Math.abs(v)) + ' · ' + t + ' = ' + M.fmtNum(s) + ' м.</p>' +
          '<p>x = x₀ + Δx = ' + M.fmtNum(x0) + ' + ' + M.fmtNum(dx) + ' = ' + M.fmtNum(x0 + dx) + ' м.</p>' +
          '<p>Проверка: s = |Δx| — разворота не было.</p>'
      };
    },

    /* 4. Путь и перемещение при развороте */
    'turn': function () {
      const v1 = rnd(2, 5), t1 = rnd(2, 4), v2 = rnd(1, 4), t2 = rnd(2, 4);
      const s1 = v1 * t1, s2 = v2 * t2;
      const x0 = rnd(-3, 3);
      return {
        title: 'Разворот: путь и перемещение',
        condition: 'Тело стартовало из точки с x₀ = ' + M.fmtNum(x0) + ' м, двигалось ' + t1 + ' с вправо со скоростью ' + v1 + ' м/с, затем развернулось и ' + t2 + ' с двигалось влево со скоростью ' + v2 + ' м/с (модуль). Найди путь и перемещение за всё время.',
        figure: axisFigure(x0, [{ x: x0 + s1, label: 'точка разворота' }, { x: x0 + s1 - s2, label: 'конец' }]),
        fields: [
          { key: 's', label: 'Весь путь s', unit: 'м', expected: s1 + s2, kind: 'path', traps: { dx: s1 - s2 } },
          { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: s1 - s2, kind: 'dx', traps: {} },
          { key: 'm', label: 'Модуль перемещения', unit: 'м', expected: Math.abs(s1 - s2), kind: 'dx' }
        ],
        hints: [
          'Путь складывается из длин обоих участков. А перемещение — только «итог»: где тело оказалось относительно старта.',
          's = ' + s1 + ' + ' + s2 + '. Δx = +' + s1 + ' − ' + s2 + '.',
          's = ' + (s1 + s2) + ' м; Δx = ' + (s1 - s2) + ' м; |Δx| = ' + M.fmtNum(Math.abs(s1 - s2)) + ' м.'
        ],
        solution: '<p>Первый участок: ' + v1 + ' м/с × ' + t1 + ' с = ' + s1 + ' м. Второй: ' + v2 + ' м/с × ' + t2 + ' с = ' + s2 + ' м.</p>' +
          '<p>Путь: s = ' + s1 + ' + ' + s2 + ' = ' + (s1 + s2) + ' м.</p>' +
          '<p>Перемещение: Δx = ' + s1 + ' − ' + s2 + ' = ' + (s1 - s2) + ' м, |Δx| = ' + M.fmtNum(Math.abs(s1 - s2)) + ' м.</p>' +
          '<p>Проверка: путь (' + (s1 + s2) + ') больше модуля перемещения (' + M.fmtNum(Math.abs(s1 - s2)) + ') — был разворот.</p>'
      };
    },

    /* 5. Возвращение к началу */
    'return': function () {
      const v = rnd(2, 5), t = rnd(2, 4);
      const s1 = v * t;
      return {
        title: 'Возвращение в начальную точку',
        condition: 'Тело прошло ' + s1 + ' м в положительном направлении оси X, а затем вернулось в начальную точку с той же по модулю скоростью.',
        figure: axisFigure(0, [{ x: s1, label: 'разворот' }, { x: 0, label: 'конец = старт' }]),
        fields: [
          { key: 's', label: 'Весь путь s', unit: 'м', expected: 2 * s1, kind: 'path', traps: { dx: 0 } },
          { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: 0, kind: 'dx' }
        ],
        hints: [
          'Тело прошло весь маршрут туда и обратно. Что стало с координатой в итоге?',
          'Путь = ' + s1 + ' + ' + s1 + '. А конечная точка совпала с начальной.',
          's = ' + (2 * s1) + ' м; Δx = 0 (тело вернулось).'
        ],
        solution: '<p>Туда: ' + s1 + ' м, обратно: ' + s1 + ' м. Путь: s = 2 · ' + s1 + ' = ' + (2 * s1) + ' м.</p>' +
          '<p>Начальная и конечная точки совпали: Δx = 0, перемещение нулевое.</p>' +
          '<p>Проверка: нулевое перемещение не значит покой — путь ' + (2 * s1) + ' м показывает, что тело двигалось.</p>'
      };
    },

    /* 6. Движение через начало координат */
    'origin': function () {
      const v = rnd(1, 4);
      const x0 = -rnd(2, 6);
      const tCross = -x0 / v; // целое, т.к. x0 кратно v? нет — подберём
      // сделаем так: x0 = -v*k, тогда tCross = k
      const k = rnd(2, 4);
      const xx0 = -v * k;
      return {
        title: 'Через начало координат',
        condition: 'Тело стартует в точке с координатой x₀ = ' + M.fmtNum(xx0) + ' м и движется равномерно в положительном направлении оси X со скоростью v_x = ' + v + ' м/с.',
        figure: axisFigure(xx0, [{ x: 0, label: '0 (начало отсчёта)' }, { x: xx0 + v * (k + 2), label: 'конец' }]),
        fields: [
          { key: 'tc', label: 'В какой момент t тело оказалось в начале координат? ', unit: 'с', expected: k, kind: 'time' },
          { key: 's', label: 'Путь за время до пересечения нуля', unit: 'м', expected: v * k, kind: 'path' },
          { key: 'dx', label: 'Δx за это же время', unit: 'м', expected: v * k, kind: 'dx' }
        ],
        hints: [
          'В начале координат x = 0. Запиши уравнение координаты: x = x₀ + v_x·t.',
          '0 = ' + M.fmtNum(xx0) + ' + ' + v + '·t → t = ' + k + ' с.',
          't = ' + k + ' с; путь s = ' + v + ' · ' + k + ' = ' + (v * k) + ' м; Δx = +' + (v * k) + ' м.'
        ],
        solution: '<p>x(t) = x₀ + v_x·t. В точке 0: 0 = ' + M.fmtNum(xx0) + ' + ' + v + '·t, откуда t = ' + k + ' с.</p>' +
          '<p>За это время путь s = |v_x|·t = ' + v + ' · ' + k + ' = ' + (v * k) + ' м; Δx = 0 − ' + M.fmtNum(xx0) + ' = +' + (v * k) + ' м.</p>' +
          '<p>Проверка: координата выросла от ' + M.fmtNum(xx0) + ' до 0 — знак Δx положительный, тело пересекло начало отсчёта.</p>'
      };
    },

    /* 7. Равномерное движение в отрицательном направлении */
    'neg': function () {
      const v = -rnd(2, 5), t = rnd(2, 6), x0 = rnd(6, 14);
      const dx = v * t, s = Math.abs(v) * t;
      return {
        title: 'Движение в отрицательном направлении',
        condition: 'Тело движется равномерно со скоростью v_x = ' + v + ' м/с вдоль оси X. Начальная координата x₀ = ' + x0 + ' м. Движение длилось ' + t + ' с.',
        figure: axisFigure(x0, [{ x: x0 + dx, label: 'конец' }]),
        fields: [
          { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: dx, kind: 'dx' },
          { key: 's', label: 'Путь s', unit: 'м', expected: s, kind: 'path', traps: { dx: dx } },
          { key: 'x', label: 'Конечная координата', unit: 'м', expected: x0 + dx, kind: 'coord' }
        ],
        hints: [
          'Скорость отрицательная: координата уменьшается. Что будет со знаком Δx?',
          'Δx = v_x · Δt = ' + v + ' · ' + t + '. Путь — через модуль: |' + v + '| · ' + t + '.',
          'Δx = ' + dx + ' м; s = ' + s + ' м; x = ' + x0 + ' + ' + '(' + dx + ') = ' + M.fmtNum(x0 + dx) + ' м.'
        ],
        solution: '<p>Δx = v_x · Δt = (' + v + ') · ' + t + ' = ' + dx + ' м — координата уменьшилась.</p>' +
          '<p>s = |v_x| · Δt = ' + Math.abs(v) + ' · ' + t + ' = ' + s + ' м.</p>' +
          '<p>x = x₀ + Δx = ' + x0 + ' − ' + s + ' = ' + M.fmtNum(x0 + dx) + ' м.</p>' +
          '<p>Проверка: путь неотрицателен, s = |Δx| — движения без разворота.</p>'
      };
    },

    /* 8. Промежуток, начинающийся не с t = 0 */
    'interval': function () {
      const v1 = rnd(2, 4), t1 = rnd(2, 4);
      const v2 = -rnd(1, 3), t2 = rnd(3, 5);
      const k = rnd(1, t2 - 1); // часть второго участка
      const model = M.buildModel(0, [{ vx: v1, dt: t1 }, { vx: v2, dt: t2 }]);
      const ta = t1, tb = t1 + k;
      const st = M.intervalStats(model, ta, tb);
      return {
        title: 'Промежуток не с нуля',
        condition: 'Тело движется так: от 0 до ' + t1 + ' с — со скоростью ' + v1 + ' м/с (вправо), затем от ' + t1 + ' с до ' + (t1 + t2) + ' с — со скоростью ' + v2 + ' м/с (влево). Найди путь и изменение координаты за промежуток от t = ' + ta + ' с до t = ' + tb + ' с.',
        figure: (function () {
          const host = document.createElement('div');
          global.Lessons._miniAxis(host, { min: -1, max: v1 * t1 + 2, bodyX: null });
          return host;
        })(),
        fields: [
          { key: 's', label: 'Путь за ' + ta + '–' + tb + ' с', unit: 'м', expected: st.path, kind: 'path', traps: { dx: st.dx } },
          { key: 'dx', label: 'Δx за ' + ta + '–' + tb + ' с', unit: 'м', expected: st.dx, kind: 'dx' }
        ],
        hints: [
          'Промежуток начинается не с нуля! Смотри только то, что происходит между t = ' + ta + ' и t = ' + tb + '.',
          'На этом промежутке тело движется только со скоростью ' + v2 + ' м/с в течение ' + k + ' с.',
          's = |' + v2 + '| · ' + k + ' = ' + M.fmtNum(st.path) + ' м; Δx = ' + v2 + ' · ' + k + ' = ' + M.fmtNum(st.dx) + ' м.'
        ],
        solution: '<p>Между t = ' + ta + ' с и t = ' + tb + ' с тело движется со скоростью ' + v2 + ' м/с (второй участок), длительность ' + k + ' с.</p>' +
          '<p>s = |' + v2 + '| · ' + k + ' = ' + M.fmtNum(st.path) + ' м; Δx = ' + v2 + ' · ' + k + ' = ' + M.fmtNum(st.dx) + ' м.</p>' +
          '<p>Первый участок (до ' + ta + ' с) в этот промежуток не входит — его учитывать не нужно.</p>'
      };
    },

    /* 9. Прочитать координаты по графику x(t) */
    'read-xt': function () {
      const v1 = pick([1, 2]), t1 = rnd(3, 5), v2 = -pick([1, 2]), t2 = rnd(2, 3);
      const x0 = rnd(0, 4);
      const model = M.buildModel(x0, [{ vx: v1, dt: t1 }, { vx: v2, dt: t2 }]);
      const tAsk = Math.floor(t1 / 2) || 1;
      const xAsk = M.stateAt(model, tAsk).x;
      const st = M.intervalStats(model, 0, t1 + t2);
      const figHost = document.createElement('div');
      const chart = new global.Charts.XtChart({ host: figHost });
      chart.setModel(model);
      return {
        title: 'Чтение графика координаты',
        condition: 'На графике показано движение тела вдоль оси X. Определи по графику: координату в момент t = ' + tAsk + ' с, изменение координаты за всё время движения и весь путь.',
        figure: figHost,
        fields: [
          { key: 'x', label: 'Координата в t = ' + tAsk + ' с', unit: 'м', expected: xAsk, kind: 'coord' },
          { key: 'dx', label: 'Δx за всё время', unit: 'м', expected: st.dx, kind: 'dx' },
          { key: 's', label: 'Весь путь', unit: 'м', expected: st.path, kind: 'path', traps: { dx: st.dx } }
        ],
        hints: [
          'Координата в момент t — где вертикальная линия t пересекает график. Δx — разность координат конца и начала.',
          'Для пути: были ли развороты? Если да — путь складывается из длин участков.',
          'x(' + tAsk + ') = ' + M.fmtNum(xAsk) + ' м; Δx = ' + M.fmtNum(st.dx) + ' м; путь = ' + M.fmtNum(st.path) + ' м.'
        ],
        solution: '<p>По графику: x(' + tAsk + ' с) = ' + M.fmtNum(xAsk) + ' м (движение от x₀ = ' + M.fmtNum(x0) + ' м со скоростью ' + v1 + ' м/с).</p>' +
          '<p>Δx = x_кон − x_нач = ' + M.fmtNum(st.xb) + ' − ' + M.fmtNum(st.xa) + ' = ' + M.fmtNum(st.dx) + ' м.</p>' +
          '<p>Путь: первый участок ' + M.fmtNum(v1 * t1) + ' м + второй ' + M.fmtNum(Math.abs(v2) * t2) + ' м = ' + M.fmtNum(st.path) + ' м.</p>' +
          '<p>Проверка: путь > |Δx| — было изменение направления.</p>'
      };
    },

    /* 10. Путь по графику скорости */
    'read-vt': function () {
      const v1 = rnd(2, 4), t1 = rnd(2, 4), v2 = -rnd(1, 3), t2 = rnd(2, 3), v3 = rnd(1, 2), t3 = rnd(1, 2);
      const model = M.buildModel(0, [{ vx: v1, dt: t1 }, { vx: v2, dt: t2 }, { vx: v3, dt: t3 }]);
      const st = M.intervalStats(model, 0, model.totalTime);
      const figHost = document.createElement('div');
      const chart = new global.Charts.VtChart({ host: figHost });
      chart.setModel(model, false);
      return {
        title: 'Путь по графику скорости',
        condition: 'На графике показана зависимость скорости v_x от времени. Найди путь за всё время движения и изменение координаты за это же время (учти знаки!).',
        figure: figHost,
        fields: [
          { key: 's', label: 'Путь за всё время', unit: 'м', expected: st.path, kind: 'path', units: ['м', 'м/с'], traps: { dx: st.dx } },
          { key: 'dx', label: 'Δx за всё время', unit: 'м', expected: st.dx, kind: 'dx', traps: { s: st.path } }
        ],
        hints: [
          'Путь — сумма площадей всех прямоугольников (модулей). Δx — сумма со знаками: ниже оси — минус.',
          'Площади: ' + v1 + '·' + t1 + ', |' + v2 + '|·' + t2 + ', ' + v3 + '·' + t3 + '.',
          's = ' + M.fmtNum(st.path) + ' м; Δx = ' + M.fmtNum(st.dx) + ' м.'
        ],
        solution: '<p>Площади участков: ' + v1 + '·' + t1 + ' = ' + (v1 * t1) + ' м; |' + v2 + '|·' + t2 + ' = ' + (Math.abs(v2) * t2) + ' м; ' + v3 + '·' + t3 + ' = ' + (v3 * t3) + ' м.</p>' +
          '<p>Путь: s = ' + (v1 * t1) + ' + ' + (Math.abs(v2) * t2) + ' + ' + (v3 * t3) + ' = ' + M.fmtNum(st.path) + ' м.</p>' +
          '<p>Δx = +' + (v1 * t1) + ' − ' + (Math.abs(v2) * t2) + ' + ' + (v3 * t3) + ' = ' + M.fmtNum(st.dx) + ' м.</p>' +
          '<p>Проверка: s ≥ |Δx| — выполняется.</p>'
      };
    },

    /* 11. Сравнение двух движений с одинаковым перемещением */
    'compare': function () {
      const v = rnd(2, 4), t = rnd(2, 3);
      const d = v * t; // общее перемещение
      // A: едет v t секунд: Δx = d, путь d
      // B: едет 2d вправо... сделаем: вправо v, время 2t (путь 2d), затем влево v, время t (путь d): Δx = 2d - d = d, путь 3d
      return {
        title: 'Одинаковое перемещение — разный путь',
        condition: 'Два тела стартовали из одной точки. Тело А двигалось вправо со скоростью ' + v + ' м/с в течение ' + t + ' с. Тело Б двигалось вправо со скоростью ' + v + ' м/с в течение ' + (2 * t) + ' с, а затем влево с той же скоростью ' + t + ' с. Сравни их перемещения и пути.',
        figure: axisFigure(0, [{ x: d, label: 'финиш А и Б' }, { x: 2 * d, label: 'разворот Б' }]),
        quiz: {
          question: 'У какого тела путь больше?',
          options: ['Пути одинаковы', 'У тела Б', 'У тела А'],
          correct: 1,
          explain: 'Перемещения у обоих ' + d + ' м, но тело Б ещё ездило «туда-обратно»: его путь больше.'
        },
        fields: [
          { key: 'sa', label: 'Путь тела А', unit: 'м', expected: d, kind: 'path' },
          { key: 'sb', label: 'Путь тела Б', unit: 'м', expected: 3 * d, kind: 'path', traps: { dx: d } },
          { key: 'dx', label: 'Перемещение каждого (Δx)', unit: 'м', expected: d, kind: 'dx' }
        ],
        hints: [
          'Начни с перемещений: где каждое тело оказалось?',
          'А: путь = перемещению (без разворота). Б: путь = ' + (2 * d) + ' + ' + d + '.',
          's_А = ' + d + ' м; s_Б = ' + (3 * d) + ' м; Δx обоих = ' + d + ' м.'
        ],
        solution: '<p>Тело А: без разворота, s_А = |Δx| = ' + d + ' м.</p>' +
          '<p>Тело Б: вправо ' + (2 * d) + ' м, затем влево ' + d + ' м: s_Б = ' + (2 * d) + ' + ' + d + ' = ' + (3 * d) + ' м.</p>' +
          '<p>Перемещения: оба тела в точке x = ' + d + ' м, Δx = ' + d + ' м.</p>' +
          '<p>Вывод: одинаковое перемещение не гарантирует одинаковый путь.</p>'
      };
    },

    /* 12. Найти и объяснить ошибку */
    'error': function () {
      const v1 = rnd(2, 3), t1 = rnd(3, 4), v2 = rnd(1, 2), t2 = rnd(2, 3);
      const s1 = v1 * t1, s2 = v2 * t2;
      const dx = s1 - s2, s = s1 + s2;
      const name = pick(['Вити', 'Коли', 'Маши', 'Даши']);
      const variants = [
        {
          wrong: name + ' написал: «s = Δx = ' + dx + ' м».',
          why: 'При развороте путь не равен изменению координаты — путь складывается из длин участков.',
          correctLabel: 'Правильный путь',
          correctVal: s
        },
        {
          wrong: name + ' вычислил: Δx = x_нач − x_кон = ' + (s2 - s1) + ' м.',
          why: 'Порядок вычитания перепутан: нужно конечное минус начальное, а не наоборот.',
          correctLabel: 'Правильное Δx',
          correctVal: dx
        },
        {
          wrong: name + ' записал: «путь получился отрицательным: ' + (-dx) + ' м».',
          why: 'Путь не бывает отрицательным: при движении влево путь всё равно положителен, знак минус живёт только у Δx.',
          correctLabel: 'Правильный путь',
          correctVal: s
        }
      ];
      const v = pick(variants);
      return {
        title: 'Найди ошибку',
        condition: 'Тело прошло ' + s1 + ' м вправо, затем ' + s2 + ' м влево. ' + v.wrong + ' Найди ошибку и запиши правильный ответ.',
        figure: axisFigure(0, [{ x: s1, label: 'разворот' }, { x: dx, label: 'конец' }]),
        quiz: {
          question: 'В чём ошибка?',
          options: [
            'Ошибка в вычислениях — числа неверные',
            'Перепутаны путь и перемещение (или порядок вычитания, или знак)',
            'Ошибки нет'
          ],
          correct: 1,
          explain: v.why
        },
        fields: [
          { key: 'c', label: v.correctLabel, unit: 'м', expected: v.correctVal, kind: v.correctLabel.indexOf('Путь') >= 0 ? 'path' : 'dx' }
        ],
        hints: [
          'Проверь: тело меняло направление? Что это меняет для пути и для Δx?',
          'Путь = ' + s1 + ' + ' + s2 + '. Перемещение: тело оказалось в ' + dx + ' м от старта.',
          v.correctLabel + ' = ' + M.fmtNum(v.correctVal) + ' м.'
        ],
        solution: '<p>Путь: s = ' + s1 + ' + ' + s2 + ' = ' + s + ' м.</p><p>Δx = ' + s1 + ' − ' + s2 + ' = ' + dx + ' м.</p><p>' + v.why + '</p>'
      };
    },

    /* 13. Собака Протон (по образцу задачи учебника) */
    'proton': function () {
      // фиксированный сценарий: |v| = 4 м/с, разворот в t = 4 с, дом в x = 0
      const fig = axisFigure(0, [{ x: 16, label: 'разворот (16 м)' }, { x: 8, label: 'x(6 с)' }]);
      return {
        title: 'Собака Протон (по мотивам задачи из §18)',
        condition: 'Собака Протон выбежала из дома (x = 0) в момент t₀ = 0 с, а по команде хозяина в момент t = 4 с развернулась и побежала обратно. Всё время она бежала по прямой с модулем скорости |v| = 4 м/с.<br><br>Определи изменение координаты и путь Протона за промежуток от 0 до 6 с, а также путь за промежуток от 2 до 5 с.',
        figure: fig,
        fields: [
          { key: 'dx', label: 'Δx за 0–6 с', unit: 'м', expected: 8, kind: 'dx' },
          { key: 's', label: 'Путь за 0–6 с', unit: 'м', expected: 24, kind: 'path', traps: { dx: 8 } },
          { key: 's25', label: 'Путь за 2–5 с', unit: 'м', expected: 12, kind: 'path' }
        ],
        hints: [
          'Разбей движение на участки: 0–4 с (вправо) и 4–6 с (влево). Сколько метров за каждый?',
          'За 0–4 с: 4·4 = 16 м вправо. За 4–6 с: 4·2 = 8 м влево. Итог перемещения: 16 − 8. Путь: 16 + 8.',
          'Для 2–5 с: от 2 до 4 с — 8 м вправо, от 4 до 5 с — 4 м влево: путь 12 м.'
        ],
        solution: '<p><b>0–6 с.</b> Вправо: |v|·Δt = 4·4 = 16 м; влево: 4·2 = 8 м.</p>' +
          '<p>Путь: s = 16 + 8 = 24 м. Перемещение: Δx = 16 − 8 = 8 м (Протон в точке x = 8 м).</p>' +
          '<p><b>2–5 с.</b> Этот промежуток пересекает разворот: от 2 до 4 с — 8 м вправо, от 4 до 5 с — 4 м влево. Путь: 8 + 4 = 12 м.</p>' +
          '<p>Проверка: путь (24 м) больше модуля перемещения (8 м) — было изменение направления.</p>',
        graphTask: true
      };
    }
  };

  /* ---------- построение графика координаты (Протон) ---------- */
  function buildProtonGraphTask() {
    const wrap = document.createElement('div');
    wrap.className = 'task-card';
    const h = document.createElement('div');
    h.className = 'task-title';
    h.textContent = 'Построй график координаты Протона';
    wrap.appendChild(h);
    const intro = document.createElement('div');
    intro.className = 'task-intro';
    intro.innerHTML = 'Отметь точки графика x(t): кликай по клеткам. Протон стартует из x = 0 в t = 0. Достаточно отметить вершины ломаной: старт, точку разворота (t = 4 с) и точку в t = 6 с. Затем нажми «Проверить график».';
    wrap.appendChild(intro);

    const host = document.createElement('div');
    wrap.appendChild(host);
    const msg = document.createElement('div');
    msg.className = 'task-msg';
    wrap.appendChild(msg);

    // сетка: t 0..7 (шаг 1), x 0..18 (шаг 2)
    const W = 640, H = 320, padL = 46, padR = 16, padT = 16, padB = 40;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'chart');
    svg.style.cursor = 'crosshair';
    const tMax = 7, xMax = 18;
    const px = (t) => padL + (t / tMax) * (W - padL - padR);
    const py = (x) => H - padB - (x / xMax) * (H - padT - padB);
    // сетка
    for (let t = 0; t <= tMax; t++) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', px(t)); l.setAttribute('y1', padT); l.setAttribute('x2', px(t)); l.setAttribute('y2', H - padB);
      l.setAttribute('class', 'grid'); svg.appendChild(l);
      const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tx.setAttribute('x', px(t)); tx.setAttribute('y', H - padB + 18); tx.setAttribute('text-anchor', 'middle');
      tx.setAttribute('class', 'tick'); tx.textContent = String(t); svg.appendChild(tx);
    }
    for (let x = 0; x <= xMax; x += 2) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', padL); l.setAttribute('y1', py(x)); l.setAttribute('x2', W - padR); l.setAttribute('y2', py(x));
      l.setAttribute('class', 'grid'); svg.appendChild(l);
      const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tx.setAttribute('x', padL - 8); tx.setAttribute('y', py(x) + 4); tx.setAttribute('text-anchor', 'end');
      tx.setAttribute('class', 'tick'); tx.textContent = String(x); svg.appendChild(tx);
    }
    const ax = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ax.setAttribute('x', 8); ax.setAttribute('y', 14); ax.setAttribute('class', 'axis-label'); ax.textContent = 'x, м';
    svg.appendChild(ax);
    const at = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    at.setAttribute('x', W - padR); at.setAttribute('y', H - 6); at.setAttribute('text-anchor', 'end'); at.setAttribute('class', 'axis-label');
    at.textContent = 't, с'; svg.appendChild(at);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', 'xt-line');
    line.setAttribute('points', '');
    svg.appendChild(line);
    host.appendChild(svg);

    const points = [];
    svg.addEventListener('click', function (ev) {
      const r = svg.getBoundingClientRect();
      const xPix = (ev.clientX - r.left) * (W / r.width);
      const yPix = (ev.clientY - r.top) * (H / r.height);
      let t = (xPix - padL) / (W - padL - padR) * tMax;
      let x = (H - padB - yPix) / (H - padT - padB) * xMax;
      t = Math.max(0, Math.min(tMax, Math.round(t)));
      x = Math.max(0, Math.min(xMax, Math.round(x / 2) * 2));
      // не добавлять дубликаты по t
      const ex = points.find(function (p) { return p.t === t; });
      if (ex) { ex.x = x; } else points.push({ t: t, x: x });
      points.sort(function (a, b) { return a.t - b.t; });
      redraw();
    });
    function redraw() {
      svg.querySelectorAll('.pt').forEach(function (n) { n.remove(); });
      line.setAttribute('points', points.map(function (p) { return px(p.t) + ',' + py(p.x); }).join(' '));
      points.forEach(function (p) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', px(p.t)); c.setAttribute('cy', py(p.x)); c.setAttribute('r', 5);
        c.setAttribute('class', 'pt cursor-dot'); svg.appendChild(c);
      });
    }
    const bar = document.createElement('div');
    bar.className = 'task-bar';
    const checkBtn = Tk.mkBtn('Проверить график', 'btn btn-primary');
    const clearBtn = Tk.mkBtn('Стереть точки', 'btn btn-ghost');
    const solBtn = Tk.mkBtn('Показать решение', 'btn btn-ghost btn-solution');
    bar.appendChild(checkBtn); bar.appendChild(clearBtn); bar.appendChild(solBtn);
    wrap.appendChild(bar);
    const sol = document.createElement('div');
    sol.className = 'task-solution';
    sol.hidden = true;
    sol.innerHTML = '<p>График: от (0; 0) до (4; 16) — подъём (движение вправо от дома), затем от (4; 16) до (6; 8) — спуск (возвращение).</p><p>Вершина — точка разворота (t = 4 с, x = 16 м). Крутизна одинаковая: модуль скорости всюду 4 м/с.</p>';
    solBtn.addEventListener('click', function () {
      sol.hidden = false; solBtn.disabled = true;
      if (P()) P().set('proton-graph', 'viewed');
    });
    wrap.appendChild(sol);

    checkBtn.addEventListener('click', function () {
      // ожидаемые точки: (0,0), (4,16), (6,8)
      const need = [{ t: 0, x: 0 }, { t: 4, x: 16 }, { t: 6, x: 8 }];
      let ok = points.length === need.length;
      if (ok) {
        for (const n of need) {
          if (!points.some(function (p) { return p.t === n.t && Math.abs(p.x - n.x) < 0.5; })) { ok = false; break; }
        }
      }
      if (ok) {
        msg.className = 'task-msg msg-ok';
        msg.textContent = 'Верно! График построен: подъём до (4 с; 16 м), затем спуск до (6 с; 8 м).';
        if (P()) P().set('proton-graph', 'solved');
      } else {
        msg.className = 'task-msg msg-err';
        msg.textContent = 'График пока не тот. Проверь себя: где Протон в t = 0? Куда он прибежал к моменту разворота (4 с)? Где он через 6 с? Должно получиться ровно 3 точки.';
        if (P()) P().set('proton-graph', 'retry');
      }
    });
    clearBtn.addEventListener('click', function () {
      points.length = 0; redraw();
      msg.textContent = ''; msg.className = 'task-msg';
    });
    return wrap;
  }

  /* ---------- разобранные примеры ---------- */
  function buildWorkedExamples() {
    const wrap = document.createElement('div');
    const examples = [
      {
        title: 'Пример 1. Движение с разворотом',
        steps: [
          'Условие: тело стартует из x₀ = 2 м, движется 5 с вправо со скоростью 3 м/с, затем 4 с влево со скоростью 2 м/с.',
          'Шаг 1. Что известно: x₀ = 2 м; участок 1: v₁ = 3 м/с, Δt₁ = 5 с; участок 2: v₂ = −2 м/с, Δt₂ = 4 с.',
          'Шаг 2. Развороты были? Да: скорость меняла знак. Значит, путь ≠ |Δx|, считать нужно по участкам.',
          'Шаг 3. Первый участок: Δx₁ = 3·5 = 15 м, путь s₁ = 15 м. Второй: Δx₂ = −2·4 = −8 м, путь s₂ = 8 м.',
          'Шаг 4. Конечная координата: x = 2 + 15 − 8 = 9 м.',
          'Шаг 5. Весь путь: s = 15 + 8 = 23 м. Перемещение: Δx = 9 − 2 = 7 м.',
          'Проверка: путь (23 м) больше модуля перемещения (7 м) — так и должно быть при развороте. x₀ + Δx = 2 + 7 = 9 ✓.'
        ]
      },
      {
        title: 'Пример 2. Путь по графику скорости',
        steps: [
          'Условие: график v_x(t): от 0 до 6 с скорость +4 м/с, от 6 до 9 с скорость −2 м/с.',
          'Шаг 1. Путь — сумма площадей прямоугольников (модулей): 4·6 = 24 м и 2·3 = 6 м.',
          'Шаг 2. Итого путь: s = 24 + 6 = 30 м.',
          'Шаг 3. Δx — площади со знаком: Δx = +24 − 6 = 18 м.',
          'Проверка: s = 30 ≥ |Δx| = 18 ✓; единицы: м/с × с = м ✓.'
        ]
      }
    ];
    examples.forEach(function (ex) {
      const card = document.createElement('div');
      card.className = 'task-card worked-example';
      const h = document.createElement('div');
      h.className = 'task-title'; h.textContent = ex.title;
      card.appendChild(h);
      const ol = document.createElement('ol');
      ol.className = 'worked-steps';
      ex.steps.forEach(function (s, i) {
        const li = document.createElement('li');
        const btn = Tk.mkBtn('Показать шаг ' + (i + 1), 'btn btn-ghost btn-step');
        const body = document.createElement('span');
        body.hidden = true;
        btn.addEventListener('click', function () {
          body.hidden = false; btn.disabled = true;
        });
        li.appendChild(btn); li.appendChild(body);
        body.innerHTML = s;
        ol.appendChild(li);
      });
      const allBtn = Tk.mkBtn('Показать все шаги', 'btn btn-ghost');
      allBtn.addEventListener('click', function () {
        ol.querySelectorAll('span').forEach(function (sp) { sp.hidden = false; });
        ol.querySelectorAll('.btn-step').forEach(function (b) { b.disabled = true; });
        allBtn.disabled = true;
      });
      card.appendChild(ol);
      card.appendChild(allBtn);
      wrap.appendChild(card);
    });
    return wrap;
  }

  /* ---------- интерфейс тренажёра ---------- */
  const TYPE_NAMES = {
    'dx-coords': 'Изменение координаты',
    'dir': 'Направление перемещения',
    'path-direct': 'Путь без разворота',
    'turn': 'Разворот: путь и перемещение',
    'return': 'Возвращение к началу',
    'origin': 'Через начало координат',
    'neg': 'Движение влево',
    'interval': 'Промежуток не с нуля',
    'read-xt': 'Чтение графика x(t)',
    'read-vt': 'Путь по графику v(t)',
    'compare': 'Сравнение движений',
    'error': 'Найди ошибку',
    'proton': 'Собака Протон'
  };

  function buildTrainer(host) {
    const frag = document.createDocumentFragment();
    const intro = document.createElement('section');
    intro.className = 'card lesson-text';
    intro.innerHTML = '<h3>Как работать с тренажёром</h3>' +
      '<p>Выбери тип задачи — числа каждый раз новые. Ответы можно вводить и с запятой, и с точкой. Если ошиблась — сначала получишь направляющий вопрос, потом намёк, и только потом разбор. «Показать решение» открывается только по твоему решению.</p>';
    frag.appendChild(intro);

    // выбор типа
    const typeCard = document.createElement('section');
    typeCard.className = 'card';
    typeCard.innerHTML = '<h3>Тип задачи</h3>';
    const chips = document.createElement('div');
    chips.className = 'chip-row';
    Object.keys(TYPE_NAMES).forEach(function (key) {
      const b = Tk.mkBtn(TYPE_NAMES[key], 'btn btn-chip');
      b.dataset.key = key;
      b.addEventListener('click', function () {
        currentType = key;
        chips.querySelectorAll('.btn-chip').forEach(function (c) { c.classList.remove('chip-active'); });
        b.classList.add('chip-active');
        renderTask();
      });
      chips.appendChild(b);
    });
    typeCard.appendChild(chips);
    const newBtn = Tk.mkBtn('Другая задача (новые числа)', 'btn btn-ghost');
    newBtn.addEventListener('click', renderTask);
    typeCard.appendChild(newBtn);
    frag.appendChild(typeCard);

    const statusCard = document.createElement('section');
    statusCard.className = 'card';
    statusCard.innerHTML = '<h3>Мой прогресс</h3>';
    const statusHost = document.createElement('div');
    statusCard.appendChild(statusHost);
    frag.appendChild(statusCard);

    const taskHost = document.createElement('div');
    frag.appendChild(taskHost);

    const protonHost = document.createElement('div');
    frag.appendChild(protonHost);

    const workedCard = document.createElement('section');
    workedCard.className = 'card';
    workedCard.innerHTML = '<h3>Разобранные примеры</h3>';
    workedCard.appendChild(buildWorkedExamples());
    frag.appendChild(workedCard);

    host.appendChild(frag);

    let currentType = 'dx-coords';
    chips.firstChild.classList.add('chip-active');

    function renderStatus() {
      if (!P()) { statusHost.innerHTML = ''; return; }
      let html = '<div class="legend small muted"><span class="badge badge-solved">сама</span> <span class="badge badge-solved">после ошибок</span> <span class="badge badge-hint">с подсказкой</span> <span class="badge badge-viewed">просмотрела решение</span> <span class="badge badge-retry">стоит повторить</span></div>';
      html += '<div class="progress-list">';
      Object.keys(TYPE_NAMES).forEach(function (key) {
        const name = TYPE_NAMES[key];
        // сводка по типу: группируем записи по экземпляру задачи
        // (основная форма и викторина — части ОДНОЙ задачи, не две)
        const ids = P().keysByPrefix('tr-' + key + '-');
        const groups = {};
        ids.forEach(function (id) {
          const isQuiz = /-quiz$/.test(id);
          const base = id.replace(/-quiz$/, '');
          if (!groups[base]) groups[base] = { formSolved: false, quizSolved: false, hinted: false, viewed: false, wrongs: 0, any: false };
          const it = (P().data.items[id]) || {};
          if (isQuiz) { if (it.solved) groups[base].quizSolved = true; }
          else { if (it.solved) groups[base].formSolved = true; }
          if (it.hinted) groups[base].hinted = true;
          if (it.viewed) groups[base].viewed = true;
          if (it.wrongs) groups[base].wrongs += it.wrongs;
          if (it.solved || it.hinted || it.viewed || it.wrongs) groups[base].any = true;
        });
        const cnt = { self: 0, afterErr: 0, hint: 0, viewed: 0, retry: 0 };
        Object.keys(groups).forEach(function (g) {
          const f = groups[g];
          if (!f.any) return; // только метаданные — попыток не было
          // завершённость = решены ВСЕ обязательные части (форма и, если есть, викторина)
          const meta = (P().data.items[g]) || {};
          const requiresQuiz = !!meta.quizRequired;
          const completed = f.formSolved && (!requiresQuiz || f.quizSolved);
          if (!completed) {
            if (f.viewed) cnt.viewed++;   // смотрела решение, не завершив
            else cnt.retry++;            // ошибка/подсказка без завершения
            return;
          }
          if (f.viewed) cnt.viewed++;      // завершила после просмотра решения
          else if (f.hinted) cnt.hint++;
          else if (f.wrongs > 0) cnt.afterErr++;
          else cnt.self++;
        });
        const total = cnt.self + cnt.afterErr + cnt.hint + cnt.viewed + cnt.retry;
        if (total === 0) { html += '<div class="progress-row"><span>' + name + '</span><span class="badge badge-none">ещё не решала</span></div>'; return; }
        const parts = [];
        if (cnt.self) parts.push('<span class="badge badge-solved">сама ×' + cnt.self + '</span>');
        if (cnt.afterErr) parts.push('<span class="badge badge-solved">после ошибок ×' + cnt.afterErr + '</span>');
        if (cnt.hint) parts.push('<span class="badge badge-hint">с подсказкой ×' + cnt.hint + '</span>');
        if (cnt.viewed) parts.push('<span class="badge badge-viewed">просмотрела решение ×' + cnt.viewed + '</span>');
        if (cnt.retry) parts.push('<span class="badge badge-retry">стоит повторить ×' + cnt.retry + '</span>');
        html += '<div class="progress-row"><span>' + name + '</span><span class="progress-badges">' + parts.join(' ') + '</span></div>';
      });
      html += '</div>';
      statusHost.innerHTML = html;
    }

    function renderTask() {
      taskHost.innerHTML = '';
      protonHost.innerHTML = '';
      const gen = GENERATORS[currentType]();
      // уникальный id экземпляра: прогресс и черновики не переходят на другую задачу
      const uid = Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
      const instId = 'tr-' + currentType + '-' + uid;
      // метаданные: какие части обязательны для завершения этого экземпляра
      if (P()) P().setMeta(instId, { quizRequired: !!gen.quiz });
      if (gen.quiz) {
        const quizCard = document.createElement('div');
        quizCard.className = 'quiz-wrap';
        const q = Tk.createQuiz(Object.assign({}, gen.quiz, {
          onSolved: function (ok) { if (P()) { P().set(instId + '-quiz', ok ? 'solved' : 'retry'); renderStatus(); } }
        }));
        quizCard.appendChild(q);
        taskHost.appendChild(quizCard);
      }
      const form = Tk.createTaskForm({
        intro: gen.condition,
        fields: gen.fields,
        hints: gen.hints,
        solution: gen.solution,
        onStatus: function (s) {
          if (P()) P().set(instId, s);
          renderStatus();
        }
      });
      // передаём текущую задачу в режим «Объясняю сама»
      if (global.Explain && global.Explain.setCurrentTask) {
        global.Explain.setCurrentTask({
          instanceId: instId,
          title: 'Тренировочная задача: ' + (gen.title || TYPE_NAMES[currentType]),
          condition: gen.condition,
          solution: gen.solution,
          figureHTML: gen.figure ? gen.figure.innerHTML : null
        });
      }
      // кнопка перехода: объяснить именно эту задачу
      const exBtn = Tk.mkBtn('Объяснить эту задачу', 'btn btn-ghost');
      exBtn.addEventListener('click', function () {
        if (global.App && global.App.show) global.App.show('explain');
      });
      const t = document.createElement('div');
      t.className = 'task-type-title';
      t.textContent = 'Тренировочное задание: ' + (gen.title || '');
      taskHost.appendChild(t);
      taskHost.appendChild(exBtn);
      if (gen.figure) form.insertBefore(gen.figure, form.querySelector('.task-fields'));
      taskHost.appendChild(form);
      if (gen.graphTask) {
        const ph = document.createElement('div');
        ph.className = 'card';
        ph.innerHTML = '<h3>Дополнительное задание: график</h3>';
        ph.appendChild(buildProtonGraphTask());
        protonHost.appendChild(ph);
      }
      renderStatus();
    }
    renderTask();
  }

  global.Trainer = { build: buildTrainer };
})(typeof window !== 'undefined' ? window : globalThis);
