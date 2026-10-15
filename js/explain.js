/* ============================================================
   Режим «Объясняю сама» + итоговая проверка.
   Без имитации понимания текста: свободные ответы проверяются
   самопроверкой по критериям, остальное — детерминированные
   задания (выбор причины, восстановление порядка).
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.Motion;
  const Tk = global.Tasks;
  const P = () => global.Progress;

  /* ---------- опорные начала фраз ---------- */
  const STARTERS = [
    'Сначала я определяю…',
    'На этом участке тело движется…',
    'Я вычитаю…, потому что…',
    'Для пути я складываю…, потому что…',
    'Знак минус здесь означает…',
    'Я подставляю числа…',
    'Ответ означает…',
    'Проверяю так:…'
  ];

  const REASON_STEPS = [
    { key: 'given', label: '1) Что известно?', hint: 'Сначала я определяю… (например: начальная координата, скорости и время участков)', short: 'Ключ: x₀, скорости, длительности участков' },
    { key: 'find', label: '2) Что нужно найти?', hint: 'Мне нужно найти… (путь, перемещение, координату)', short: 'Ключ: что ищем — s, Δx или x?' },
    { key: 'turn', label: '3) Были ли развороты?', hint: 'На этом участке тело движется… / Тело меняло направление, потому что…', short: 'Ключ: менялась ли скорость знак?' },
    { key: 'which', label: '4) Какую величину я вычисляю?', hint: 'Я вычисляю… (путь или изменение координаты)', short: 'Ключ: путь или перемещение?' },
    { key: 'why', label: '5) Почему выбираю это действие или формулу?', hint: 'Я вычитаю…, потому что… / Для пути я складываю…, потому что…', short: 'Ключ: почему именно это действие' },
    { key: 'subst', label: '6) Как подставляю числа и единицы?', hint: 'Я подставляю числа… (с единицами: м/с × с = м)', short: 'Ключ: числа + единицы' },
    { key: 'meaning', label: '7) Что означает ответ?', hint: 'Ответ означает… (тело оказалось на … м правее/левее старта)', short: 'Ключ: смысл ответа' },
    { key: 'check', label: '8) Как проверяю его правдоподобность?', hint: 'Проверяю так:… (путь ≥ |перемещения|; обратная подстановка)', short: 'Ключ: s ≥ |Δx|? обратная подстановка?' }
  ];

  /* Текущая задача из тренажёра для разбора (сохраняется). */
  let currentTask = null;
  function setCurrentTask(t) {
    currentTask = t;
    if (P()) P().setRaw('explain-current-task', JSON.stringify(t));
  }
  function getCurrentTask() {
    if (currentTask) return currentTask;
    if (P()) {
      const raw = P().raw('explain-current-task');
      if (raw) { try { currentTask = JSON.parse(raw); } catch (e) {} }
    }
    return currentTask;
  }

  function slug(str) {
    return String(str).toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-').slice(0, 40);
  }

  function buildExplain(host) {
    const frag = document.createDocumentFragment();

    const intro = document.createElement('section');
    intro.className = 'card lesson-text';
    intro.innerHTML = '<h3>Зачем этот режим</h3><p>Решить задачу — половина дела. Вторая половина — уметь рассказать ход решения так, чтобы было понятно любому. Здесь ты сначала пишешь объяснение сама, а потом сверяешься с образцом и списком смысловых пунктов.</p>' +
      '<p class="muted">Честно о проверке: программа не умеет «понимать» свободный текст и не делает вид, что умеет. Твой ответ никуда не отправляется — проверяешь его ты сама по критериям.</p>';
    frag.appendChild(intro);

    /* --- часть 1: пошаговый разбор (задача из тренажёра или лыжник) --- */
    const task = getCurrentTask();
    const p1 = document.createElement('section');
    p1.className = 'card';
    let p1Head = '<h3>Разбери задачу по шагам</h3>';
    if (task) {
      p1Head += '<p><b>' + task.title + '</b></p><p>' + task.condition + '</p>';
      if (task.figureHTML) p1Head += '<div class="task-figure">' + task.figureHTML + '</div>';
    } else {
      p1Head += '<p>Задача: лыжник прошёл 400 м вправо, затем 150 м влево. Найди путь и перемещение и объясни решение.</p><p class="muted small">Решишь задачу в тренажёре — она появится здесь кнопкой «Объяснить эту задачу».</p>';
    }
    p1.innerHTML = p1Head;

    // опоры: 3 уровня — полные начала фраз → только ключевые вопросы → без опор
    const attempts = P() ? P().attempts('explain-form') : 0;
    const level = attempts === 0 ? 2 : (attempts < 3 ? 1 : 0);
    const starterToggle = document.createElement('label');
    starterToggle.className = 'starter-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = (level === 2);
    const cbLbl = document.createElement('span');
    cbLbl.textContent = 'Показывать опоры (начала фраз)';
    cb.addEventListener('change', function () {
      p1.querySelectorAll('.starter-hint').forEach(function (h) { h.hidden = !cb.checked; });
      p1.querySelectorAll('.starter-short').forEach(function (h) { h.hidden = !cb.checked; });
    });
    starterToggle.appendChild(cb); starterToggle.appendChild(cbLbl);
    const levelNote = document.createElement('div');
    levelNote.className = 'muted small';
    levelNote.textContent = attempts === 0
      ? 'Опоры полные. После каждой сохранённой попытки объяснения они будут постепенно уменьшаться.'
      : (attempts < 3 ? 'Опоры сокращены: остались только ключевые вопросы. Вернуть полные можно галочкой.'
                      : 'Опоры убраны — ты уже объясняла. Вернуть их можно галочкой в любой момент.');
    p1.appendChild(starterToggle);
    p1.appendChild(levelNote);

    REASON_STEPS.forEach(function (st, i) {
      const row = document.createElement('div');
      row.className = 'explain-step';
      const lab = document.createElement('div');
      lab.className = 'explain-step-label';
      lab.textContent = st.label;
      const hintEl = document.createElement('div');
      hintEl.className = 'starter-hint muted small';
      hintEl.textContent = 'Например: ' + st.hint;
      const shortEl = document.createElement('div');
      shortEl.className = 'starter-short muted small';
      shortEl.textContent = st.short;
      if (level === 2) { hintEl.hidden = false; shortEl.hidden = true; }
      else if (level === 1) { hintEl.hidden = true; shortEl.hidden = false; }
      else { hintEl.hidden = true; shortEl.hidden = true; }
      const ta = document.createElement('textarea');
      ta.rows = 2;
      ta.placeholder = 'Твой шаг объяснения…';
      const prefix = task && task.instanceId ? ('draft-' + task.instanceId + '-') : 'explain-default-';
      const key = prefix + st.key;
      if (P()) {
        const prev = P().raw(key);
        if (prev) ta.value = prev;
      }
      ta.addEventListener('input', function () { if (P()) P().setRaw(key, ta.value); });
      row.appendChild(lab); row.appendChild(hintEl); row.appendChild(shortEl); row.appendChild(ta);
      p1.appendChild(row);
    });
    const saveBtn = Tk.mkBtn('Сохранить и отметить попытку', 'btn btn-ghost');
    saveBtn.addEventListener('click', function () {
      const filled = p1.querySelectorAll('.explain-step textarea');
      let n = 0;
      filled.forEach(function (t) { if (t.value.trim()) n++; });
      if (n >= 4 && P()) P().set('explain-form', 'answered');
      saveBtn.textContent = n >= 4
        ? 'Сохранено! После следующих попыток опоры уменьшатся'
        : 'Сохранено как черновик (заполни хотя бы 4 шага — тогда это попытка)';
      saveBtn.disabled = true;
    });
    const saveWrap = document.createElement('div');
    saveWrap.className = 'task-bar';
    saveWrap.appendChild(saveBtn);
    p1.appendChild(saveWrap);
    const sampleBtn = Tk.mkBtn('Показать образец разбора', 'btn btn-primary');
    const sampleBox = document.createElement('div');
    sampleBox.className = 'task-solution';
    sampleBox.hidden = true;
    if (task && task.solution) {
      sampleBox.innerHTML = '<p class="muted">Образец решения этой задачи:</p>' + task.solution;
    } else sampleBox.innerHTML =
      '<p><b>1) Известно:</b> два участка: 400 м вправо и 150 м влево.</p>' +
      '<p><b>2) Найти:</b> путь s и перемещение (изменение координаты) Δx.</p>' +
      '<p><b>3) Развороты:</b> да — направление движения менялось (вправо, потом влево).</p>' +
      '<p><b>4) Вычисляю:</b> сначала путь, потом перемещение.</p>' +
      '<p><b>5) Почему:</b> путь — сумма длин всех участков (400 + 150), потому что путь — всё пройденное расстояние. Перемещение — «итог»: 400 вправо и 150 влево дают 250 м вправо, потому что перемещение зависит только от начальной и конечной точек.</p>' +
      '<p><b>6) Подстановка:</b> s = 400 + 150 = 550 м; Δx = 400 − 150 = 250 м.</p>' +
      '<p><b>7) Ответ:</b> путь 550 м, перемещение 250 м, направлено вправо.</p>' +
      '<p><b>8) Проверка:</b> путь (550) больше модуля перемещения (250) — при развороте это обязательно так. Плюс обратная подстановка: 400 − 150 = 250 ✓.</p>';
    sampleBtn.addEventListener('click', function () {
      sampleBox.hidden = !sampleBox.hidden;
      sampleBtn.textContent = sampleBox.hidden ? 'Показать образец разбора' : 'Скрыть образец';
    });
    p1.appendChild(sampleBtn);
    p1.appendChild(sampleBox);
    frag.appendChild(p1);

    /* --- часть 2: устные вопросы --- */
    const ORAL = [
      {
        q: 'Что такое перемещение?',
        criteria: ['это направленный отрезок (вектор)', 'от начального положения к конечному', 'характеризуется модулем и направлением'],
        sample: 'Перемещение — направленный отрезок прямой, начало которого совпадает с начальным положением точки, а конец — с конечным положением.',
        pitfalls: ['называть перемещением весь маршрут или траекторию', 'говорить, что перемещение — это «сколько метров прошло» (это путь)']
      },
      {
        q: 'От чего зависит перемещение?',
        criteria: ['только от начальной и конечной точек', 'не зависит от того, как тело двигалось в промежутке'],
        sample: 'Перемещение определяется только начальной и конечной координатами тела и не зависит от того, как оно двигалось.',
        pitfalls: ['считать, что длинный маршрут даёт большое перемещение', 'забывать про случай возврата в начальную точку (перемещение 0)']
      },
      {
        q: 'Что такое путь?',
        criteria: ['всё расстояние, пройденное телом', 'за рассматриваемый промежуток времени', 'величина неотрицательная'],
        sample: 'Путь — всё расстояние, пройденное точечным телом за рассматриваемый промежуток времени.',
        pitfalls: ['называть путём разность координат', 'допускать «отрицательный путь»']
      },
      {
        q: 'Чем путь отличается от перемещения?',
        criteria: ['путь — число (расстояние), перемещение — направленный отрезок', 'путь учитывает весь маршрут, перемещение — только итог', 'путь ≥ модуля перемещения'],
        sample: 'Путь — всё пройденное расстояние (число), перемещение — стрелка от старта к финишу. Путь учитывает весь маршрут, а перемещение — только где начало и где конец.',
        pitfalls: ['говорить, что они «почти одно и то же»', 'сравнивать путь с перемещением без модуля']
      },
      {
        q: 'Когда путь равен модулю перемещения?',
        criteria: ['когда тело не меняло направления движения', 'двигалось по прямой без разворотов'],
        sample: 'Когда тело за весь промежуток двигалось в одном направлении (без разворотов): тогда s = |Δx|.',
        pitfalls: ['считать, что «всегда равен»', 'забывать про остановки: остановки не мешают равенству, мешают развороты']
      },
      {
        q: 'Может ли путь быть отрицательным?',
        criteria: ['нет, никогда', 'путь — расстояние, а расстояние неотрицательно', 'нулевым — может (если тело покоилось)'],
        sample: 'Нет. Путь — расстояние, он либо положителен, либо равен нулю (если тело не двигалось).',
        pitfalls: ['«отрицательный путь» при движении влево (отрицательным бывает только Δx)', 'путать знак скорости и знак пути']
      },
      {
        q: 'Может ли тело двигаться, но иметь нулевое перемещение?',
        criteria: ['да, может', 'пример: уехало и вернулось в начальную точку', 'при этом путь ненулевой'],
        sample: 'Да: если тело вернулось в начальную точку, перемещение нулевое, хотя путь больше нуля. Перемещение зависит только от начала и конца.',
        pitfalls: ['считать, что нулевое перемещение — всегда покой', 'путать с остановкой в середине пути']
      },
      {
        q: 'Как определить путь по графику скорости?',
        criteria: ['построить прямоугольники на участках постоянной скорости', 'сложить площади (модулей), взятые без отрицательных знаков', 'единицы: м/с × с = м'],
        sample: 'Найти площади прямоугольников между графиком v_x(t) и осью времени и сложить их, беря модули. Площадь одного участка: |v_x| · Δt.',
        pitfalls: ['брать площади со знаком (это Δx, а не путь)', 'искать площадь под графиком x(t)']
      }
    ];
    const p2 = document.createElement('section');
    p2.className = 'card';
    p2.innerHTML = '<h3>Вопросы для устного ответа</h3><p>Ответь вслух или запиши, затем открой образец и сверься по пунктам.</p>';
    ORAL.forEach(function (item, i) {
      const d = document.createElement('details');
      d.className = 'oral-q';
      const sum = document.createElement('summary');
      sum.textContent = 'Вопрос ' + (i + 1) + '. ' + item.q;
      d.appendChild(sum);
      d.appendChild(Tk.createSelfCheck({
        placeholder: 'Ответь своими словами…',
        criteria: item.criteria,
        sample: item.sample,
        pitfalls: item.pitfalls,
        onDone: function (res) { if (P()) P().set('oral-' + i, res); }
      }));
      p2.appendChild(d);
    });
    frag.appendChild(p2);

    /* --- часть 3: выбери причину --- */
    const REASONS = [
      {
        q: 'Почему в формуле пути стоит модуль скорости: s = |v_x| · Δt?',
        options: ['Потому что путь — расстояние, а расстояние не бывает отрицательным', 'Потому что скорость всегда положительна', 'Для красоты записи'],
        correct: 0,
        explain: 'Скорость со знаком несёт информацию о направлении — она нужна для Δx. Путь — длина, поэтому берём модуль.'
      },
      {
        q: 'Почему изменение координаты считают как «конечная минус начальная», а не наоборот?',
        options: ['Так удобнее рисовать', 'Потому что знак результата показывает направление смещения: x₂ = x₁ + Δx', 'Разницы нет'],
        correct: 1,
        explain: 'Если к начальному положению прибавить Δx, должно получиться конечное. Это выполняется только при порядке «конечное минус начальное».'
      },
      {
        q: 'Почему при развороте путь больше модуля перемещения?',
        options: ['Путь складывает длины всех участков, включая «обратные», а перемещение помнит только старт и финиш', 'Перемещение всегда маленькое', 'Это ошибка: они равны'],
        correct: 0,
        explain: 'Тело реально прошло метры в обе стороны — путь их учитывает. А перемещение — одна стрелка от старта к финишу.'
      },
      {
        q: 'Почему нельзя находить путь как площадь под графиком x(t)?',
        options: ['Площадь под графиком x(t) даёт не метры, а другие единицы', 'Можно, просто сложно', 'Путь связан с графиком скорости: площадь под v_x(t) — это |v|·t = м'],
        correct: 2,
        explain: 'Площадь под графиком скорости имеет единицы м/с × с = м и равна пути (или со знаком — Δx). График координаты для этого не предназначен.'
      },
      {
        q: 'Почему горизонтальный участок на графике x(t) означает покой?',
        options: ['Потому что координата не меняется со временем: Δx = 0 при Δt > 0, значит v_x = 0', 'Потому что график заканчивается', 'Так не бывает'],
        correct: 0,
        explain: 'Горизонталь = x постоянна = тело не меняет положения = покой (или мгновенная остановка на этом участке).'
      }
    ];
    const p3 = document.createElement('section');
    p3.className = 'card';
    p3.innerHTML = '<h3>Выбери причину</h3><p>Понимать — значит уметь объяснить, почему формула работает именно так.</p>';
    REASONS.forEach(function (r, i) {
      p3.appendChild(Tk.createQuiz(Object.assign({}, r, {
        onSolved: function (ok) { if (P()) P().set('reason-' + i, ok ? 'solved' : 'retry'); }
      })));
    });
    frag.appendChild(p3);

    /* --- часть 4: восстанови объяснение --- */
    const p4 = document.createElement('section');
    p4.className = 'card';
    p4.innerHTML = '<h3>Восстанови объяснение</h3><p>Шаги решения перепутались. Кликай по ним в правильном порядке — они встанут в список. Затем проверь.</p>';
    const steps = [
      'Определить, что известно: участки движения и их скорости',
      'Проверить, были ли развороты',
      'Найти длину каждого участка: |v_x| · Δt',
      'Сложить длины — получился путь',
      'Найти итог: x_кон − x_нач — это Δx',
      'Проверить: путь ≥ |Δx|'
    ];
    const orderWrap = document.createElement('div');
    p4.appendChild(orderWrap);
    buildOrdering(orderWrap, steps, 'order-1');
    frag.appendChild(p4);

    host.appendChild(frag);
  }

  /* ---------- задание на восстановление порядка ---------- */
  function buildOrdering(host, steps, id) {
    const wrap = document.createElement('div');
    wrap.className = 'ordering';
    const pool = steps.map(function (s, i) { return { text: s, idx: i }; });
    // перемешиваем
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    const chosen = [];
    const poolBox = document.createElement('div');
    poolBox.className = 'order-pool';
    const chosenBox = document.createElement('div');
    chosenBox.className = 'order-chosen';
    const msg = document.createElement('div');
    msg.className = 'task-msg';
    function redraw() {
      poolBox.innerHTML = ''; chosenBox.innerHTML = '';
      pool.forEach(function (p) {
        const b = Tk.mkBtn(p.text, 'btn btn-option');
        b.addEventListener('click', function () {
          chosen.push(p.idx);
          pool.splice(pool.indexOf(p), 1);
          redraw();
        });
        poolBox.appendChild(b);
      });
      chosen.forEach(function (idx, pos) {
        const d = document.createElement('div');
        d.className = 'order-step';
        d.innerHTML = '<span class="order-num">' + (pos + 1) + '.</span> ' + steps[idx];
        const rm = Tk.mkBtn('← вернуть', 'btn btn-ghost btn-small');
        rm.addEventListener('click', function () {
          pool.push({ text: steps[idx], idx: idx });
          chosen.splice(pos, 1);
          redraw();
        });
        d.appendChild(rm);
        chosenBox.appendChild(d);
      });
    }
    redraw();
    const bar = document.createElement('div');
    bar.className = 'task-bar';
    const checkBtn = Tk.mkBtn('Проверить порядок', 'btn btn-primary');
    const resetBtn = Tk.mkBtn('Начать заново', 'btn btn-ghost');
    bar.appendChild(checkBtn); bar.appendChild(resetBtn);
    checkBtn.addEventListener('click', function () {
      const ok = chosen.length === steps.length && chosen.every(function (v, i) { return v === i; });
      if (ok) {
        msg.className = 'task-msg msg-ok';
        msg.textContent = 'Верно! Порядок объяснения восстановлен.';
        if (P()) P().set(id, 'solved');
        if (window._updateFinalSummary) window._updateFinalSummary();
      } else {
        msg.className = 'task-msg msg-err';
        msg.textContent = 'Порядок пока неверный. Подумай: что определяем в первую очередь — данные или формулу? И что идёт в конце — вычисление или проверка?';
      }
    });
    resetBtn.addEventListener('click', function () {
      chosen.length = 0;
      pool.length = 0;
      steps.forEach(function (s, i) { pool.push({ text: s, idx: i }); });
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      redraw();
      msg.textContent = ''; msg.className = 'task-msg';
    });
    wrap.appendChild(poolBox);
    wrap.appendChild(chosenBox);
    wrap.appendChild(bar);
    wrap.appendChild(msg);
    host.appendChild(wrap);
  }

  /* ============================================================
     ИТОГОВАЯ ПРОВЕРКА
     ============================================================ */
  function buildFinalCheck(host) {
    const frag = document.createDocumentFragment();
    const intro = document.createElement('section');
    intro.className = 'card lesson-text';
    intro.innerHTML = '<h3>Как устроена проверка</h3><p>Пять заданий разных типов: определение своими словами, вычисление, график, поиск ошибки и объяснение решения. Это не оценка — это ориентир, что уже уверенно, а что стоит повторить.</p>';
    frag.appendChild(intro);

    /* сводка по пяти частям — обновляется по мере выполнения */
    const summary = document.createElement('section');
    summary.className = 'card';
    const sumHost = document.createElement('div');
    summary.appendChild(sumHost);
    frag.appendChild(summary);
    window._updateFinalSummary = function () {
      const parts = [
        ['1. Определение', 'final-1'],
        ['2. Вычисление', 'final-2'],
        ['3. График', 'final-3'],
        ['4. Поиск ошибки', ['final-4', 'final-4b']],
        ['5. Объяснение решения', 'final-5']
      ];
      let html = '<h3>Сводка проверки</h3><div class="progress-list">';
      parts.forEach(function (pt) {
        const keys = Array.isArray(pt[1]) ? pt[1] : [pt[1]];
        let label = 'ещё не выполнено', cls = 'badge-none';
        const stats = keys.map(function (k) { return P() ? P().get(k) : null; });
        const allDone = stats.every(function (st) { return st && st.flags && st.flags.solved; });
        if (allDone) {
          const f = stats.map(function (st) { return st.flags; });
          const anyViewed = f.some(function (x) { return x.viewed; });
          const anyHinted = f.some(function (x) { return x.hinted; });
          const anyWrong = f.some(function (x) { return (x.wrongs || 0) > 0; });
          if (anyViewed) { label = 'решение просмотрено — стоит повторить'; cls = 'badge-viewed'; }
          else if (anyHinted) { label = 'получилось с подсказкой'; cls = 'badge-hint'; }
          else if (anyWrong) { label = 'получилось после ошибок'; cls = 'badge-solved'; }
          else { label = 'получилось самой'; cls = 'badge-solved'; }
        }
        html += '<div class="progress-row"><span>' + pt[0] + '</span><span class="badge ' + cls + '">' + label + '</span></div>';
      });
      html += '</div>';
      sumHost.innerHTML = html;
    };
    window._updateFinalSummary();

    /* 1. определение своими словами */
    const c1 = document.createElement('section');
    c1.className = 'card';
    c1.innerHTML = '<h3>1. Определение</h3><p>Своими словами объясни: что такое перемещение и чем оно отличается от пути?</p>';
    c1.appendChild(Tk.createSelfCheck({
      placeholder: 'Что такое перемещение и чем оно отличается от пути…',
      criteria: [
        'перемещение — направленный отрезок от начального положения к конечному',
        'путь — всё пройденное расстояние (число, неотрицательное)',
        'перемещение зависит только от старта и финиша, путь — от всего маршрута',
        'путь ≥ модуля перемещения, равенство — если не было разворотов'
      ],
      sample: 'Перемещение — направленный отрезок от начального положения тела к конечному; оно характеризуется модулем и направлением. Путь — всё расстояние, пройденное телом за промежуток времени. Отличие: путь описывает весь маршрут и не бывает отрицательным, а перемещение — только «итог» движения. Путь равен модулю перемещения, только если тело не меняло направления.',
      pitfalls: ['называть перемещение «пройденными метрами»', 'забывать про слово «направленный»', 'считать, что путь может быть меньше модуля перемещения'],
      onDone: function (res) { if (P()) P().set('final-1', res); if (window._updateFinalSummary) window._updateFinalSummary(); }
    }));
    frag.appendChild(c1);

    /* 2. вычисление */
    const v1 = 3, t1 = 4, v2 = 2, t2 = 3;
    const c2 = document.createElement('section');
    c2.className = 'card';
    c2.innerHTML = '<h3>2. Вычисление</h3>';
    c2.appendChild(Tk.createTaskForm({
      intro: 'Велосипедист поехал из точки с координатой 100 м вправо со скоростью 3 м/с и двигался 4 с, затем 3 с двигался влево со скоростью 2 м/с. Найди путь, изменение координаты и конечную координату.',
      fields: [
        { key: 's', label: 'Путь s', unit: 'м', expected: v1 * t1 + v2 * t2, kind: 'path', traps: { dx: v1 * t1 - v2 * t2 } },
        { key: 'dx', label: 'Изменение координаты Δx', unit: 'м', expected: v1 * t1 - v2 * t2, kind: 'dx' },
        { key: 'x', label: 'Конечная координата x', unit: 'м', expected: 100 + v1 * t1 - v2 * t2, kind: 'coord', traps: {} }
      ],
      hints: [
        'Разбей движение на участки и посчитай длину каждого.',
        'Участок 1: 3·4 = 12 м; участок 2: 2·3 = 6 м. Путь = 12 + 6; Δx = 12 − 6; x = 100 + Δx.',
        's = 18 м; Δx = 6 м; x = 106 м.'
      ],
      solution: '<p>Путь: s = 3·4 + 2·3 = 12 + 6 = 18 м.</p><p>Δx = 12 − 6 = 6 м (вправо).</p><p>x = 100 + 6 = 106 м.</p><p>Проверка: s (18) > |Δx| (6) — был разворот.</p>',
      onStatus: function (s) { if (P()) P().set('final-2', s); if (window._updateFinalSummary) window._updateFinalSummary(); }
    }));
    frag.appendChild(c2);

    /* 3. график */
    const model = M.buildModel(2, [{ vx: 3, dt: 3 }, { vx: 0, dt: 2 }, { vx: -1, dt: 4 }]);
    const c3 = document.createElement('section');
    c3.className = 'card';
    c3.innerHTML = '<h3>3. График</h3><p>По графику x(t) определи: координату в t = 4 с, изменение координаты за 0–8 с и путь за 0–8 с.</p>';
    const g3 = document.createElement('div');
    c3.appendChild(g3);
    const chart = new global.Charts.XtChart({ host: g3 });
    chart.setModel(model);
    c3.appendChild(Tk.createTaskForm({
      intro: '',
      fields: [
        { key: 'x4', label: 'Координата в t = 4 с', unit: 'м', expected: 11, kind: 'coord' },
        { key: 'dx', label: 'Δx за 0–8 с', unit: 'м', expected: 6, kind: 'dx' },
        { key: 's', label: 'Путь за 0–8 с', unit: 'м', expected: 12, kind: 'path', traps: { dx: 6 } }
      ],
      hints: [
        'На графике есть три участка: подъём, горизонталь (что это?), спуск. Движение длится 9 с, а спрашивают за 0–8 с.',
        't = 4 с — на горизонтальном участке: x = 11 м. К t = 8 с тело успело проехать 3 с вниз: x(8) = 11 − 1·3 = 8. Δx = 8 − 2. Путь: 9 м (0–3 с) + 0 м (покой) + 3 м (5–8 с).',
        'x(4) = 11 м; Δx = 8 − 2 = 6 м; s = 9 + 0 + 3 = 12 м.'
      ],
      solution: '<p>x(4) = 11 м — тело стоит (горизонтальный участок).</p><p>К моменту t = 8 с (из 9): x(8) = 11 − 1·3 = 8 м, поэтому Δx = 8 − 2 = 6 м.</p><p>Путь: 3·3 = 9 м + 0 м (покой) + 1·3 = 3 м; s = 12 м.</p><p>Проверка: 12 > 6 — было изменение направления.</p>',
      onStatus: function (s) { if (P()) P().set('final-3', s); if (window._updateFinalSummary) window._updateFinalSummary(); }
    }));
    frag.appendChild(c3);

    /* 4. поиск ошибки */
    const c4 = document.createElement('section');
    c4.className = 'card';
    c4.innerHTML = '<h3>4. Найди ошибку</h3><p>Ученик решил задачу так: «Тело прошло 7 м вправо и 3 м влево. Значит, Δx = 7 + 3 = 10 м, путь s = 10 м». Найди ошибку.</p>';
    c4.appendChild(Tk.createQuiz({
      question: 'В чём ошибка решения?',
      options: ['Вычисления верные, ошибки нет', 'Δx найден как сумма: влево движение должно вычитаться (Δx = 7 − 3 = 4 м)', 'Путь не может быть 10 м'],
      correct: 1,
      explain: 'Складывать нужно участки пути (для s), а для Δx «влево» вычитается: 7 − 3 = 4 м. Здесь случайно ответ пути верный (7 + 3 = 10 м), но Δx посчитан неверно.',
      onSolved: function (ok, first) { if (P()) P().set('final-4', ok ? 'solved' : 'retry'); if (window._updateFinalSummary) window._updateFinalSummary(); }
    }));
    c4.appendChild(Tk.createTaskForm({
      intro: 'Запиши правильные ответы для этой же задачи (7 м вправо, затем 3 м влево):',
      fields: [
        { key: 'dx', label: 'Правильное Δx', unit: 'м', expected: 4, kind: 'dx' },
        { key: 's', label: 'Правильный путь s', unit: 'м', expected: 10, kind: 'path' }
      ],
      hints: [
        'Путь — сумма длин участков. Δx — итог с учётом направления.',
        's = 7 + 3; Δx = 7 − 3.',
        's = 10 м, Δx = 4 м.'
      ],
      solution: '<p>s = 7 + 3 = 10 м. Δx = 7 − 3 = 4 м (тело в 4 м правее старта).</p><p>Проверка: 10 > 4 — разворот был.</p>',
      onStatus: function (s) { if (P()) P().set('final-4b', s); if (window._updateFinalSummary) window._updateFinalSummary(); }
    }));
    frag.appendChild(c4);

    /* 5. объяснение решения */
    const c5 = document.createElement('section');
    c5.className = 'card';
    c5.innerHTML = '<h3>5. Объясни решение</h3><p>Восстанови порядок объяснения для задачи: «Тело прошло 8 м вправо, затем 6 м влево. Найди путь и перемещение».</p>';
    const orderHost = document.createElement('div');
    c5.appendChild(orderHost);
    buildOrdering(orderHost, [
      'Определить, что известно: два участка — 8 м вправо и 6 м влево',
      'Отметить, что было изменение направления (разворот)',
      'Найти путь как сумму длин участков: 8 + 6 = 14 м',
      'Найти изменение координаты: +8 − 6 = +2 м',
      'Сформулировать ответ: путь 14 м, перемещение 2 м вправо',
      'Проверить: путь (14) больше модуля перемещения (2) — разворот учтён'
    ], 'final-5');
    frag.appendChild(c5);

    host.appendChild(frag);
  }

  global.Explain = {
    build: buildExplain,
    buildFinalCheck: buildFinalCheck,
    setCurrentTask: setCurrentTask,
    getCurrentTask: getCurrentTask
  };
})(typeof window !== 'undefined' ? window : globalThis);
