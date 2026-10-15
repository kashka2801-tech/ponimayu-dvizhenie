/* ============================================================
   Общие строительные блоки заданий:
   — форма с числовыми полями, проверкой, подсказками (3 уровня),
     решением и разбором типичных ошибок;
   — вопросы с выбором ответа;
   — самопроверка по критериям (без имитации понимания текста).
   ============================================================ */
(function (global) {
  'use strict';
  const M = global.Motion;

  /* ---------- сообщение об ошибке по классу ---------- */
  function fieldFeedback(field, res) {
    switch (res.status) {
      case 'empty':
        return 'Поле «' + field.label + '» пустое. Пустое поле — это не ноль: введи число.';
      case 'negpath':
        return 'Проверь: ты сейчас нашла всё пройденное расстояние или изменение координаты? Путь — это расстояние, он не бывает отрицательным.';
      case 'sign':
        return 'Число верное по модулю, но со знаком. Проверь порядок вычитания: из конечной координаты вычитаем начальную (x_кон − x_нач), а не наоборот.';
      case 'sum':
        return 'Похоже, ты сложила координаты. Нас интересует не сумма положений, а то, насколько конечное положение отличается от начального.';
      case 'confused':
        return 'Похоже, это модуль перемещения (изменение координаты), а спрашивали путь. Вспомни: если были развороты, путь складывается из длин всех пройденных участков.';
      case 'dispInsteadOfPath':
        return 'Это изменение координаты. А путь — всё пройденное расстояние: сложи длины всех участков по отдельности.';
      case 'unit':
        return 'Число похоже на верное, но проверь единицы: ' + field.label + ' измеряется в «' + field.unit + '».';
      default:
        return 'Пока не сходится. Попробуй подсказку — она не выдаст ответ, но направит.';
    }
  }

  /* ---------- числовая форма ---------- */
  /*
    spec = {
      id: 'id-задания',
      title: 'Тренировочное задание',
      intro: 'текст условия (HTML)',
      fields: [{
        key, label, unit, expected, tol,
        kind: 'path'|'dx'|'coord'|'time'|'vel',
        units: ['м','м/с','с'] (опц. — выбор единиц),
        traps: { sum: число, disp: число } (опц.)
      }],
      hints: ['вопрос-направление', 'намёк на рисунок/действие', 'разбор по шагам'],
      solution: 'HTML разбора',
      onStatus: function(status) // 'solved'|'hint'|'viewed'
    }
  */
  function createTaskForm(spec) {
    const wrap = document.createElement('div');
    wrap.className = 'task-card';
    if (spec.title) {
      const h = document.createElement('div');
      h.className = 'task-title';
      h.textContent = spec.title;
      wrap.appendChild(h);
    }
    if (spec.intro) {
      const intro = document.createElement('div');
      intro.className = 'task-intro';
      intro.innerHTML = spec.intro;
      wrap.appendChild(intro);
    }
    if (spec.figure) wrap.appendChild(spec.figure);

    const fieldsWrap = document.createElement('div');
    fieldsWrap.className = 'task-fields';
    const inputs = [];
    (spec.fields || []).forEach(function (f) {
      const row = document.createElement('div');
      row.className = 'task-field';
      const lab = document.createElement('label');
      lab.className = 'task-field-label';
      lab.textContent = f.label + (f.unit && !f.units ? ' (' + f.unit + ')' : '');
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'decimal';
      input.autocomplete = 'off';
      input.placeholder = 'например, 4 или 4,5';
      input.setAttribute('aria-label', f.label);
      row.appendChild(lab);
      const ctrl = document.createElement('div');
      ctrl.className = 'task-field-ctrl';
      ctrl.appendChild(input);
      if (f.units) {
        const sel = document.createElement('select');
        sel.className = 'unit-select';
        sel.setAttribute('aria-label', 'Единицы: ' + f.label);
        f.units.forEach(function (u) {
          const o = document.createElement('option');
          o.value = u; o.textContent = u;
          sel.appendChild(o);
        });
        ctrl.appendChild(sel);
        input._unitSel = sel;
      }
      row.appendChild(ctrl);
      fieldsWrap.appendChild(row);
      inputs.push({ field: f, input: input });
    });
    wrap.appendChild(fieldsWrap);

    // кнопки и сообщения
    const bar = document.createElement('div');
    bar.className = 'task-bar';
    const checkBtn = mkBtn('Проверить', 'btn btn-primary');
    const hintBtn = mkBtn('Подсказка', 'btn btn-ghost');
    const solBtn = mkBtn('Показать решение', 'btn btn-ghost btn-solution');
    bar.appendChild(checkBtn); bar.appendChild(hintBtn);
    if (spec.solution) bar.appendChild(solBtn);
    wrap.appendChild(bar);

    const msg = document.createElement('div');
    msg.className = 'task-msg';
    msg.setAttribute('role', 'status');
    wrap.appendChild(msg);

    const hintBox = document.createElement('div');
    hintBox.className = 'task-hints';
    wrap.appendChild(hintBox);

    const solBox = document.createElement('div');
    solBox.className = 'task-solution';
    solBox.hidden = true;
    if (spec.solution) solBox.innerHTML = spec.solution;
    wrap.appendChild(solBox);

    const st = { wrongAttempts: 0, hintLevel: 0, hintUsed: false, solutionViewed: false, solved: false };

    function unitOf(inp) {
      return inp._unitSel ? inp._unitSel.value : null;
    }
    function checkField(f, raw, unit) {
      const v = M.parseNum(raw);
      if (v === null) return { status: 'empty' };
      if (f.units && unit && unit !== f.unit) return { status: 'unit' };
      if (Math.abs(v - f.expected) <= (f.tol !== undefined ? f.tol : 0.011)) return { status: 'ok' };
      if (f.kind === 'path' && v < 0) return { status: 'negpath' };
      if (f.expected !== 0 && Math.abs(Math.abs(v) - Math.abs(f.expected)) <= 0.011) return { status: 'sign' };
      if (f.traps) {
        if (f.traps.sum !== undefined && Math.abs(v - f.traps.sum) <= 0.011) return { status: 'sum' };
        if (f.traps.disp !== undefined && Math.abs(v - f.traps.disp) <= 0.011) return { status: 'confused' };
        if (f.traps.dx !== undefined && Math.abs(v - f.traps.dx) <= 0.011) return { status: 'dispInsteadOfPath' };
      }
      return { status: 'wrong', got: v };
    }

    function reportStatus() {
      if (spec.onStatus) spec.onStatus('solved');
    }

    function check() {
      if (st.solved) return;
      let allOk = true;
      let firstProblem = null;
      inputs.forEach(function (it) {
        it.input.classList.remove('input-error');
        const res = checkField(it.field, it.input.value, unitOf(it.input));
        if (res.status !== 'ok') {
          allOk = false;
          if (!firstProblem) {
            firstProblem = { it: it, res: res };
            it.input.classList.add('input-error');
          }
        }
      });
      if (allOk) {
        st.solved = true;
        msg.className = 'task-msg msg-ok';
        msg.textContent = 'Верно! ' + (spec.okNote || 'Все величины найдены правильно.');
        hintBtn.disabled = true;
        reportStatus();
        return;
      }
      st.wrongAttempts++;
      msg.className = 'task-msg msg-err';
      msg.textContent = fieldFeedback(firstProblem.it.field, firstProblem.res);
      if (spec.onStatus) spec.onStatus('retry');
      // после первой ошибки — направляющий вопрос (уровень 1), без ответа
      if (st.hintLevel === 0 && spec.hints && spec.hints.length) {
        showHint();
      }
    }

    function showHint() {
      if (!spec.hints || !spec.hints.length || st.hintLevel >= spec.hints.length) return;
      const level = st.hintLevel + 1;
      const div = document.createElement('div');
      div.className = 'hint hint-level-' + level;
      div.innerHTML = '<span class="hint-tag">Подсказка ' + level + ' из ' + spec.hints.length + '</span> ' + spec.hints[st.hintLevel];
      hintBox.appendChild(div);
      st.hintLevel++;
      st.hintUsed = true;
      if (spec.onStatus) spec.onStatus('hint');
      if (st.hintLevel >= spec.hints.length) hintBtn.disabled = true;
    }

    checkBtn.addEventListener('click', check);
    inputs.forEach(function (it) {
      it.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
    });
    hintBtn.addEventListener('click', showHint);
    if (spec.solution) {
      solBtn.addEventListener('click', function () {
        solBox.hidden = false;
        solBtn.disabled = true;
        if (!st.solved && spec.onStatus) spec.onStatus('viewed');
      });
    }
    return wrap;
  }

  /* ---------- вопрос с выбором ответа ---------- */
  /*
    spec = { question, options: [], correct: index, explain: 'текст после ответа',
             randomize: bool, onSolved: function(firstTry) }
  */
  function createQuiz(spec) {
    const wrap = document.createElement('div');
    wrap.className = 'quiz-card';
    const q = document.createElement('div');
    q.className = 'quiz-question';
    q.innerHTML = spec.question;
    wrap.appendChild(q);
    let idxs = spec.options.map(function (_, i) { return i; });
    if (spec.randomize) {
      for (let i = idxs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = idxs[i]; idxs[i] = idxs[j]; idxs[j] = tmp;
      }
    }
    const fb = document.createElement('div');
    fb.className = 'quiz-feedback';
    fb.setAttribute('role', 'status');
    let answered = false;
    let wrongTries = 0;
    idxs.forEach(function (optIdx, pos) {
      const b = mkBtn(spec.options[optIdx], 'btn btn-option');
      b.addEventListener('click', function () {
        if (answered) return;
        if (optIdx === spec.correct) {
          answered = true;
          b.classList.add('option-correct');
          wrap.querySelectorAll('.btn-option').forEach(function (x) { x.disabled = true; });
          fb.className = 'quiz-feedback msg-ok';
          fb.innerHTML = 'Верно! ' + (spec.explain || '');
          if (spec.onSolved) spec.onSolved(true, wrongTries === 0);
        } else {
          wrongTries++;
          b.classList.add('option-wrong');
          b.disabled = true;
          fb.className = 'quiz-feedback msg-err';
          fb.innerHTML = spec.wrongExplain || 'Пока неверно. Подумай ещё и попробуй другой вариант.';
          if (spec.onSolved) spec.onSolved(false, false);
        }
      });
      wrap.appendChild(b);
    });
    wrap.appendChild(fb);
    return wrap;
  }

  /* ---------- самопроверка по критериям (честная, без «ИИ») ---------- */
  function createSelfCheck(spec) {
    // spec: { prompt, criteria, sample, pitfalls, onDone }
    const wrap = document.createElement('div');
    wrap.className = 'selfcheck-card';
    const ta = document.createElement('textarea');
    ta.className = 'selfcheck-text';
    ta.rows = 4;
    ta.placeholder = spec.placeholder || 'Ответь своими словами…';
    const note = document.createElement('div');
    note.className = 'muted small';
    note.textContent = 'Свободный текст программа не оценивает автоматически: сначала ответь сама, потом честно сверься с критериями.';
    // шаг 1: зафиксировать ответ
    const answerBtn = mkBtn('Готово — я ответила', 'btn btn-primary');
    answerBtn.disabled = true;
    ta.addEventListener('input', function () { answerBtn.disabled = ta.value.trim().length === 0; });
    // шаг 2 (после ответа): критерии + образец
    const out = document.createElement('div');
    out.hidden = true;
    // шаг 3: подтвердить сверку
    const checkBtn = mkBtn('Я сверила по критериям', 'btn btn-primary');
    checkBtn.hidden = true;
    checkBtn.disabled = true;
    answerBtn.addEventListener('click', function () {
      answerBtn.disabled = true;
      if (spec.onDone) spec.onDone('answered');
      out.hidden = false;
      checkBtn.hidden = false;
    });
    out.innerHTML = '';
    if (spec.criteria) {
      const h = document.createElement('div');
      h.className = 'selfcheck-h';
      h.textContent = 'Проверь свой ответ по пунктам:';
      const ul = document.createElement('ul');
      ul.className = 'criteria-list';
      spec.criteria.forEach(function (c) {
        const li = document.createElement('li');
        const cb = document.createElement('input'); cb.type = 'checkbox';
        const sp = document.createElement('span'); sp.textContent = c;
        cb.addEventListener('change', function () {
          const n = ul.querySelectorAll('input[type=checkbox]:checked').length;
          checkBtn.disabled = n === 0;
        });
        li.appendChild(cb); li.appendChild(sp);
        ul.appendChild(li);
      });
      out.appendChild(h); out.appendChild(ul);
    }
    if (spec.sample) {
      const sh = document.createElement('div');
      sh.className = 'selfcheck-h';
      sh.textContent = 'Короткий образец:';
      const sm = document.createElement('div');
      sm.className = 'sample-text';
      sm.innerHTML = spec.sample;
      out.appendChild(sh); out.appendChild(sm);
    }
    if (spec.pitfalls) {
      const ph = document.createElement('div');
      ph.className = 'selfcheck-h';
      ph.textContent = 'Типичные неточности:';
      const ul2 = document.createElement('ul');
      ul2.className = 'pitfalls-list';
      spec.pitfalls.forEach(function (p) {
        const li = document.createElement('li'); li.textContent = p;
        ul2.appendChild(li);
      });
      out.appendChild(ph); out.appendChild(ul2);
    }
    checkBtn.addEventListener('click', function () {
      checkBtn.disabled = true;
      if (spec.onDone) spec.onDone('solved');
    });
    wrap.appendChild(ta);
    wrap.appendChild(note);
    wrap.appendChild(answerBtn);
    wrap.appendChild(out);
    wrap.appendChild(checkBtn);
    return wrap;
  }

  function mkBtn(label, cls) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls || 'btn';
    b.textContent = label;
    return b;
  }

  global.Tasks = {
    createTaskForm: createTaskForm,
    createQuiz: createQuiz,
    createSelfCheck: createSelfCheck,
    mkBtn: mkBtn
  };
})(typeof window !== 'undefined' ? window : globalThis);
