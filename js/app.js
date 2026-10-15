/* ============================================================
   Сборка приложения: прогресс, навигация, диагностика,
   памятка, сброс, тёмная тема.
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.Motion;
  const Tk = global.Tasks;

  /* ---------- прогресс (localStorage) ---------- */
  /* Прогресс хранит ПОПЫТКИ по каждому заданию (а не один «лучший»
     статус): просмотренное решение никогда не превращается в
     «решила сама» задним числом. */
  const Progress = {
    key: 'ponimayu-dvizhenie-v1',
    data: { items: {} },
    available: true,
    load: function () {
      try {
        const raw = localStorage.getItem(this.key);
        if (raw) this.data = JSON.parse(raw);
      } catch (e) { this.available = false; }
    },
    save: function () {
      try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { this.available = false; }
    },
    /* set(id, event) — события одного экземпляра задания:
       'solved' (решила), 'hint' (была подсказка), 'viewed' (смотрела решение),
       'retry' (неверная попытка), 'answered' (ответила, сверься с критериями).
       События помощи и результата НЕ нарастают счётчиком: повторный просмотр
       не превращает задание в решённое и наоборот. */
    set: function (id, event) {
      if (!this.data.items[id]) this.data.items[id] = {};
      const it = this.data.items[id];
      switch (event) {
        case 'solved': it.solved = true; break;
        case 'hint': it.hinted = true; break;
        case 'viewed': it.viewed = true; break;
        case 'retry': it.wrongs = (it.wrongs || 0) + 1; break;
        case 'answered':
          it.answered = true;
          it.answeredCount = (it.answeredCount || 0) + 1; // содержательные попытки
          break;
      }
      this.save();
    },
    /* Итоговый ярлык по флагам экземпляра (строгий порядок честности). */
    get: function (id) {
      const it = this.data.items[id];
      if (!it) return null;
      let label = null;
      if (it.solved && it.viewed) label = 'просмотрела решение';
      else if (it.solved && it.hinted) label = 'с подсказкой';
      else if (it.solved && (it.wrongs || 0) > 0) label = 'решила после ошибок';
      else if (it.solved) label = 'решила сама';
      else if (it.answered) label = 'ответила — сверься с критериями';
      else if (it.viewed || it.hinted || (it.wrongs || 0) > 0) label = 'стоит повторить';
      return { flags: it, label: label };
    },
    raw: function (id) { return this.data.items[id + ':text'] || null; },
    setRaw: function (id, text) { this.data.items[id + ':text'] = text; this.save(); },
    countSolved: function (ids) {
      const self = this;
      return ids.filter(function (i) {
        const it = self.data.items[i];
        return it && it.solved && !it.viewed; // просмотренное решение — не «выполнено»
      }).length;
    },
    /* Сколько раз объяснение было сохранено с содержательным ответом. */
    attempts: function (id) {
      const it = this.data.items[id];
      if (!it) return 0;
      return (it.answeredCount || 0) + (it.solved ? 1 : 0);
    },
    /* Метаданные экземпляра (например, нужна ли викторина) — не результат. */
    setMeta: function (id, obj) {
      if (!this.data.items[id]) this.data.items[id] = {};
      Object.assign(this.data.items[id], obj);
      this.save();
    },
    /* Все ключи записей прогресса с данным префиксом (для сводки по типам). */
    keysByPrefix: function (prefix) {
      return Object.keys(this.data.items).filter(function (k) { return k.indexOf(prefix) === 0; });
    },
    reset: function () { this.data = { items: {} }; this.save(); }
  };
  global.Progress = Progress;

  /* ---------- разделы ---------- */
  const SECTIONS = [
    { id: 'start', title: 'Начало' },
    { id: 'coord', title: '1. Координата' },
    { id: 'delta', title: '2. Изменение координаты' },
    { id: 'disp', title: '3. Перемещение' },
    { id: 'path', title: '4. Путь' },
    { id: 'turn', title: '5. Разворот' },
    { id: 'lab', title: '6. Лаборатория' },
    { id: 'uniform', title: '7. Равномерное движение' },
    { id: 'graphx', title: '8. График x(t)' },
    { id: 'graphv', title: '9. График v(t)' },
    { id: 'trainer', title: '10. Тренажёр' },
    { id: 'explain', title: '11. Объясняю сама' },
    { id: 'final', title: '12. Итоговая проверка' },
    { id: 'memo', title: '13. Памятка' }
  ];
  const SECTION_ITEMS = {
    coord: ['coord-quiz', 'coord-task'],
    delta: ['delta-quiz', 'delta-task'],
    disp: ['disp-quiz', 'disp-task'],
    path: ['path-quiz', 'path-task'],
    turn: ['tb1', 'tb2', 'tb3', 'tb4', 'tb5', 'tb6', 'tb7', 'turn-quiz'],
    uniform: ['uniform-quiz', 'uniform-task'],
    graphx: ['gx-quiz', 'gx-task'],
    graphv: ['gv-quiz', 'gv-task']
  };

  /* ---------- диагностика ---------- */
  const DIAG = [
    {
      q: 'Что показывает координата тела?',
      options: ['Сколько метров тело прошло всего', 'Положение тела относительно выбранного начала отсчёта', 'Как быстро движется тело'],
      correct: 1,
      rec: 'coord',
      recName: '«1. Координата»'
    },
    {
      q: 'Тело перешло из точки x₁ = 5 м в точку x₂ = 2 м. Чему равно Δx?',
      options: ['+3 м', '−3 м', '7 м'],
      correct: 1,
      rec: 'delta',
      recName: '«2. Изменение координаты»'
    },
    {
      q: 'Тело прошло 6 м вправо, а потом 6 м влево. Чему равен путь?',
      options: ['0 м', '6 м', '12 м'],
      correct: 2,
      rec: 'path',
      recName: '«4. Путь»'
    },
    {
      q: 'Перемещение тела за час равно нулю. Что можно сказать точно?',
      options: ['Тело точно стояло на месте', 'Тело точно вернулось в начальную точку', 'Тело либо стояло, либо вернулось в начальную точку — по перемещению не различить'],
      correct: 2,
      rec: 'turn',
      recName: '«5. Разворот»'
    },
    {
      q: 'Что даёт площадь под графиком скорости v_x(t) (по модулю)?',
      options: ['Путь за этот промежуток', 'Скорость', 'Координату тела'],
      correct: 0,
      rec: 'graphv',
      recName: '«9. График v(t)»'
    }
  ];

  function buildStart(host) {
    const frag = document.createDocumentFragment();
    const hello = document.createElement('section');
    hello.className = 'card lesson-text';
    hello.innerHTML = '<h3>Привет, Ксюша!</h3>' +
      '<p>Эта программа — про три главные идеи движения: <b>где</b> тело (координата), <b>что изменилось</b> (перемещение и изменение координаты) и <b>сколько пройдено</b> (путь). Никакого заучивания: сначала пробуешь сама, потом проверяешь, потом понимаешь, почему формула работает.</p>' +
      '<p>Начни с короткой диагностики — она покажет, с каких разделов удобнее начать. Оценки тут нет: это компас, а не экзамен.</p>';
    frag.appendChild(hello);

    const diag = document.createElement('section');
    diag.className = 'card';
    diag.innerHTML = '<h3>Диагностика: 5 вопросов</h3>';
    const resBox = document.createElement('div');
    const wrongRecs = [];
    DIAG.forEach(function (d, i) {
      diag.appendChild(Tk.createQuiz({
        question: (i + 1) + '. ' + d.q,
        options: d.options,
        correct: d.correct,
        explain: 'Правильный ответ: «' + d.options[d.correct] + '».',
        onSolved: function (ok) {
          if (ok) Progress.set('diag-' + i, 'solved');
          else if (wrongRecs.indexOf(d.recName) < 0) wrongRecs.push(d.recName);
          renderDiagRes();
        }
      }));
    });
    function renderDiagRes() {
      const solved = Progress.countSolved(DIAG.map(function (_, i) { return 'diag-' + i; }));
      if (solved < DIAG.length) {
        resBox.innerHTML = '<div class="muted">Отвечено ' + solved + ' из ' + DIAG.length + '. Когда ответишь на все — здесь появятся рекомендации.</div>';
      } else {
        resBox.innerHTML = '<div class="msg-ok task-msg">Диагностика пройдена!</div>';
        if (wrongRecs.length) {
          resBox.innerHTML += '<p>Судя по ответам, стоит заглянуть в разделы: <b>' + wrongRecs.join('</b>, <b>') + '</b>. Остальное можно просто пролистать для уверенности.</p>';
        } else {
          resBox.innerHTML += '<p>Отличный старт! Все разделы уже знакомы — проходи их как повторение и смело иди в тренажёр.</p>';
        }
        resBox.innerHTML += '<p class="muted">Навигация всегда свободная: рекомендации — только совет.</p>';
      }
    }
    diag.appendChild(resBox);
    renderDiagRes();
    frag.appendChild(diag);
    host.appendChild(frag);
  }

  /* ---------- памятка ---------- */
  function buildMemo(host) {
    const frag = document.createDocumentFragment();
    const c = document.createElement('section');
    c.className = 'card';
    c.innerHTML = '<h3>Что спрашивают → на что смотрю → что делаю → как проверяю</h3>' +
      '<div class="table-wrap"><table><thead><tr><th>Что спрашивают</th><th>На что смотрю</th><th>Что делаю</th><th>Как проверяю</th></tr></thead><tbody>' +
      '<tr><td>Где тело?</td><td>точка на оси</td><td>читаю координату x со знаком</td><td>справа от 0 — плюс, слева — минус</td></tr>' +
      '<tr><td>Насколько сместилось?</td><td>начальная и конечная координаты</td><td>Δx = x_кон − x_нач</td><td>x_нач + Δx = x_кон; знак = направление</td></tr>' +
      '<tr><td>Куда направлено перемещение?</td><td>знак Δx</td><td>Δx > 0 — вправо; Δx < 0 — влево; Δx = 0 — нулевое</td><td>рисую стрелку от старта к финишу</td></tr>' +
      '<tr><td>Сколько всего пройдено?</td><td>все участки маршрута</td><td>s = сумма длин участков</td><td>путь ≥ |Δx|; путь не бывает отрицательным</td></tr>' +
      '<tr><td>Равномерный участок</td><td>скорость и время</td><td>Δx = v_x·Δt; s = |v_x|·Δt</td><td>единицы: м/с × с = м</td></tr>' +
      '<tr><td>График x(t)</td><td>точки на линии</td><td>подъём — вправо, спуск — влево, ровно — покой; круче — быстрее</td><td>график — не дорога и не горка</td></tr>' +
      '<tr><td>График v_x(t)</td><td>прямоугольники</td><td>путь = сумма площадей (модулей); Δx = площади со знаком</td><td>ниже оси — минус для Δx, но плюс для пути</td></tr>' +
      '</tbody></table></div>';
    frag.appendChild(c);

    const f = document.createElement('section');
    f.className = 'card';
    f.innerHTML = '<h3>Формулы</h3>' +
      '<div class="formula-box">Δx = x_кон − x_нач &nbsp;&nbsp;|&nbsp;&nbsp; s = |v_x| · Δt &nbsp;&nbsp;|&nbsp;&nbsp; Δx = v_x · Δt &nbsp;&nbsp;|&nbsp;&nbsp; Δt = t_кон − t_нач</div>' +
      '<p><b>Без разворота:</b> s = |Δx|. <b>С разворотом:</b> s = s₁ + s₂ + …, и путь больше модуля перемещения.</p>';
    frag.appendChild(f);

    const q = document.createElement('section');
    q.className = 'card';
    q.innerHTML = '<h3>Проверь себя</h3>';
    q.appendChild(Tk.createQuiz({
      question: 'Ты решаешь задачу и получила «путь = −6 м». Что это значит?',
      options: ['Так и есть: путь бывает отрицательным при движении влево', 'Ошибка: найдено изменение координаты, а путь — расстояние, он неотрицателен', 'Ошибка в единицах'],
      correct: 1,
      explain: 'Отрицательным бывает только Δx (он несёт знак направления). Путь — расстояние, «−6 м пути» не бывает. Вернись к разделу «4. Путь».',
      onSolved: function (ok) { if (ok) Progress.set('memo-quiz', 'solved'); else Progress.set('memo-quiz', 'retry'); }
    }));
    frag.appendChild(q);

    const w = document.createElement('section');
    w.className = 'card';
    w.innerHTML = '<h3>Триггеры ошибок</h3><ul class="pitfalls-list">' +
      '<li>Получился отрицательный путь → ты нашла Δx, а не путь.</li>' +
      '<li>Сложила координаты → для Δx нужно вычитание.</li>' +
      '<li>Путь равен |Δx| при развороте → пересчитай участки отдельно.</li>' +
      '<li>Перемещение 0 → это не обязательно покой: вспомни о возврате.</li>' +
      '<li>«Горка» на графике x(t) → график — не рельеф, а зависимость координаты от времени.</li>' +
      '</ul>';
    frag.appendChild(w);
    host.appendChild(frag);
  }

  /* ---------- приложение ---------- */
  const App = {
    current: 'start',
    init: function () {
      Progress.load();
      this.buildNav();
      this.main = document.getElementById('app-main');
      this.show('start');
      this.bindReset();
      this.bindTheme();
    },
    buildNav: function () {
      const nav = document.getElementById('app-nav');
      SECTIONS.forEach(function (s) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn nav-chip';
        b.textContent = s.title;
        b.dataset.target = s.id;
        b.addEventListener('click', function () { App.show(s.id); });
        nav.appendChild(b);
      });
      nav.addEventListener('click', function () {
        // закрыть меню на мобильных после выбора
        if (window.innerWidth < 720) nav.classList.remove('nav-open');
      });
      const toggle = document.querySelector('.nav-toggle');
      if (toggle) toggle.addEventListener('click', function () { nav.classList.toggle('nav-open'); });
    },
    show: function (id) {
      this.current = id;
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      this.main.innerHTML = '';
      document.querySelectorAll('.nav-chip').forEach(function (c) {
        c.classList.toggle('nav-active', c.dataset.target === id);
      });
      const title = (SECTIONS.find(function (s) { return s.id === id; }) || {}).title || '';
      const h2 = document.createElement('h2');
      h2.className = 'page-title';
      h2.textContent = title;
      this.main.appendChild(h2);

      switch (id) {
        case 'start': buildStart(this.main); break;
        case 'coord': this.main.appendChild(global.Lessons.buildCoord()); break;
        case 'delta': this.main.appendChild(global.Lessons.buildDelta()); break;
        case 'disp': this.main.appendChild(global.Lessons.buildDisp()); break;
        case 'path': this.main.appendChild(global.Lessons.buildPath()); break;
        case 'turn': this.main.appendChild(global.Lessons.buildTurn()); break;
        case 'lab': this.buildLab(); break;
        case 'uniform': this.main.appendChild(global.Lessons.buildUniform()); break;
        case 'graphx': this.main.appendChild(global.Lessons.buildGraphX()); break;
        case 'graphv': this.main.appendChild(global.Lessons.buildGraphV()); break;
        case 'trainer': global.Trainer.build(this.main); break;
        case 'explain': global.Explain.build(this.main); break;
        case 'final': global.Explain.buildFinalCheck(this.main); break;
        case 'memo': buildMemo(this.main); break;
      }

      // прогресс раздела
      const items = SECTION_ITEMS[id];
      if (items) {
        const done = Progress.countSolved(items);
        const p = document.createElement('div');
        p.className = 'section-progress muted';
        p.textContent = 'Прогресс раздела: выполнено ' + done + ' из ' + items.length + ' заданий.';
        this.main.appendChild(p);
      }

      // навигация вперёд-назад
      const idx = SECTIONS.findIndex(function (s) { return s.id === id; });
      const nav = document.createElement('div');
      nav.className = 'page-nav';
      if (idx > 0) {
        const b = Tk.mkBtn('← ' + SECTIONS[idx - 1].title, 'btn btn-ghost');
        b.addEventListener('click', function () { App.show(SECTIONS[idx - 1].id); });
        nav.appendChild(b);
      }
      if (idx < SECTIONS.length - 1) {
        const b = Tk.mkBtn(SECTIONS[idx + 1].title + ' →', 'btn btn-primary');
        b.addEventListener('click', function () { App.show(SECTIONS[idx + 1].id); });
        nav.appendChild(b);
      }
      this.main.appendChild(nav);
    },
    buildLab: function () {
      const host = document.createElement('div');
      this.main.appendChild(host);
      const intro = document.createElement('section');
      intro.className = 'card lesson-text';
      intro.innerHTML = '<h3>Лаборатория движения</h3><p>Задай условия (начальная координата и участки со скоростью и длительностью), предскажи результат, запусти анимацию и проверь себя. Курсор времени синхронно движется по оси и обоим графикам; кликни по графику, чтобы выбрать момент.</p><p class="muted">Оранжевая стрелка — перемещение (от начала выбранного промежутка к текущему положению). Зелёная лента — накопленный путь: она не «съезжает» при возвращении.</p>';
      this.main.insertBefore(intro, host);
      new global.Lab(host);
    },
    bindReset: function () {
      const btn = document.getElementById('btn-reset');
      btn.addEventListener('click', function () {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = '<h3>Сбросить прогресс?</h3><p>Будут удалены все отметки о решённых заданиях, ответы и сохранённые объяснения. Условия задач в лаборатории вернутся к исходным.</p>';
        const bar = document.createElement('div');
        bar.className = 'task-bar';
        const yes = Tk.mkBtn('Да, сбросить', 'btn btn-primary');
        const no = Tk.mkBtn('Отмена', 'btn btn-ghost');
        bar.appendChild(yes); bar.appendChild(no);
        modal.appendChild(bar);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        no.addEventListener('click', function () { overlay.remove(); });
        yes.addEventListener('click', function () {
          Progress.reset();
          overlay.remove();
          App.show(App.current);
        });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
      });
    },
    bindTheme: function () {
      const t = document.querySelector('[data-theme-toggle]');
      const r = document.documentElement;
      let d = 'light';
      try { d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'; } catch (e) {}
      const saved = Progress.raw('theme');
      if (saved === 'dark' || saved === 'light') d = saved;
      r.setAttribute('data-theme', d);
      const setIcon = function () {
        t.innerHTML = d === 'dark'
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        t.setAttribute('aria-label', d === 'dark' ? 'Светлая тема' : 'Тёмная тема');
      };
      setIcon();
      t.addEventListener('click', function () {
        d = d === 'dark' ? 'light' : 'dark';
        r.setAttribute('data-theme', d);
        Progress.setRaw('theme', d);
        setIcon();
      });
    }
  };

  document.addEventListener('DOMContentLoaded', function () { App.init(); });
  global.App = App;
})(typeof window !== 'undefined' ? window : globalThis);
