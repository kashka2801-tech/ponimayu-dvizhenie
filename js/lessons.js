/* ============================================================
   Учебные разделы: координата, Δx, перемещение, путь, разворот
   (с опорным примером §18), равномерное движение, графики.
   Каждый раздел: пример → объяснение → точная формулировка →
   вопрос на понимание → задание → три вида объяснений.
   ============================================================ */
(function (global) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const M = global.Motion;
  const Tk = global.Tasks;
  const P = () => global.Progress;

  /* ---------- мелкие помощники ---------- */
  function card(title, cls) {
    const s = document.createElement('section');
    s.className = 'card ' + (cls || '');
    if (title) { const h = document.createElement('h3'); h.textContent = title; s.appendChild(h); }
    return s;
  }
  function para(html) { const d = document.createElement('p'); d.className = 'lesson-p'; d.innerHTML = html; return d; }
  function formula(html) { const d = document.createElement('div'); d.className = 'formula-box'; d.innerHTML = html; return d; }
  function note(html) { const d = document.createElement('div'); d.className = 'note-box'; d.innerHTML = html; return d; }
  function warn(html) { const d = document.createElement('div'); d.className = 'warn-box'; d.innerHTML = html; return d; }

  /* Три разных объяснения: «Проще», «Покажи на примере», «Почему так?» */
  function explainTrio(simpler, example, why) {
    const wrap = document.createElement('div');
    wrap.className = 'explain-trio';
    const bar = document.createElement('div');
    bar.className = 'explain-bar';
    const boxes = {};
    [['simpler', 'Проще'], ['example', 'Покажи на примере'], ['why', 'Почему так?']].forEach(function (pair) {
      const b = Tk.mkBtn(pair[1], 'btn btn-ghost');
      const box = document.createElement('div');
      box.className = 'explain-box';
      box.hidden = true;
      box.innerHTML = pair[0] === 'simpler' ? simpler : (pair[0] === 'example' ? example : why);
      b.addEventListener('click', function () {
        const open = !box.hidden;
        for (const k in boxes) boxes[k].hidden = true;
        box.hidden = open;
      });
      bar.appendChild(b);
      boxes[pair[0]] = box;
      wrap.appendChild(box);
    });
    wrap.insertBefore(bar, wrap.firstChild);
    return wrap;
  }

  /* Простая ось для мини-примеров */
  function miniAxis(host, opts) {
    const o = Object.assign({ min: -8, max: 8, bodyX: null, arrow: null, landmarks: [], cy: 60, h: 130, clickable: false, onPick: null, path: null }, opts);
    const compact = global.Charts.isCompact();
    const W = compact ? 420 : 640, H = o.h, padL = 34, padR = 26;
    host.innerHTML = '';
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('class', 'axis-svg' + (compact ? ' svg-compact' : ''));
    const px = (x) => padL + ((x - o.min) / (o.max - o.min)) * (W - padL - padR);
    const axis = document.createElementNS(SVGNS, 'line');
    axis.setAttribute('x1', padL); axis.setAttribute('y1', o.cy); axis.setAttribute('x2', W - padR); axis.setAttribute('y2', o.cy);
    axis.setAttribute('class', 'axis'); svg.appendChild(axis);
    const step = global.Charts.niceStep(o.max - o.min, 12);
    for (let x = Math.ceil(o.min / step) * step; x <= o.max + 1e-9; x += step) {
      const t = document.createElementNS(SVGNS, 'line');
      t.setAttribute('x1', px(x)); t.setAttribute('y1', o.cy - 4); t.setAttribute('x2', px(x)); t.setAttribute('y2', o.cy + 4);
      t.setAttribute('class', 'tickline'); svg.appendChild(t);
      const l = document.createElementNS(SVGNS, 'text');
      l.setAttribute('x', px(x)); l.setAttribute('y', o.cy + 20); l.setAttribute('text-anchor', 'middle');
      l.setAttribute('class', 'tick'); l.textContent = M.fmtNum(x);
      svg.appendChild(l);
    }
    const u = document.createElementNS(SVGNS, 'text');
    u.setAttribute('x', 6); u.setAttribute('y', o.cy - 10); u.setAttribute('class', 'axis-label'); u.textContent = 'м';
    svg.appendChild(u);
    const d = document.createElementNS(SVGNS, 'text');
    d.setAttribute('x', W - padR); d.setAttribute('y', o.cy - 10); d.setAttribute('text-anchor', 'end');
    d.setAttribute('class', 'axis-label'); d.textContent = 'X →';
    svg.appendChild(d);
    (o.landmarks || []).forEach(function (lm) {
      const l = document.createElementNS(SVGNS, 'text');
      l.setAttribute('x', px(lm.x)); l.setAttribute('y', o.cy + (lm.below ? 38 : -12));
      l.setAttribute('text-anchor', 'middle'); l.setAttribute('class', 'lm-label');
      l.textContent = lm.label;
      svg.appendChild(l);
    });
    if (o.arrow) {
      const a = o.arrow;
      if (Math.abs(a.to - a.from) > 1e-9) {
        const l1 = document.createElementNS(SVGNS, 'line');
        l1.setAttribute('x1', px(a.from)); l1.setAttribute('y1', o.cy - 24); l1.setAttribute('x2', px(a.to)); l1.setAttribute('y2', o.cy - 24);
        l1.setAttribute('class', 'disp-arrow'); svg.appendChild(l1);
        const hd = document.createElementNS(SVGNS, 'path');
        const sgn = a.to > a.from ? 1 : -1;
        hd.setAttribute('d', 'M ' + px(a.to) + ' ' + (o.cy - 24) + ' l ' + (-sgn * 9) + ' -4 v 8 z');
        hd.setAttribute('class', 'disp-arrow-head'); svg.appendChild(hd);
      } else {
        const zl = document.createElementNS(SVGNS, 'text');
        const zy = Math.max(o.cy - 56, 14);
        zl.setAttribute('x', px(a.from)); zl.setAttribute('y', zy);
        zl.setAttribute('text-anchor', 'middle'); zl.setAttribute('class', 'disp-label');
        zl.textContent = 'перемещение Δx = 0 (нулевое)';
        svg.appendChild(zl);
        // если рядом метка тела — опускаем её ниже, чтобы не наезжать
        const bl0 = svg.querySelector('.body-label');
        if (bl0) bl0.setAttribute('y', zy + 24);
      }
    }
    let body = null, bodyLbl = null;
    function drawBody(x) {
      if (body) { body.setAttribute('cx', px(x)); bodyLbl.setAttribute('x', px(x)); bodyLbl.textContent = 'тело: x = ' + M.fmtNum(x) + ' м'; }
    }
    if (o.bodyX !== null && o.bodyX !== undefined) {
      body = document.createElementNS(SVGNS, 'circle');
      body.setAttribute('cx', px(o.bodyX)); body.setAttribute('cy', o.cy); body.setAttribute('r', 8);
      body.setAttribute('class', 'body-dot'); svg.appendChild(body);
      bodyLbl = document.createElementNS(SVGNS, 'text');
      bodyLbl.setAttribute('x', px(o.bodyX)); bodyLbl.setAttribute('y', o.cy - 34);
      bodyLbl.setAttribute('text-anchor', 'middle'); bodyLbl.setAttribute('class', 'body-label');
      bodyLbl.textContent = 'тело: x = ' + M.fmtNum(o.bodyX) + ' м';
      svg.appendChild(bodyLbl);
    }
    if (o.path) {
      // лента пройденного пути
      const ry = o.cy + 26;
      const bg = document.createElementNS(SVGNS, 'rect');
      bg.setAttribute('x', padL); bg.setAttribute('y', ry); bg.setAttribute('width', W - padL - padR);
      bg.setAttribute('height', 12); bg.setAttribute('rx', 6); bg.setAttribute('class', 'path-ribbon-bg');
      svg.appendChild(bg);
      const f = document.createElementNS(SVGNS, 'rect');
      f.setAttribute('x', padL); f.setAttribute('y', ry); f.setAttribute('height', 12); f.setAttribute('rx', 6);
      f.setAttribute('width', Math.max(0, (o.path.L / o.path.Ltotal) * (W - padL - padR)));
      f.setAttribute('class', 'path-ribbon'); svg.appendChild(f);
      const pl = document.createElementNS(SVGNS, 'text');
      pl.setAttribute('x', padL); pl.setAttribute('y', ry + 26); pl.setAttribute('class', 'path-label');
      pl.textContent = 'путь: ' + M.fmtNum(o.path.L) + ' м (счётчик только растёт)';
      svg.appendChild(pl);
    }
    if (o.clickable) {
      svg.style.cursor = 'pointer';
      svg.addEventListener('click', function (ev) {
        const r = svg.getBoundingClientRect();
        const xPix = (ev.clientX - r.left) * (W / r.width);
        let x = o.min + (xPix - padL) / (W - padL - padR) * (o.max - o.min);
        x = Math.round(x * 2) / 2;
        x = Math.max(o.min, Math.min(o.max, x));
        if (o.onPick) o.onPick(x);
      });
    }
    host.appendChild(svg);
    return { svg: svg, drawBody: drawBody, px: px };
  }

  /* ============================================================
     РАЗДЕЛ 1. Координата
     ============================================================ */
  function buildCoord() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: попробуй сама');
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const pickInfo = para('Кликни по оси — тело переместится в выбранную точку. Посмотри, как меняется его координата.');
    ex.appendChild(pickInfo);
    let cur = 2;
    const axis1 = miniAxis(exHost, {
      min: -6, max: 6, bodyX: cur, clickable: true,
      landmarks: [{ x: 0, label: 'начало отсчёта (дом)', below: true }],
      onPick: function (x) { cur = x; axis1.drawBody(x); }
    });
    frag.appendChild(ex);

    frag.appendChild(card('Что это такое', 'lesson-text').appendChild(para(
      'Координата отвечает на вопрос «где тело?». Это «адрес» тела на оси: сколько метров и в какую сторону от выбранной точки 0.')));

    const prec = card('Точная формулировка (для ответа на уроке)');
    prec.appendChild(para('Координата x — число, которое задаёт положение точечного тела на координатной оси относительно выбранного начала отсчёта. Если тело правее начала отсчёта, его координата положительна; левее — отрицательна; в начале отсчёта — равна нулю.'));
    frag.appendChild(prec);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'Тело имеет координату x = −3 м. Что это значит?',
      options: ['Тело находится на 3 м правее начала отсчёта', 'Тело находится на 3 м левее начала отсчёта', 'Тело стоит в начале отсчёта', 'Такого не бывает: координата не может быть отрицательной'],
      correct: 1,
      explain: 'Знак «минус» — не ошибка и не «отрицательная длина». Он показывает сторону: тело в отрицательном направлении оси, левее нуля. Отрицательная координата — это обычное дело.',
      onSolved: (ok, first) => { if (P()) P().set('coord-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное)');
    task.appendChild(Tk.createTaskForm({
      id: 'coord-task',
      intro: 'На оси отмечены тела. Мяч лежит в точке с координатой −2 м. Кубик — в точке с координатой 5 м. Ещё правее кубика на 3 м лежит флажок.',
      fields: [
        { key: 'x1', label: 'Координата мяча x_м', unit: 'м', expected: -2, kind: 'coord', traps: {} },
        { key: 'x2', label: 'Координата кубика x_к', unit: 'м', expected: 5, kind: 'coord', traps: {} },
        { key: 'x3', label: 'Координата флажка x_ф', unit: 'м', expected: 8, kind: 'coord', traps: {} }
      ],
      hints: [
        'Координата — это «сколько метров от нуля и в какую сторону». Где ноль на этой оси?',
        'Нарисуй ось, отметь 0, мяч и кубик. Флажок «правее кубика на 3 м» — это значит к координате кубика нужно прибавить 3.',
        'x_м = −2 м (левее нуля), x_к = 5 м, x_ф = 5 + 3 = 8 м.'
      ],
      solution: '<p>x_м = −2 м — мяч левее начала отсчёта на 2 м.</p><p>x_к = 5 м.</p><p>Флажок правее кубика на 3 м: x_ф = 5 + 3 = 8 м.</p><p>Проверка: все точки можно отметить на оси от −2 до 8, порядок: мяч, 0, кубик, флажок.</p>',
      onStatus: (s) => { if (P()) P().set('coord-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Представь улицу: твой дом — точка 0. Говоришь «координата +3» — значит, три шага в сторону, куда указывает стрелка оси. «Координата −3» — три шага в противоположную сторону. Координата — это просто адрес на этой «улице».',
      'Вернись к интерактивной оси выше и покликай по ней слева и справа от нуля. Заметь: тело может иметь координату −4, и это нормально — оно просто по другую сторону от начала отсчёта. А если тело стоит в нуле, его координата — 0.',
      'Чтобы ответить «где тело», одного числа мало: нужно договориться, от чего считать. Поэтому в физике выбирают систему отсчёта: тело отсчёта (его положение — ноль), ось координат и положительное направление. Тогда координата — это расстояние до нуля со знаком «+» или «−».'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 2. Изменение координаты
     ============================================================ */
  function buildDelta() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: подвигай ползунки');
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const info = para('');
    ex.appendChild(info);
    let x1 = 2, x2 = 6;
    const axis2 = miniAxis(exHost, { min: -8, max: 8, bodyX: x2, arrow: { from: x1, to: x2 } });
    const sliders = document.createElement('div');
    sliders.className = 'slider-row';
    function mkSlider(label, val, cb) {
      const w = document.createElement('label');
      w.className = 'slider-wrap';
      const sp = document.createElement('span');
      sp.textContent = label;
      const r = document.createElement('input');
      r.type = 'range'; r.min = '-8'; r.max = '8'; r.step = '1'; r.value = val;
      r.addEventListener('input', function () { cb(parseFloat(r.value)); });
      w.appendChild(sp); w.appendChild(r);
      return w;
    }
    const s1 = mkSlider('Начальная координата x₁', x1, function (v) { x1 = v; upd(); });
    const s2 = mkSlider('Конечная координата x₂', x2, function (v) { x2 = v; upd(); });
    sliders.appendChild(s1); sliders.appendChild(s2);
    ex.appendChild(sliders);
    function upd() {
      exHost.innerHTML = '';
      miniAxis(exHost, { min: -8, max: 8, bodyX: x2, arrow: { from: x1, to: x2 } });
      info.innerHTML = 'Δx = x₂ − x₁ = ' + M.fmtNum(x2) + ' − (' + M.fmtNum(x1) + ') = <b>' + M.fmtNum(x2 - x1) + ' м</b>' +
        '. ' + (x2 - x1 > 0 ? 'Положительный результат: тело сместилось в положительном направлении (вправо).' : x2 - x1 < 0 ? 'Отрицательный результат: тело сместилось влево.' : 'Нулевой результат: координата не изменилась.');
    }
    upd();
    frag.appendChild(ex);

    frag.appendChild(card('Что это такое', 'lesson-text').appendChild(para(
      'Изменение координаты отвечает на вопрос «насколько сместилось тело и в какую сторону?». Это «итог» между двумя моментами: начальным и конечным.')));

    const prec = card('Точная формулировка (для ответа на уроке)');
    prec.appendChild(formula('Δx = x<sub>кон</sub> − x<sub>нач</sub> = x₂ − x₁'));
    prec.appendChild(para('Сначала записываем конечную координату, потом начальную. Порядок именно такой — иначе знак получится неверным. Изменение координаты может быть положительным (движение в положительном направлении оси), отрицательным (движение в отрицательном направлении) или нулевым (координата не изменилась).'));
    frag.appendChild(prec);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'Тело перешло из точки с координатой x₁ = 7 м в точку с координатой x₂ = 4 м. Чему равно изменение координаты?',
      options: ['Δx = +3 м', 'Δx = −3 м', 'Δx = +11 м', 'Δx = −11 м'],
      correct: 1,
      explain: 'Δx = x₂ − x₁ = 4 − 7 = −3 м. Минус говорит: координата уменьшилась, тело сместилось в отрицательном направлении оси.',
      onSolved: (ok, first) => { if (P()) P().set('delta-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное)');
    task.appendChild(Tk.createTaskForm({
      id: 'delta-task',
      intro: 'Найди изменение координаты в двух случаях.<br>а) Тело двигалось из точки с x₁ = −5 м в точку с x₂ = −1 м.<br>б) Часы идут, но тело покоится в точке с x₁ = x₂ = 6 м.',
      fields: [
        { key: 'a', label: 'а) Δx', unit: 'м', expected: 4, kind: 'dx', traps: { sum: -6 } },
        { key: 'b', label: 'б) Δx', unit: 'м', expected: 0, kind: 'dx', traps: {} }
      ],
      hints: [
        'Вспомни порядок: из какой координаты вычитаем и какую?',
        'б) Если тело не двигалось, изменилась ли его координата? В а) аккуратно с минусами: −1 − (−5).',
        'а) Δx = −1 − (−5) = −1 + 5 = 4 м. б) Δx = 6 − 6 = 0 м — при покое изменение координаты равно нулю.'
      ],
      solution: '<p>а) Δx = x₂ − x₁ = (−1) − (−5) = −1 + 5 = 4 м. Координата увеличилась — тело сместилось вправо, хотя обе координаты отрицательные.</p><p>б) Δx = 6 − 6 = 0 м. Тело покоилось — координата не менялась.</p><p>Проверка: подставим обратно x₂ = x₁ + Δx.</p>',
      onStatus: (s) => { if (P()) P().set('delta-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Δx — это «сколько добавилось» к координате. Было 2, стало 6 — добавилось +4. Было 6, стало 2 — добавилось −4, то есть убыло 4. Было и осталось 6 — добавилось 0.',
      'Лифт: с 3-го этажа на 7-й. Δx = 7 − 3 = +4 этажа. А с 7-го на 3-й: Δx = 3 − 7 = −4. Лифт проехал одно и то же расстояние, но знак показывает направление.',
      'Почему именно «конечное минус начальное»? Потому что вычитание — обратная операция к сложению: если к начальному положению прибавить Δx, получим конечное: x₂ = x₁ + Δx. Знак Δx — это направление смещения: «+» — в положительном направлении оси, «−» — в отрицательном.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 3. Перемещение
     ============================================================ */
  function buildDisp() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: стрелка — итог движения');
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const info = para('');
    ex.appendChild(info);
    let x1 = -1, x2 = 5;
    function draw3() {
      exHost.innerHTML = '';
      miniAxis(exHost, { min: -8, max: 8, bodyX: x2, arrow: { from: x1, to: x2 }, landmarks: [{ x: x1, label: 'начало', below: false }] });
      const dir = x2 > x1 ? 'вправо (в положительном направлении)' : x2 < x1 ? 'влево (в отрицательном направлении)' : 'нулевое';
      info.innerHTML = 'Вектор перемещения направлен ' + dir + '. Модуль перемещения |Δx| = |x₂ − x₁| = ' + M.fmtNum(Math.abs(x2 - x1)) +
        ' м. Проекция перемещения на ось: Δx = ' + M.fmtNum(x2 - x1) + ' м.';
    }
    const sliders = document.createElement('div');
    sliders.className = 'slider-row';
    function mkSlider(label, val, cb) {
      const w = document.createElement('label');
      w.className = 'slider-wrap';
      const sp = document.createElement('span'); sp.textContent = label;
      const r = document.createElement('input');
      r.type = 'range'; r.min = '-8'; r.max = '8'; r.step = '1'; r.value = val;
      r.addEventListener('input', function () { cb(parseFloat(r.value)); });
      w.appendChild(sp); w.appendChild(r);
      return w;
    }
    sliders.appendChild(mkSlider('Начальное положение', x1, function (v) { x1 = v; draw3(); }));
    sliders.appendChild(mkSlider('Конечное положение', x2, function (v) { x2 = v; draw3(); }));
    ex.appendChild(sliders);
    draw3();
    frag.appendChild(ex);

    frag.appendChild(card('Что это такое', 'lesson-text').appendChild(para(
      'Перемещение — это «итог» движения одной стрелкой: из точки, где тело было, в точку, где оно оказалось. Как именно тело шло — зигзагом, с остановками, туда-обратно — для перемещения неважно.')));

    const prec = card('Точная формулировка (для ответа на уроке)');
    prec.appendChild(para('<b>Перемещением</b> точки за промежуток времени называют <b>направленный отрезок прямой</b>, начало которого совпадает с начальным положением точки, а конец — с конечным положением точки.'));
    prec.appendChild(para('Перемещение — векторная величина: она характеризуется модулем и направлением. Для движения вдоль прямой оси X проекция перемещения на ось равна изменению координаты Δx, а модуль перемещения равен |Δx|.'));
    prec.appendChild(note('Не путай: изменение координаты Δx — это число (со знаком), а перемещение — направленный отрезок (вектор). Числом является проекция перемещения на ось.'));
    frag.appendChild(prec);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'Что из перечисленного является перемещением?',
      options: ['Число метров, которое тело прошло всего', 'Стрелка от начального положения тела к конечному', 'Вся линия, по которой двигалось тело', 'Разность конечного и начального моментов времени'],
      correct: 1,
      explain: 'Перемещение — именно направленный отрезок (стрелка) от начала к концу. Пройденные метры — это путь, вся линия движения — траектория, разность времени — промежуток Δt.',
      onSolved: (ok, first) => { if (P()) P().set('disp-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное)');
    task.appendChild(Tk.createTaskForm({
      id: 'disp-task',
      intro: 'Тело перешло из точки с координатой x₁ = −2 м в точку с координатой x₂ = 6 м по прямой.',
      fields: [
        { key: 'dx', label: 'Проекция перемещения Δx', unit: 'м', expected: 8, kind: 'dx', traps: { sum: 4 } },
        { key: 'mag', label: 'Модуль перемещения |Δx|', unit: 'м', expected: 8, kind: 'dx', traps: {} }
      ],
      hints: [
        'Что нужно сделать с конечной и начальной координатами, чтобы получить Δx?',
        'Δx = x₂ − x₁ = 6 − (−2). Не потеряй минус: вычитание отрицательного числа — это сложение.',
        'Δx = 6 − (−2) = 8 м, |Δx| = 8 м. Перемещение направлено вправо.'
      ],
      solution: '<p>Δx = x₂ − x₁ = 6 − (−2) = 6 + 2 = 8 м.</p><p>|Δx| = |8| = 8 м — модуль перемещения.</p><p>Знак «+»: перемещение направлено в положительном направлении оси X (вправо).</p><p>Проверка: x₁ + Δx = −2 + 8 = 6 = x₂. Сходится.</p>',
      onStatus: (s) => { if (P()) P().set('disp-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Перемещение — это «где оказались минус где были», но нарисованное стрелкой. Стрелка смотрит от старта к финишу. Если вернулся в старт — стрелка схлопнулась в точку: перемещение нулевое.',
      'Ты вышла из дома, дошла до школы, но на полпути вспомнила, что забыла тетрадь, вернулась домой и только потом снова дошла до школы. Путь — все метры вместе. А перемещение — стрелка «дом → школа»: забытая тетрадь его не изменила. Для перемещения важен только результат.',
      'Перемещение вводят, чтобы описать итог движения векторно: направление имеет значение. В одномерном случае (движение вдоль прямой оси) вектору соответствует проекция Δx: её знак и задаёт направление стрелки, а модуль |Δx| — длину.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 4. Путь
     ============================================================ */
  function buildPath() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: маршрут с возвращением');
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const info = para('');
    ex.appendChild(info);
    const playBtn = Tk.mkBtn('Прогнать маршрут', 'btn btn-primary');
    ex.appendChild(playBtn);
    // маршрут: x0=1 → вправо до 7 (6 м) → влево до 4 (3 м)
    const route = [{ from: 1, to: 7 }, { from: 7, to: 4 }];
    function totalPath() { return route.reduce(function (a, r) { return a + Math.abs(r.to - r.from); }, 0); }
    function drawPath(L) {
      // какие части маршрута пройдены и где тело сейчас
      const done = []; let acc = 0; let curX = route[0].from;
      for (const r of route) {
        const len = Math.abs(r.to - r.from);
        if (L >= acc + len - 1e-9) { done.push(r); acc += len; curX = r.to; }
        else if (L > acc) {
          const f = (L - acc) / len;
          const seg = { from: r.from, to: r.from + (r.to - r.from) * f };
          done.push(seg); curX = seg.to;
          break;
        } else break;
      }
      exHost.innerHTML = '';
      miniAxis(exHost, { min: -2, max: 9, bodyX: curX, arrow: { from: 1, to: curX }, path: { L: L, Ltotal: totalPath() } });
      const svg = exHost.firstChild;
      const compact = global.Charts.isCompact();
      const Wpx = compact ? 420 : 640;
      const px = (x) => 34 + ((x - (-2)) / (9 - (-2))) * (Wpx - 34 - 26);
      for (const r of done) {
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', px(Math.min(r.from, r.to))); ln.setAttribute('x2', px(Math.max(r.from, r.to)));
        ln.setAttribute('y1', 60); ln.setAttribute('y2', 60);
        ln.setAttribute('class', 'traveled-line');
        svg.insertBefore(ln, svg.firstChild);
      }
    }
    drawPath(0);
    let animToken = 0;
    playBtn.addEventListener('click', function () {
      if (playBtn.dataset.running === '1') {
        animToken++; // остановка
        delete playBtn.dataset.running;
        playBtn.textContent = 'Прогнать маршрут';
        return;
      }
      playBtn.dataset.running = '1';
      playBtn.textContent = 'Остановить';
      const myToken = ++animToken;
      const Ltot = totalPath();
      const t0 = performance.now();
      const dur = 4000;
      function frame(ts) {
        if (myToken !== animToken) return; // анимация остановлена
        const f = Math.min(1, (ts - t0) / dur);
        const L = f * Ltot;
        drawPath(L);
        const xNow = (L <= 6) ? 1 + L : 13 - L;
        info.innerHTML = 'Пройдено всего: <b>' + M.fmtNum(L) + ' м</b> (счётчик пути только растёт). ' +
          'Тело сейчас в x = <b>' + M.fmtNum(xNow) + ' м</b> — смотри: стрелка перемещения сначала росла, потом начала уменьшаться.';
        if (f < 1) requestAnimationFrame(frame);
        else {
          delete playBtn.dataset.running;
          playBtn.textContent = 'Прогнать маршрут';
          info.innerHTML = 'Итог: путь = <b>9 м</b> (6 м вправо + 3 м влево), а перемещение — только <b>3 м</b> вправо. ' +
            'Оранжевая стрелка (перемещение) «съёжилась», а счётчик пути сохранил всё пройденное.';
        }
      }
      requestAnimationFrame(frame);
    });
    frag.appendChild(ex);

    frag.appendChild(card('Что это такое', 'lesson-text').appendChild(para(
      'Путь отвечает на вопрос «сколько всего намотано?». Это всё расстояние, которое тело прошло за выбранный промежуток времени, — как счётчик в машине или шагомер.')));

    const prec = card('Точная формулировка (для ответа на уроке)');
    prec.appendChild(para('<b>Путь</b> — всё расстояние, пройденное точечным телом за рассматриваемый промежуток времени.'));
    prec.appendChild(para('Путь — величина неотрицательная. Он равен нулю только если тело весь промежуток покоилось. Если тело не меняло направления, путь равен модулю перемещения: s = |Δx|. Если меняло — путь больше.'));
    prec.appendChild(warn('Путь не бывает отрицательным. Если у тебя получился «путь −6 м» — это сигнал: ты нашла не путь, а, скорее всего, изменение координаты.'));
    frag.appendChild(prec);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'Тело прошло 5 м вправо, а потом 2 м влево. Чему равен путь?',
      options: ['7 м', '3 м', '5 м', '2 м'],
      correct: 0,
      explain: 'Путь — всё пройденное: 5 м + 2 м = 7 м. А перемещение при этом всего 3 м вправо. Путь складывает длины участков, направление не «вычитает».',
      onSolved: (ok, first) => { if (P()) P().set('path-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное)');
    task.appendChild(Tk.createTaskForm({
      id: 'path-task',
      intro: 'Лыжник прошёл 400 м вправо, затем 150 м влево по той же прямой.',
      fields: [
        { key: 's', label: 'Путь s', unit: 'м', expected: 550, kind: 'path', traps: { dx: 250 } },
        { key: 'mag', label: 'Модуль перемещения |Δx|', unit: 'м', expected: 250, kind: 'dx', traps: {} }
      ],
      hints: [
        'Что нужно сделать с длинами участков, чтобы получить весь пройденный путь?',
        'Путь = сумма длин участков: 400 + 150. А перемещение — это «итог»: 400 вправо и 150 влево — что осталось?',
        's = 400 + 150 = 550 м. |Δx| = |400 − 150| = 250 м.'
      ],
      solution: '<p>Путь: s = 400 + 150 = 550 м — складываем длины всех участков.</p><p>Перемещение: тело оказалось на 400 − 150 = 250 м правее старта, |Δx| = 250 м.</p><p>Проверка: путь (550) больше модуля перемещения (250) — так и должно быть при развороте.</p>',
      onStatus: (s) => { if (P()) P().set('path-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Путь — как одометр у велосипеда: крутится вперёд всегда, даже когда ты едешь назад. Вернулся домой — одометр не обнулился.',
      'В примере выше нажми «Прогнать маршрут» и посмотри на два разных индикатора: счётчик пути растёт всё время, а оранжевая стрелка перемещения сначала растёт, потом уменьшается.',
      'Путь определён как сумма длин всех пройденных участков, поэтому он не может уменьшаться или стать отрицательным. Перемещение же зависит только от начальной и конечной точек — поэтому при возврате оно «съезжает» обратно к нулю.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 5. Разворот + опорный пример §18
     ============================================================ */
  function buildTurn() {
    const frag = document.createDocumentFragment();

    frag.appendChild(card('Главная идея', 'lesson-text').appendChild(para(
      'Если тело развернулось, путь и перемещение перестают совпадать. Путь честно складывает длины всех участков, а перемещение помнит только «откуда» и «куда».')));

    const c1 = card('Правило (для ответа на уроке)');
    c1.appendChild(para('<b>Если тело меняло направление движения</b>, то путь больше и модуля перемещения, и модуля изменения координаты. Путь складывается из длин отдельных пройденных участков: s = s₁ + s₂ + …'));
    c1.appendChild(para('<b>Если тело не меняло направления</b>, путь равен модулю перемещения: s = |Δx| = |Δx⃗|.'));
    frag.appendChild(c1);

    /* --- опорный пример из параграфа --- */
    const ex = card('Опорный пример из §18: разберём по шагам');
    frag.appendChild(ex);
    const stepsIntro = para('Движение тела (из учебника, рис. 46–47):<br>• в момент t₀ = 0 с тело в точке x₀ = 3 м;<br>• к t₁ = 4 с оно приходит в x₁ = 11 м;<br>• к t₂ = 7 с возвращается до x₂ = 5 м;<br>• к t₃ = 8 с приходит в x₃ = 3 м.');
    ex.appendChild(stepsIntro);

    // ось + плеер: единая функция времени для оси, ползунка и обоих графиков
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const tbModelEx = M.buildModel(3, [{ vx: 2, dt: 4 }, { vx: -2, dt: 3 }, { vx: -2, dt: 1 }]);
    let xtEx = null, vtEx = null;
    const tSlider = document.createElement('input');
    tSlider.type = 'range'; tSlider.min = '0'; tSlider.max = '8'; tSlider.step = '0.1'; tSlider.value = '0';
    const tLabel = document.createElement('span');
    const playTB = Tk.mkBtn('Пустить', 'btn btn-primary');
    const tbInfo = para('');
    const tRowWrap = document.createElement('div');
    tRowWrap.className = 'tb-controls';
    tRowWrap.appendChild(playTB);
    tRowWrap.appendChild(tSlider);
    tRowWrap.appendChild(tLabel);
    ex.appendChild(tRowWrap);
    ex.appendChild(tbInfo);
    function setTBTime(t) {
      t = Math.max(0, Math.min(tbModelEx.totalTime, t));
      tSlider.value = String(Math.round(t * 10) / 10);
      const st = M.stateAt(tbModelEx, t);
      exHost.innerHTML = '';
      miniAxis(exHost, {
        min: 0, max: 12, bodyX: st.x,
        arrow: { from: 3, to: st.x },
        path: { L: st.L, Ltotal: 16 },
        landmarks: [{ x: 3, label: 'x₀ = 3 м', below: true }, { x: 11, label: 'x₁ = 11', below: true }, { x: 5, label: 'x₂ = 5', below: true }]
      });
      tLabel.textContent = 't = ' + M.fmtNum(t, 1) + ' с';
      tbInfo.innerHTML = 'x = ' + M.fmtNum(st.x) + ' м; пройдено ' + M.fmtNum(st.L) + ' м; v_x = ' + M.fmtNum(st.vx) + ' м/с';
      if (xtEx) xtEx.update(t);
      if (vtEx) vtEx.update(t);
    }
    let tbAnimToken = 0;
    playTB.addEventListener('click', function () {
      if (playTB.dataset.running === '1') {
        tbAnimToken++;
        delete playTB.dataset.running;
        playTB.textContent = 'Пустить';
        return;
      }
      playTB.dataset.running = '1';
      playTB.textContent = 'Остановить';
      const myToken = ++tbAnimToken;
      const t0 = performance.now();
      let from = parseFloat(tSlider.value) || 0;
      if (from >= 7.95) from = 0;
      function frame(ts) {
        if (myToken !== tbAnimToken) return;
        const f = Math.min(1, (ts - t0) / 6000);
        setTBTime(from + f * (8 - from));
        if (f < 1) requestAnimationFrame(frame);
        else {
          delete playTB.dataset.running;
          playTB.textContent = 'Пустить';
        }
      }
      requestAnimationFrame(frame);
    });
    tSlider.addEventListener('input', function () { setTBTime(parseFloat(tSlider.value)); });
    setTBTime(0);

    // поэтапные вопросы
    const qs = card('Сначала определи сама (не открывай решение раньше времени)');
    frag.appendChild(qs);
    const qDefs = [
      { key: 'tb1', intro: 'Шаг 1. Сколько метров тело прошло от t₀ = 0 с до t₁ = 4 с (первый участок, без разворота)?', fields: [{ key: 's1', label: 'Путь за 0–4 с', unit: 'м', expected: 8, kind: 'path' }], hints: ['На этом участке тело двигалось всё время в одну сторону. Что тогда можно сказать о пути и модуле перемещения?', 'Без разворота путь = |Δx| = |11 − 3|.', '|Δx| = |11 − 3| = 8 м, значит s₁ = 8 м.'], sol: '<p>Δx₀₁ = x₁ − x₀ = 11 − 3 = 8 м, разворота не было, поэтому s₁ = |Δx₀₁| = 8 м.</p>' },
      { key: 'tb2', intro: 'Шаг 2. Сколько метров тело прошло от t₁ = 4 с до t₂ = 7 с (движение в обратную сторону)?', fields: [{ key: 's2', label: 'Путь за 4–7 с', unit: 'м', expected: 6, kind: 'path' }], hints: ['На этом участке тело движется в отрицательном направлении. Путь — это длина участка.', '|Δx₁₂| = |5 − 11|.', '|Δx₁₂| = |5 − 11| = 6 м — длина второго участка пути.'], sol: '<p>Δx₁₂ = x₂ − x₁ = 5 − 11 = −6 м. Длина участка: |Δx₁₂| = 6 м, поэтому s₂ = 6 м.</p>' },
      { key: 'tb3', intro: 'Шаг 3. Чему равен весь путь от t₀ = 0 с до t₂ = 7 с?', fields: [{ key: 's', label: 'Весь путь за 0–7 с', unit: 'м', expected: 14, kind: 'path', traps: { dx: 2 } }], hints: ['Путь при развороте — это сумма длин участков.', 's = s₁ + s₂ = 8 + 6.', 's = 8 + 6 = 14 м.'], sol: '<p>s₀₂ = s₁ + s₂ = 8 + 6 = 14 м.</p><p>Проверка: 14 > |Δx₀₂| = 2 м — при развороте путь больше модуля перемещения.</p>' },
      { key: 'tb4', intro: 'Шаг 4. Чему равно изменение координаты за 0–7 с?', fields: [{ key: 'dx', label: 'Δx за 0–7 с', unit: 'м', expected: 2, kind: 'dx', traps: { sum: 14 } }], hints: ['Изменение координаты зависит только от начального и конечного положения.', 'Δx = x₂ − x₀ = 5 − 3.', 'Δx = 5 − 3 = +2 м — координата увеличилась на 2 м, хотя тело прошло 14 м.'], sol: '<p>Δx₀₂ = x₂ − x₀ = 5 − 3 = 2 м.</p><p>Перемещение направлено в положительном направлении оси (вправо), его модуль 2 м.</p>' },
      { key: 'tb5', intro: 'Шаг 5. Чему равен модуль перемещения за 0–7 с?', fields: [{ key: 'm', label: '|Δx| за 0–7 с', unit: 'м', expected: 2, kind: 'dx' }], hints: ['Модуль перемещения в одномерном движении равен модулю изменения координаты.', '|Δx| = |x₂ − x₀| = |5 − 3|.', '|Δx| = 2 м.'], sol: '<p>|Δx₀₂| = |2| = 2 м. Перемещение — стрелка от x₀ = 3 м до x₂ = 5 м, то есть всего 2 м вправо.</p>' },
      { key: 'tb6', intro: 'Шаг 6. Тело продолжило движение до t₃ = 8 с и пришло в x₃ = 3 м. Чему равен весь путь за 0–8 с?', fields: [{ key: 's', label: 'Весь путь за 0–8 с', unit: 'м', expected: 16, kind: 'path', traps: { dx: 0 } }], hints: ['Третий участок: от 5 м до 3 м — сколько метров?', 's = s₁ + s₂ + s₃ = 8 + 6 + 2.', 's = 16 м.'], sol: '<p>Третий участок: от x₂ = 5 м до x₃ = 3 м — 2 м. s₀₃ = 8 + 6 + 2 = 16 м.</p>' },
      { key: 'tb7', intro: 'Шаг 7. Чему равно изменение координаты (и перемещение) за 0–8 с?', fields: [{ key: 'dx', label: 'Δx за 0–8 с', unit: 'м', expected: 0, kind: 'dx' }], hints: ['Где тело было в начале и где оказалось в конце?', 'Δx = x₃ − x₀ = 3 − 3.', 'Δx = 0 — перемещение нулевое, хотя тело прошло 16 м!'], sol: '<p>Δx₀₃ = x₃ − x₀ = 3 − 3 = 0. Перемещение равно нулю.</p><p>Тело вернулось в начальную точку — стрелке «некуда» смотреть.</p>' }
    ];
    qDefs.forEach(function (d) {
      qs.appendChild(Tk.createTaskForm({
        id: d.key,
        intro: d.intro,
        fields: d.fields,
        hints: d.hints,
        solution: d.sol + '<p class="muted">Связь: на рисунке — путь это вся пройденная «лента» (она растёт всегда), а перемещение — одна стрелка от x₀ к текущему положению.</p>',
        onStatus: (s) => { if (P()) P().set(d.key, s); }
      }));
    });

    // графики опорного примера
    const graphs = card('Графики этого движения');
    frag.appendChild(graphs);
    const gx = document.createElement('div');
    const gv = document.createElement('div');
    graphs.appendChild(gx);
    const vtHead = document.createElement('div');
    vtHead.className = 'chart-head';
    vtHead.innerHTML = '<span>Скорость</span>';
    const modBtn = Tk.mkBtn('Показать |v_x|', 'btn btn-ghost');
    let mod = false;
    xtEx = new global.Charts.XtChart({ host: gx, onTimeSelected: function (t) { setTBTime(t); } });
    xtEx.setModel(tbModelEx);
    vtEx = new global.Charts.VtChart({ host: gv, onTimeSelected: function (t) { setTBTime(t); } });
    vtEx.setModel(tbModelEx, false);
    modBtn.addEventListener('click', function () {
      mod = !mod;
      modBtn.textContent = mod ? 'Показать v_x со знаком' : 'Показать |v_x|';
      vtEx.setModel(tbModelEx, mod);
      vtEx.update(parseFloat(tSlider.value) || 0);
    });
    vtHead.appendChild(modBtn);
    graphs.appendChild(vtHead);
    graphs.appendChild(gv);
    graphs.appendChild(para('<span class="muted">Кликни по любому графику или двигай ползунок: на обоих графиках и на оси выше — один и тот же момент времени.</span>'));

    // таблица опорного примера
    const tbl = document.createElement('section');
    tbl.className = 'card';
    tbl.innerHTML = '<h3>Таблица движения (сверяйся после каждого шага)</h3>' +
      '<div class="table-wrap"><table><thead><tr><th>Момент</th><th>Координата</th><th>Что произошло</th><th>Пройдено к этому моменту</th></tr></thead><tbody>' +
      '<tr><td>t₀ = 0 с</td><td>3 м</td><td>старт</td><td class="tbl-path">0 м</td></tr>' +
      '<tr><td>t₁ = 4 с</td><td>11 м</td><td>развёрнулось</td><td class="tbl-path">8 м</td></tr>' +
      '<tr><td>t₂ = 7 с</td><td>5 м</td><td>двигалось влево</td><td class="tbl-path">14 м</td></tr>' +
      '<tr><td>t₃ = 8 с</td><td>3 м</td><td>вернулось в старт</td><td class="tbl-path">16 м</td></tr>' +
      '</tbody></table></div>';
    const revealBtn = Tk.mkBtn('Я решила шаги — показать пройденный путь в таблице', 'btn btn-ghost');
    const tblNote = document.createElement('p');
    tblNote.className = 'muted small';
    tblNote.textContent = 'Столбец «Пройдено» скрыт: сначала реши шаги выше — потом сверяйся.';
    tbl.appendChild(revealBtn);
    tbl.appendChild(tblNote);
    revealBtn.addEventListener('click', function () {
      tbl.querySelectorAll('.tbl-path').forEach(function (c) { c.classList.add('revealed'); });
      revealBtn.disabled = true;
      tblNote.textContent = 'Пройденный путь открыт для сверки.';
    });
    frag.appendChild(tbl);

    /* --- нулевое перемещение: покой vs возвращение --- */
    const zero = card('Важный вопрос: если перемещение равно нулю — тело стояло?');
    frag.appendChild(zero);
    zero.appendChild(Tk.createQuiz({
      question: 'Перемещение тела за промежуток равно нулю. Обязательно ли тело покоилось весь этот промежуток?',
      options: ['Да, конечно: нулевое перемещение — значит, тело стояло', 'Нет: тело могло уехать и вернуться в начальную точку', 'Нет: тело могло ехать только влево', 'Такое вообще невозможно'],
      correct: 1,
      explain: 'Перемещение зависит только от начальной и конечной точек. Если они совпали — перемещение нулевое, при этом тело могло двигаться (путь был бы ненулевой) или действительно стоять (путь нулевой). Различить эти случаи можно только по пути!',
      onSolved: (ok, first) => { if (P()) P().set('turn-quiz', ok ? 'solved' : 'retry'); }
    }));
    const cmp = document.createElement('div');
    cmp.className = 'compare-grid';
    function scenarioCard(title, model, noteTxt) {
      const c = document.createElement('div');
      c.className = 'card compare-card';
      const h = document.createElement('div');
      h.className = 'compare-title';
      h.textContent = title;
      c.appendChild(h);
      const host = document.createElement('div');
      c.appendChild(host);
      const stc = M.intervalStats(model, 0, model.totalTime);
      miniAxis(host, { min: -1, max: 9, bodyX: stc.xb, arrow: { from: model.x0, to: stc.xb }, path: { L: M.stateAt(model, model.totalTime).L, Ltotal: Math.max(M.stateAt(model, model.totalTime).L, 1) } });
      c.appendChild(para(noteTxt));
      return c;
    }
    cmp.appendChild(scenarioCard('Сценарий 1: покой', M.buildModel(3, [{ vx: 0, dt: 8 }]), 'x = 3 м всё время. Путь: 0 м. Перемещение: 0.'));
    cmp.appendChild(scenarioCard('Сценарий 2: уехала и вернулась', M.buildModel(3, [{ vx: 2, dt: 4 }, { vx: -2, dt: 4 }]), 'Прошла 8 м вправо и 8 м обратно. Путь: 16 м. Перемещение: 0 — такое же, как у покоя!'));
    zero.appendChild(cmp);
    zero.appendChild(para('Вывод: одинаковое перемещение не означает одинаковое движение. Путь у этих сценариев разный: 0 м и 16 м.'));

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Разворот — момент, когда путь и перемещение «расходятся». Путь как одометр: намотал метры — и всё, разворачивайся не разворачивайся, он помнит. А перемещение как стрелка на карте «откуда-куда»: развернулся — стрелка поползла назад.',
      'Вернись к анимации опорного примера: двигай ползунок к t = 4 с — стрелка перемещения доросла до 8 м. Теперь двигай к t = 7 с — стрелка съехала до 2 м, а зелёная лента пути выросла до 14 м и не собирается уменьшаться.',
      'Путь определён как сумма длин участков — разворот лишь добавляет новый участок. Перемещение же — вектор от старта к финишу: когда тело едет назад, конец вектора возвращается к началу. Поэтому при развороте s > |Δx| всегда.'
    ));
    frag.appendChild(trio);

    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 7. Путь при равномерном движении (§19)
     ============================================================ */
  function buildUniform() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: собери формулу сама');
    const exHost = document.createElement('div');
    ex.appendChild(exHost);
    const info = para('');
    ex.appendChild(info);
    let v = 3, dt = 4;
    function drawU() {
      exHost.innerHTML = '';
      const end = v * dt;
      const lo = Math.min(-2, end - 2, 0), hi = Math.max(2, end + 2, 0);
      miniAxis(exHost, { min: lo, max: hi, bodyX: end, arrow: { from: 0, to: end } });
      info.innerHTML = 'Если v_x = ' + M.fmtNum(v) + ' м/с и Δt = ' + M.fmtNum(dt, 1) + ' с, то:<br>' +
        'Δx = v_x · Δt = ' + M.fmtNum(v) + ' · ' + M.fmtNum(dt, 1) + ' = <b>' + M.fmtNum(v * dt) + ' м</b><br>' +
        's = |v_x| · Δt = |' + M.fmtNum(v) + '| · ' + M.fmtNum(dt, 1) + ' = <b>' + M.fmtNum(Math.abs(v) * dt) + ' м</b>';
    }
    const sliders = document.createElement('div');
    sliders.className = 'slider-row';
    function mkSlider(label, min, max, step, val, cb) {
      const w = document.createElement('label');
      w.className = 'slider-wrap';
      const sp = document.createElement('span'); sp.textContent = label;
      const r = document.createElement('input');
      r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(val);
      r.addEventListener('input', function () { cb(parseFloat(r.value)); });
      w.appendChild(sp); w.appendChild(r);
      return w;
    }
    sliders.appendChild(mkSlider('Скорость v_x, м/с (может быть со знаком)', -5, 5, 0.5, v, function (x) { v = x; drawU(); }));
    sliders.appendChild(mkSlider('Промежуток Δt, с', 1, 10, 0.5, dt, function (x) { dt = x; drawU(); }));
    ex.appendChild(sliders);
    drawU();
    frag.appendChild(ex);

    frag.appendChild(card('Что это такое', 'lesson-text').appendChild(para(
      'При равномерном движении скорость постоянна, поэтому путь и изменение координаты считаются простым умножением. Важно только не перепутать, когда нужна скорость со знаком, а когда — её модуль.')));

    const prec = card('Точные формулы (для ответа на уроке)');
    prec.appendChild(formula('Δx = v_x · Δt &nbsp;&nbsp;&nbsp; s = |v_x| · Δt &nbsp;&nbsp;&nbsp; Δt = t_кон − t_нач'));
    prec.appendChild(para('Здесь v_x — значение скорости со знаком относительно выбранной оси X (положительное — движение «по оси», отрицательное — против), а |v_x| — её модуль (всегда неотрицательный).'));
    prec.appendChild(warn('Формула s = |v_x| · Δt с модулем — не украшение: если подставить отрицательную скорость без модуля, получится «отрицательный путь», а такого не бывает. Отрицательной может быть только Δx — информация о направлении.'));
    prec.appendChild(note('Эти формулы годятся для отдельного участка равномерного движения. Если участков несколько или есть развороты — считай каждый участок отдельно, а пути складывай.'));
    frag.appendChild(prec);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'Тело движется равномерно со скоростью v_x = −3 м/с в течение 4 с. Чему равен путь?',
      options: ['−12 м', '12 м', '7 м', '1 м'],
      correct: 1,
      explain: 'Путь считается через модуль: s = |v_x| · Δt = |−3| · 4 = 3 · 4 = 12 м. Знак минус у скорости показывает направление, а путь — это расстояние, он неотрицателен.',
      onSolved: (ok, first) => { if (P()) P().set('uniform-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное)');
    task.appendChild(Tk.createTaskForm({
      id: 'uniform-task',
      intro: 'Тело движется равномерно в отрицательном направлении оси X со скоростью v_x = −3 м/с в течение Δt = 4 с. Начальная координата x₀ = 10 м.',
      fields: [
        { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: -12, kind: 'dx' },
        { key: 's', label: 'Путь s', unit: 'м', expected: 12, kind: 'path', traps: { dx: -12 } },
        { key: 'x', label: 'Конечная координата x', unit: 'м', expected: -2, kind: 'coord', traps: { sum: 13 } }
      ],
      hints: [
        'Для Δx скорость берётся со знаком, для пути — с модулем. А конечная координата получается прибавлением Δx к начальной.',
        'Δx = v_x · Δt = (−3) · 4 = −12 м; s = |−3| · 4 = 12 м; x = x₀ + Δx.',
        'Δx = −12 м, s = 12 м, x = 10 + (−12) = −2 м.'
      ],
      solution: '<p>Δx = v_x · Δt = (−3 м/с) · 4 с = −12 м — знак «минус»: движение против оси.</p><p>s = |v_x| · Δt = 3 · 4 = 12 м.</p><p>x = x₀ + Δx = 10 − 12 = −2 м.</p><p>Проверка: путь 12 м = |Δx| — разворота не было, всё сходится.</p>',
      onStatus: (s) => { if (P()) P().set('uniform-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Скорость со знаком — это «сколько метров в секунду и в какую сторону». Модуль скорости — «сколько метров в секунду» без направления. Для пути направление не нужно: метры есть метры.',
      'В примере выше поставь v_x = −3 м/с: Δx станет −12 м, а путь останется 12 м. Потом поставь v_x = +3 — путь тот же 12 м, а Δx станет +12 м. Путь «не видит» направление.',
      'Формула s = |v_x| · Δt — это определение равномерного движения «наоборот»: за каждую секунду тело проходит одинаковые метры, значит всего — произведение. Модуль нужен потому, что путь определён как длина (расстояние), а длина отрицательной не бывает.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 8. График координаты x(t)
     ============================================================ */
  function buildGraphX() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: прочитай график');
    const gx = document.createElement('div');
    frag.appendChild(ex);
    ex.appendChild(gx);
    const model = M.buildModel(3, [{ vx: 2, dt: 4 }, { vx: -2, dt: 3 }, { vx: -2, dt: 1 }]);
    const readout = document.createElement('div');
    readout.className = 'task-msg msg-ok';
    readout.textContent = 'Кликни по графику: здесь появятся координата и путь в выбранный момент.';
    const xt = new global.Charts.XtChart({
      host: gx,
      onTimeSelected: function (t) {
        xt.update(t);
        const st = M.stateAt(model, t);
        readout.textContent = 'В момент t = ' + M.fmtNum(t, 1) + ' с: координата x = ' + M.fmtNum(st.x) +
          ' м, пройдено ' + M.fmtNum(st.L) + ' м.';
      }
    });
    xt.setModel(model);
    ex.appendChild(readout);
    ex.appendChild(para('<span class="muted">Кликни по графику — курсор покажет координату в выбранный момент времени.</span>'));

    frag.appendChild(card('Как читать этот график', 'lesson-text').appendChild(para(
      'Каждая точка графика отвечает на вопрос «где тело было в этот момент?». Подъём линии — координата растёт; спуск — уменьшается; горизонтальный участок — тело стоит. При одинаковых масштабах более крутой участок — большая по модулю скорость.')));

    const warnCard = card('Частая ловушка');
    warnCard.appendChild(warn('График x(t) — это не фотография дороги и не горка, по которой тело катится! Вниз по линии графика тело не «спускается» — оно движется влево по оси X (в отрицательном направлении). Подъём и спуск говорят об изменении координаты, а не о рельефе.'));
    frag.appendChild(warnCard);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'На графике x(t) линия на каком-то участке идёт вниз. Что это значит?',
      options: ['Тело катится с горки вниз', 'Координата уменьшается: тело движется в отрицательном направлении оси', 'Тело едет вниз по дороге', 'Время идёт назад'],
      correct: 1,
      explain: 'Ось по вертикали — координата x. «Вниз по графику» = x уменьшается со временем = движение в отрицательном направлении. Никакого «рельефа» на графике нет.',
      onSolved: (ok, first) => { if (P()) P().set('gx-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное): по графику выше');
    task.appendChild(Tk.createTaskForm({
      id: 'gx-task',
      intro: 'Пользуясь графиком x(t) выше (тот же, что в опорном примере): определи координату в момент t = 2 с, изменение координаты за 4–7 с и путь за 0–7 с.',
      fields: [
        { key: 'x2', label: 'Координата в t = 2 с', unit: 'м', expected: 7, kind: 'coord' },
        { key: 'dx', label: 'Δx за 4–7 с', unit: 'м', expected: -6, kind: 'dx' },
        { key: 's', label: 'Путь за 0–7 с', unit: 'м', expected: 14, kind: 'path', traps: { dx: 2, disp: 2 } }
      ],
      hints: [
        'Для координаты найди на графике вертикальную линию t = 2 с и посмотри, где её пересекает график. Для Δx — координаты на концах промежутка.',
        't = 2 с лежит на первом участке (0–4 с): x = 3 + 2·2. За 4–7 с: x(7) − x(4) = 5 − 11.',
        'x(2) = 7 м; Δx = 5 − 11 = −6 м; путь за 0–7 с: 8 + 6 = 14 м (был разворот — модуль Δx не подходит).'
      ],
      solution: '<p>x(2) = 3 + 2·2 = 7 м (движение от x₀ = 3 м со скоростью 2 м/с).</p><p>Δx(4→7) = x(7) − x(4) = 5 − 11 = −6 м.</p><p>Путь за 0–7 с: участки 8 м и 6 м, s = 14 м. Обрати внимание: |Δx| = 2 м ≠ 14 м — был разворот.</p>',
      onStatus: (s) => { if (P()) P().set('gx-task', s); }
    }));
    frag.appendChild(task);

    const steep = card('Круче — быстрее');
    const stHost = document.createElement('div');
    steep.appendChild(stHost);
    // две линии: v=2 и v=4 от x0=3
    (function () {
      const W = 640, H = 260, padL = 50, padR = 18, padT = 16, padB = 38;
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('class', 'chart');
      const px = (t) => padL + (t / 4) * (W - padL - padR);
      const py = (x) => H - padB - ((x - 0) / 20) * (H - padT - padB);
      for (let t = 0; t <= 4; t += 1) {
        const l = document.createElementNS(SVGNS, 'line');
        l.setAttribute('x1', px(t)); l.setAttribute('y1', padT); l.setAttribute('x2', px(t)); l.setAttribute('y2', H - padB);
        l.setAttribute('class', 'grid'); svg.appendChild(l);
        const tx = document.createElementNS(SVGNS, 'text');
        tx.setAttribute('x', px(t)); tx.setAttribute('y', H - padB + 18); tx.setAttribute('text-anchor', 'middle');
        tx.setAttribute('class', 'tick'); tx.textContent = M.fmtNum(t, 1); svg.appendChild(tx);
      }
      for (let x = 0; x <= 18; x += 3) {
        const l = document.createElementNS(SVGNS, 'line');
        l.setAttribute('x1', padL); l.setAttribute('y1', py(x)); l.setAttribute('x2', W - padR); l.setAttribute('y2', py(x));
        l.setAttribute('class', 'grid'); svg.appendChild(l);
        const tx = document.createElementNS(SVGNS, 'text');
        tx.setAttribute('x', padL - 8); tx.setAttribute('y', py(x) + 4); tx.setAttribute('text-anchor', 'end');
        tx.setAttribute('class', 'tick'); tx.textContent = M.fmtNum(x); svg.appendChild(tx);
      }
      const mk = (v, cls, lbl) => {
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', px(0)); ln.setAttribute('y1', py(3));
        ln.setAttribute('x2', px(4)); ln.setAttribute('y2', py(3 + v * 4));
        ln.setAttribute('class', cls); svg.appendChild(ln);
        const t = document.createElementNS(SVGNS, 'text');
        const ly = Math.max(py(3 + v * 4) - 8, 24);
        t.setAttribute('x', px(4) - 6); t.setAttribute('y', ly); t.setAttribute('text-anchor', 'end');
        t.setAttribute('class', 'chart-note'); t.textContent = lbl; svg.appendChild(t);
      };
      mk(4, 'xt-line steep-a', 'v_x = 4 м/с (круче)');
      mk(2, 'xt-line steep-b', 'v_x = 2 м/с');
      stHost.appendChild(svg);
    })();
    steep.appendChild(para('Оба тела стартовали из x = 3 м. Линия v_x = 4 м/с поднимается круче: за то же время координата вырастает больше. Одинаковые масштабы — честное сравнение.'));
    frag.appendChild(steep);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'График x(t) — расписание «когда где»: по горизонтали время, по вертикали — координата. Идёт линия вверх — тело уезжает всё дальше вправо; ровно — стоит; вниз — возвращается влево.',
      'Вернись к графику вверху и кликни в t = 4 с (вершина), потом в t = 7 с. Видишь: координата сначала выросла до 11 м, потом упала до 5 м. Крутой подъём = большая скорость.',
      'Наклон графика — это скорость изменения координаты. При равномерном движении наклон постоянен, поэтому график — прямые отрезки. Чем больше |v_x|, тем за то же время сильнее меняется x — тем круче линия. Горизонтальный участок — изменение x равно нулю — покой.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  /* ============================================================
     РАЗДЕЛ 9. График скорости v_x(t)
     ============================================================ */
  function buildGraphV() {
    const frag = document.createDocumentFragment();

    const ex = card('Пример: график скорости и площади');
    const gv = document.createElement('div');
    frag.appendChild(ex);
    ex.appendChild(gv);
    const model = M.buildModel(3, [{ vx: 2, dt: 4 }, { vx: -2, dt: 3 }, { vx: -2, dt: 1 }]);
    const vt = new global.Charts.VtChart({ host: gv });
    vt.setModel(model, false);
    const head = document.createElement('div');
    head.className = 'chart-head';
    head.innerHTML = '<span>График скорости</span>';
    const modBtn = Tk.mkBtn('Показать |v_x|', 'btn btn-ghost');
    let mod = false;
    modBtn.addEventListener('click', function () {
      mod = !mod;
      modBtn.textContent = mod ? 'Показать v_x со знаком' : 'Показать |v_x|';
      vt.setModel(model, mod);
    });
    head.appendChild(modBtn);
    ex.appendChild(head);
    // график уже находится под шапкой (переместили выше)

    frag.appendChild(card('Как читать этот график', 'lesson-text').appendChild(para(
      'Линия выше нуля — движение в положительном направлении; ниже нуля — в отрицательном; на нуле — покой. Участки постоянной скорости образуют прямоугольники со временем, и их площадь — это путь или изменение координаты.')));

    const area = card('Площадь прямоугольников: почему метры?');
    area.appendChild(formula('м/с × с = м'));
    area.appendChild(para('Стороны прямоугольника — скорость (м/с) и время (с). Их произведение — метры: (м/с) · с = м. Это и есть путь за участок: s = |v_x| · Δt.'));
    area.appendChild(para('<b>Путь</b> — сумма площадей всех прямоугольников, взятых без отрицательных знаков (модулей).'));
    area.appendChild(para('<b>Изменение координаты</b> — площади со знаком: прямоугольники выше оси со знаком «+», ниже — со знаком «−».'));
    area.appendChild(warn('Не ищи путь как площадь под графиком x(t) — это разные графики! Путь связан только с графиком скорости (или модуля скорости).'));
    frag.appendChild(area);

    const q = card('Вопрос на понимание');
    q.appendChild(Tk.createQuiz({
      question: 'На графике v_x(t) линия расположена ниже оси времени. Что это значит?',
      options: ['Тело стоит', 'Тело движется в отрицательном направлении оси X', 'Тело удаляется от начала координат', 'Скорость уменьшается'],
      correct: 1,
      explain: 'Отрицательная скорость со знаком = движение против положительного направления оси. Тело при этом движется, а не стоит (стояло бы — линия на нуле).',
      onSolved: (ok, first) => { if (P()) P().set('gv-quiz', ok ? 'solved' : 'retry'); }
    }));
    frag.appendChild(q);

    const task = card('Задание (тренировочное): по графику скорости');
    task.appendChild(Tk.createTaskForm({
      id: 'gv-task',
      intro: 'Тело двигалось так: от 0 до 4 с — v_x = 2 м/с; от 4 до 6 с — v_x = 5 м/с; от 6 до 8 с — v_x = −1 м/с (как на рис. 49 учебника). Найди путь за весь промежуток 0–8 с и изменение координаты за 0–8 с.',
      fields: [
        { key: 's', label: 'Путь за 0–8 с', unit: 'м', expected: 20, kind: 'path', traps: { dx: 16 } },
        { key: 'dx', label: 'Δx за 0–8 с', unit: 'м', expected: 16, kind: 'dx', traps: {} }
      ],
      hints: [
        'Путь — сумма площадей всех прямоугольников (без знаков). Δx — сумма со знаками.',
        'Площади: 2·4 = 8; 5·2 = 10; |−1|·2 = 2. Для Δx последняя берётся с минусом: −1·2 = −2.',
        's = 8 + 10 + 2 = 20 м. Δx = 8 + 10 − 2 = 16 м.'
      ],
      solution: '<p>Участок 1: s₁ = |2| · 4 = 8 м. Участок 2: s₂ = |5| · 2 = 10 м. Участок 3: s₃ = |−1| · 2 = 2 м.</p><p>Путь: s = 8 + 10 + 2 = 20 м.</p><p>Δx = (+8) + (+10) + (−2) = 16 м — площади со знаком.</p><p>Проверка: s = 20 > |Δx| = 16 — было изменение направления.</p>',
      onStatus: (s) => { if (P()) P().set('gv-task', s); }
    }));
    frag.appendChild(task);

    const trio = card('Объясни себе по-разному');
    trio.appendChild(explainTrio(
      'Каждый прямоугольник на графике скорости — «порция» пути за участок: высота (скорость) × ширина (время). Складываешь порции — получаешь весь путь.',
      'В графике выше: голубой прямоугольник 2 м/с × 4 с = 8 м (тело вправо), серый 2 м/с × 3 с = 6 м (тело влево). Путь 14 м, а Δx = 8 − 6 = 2 м.',
      'Путь по определению — сумма длин участков, а длина участка при равномерном движении равна |v_x| · Δt, то есть площади прямоугольника со сторонами «модуль скорости» и «время». Единицы сходятся: м/с · с = м. Знак площади нужен только для Δx: он показывает направление.'
    ));
    frag.appendChild(trio);
    return frag;
  }

  global.Lessons = {
    _miniAxis: miniAxis,
    buildCoord: buildCoord,
    buildDelta: buildDelta,
    buildDisp: buildDisp,
    buildPath: buildPath,
    buildTurn: buildTurn,
    buildUniform: buildUniform,
    buildGraphX: buildGraphX,
    buildGraphV: buildGraphV
  };
})(typeof window !== 'undefined' ? window : globalThis);
