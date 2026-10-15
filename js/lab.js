/* ============================================================
   Лаборатория движения — основная интерактивная модель.
   Ось X, тело, вектор перемещения, лента пути, анимация,
   графики x(t) и v_x(t) с общим курсором времени.
   ============================================================ */
(function (global) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const M = global.Motion;
  const T = global.Tasks;

  const PRESETS = [
    { key: 'right', name: 'Вправо', x0: 0, segs: [{ vx: 2, dt: 5 }] },
    { key: 'left', name: 'Влево', x0: 2, segs: [{ vx: -2, dt: 5 }] },
    { key: 'turn', name: 'С разворотом', x0: 3, segs: [{ vx: 2, dt: 4 }, { vx: -2, dt: 3 }] },
    { key: 'return', name: 'Возвращение в начало', x0: 0, segs: [{ vx: 3, dt: 2 }, { vx: -3, dt: 2 }] },
    { key: 'stop', name: 'С остановкой', x0: 0, segs: [{ vx: 2, dt: 3 }, { vx: 0, dt: 2 }, { vx: 2, dt: 3 }] },
    { key: 'rest', name: 'Тело стоит', x0: 5, segs: [{ vx: 0, dt: 6 }] }
  ];

  class Lab {
    constructor(host) {
      this.host = host;
      this.host.classList.add('lab');
      this.t = 0;              // физическое время
      this.playing = false;
      this.tempo = 1;          // темп анимации
      this.ta = 0; this.tb = 0;
      this.model = null;
      this.lastFrame = null;
      this.buildDOM();
      this.applyPreset('turn');
    }

    /* ---------- DOM ---------- */
    buildDOM() {
      const self = this;

      /* --- панель условий --- */
      const cfg = document.createElement('section');
      cfg.className = 'card lab-config';
      cfg.innerHTML = '<h3>Условия движения</h3>';
      const x0row = document.createElement('div');
      x0row.className = 'lab-row';
      x0row.innerHTML = '<label>Начальная координата x₀, м</label>';
      this.x0Input = document.createElement('input');
      this.x0Input.type = 'text'; this.x0Input.inputMode = 'decimal';
      x0row.appendChild(this.x0Input);
      cfg.appendChild(x0row);
      this.x0Input.addEventListener('change', function () { self.readConfig(); });

      this.segList = document.createElement('div');
      this.segList.className = 'lab-segments';
      cfg.appendChild(this.segList);

      const addBtn = T.mkBtn('+ добавить участок', 'btn btn-ghost');
      addBtn.addEventListener('click', function () {
        if (self.segInputs.length >= 6) return;
        self.segInputs.push({ vx: 1, dt: 2 });
        self.renderSegInputs();
        self.readConfig();
      });
      const addWrap = document.createElement('div');
      addWrap.appendChild(addBtn);
      cfg.appendChild(addWrap);

      this.cfgMsg = document.createElement('div');
      this.cfgMsg.className = 'task-msg msg-err';
      this.cfgMsg.hidden = true;
      cfg.appendChild(this.cfgMsg);

      const pres = document.createElement('div');
      pres.className = 'lab-presets';
      pres.innerHTML = '<div class="muted small">Готовые сценарии:</div>';
      const presBtns = document.createElement('div');
      presBtns.className = 'preset-row';
      PRESETS.forEach(function (p) {
        const b = T.mkBtn(p.name, 'btn btn-preset');
        b.addEventListener('click', function () { self.applyPreset(p.key); });
        presBtns.appendChild(b);
      });
      pres.appendChild(presBtns);
      cfg.appendChild(pres);

      /* --- сцена с осью --- */
      const stage = document.createElement('section');
      stage.className = 'card lab-stage';
      stage.innerHTML = '<h3>Координатная ось и движение тела</h3>';
      stage.tabIndex = -1;
      stage.setAttribute('aria-label', 'Координатная ось и движение тела');
      this.stage = stage;
      this.axisHost = document.createElement('div');
      stage.appendChild(this.axisHost);

      const controls = document.createElement('div');
      controls.className = 'lab-controls';
      this.playBtn = T.mkBtn('Пуск', 'btn btn-primary');
      this.playBtn.addEventListener('click', function () { self.togglePlay(); });
      const stepBtn = T.mkBtn('Шаг +0,5 с', 'btn');
      stepBtn.addEventListener('click', function () {
        self.pause();
        self.setTime(Math.min(self.model.totalTime, self.t + 0.5));
      });
      const resetBtn = T.mkBtn('Сначала', 'btn');
      resetBtn.addEventListener('click', function () { self.setTime(0); });
      controls.appendChild(this.playBtn);
      controls.appendChild(stepBtn);
      controls.appendChild(resetBtn);

      const tempoWrap = document.createElement('label');
      tempoWrap.className = 'tempo-wrap';
      this.tempoInput = document.createElement('input');
      this.tempoInput.type = 'range';
      this.tempoInput.min = '0.25'; this.tempoInput.max = '3'; this.tempoInput.step = '0.25'; this.tempoInput.value = '1';
      const tempoLbl = document.createElement('span');
      const tempoUpd = function () {
        self.tempo = parseFloat(self.tempoInput.value);
        tempoLbl.textContent = 'Темп анимации: ' + M.fmtNum(self.tempo) + '×';
      };
      this.tempoInput.addEventListener('input', tempoUpd);
      tempoWrap.appendChild(this.tempoInput);
      tempoWrap.appendChild(tempoLbl);
      tempoUpd();
      controls.appendChild(tempoWrap);
      stage.appendChild(controls);

      this.liveStats = document.createElement('div');
      this.liveStats.className = 'stat-grid';
      stage.appendChild(this.liveStats);

      this.pathBox = document.createElement('div');
      this.pathBox.className = 'path-box';
      stage.appendChild(this.pathBox);

      /* --- прогнозы --- */
      const pred = document.createElement('section');
      pred.className = 'card lab-predict';
      pred.innerHTML = '<h3>Предскажи до запуска</h3>' +
        '<div class="muted">Сначала подумай, потом запусти анимацию и проверь себя.</div>';
      this.predWrap = document.createElement('div');
      pred.appendChild(this.predWrap);
      this.host.appendChild(pred);

      /* --- промежуток --- */
      const iv = document.createElement('section');
      iv.className = 'card lab-interval';
      iv.innerHTML = '<h3>Промежуток времени</h3>';
      const ivRow = document.createElement('div');
      ivRow.className = 'lab-row lab-row-inline';
      ivRow.innerHTML = '<span>от t<sub>а</sub> =</span>';
      this.taInput = document.createElement('input');
      this.taInput.type = 'text'; this.taInput.inputMode = 'decimal';
      this.tbInput = document.createElement('input');
      this.tbInput.type = 'text'; this.tbInput.inputMode = 'decimal';
      const tbLbl = document.createElement('span'); tbLbl.textContent = 'с до tб =';
      const tbEnd = document.createElement('span'); tbEnd.textContent = 'с';
      ivRow.appendChild(this.taInput); ivRow.appendChild(tbLbl);
      ivRow.appendChild(this.tbInput); ivRow.appendChild(tbEnd);
      const ivApply = T.mkBtn('Применить', 'btn btn-ghost');
      ivApply.addEventListener('click', function () { self.readInterval(); });
      ivRow.appendChild(ivApply);
      iv.appendChild(ivRow);
      this.ivMsg = document.createElement('div');
      this.ivMsg.className = 'task-msg msg-err';
      this.ivMsg.hidden = true;
      iv.appendChild(this.ivMsg);
      this.ivStats = document.createElement('div');
      iv.appendChild(this.ivStats);
      this.host.appendChild(iv);

      /* --- графики --- */
      const chartsCard = document.createElement('section');
      chartsCard.className = 'card lab-charts';
      chartsCard.innerHTML = '<h3>Графики</h3>';
      this.xtHost = document.createElement('div');
      chartsCard.appendChild(this.xtHost);
      this.vtHost = document.createElement('div');
      const vtHead = document.createElement('div');
      vtHead.className = 'chart-head';
      vtHead.innerHTML = '<span>Скорость от времени</span>';
      this.vtToggle = T.mkBtn('Показать |v_x|', 'btn btn-ghost');
      this.vtToggle.addEventListener('click', function () {
        self.vtModule = !self.vtModule;
        self.vtToggle.textContent = self.vtModule ? 'Показать v_x со знаком' : 'Показать |v_x|';
        self.vtChart.setModel(self.model, self.vtModule);
        self.vtChart.update(self.t);
      });
      vtHead.appendChild(this.vtToggle);
      chartsCard.appendChild(vtHead);
      chartsCard.appendChild(this.vtHost);
      this.vtModule = false;

      /* --- таблица участков --- */
      const tblCard = document.createElement('section');
      tblCard.className = 'card lab-table';
      tblCard.innerHTML = '<h3>Таблица движения</h3>';
      this.tableHost = document.createElement('div');
      tblCard.appendChild(this.tableHost);

      this.host.appendChild(cfg);
      this.host.appendChild(stage);
      this.host.appendChild(chartsCard);
      this.host.appendChild(tblCard);

      this.xtChart = new global.Charts.XtChart({
        host: this.xtHost,
        onTimeSelected: function (t) { self.pause(); self.setTime(t); }
      });
      this.vtChart = new global.Charts.VtChart({
        host: this.vtHost,
        onTimeSelected: function (t) { self.pause(); self.setTime(t); }
      });
    }

    /* ---------- ввод участков ---------- */
    renderSegInputs() {
      const self = this;
      this.segList.innerHTML = '';
      this.segInputs.forEach(function (s, i) {
        const row = document.createElement('div');
        row.className = 'lab-row lab-seg-row';
        const lbl = document.createElement('span');
        lbl.textContent = 'Участок ' + (i + 1) + ': v_x =';
        const vx = document.createElement('input');
        vx.type = 'text'; vx.inputMode = 'decimal'; vx.value = M.fmtNum(s.vx);
        const mid = document.createElement('span'); mid.textContent = 'м/с, длительность';
        const dt = document.createElement('input');
        dt.type = 'text'; dt.inputMode = 'decimal'; dt.value = M.fmtNum(s.dt, 1);
        const end = document.createElement('span'); end.textContent = 'с';
        const rm = T.mkBtn('×', 'btn btn-icon');
        rm.title = 'Удалить участок';
        rm.disabled = this.segInputs.length <= 1;
        rm.addEventListener('click', function () {
          self.segInputs.splice(i, 1);
          self.renderSegInputs();
          self.readConfig();
        });
        vx.addEventListener('change', function () { self.readConfig(); });
        dt.addEventListener('change', function () { self.readConfig(); });
        row.appendChild(lbl); row.appendChild(vx); row.appendChild(mid); row.appendChild(dt); row.appendChild(end); row.appendChild(rm);
        self.segList.appendChild(row);
        s._vxEl = vx; s._dtEl = dt;
      }.bind(this));
    }

    /* ---------- чтение условий ---------- */
    readConfig() {
      const x0 = M.parseNum(this.x0Input.value);
      let ok = x0 !== null;
      const segs = [];
      this.segInputs.forEach(function (s) {
        const vx = M.parseNum(s._vxEl ? s._vxEl.value : s.vx);
        const dt = M.parseNum(s._dtEl ? s._dtEl.value : s.dt);
        if (vx === null || dt === null || dt <= 0) { ok = false; (s._dtEl || s._vxEl).classList.add('input-error'); }
        else {
          if (s._dtEl) s._dtEl.classList.remove('input-error');
          if (s._vxEl) s._vxEl.classList.remove('input-error');
          segs.push({ vx: vx, dt: dt });
          s.vx = vx; s.dt = dt;
        }
      });
      if (!ok) {
        this.cfgMsg.hidden = false;
        this.cfgMsg.textContent = 'Проверь условия: длительность каждого участка должна быть числом больше нуля, скорость — любое число (можно отрицательное и ноль).';
        return;
      }
      this.cfgMsg.hidden = true;
      this.rebuild(x0, segs);
    }

    rebuild(x0, segs) {
      this.model = M.buildModel(x0, segs);
      this.pause();
      this.t = 0;
      this.ta = 0; this.tb = this.model.totalTime;
      this.taInput.value = M.fmtNum(0); this.tbInput.value = M.fmtNum(this.model.totalTime, 1);
      this.renderAll();
      this.buildPredictions();
    }

    applyPreset(key) {
      const p = PRESETS.find(function (x) { return x.key === key; });
      this.x0Input.value = M.fmtNum(p.x0);
      this.segInputs = p.segs.map(function (s) { return { vx: s.vx, dt: s.dt }; });
      this.renderSegInputs();
      this.readConfig();
    }

    /* ---------- прогнозы ---------- */
    buildPredictions() {
      const self = this;
      this.pred = { answered: false };
      this.predWrap.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'predict-card';
      const items = [
        { key: 'dir', q: 'Куда будет направлено перемещение за весь промежуток движения?',
          opts: ['Вправо', 'Влево', 'Перемещение равно нулю'] },
        { key: 'eq', q: 'Будет ли путь равен модулю перемещения за весь промежуток?',
          opts: ['Да, равен', 'Нет, путь будет больше'] },
        { key: 'zero', q: 'Может ли перемещение стать нулевым при таких условиях?',
          opts: ['Да, может', 'Нет, не может'] }
      ];
      const selects = {};
      items.forEach(function (it) {
        const row = document.createElement('div');
        row.className = 'predict-row';
        const lab = document.createElement('div');
        lab.textContent = it.q;
        const sel = document.createElement('select');
        sel.className = 'unit-select';
        const d = document.createElement('option'); d.value = ''; d.textContent = '— выбери ответ —';
        sel.appendChild(d);
        it.opts.forEach(function (o, i) {
          const op = document.createElement('option'); op.value = i; op.textContent = o;
          sel.appendChild(op);
        });
        row.appendChild(lab); row.appendChild(sel);
        card.appendChild(row);
        selects[it.key] = sel;
      });
      this.predSelects = selects;
      const btn = T.mkBtn('Запустить и проверить предположения', 'btn btn-primary');
      btn.addEventListener('click', function () {
        // Показываем сцену сразу, до начала движения, в том числе при повторном нажатии.
        self.stage.focus({ preventScroll: true });
        self.stage.scrollIntoView({ behavior: 'instant', block: 'start' });
        if (self.playing) return;
        self.setTime(0);
        self.play();
      });
      this.predBtn = btn;
      card.appendChild(btn);
      this.predFb = document.createElement('div');
      card.appendChild(this.predFb);
      this.predWrap.appendChild(card);
    }

    checkPredictions() {
      const m = this.model;
      const st = M.intervalStats(m, 0, m.totalTime);
      const dir = st.dx > 1e-9 ? 0 : (st.dx < -1e-9 ? 1 : 2);
      const eq = Math.abs(st.path - st.dispMag) < 1e-9;
      const turn = M.hasTurn(m, 0, m.totalTime);
      const ret = M.returnsToStart(m);
      const zero = Math.abs(st.dx) < 1e-9 || ret.yes;
      const fb = [];
      const sel = this.predSelects;
      function mark(key, correctVal, actual, good, bad) {
        const v = sel[key].value;
        if (v === '') { fb.push('<div class="predict-res">— один из ответов не выбран.</div>'); return; }
        const right = parseInt(v, 10) === correctVal;
        fb.push('<div class="predict-res ' + (right ? 'msg-ok' : 'msg-err') + '">' +
          (right ? 'Верно: ' : 'Не совсем: ') + (right ? good : bad) + '</div>');
      }
      mark('dir', dir, dir,
        'перемещение направлено ' + (dir === 0 ? 'вправо (Δx = +' : dir === 1 ? 'влево (Δx = −' : 'нулевое (Δx = 0') + (dir === 2 ? '' : M.fmtNum(Math.abs(st.dx)) + ' м') + ').',
        'смотри: Δx = x_кон − x_нач = ' + M.fmtNum(st.xb) + ' − ' + M.fmtNum(st.xa) + ' = ' + M.fmtNum(st.dx) + ' м — знак показывает направление.');
      mark('eq', eq ? 0 : 1, eq,
        eq ? 'путь равен модулю перемещения: ' + M.fmtNum(st.path) + ' м — движения без разворота.'
           : 'верно, что путь больше: путь ' + M.fmtNum(st.path) + ' м против модуля перемещения ' + M.fmtNum(st.dispMag) + ' м.',
        eq ? 'путь всё-таки равен модулю перемещения: оба по ' + M.fmtNum(st.path) + ' м — разворотов не было.'
           : 'путь (' + M.fmtNum(st.path) + ' м) больше модуля перемещения (' + M.fmtNum(st.dispMag) + ' м) — было изменение направления.');
      mark('zero', zero ? 0 : 1, zero,
        zero
          ? (Math.abs(st.dx) < 1e-9
              ? 'перемещение за весь промежуток действительно нулевое: тело вернулось в старт (или стояло).'
              : 'да: тело возвращалось в начальную точку — в момент t = ' + M.fmtNum(ret.t, 1) + ' с перемещение было нулевым.')
          : 'верно, что не станет: конечная координата ' + M.fmtNum(st.xb) + ' м, и тело по пути не возвращалось в начальную точку.',
        zero ? 'тело как раз вернулось в начальную точку — перемещение стало нулевым.'
           : 'нет: за этот промежуток тело ни разу не вернулось в начальную точку (проверь: конечная координата ' + M.fmtNum(st.xb) + ' м ≠ начальной ' + M.fmtNum(st.xa) + ' м). Перемещение станет нулевым, только если тело вернётся в старт или будет стоять.');
      this.predFb.innerHTML = '<div class="predict-res-title">Результаты предположений:</div>' + fb.join('') +
        '<div class="muted small">Перемещение — стрелка от начального положения к конечному. Путь — вся «лента» пройденного, она не исчезает при возвращении.</div>';
    }

    /* ---------- воспроизведение ---------- */
    togglePlay() { this.playing ? this.pause() : this.play(); }
    play() {
      if (this.playing) return;
      if (!this.model) return;
      const hi = Math.max(this.ta, this.tb);
      if (this.t >= hi - 1e-9) this.t = Math.min(this.ta, this.tb); // перемотка к началу промежутка
      this.playing = true;
      this.playBtn.textContent = 'Пауза';
      this.lastFrame = null;
      const self = this;
      function frame(ts) {
        if (!self.playing) return;
        if (self.lastFrame !== null) {
          const dtReal = Math.min((ts - self.lastFrame) / 1000, 0.1);
          const hi = Math.max(self.ta, self.tb);
          self.t = Math.min(hi, self.t + dtReal * self.tempo);
          if (self.t >= hi - 1e-9) {
            self.t = hi;
            self.pause();
            // прогнозы проверяем только при просмотре всего движения
            if (hi >= self.model.totalTime - 1e-9) self.checkPredictions();
          }
          self.updateViews();
        }
        self.lastFrame = ts;
        if (self.playing) self._raf = requestAnimationFrame(frame);
      }
      this._raf = requestAnimationFrame(frame);
    }
    pause() {
      this.playing = false;
      this.playBtn.textContent = 'Пуск';
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    }
    setTime(t) {
      const lo = Math.min(this.ta, this.tb);
      const hi = Math.max(this.ta, this.tb);
      this.t = Math.max(lo, Math.min(hi, t));
      this.updateViews();
    }

    readInterval() {
      const ta = M.parseNum(this.taInput.value);
      const tb = M.parseNum(this.tbInput.value);
      if (ta === null || tb === null || ta < 0 || tb > this.model.totalTime + 1e-9 || tb < ta) {
        this.ivMsg.hidden = false;
        this.ivMsg.textContent = 'Промежуток задан неверно: нужно 0 ≤ t_а ≤ t_б ≤ ' + M.fmtNum(this.model.totalTime, 1) + ' с.';
        return;
      }
      this.ivMsg.hidden = true;
      this.ta = Math.max(0, ta); this.tb = Math.min(this.model.totalTime, tb);
      // просмотр «живёт» внутри выбранного промежутка
      this.pause();
      this.setTime(Math.min(Math.max(this.t, this.ta), this.tb));
      this.renderIntervalStats();
      this.renderAxis();
    }

    /* ---------- отрисовка ---------- */
    renderAll() {
      this.renderAxis();
      this.renderLiveStats();
      this.renderPathBox();
      this.renderIntervalStats();
      this.renderTable();
      this.xtChart.setModel(this.model);
      this.vtChart.setModel(this.model, this.vtModule);
      this.xtChart.update(this.t);
      this.vtChart.update(this.t);
    }
    updateViews() {
      this.renderAxis();
      this.renderLiveStats();
      this.renderPathBox();
      this.xtChart.update(this.t);
      this.vtChart.update(this.t);
      // если курсор внутри промежутка, статистика промежутка не меняется
    }

    renderAxis() {
      const host = this.axisHost;
      host.innerHTML = '';
      const compact = global.Charts.isCompact();
      const W = compact ? 440 : 660, H = 190, padL = 40, padR = 30;
      const cy = 70;
      const svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('class', 'axis-svg' + (compact ? ' svg-compact' : ''));
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Координатная ось с телом');
      const m = this.model;
      const span = Math.max(m.maxX - m.minX, 2);
      const xlo = Math.min(m.minX - span * 0.12, 0);
      const xhi = Math.max(m.maxX + span * 0.12, 0);
      const px = (x) => padL + ((x - xlo) / (xhi - xlo)) * (W - padL - padR);

      // положительное направление
      const dirArrow = document.createElementNS(SVGNS, 'line');
      dirArrow.setAttribute('x1', W - padR); dirArrow.setAttribute('y1', cy);
      dirArrow.setAttribute('x2', W - padR + 14); dirArrow.setAttribute('y2', cy);
      dirArrow.setAttribute('class', 'axis');
      svg.appendChild(dirArrow);
      const dirHead = document.createElementNS(SVGNS, 'path');
      dirHead.setAttribute('d', 'M ' + (W - padR + 20) + ' ' + cy + ' l -9 -4 v 8 z');
      dirHead.setAttribute('class', 'axis-head');
      svg.appendChild(dirHead);
      const dirTxt = document.createElementNS(SVGNS, 'text');
      dirTxt.setAttribute('x', padL + 96); dirTxt.setAttribute('y', cy - 14);
      dirTxt.setAttribute('class', 'axis-label'); dirTxt.textContent = 'X → (положительное направление)';
      svg.appendChild(dirTxt);

      // ось
      const axis = document.createElementNS(SVGNS, 'line');
      axis.setAttribute('x1', padL); axis.setAttribute('y1', cy);
      axis.setAttribute('x2', W - padR); axis.setAttribute('y2', cy);
      axis.setAttribute('class', 'axis');
      svg.appendChild(axis);

      // деления
      const step = global.Charts.niceStep(xhi - xlo, 11);
      for (let x = Math.ceil(xlo / step) * step; x <= xhi + 1e-9; x += step) {
        const X = px(x);
        const tick = document.createElementNS(SVGNS, 'line');
        tick.setAttribute('x1', X); tick.setAttribute('y1', cy - 5);
        tick.setAttribute('x2', X); tick.setAttribute('y2', cy + 5);
        tick.setAttribute('class', 'tickline');
        svg.appendChild(tick);
        const lbl = document.createElementNS(SVGNS, 'text');
        lbl.setAttribute('x', X); lbl.setAttribute('y', cy + 22);
        lbl.setAttribute('text-anchor', 'middle');
        lbl.setAttribute('class', 'tick');
        lbl.textContent = M.fmtNum(x);
        svg.appendChild(lbl);
      }
      const unitTxt = document.createElementNS(SVGNS, 'text');
      unitTxt.setAttribute('x', padL - 24); unitTxt.setAttribute('y', cy + 26);
      unitTxt.setAttribute('class', 'axis-label'); unitTxt.textContent = 'м';
      svg.appendChild(unitTxt);

      // положение в начале промежутка и текущее
      const xa = M.stateAt(m, this.ta).x;
      const xt = M.stateAt(m, this.t).x;
      const xb = xt;

      // маркер начальной точки промежутка
      const startMark = document.createElementNS(SVGNS, 'circle');
      startMark.setAttribute('cx', px(xa)); startMark.setAttribute('cy', cy);
      startMark.setAttribute('r', 4); startMark.setAttribute('class', 'start-dot');
      svg.appendChild(startMark);

      // вектор перемещения (одна стрелка от начала к текущему положению)
      if (Math.abs(xb - xa) > 1e-9) {
        const arrow = document.createElementNS(SVGNS, 'line');
        arrow.setAttribute('x1', px(xa)); arrow.setAttribute('y1', cy - 26);
        arrow.setAttribute('x2', px(xb)); arrow.setAttribute('y2', cy - 26);
        arrow.setAttribute('class', 'disp-arrow');
        svg.appendChild(arrow);
        const head = document.createElementNS(SVGNS, 'path');
        const sgn = xb > xa ? 1 : -1;
        head.setAttribute('d', 'M ' + px(xb) + ' ' + (cy - 26) + ' l ' + (-sgn * 10) + ' -4.5 v 9 z');
        head.setAttribute('class', 'disp-arrow-head');
        svg.appendChild(head);
        const albl = document.createElementNS(SVGNS, 'text');
        const amid = Math.max(Math.min((px(xa) + px(xb)) / 2, W - padR - 120), padL + 120);
        albl.setAttribute('x', amid); albl.setAttribute('y', cy - 30);
        albl.setAttribute('text-anchor', 'middle');
        albl.setAttribute('class', 'disp-label');
        albl.textContent = 'перемещение Δx = ' + M.fmtNum(xb - xa) + ' м';
        svg.appendChild(albl);
      } else {
        const albl = document.createElementNS(SVGNS, 'text');
        albl.setAttribute('x', px(xa)); albl.setAttribute('y', cy - 34);
        albl.setAttribute('text-anchor', 'middle');
        albl.setAttribute('class', 'disp-label');
        albl.textContent = 'перемещение Δx = 0';
        svg.appendChild(albl);
      }

      // тело
      const body = document.createElementNS(SVGNS, 'circle');
      body.setAttribute('cx', px(xt)); body.setAttribute('cy', cy);
      body.setAttribute('r', 9); body.setAttribute('class', 'body-dot');
      svg.appendChild(body);
      const blbl = document.createElementNS(SVGNS, 'text');
      blbl.setAttribute('x', Math.max(px(xt), 90)); blbl.setAttribute('y', cy - 46);
      blbl.setAttribute('text-anchor', 'middle');
      blbl.setAttribute('class', 'body-label');
      blbl.textContent = 'тело, x = ' + M.fmtNum(xt) + ' м';
      svg.appendChild(blbl);

      // лента пути
      const ribbonY = cy + 46;
      const rLbl = document.createElementNS(SVGNS, 'text');
      rLbl.setAttribute('x', padL); rLbl.setAttribute('y', ribbonY - 6);
      rLbl.setAttribute('class', 'path-label');
      rLbl.textContent = 'лента пути (всё пройденное): ' + M.fmtNum(M.stateAt(m, this.t).L) + ' м';
      svg.appendChild(rLbl);
      const totalPath = m.segments[m.segments.length - 1].L1;
      if (totalPath > 1e-9) {
        const ribbonBg = document.createElementNS(SVGNS, 'rect');
        ribbonBg.setAttribute('x', padL); ribbonBg.setAttribute('y', ribbonY);
        ribbonBg.setAttribute('width', W - padL - padR); ribbonBg.setAttribute('height', 14);
        ribbonBg.setAttribute('rx', 7); ribbonBg.setAttribute('class', 'path-ribbon-bg');
        svg.appendChild(ribbonBg);
        const curL = M.stateAt(m, this.t).L;
        const ribbon = document.createElementNS(SVGNS, 'rect');
        ribbon.setAttribute('x', padL); ribbon.setAttribute('y', ribbonY);
        ribbon.setAttribute('width', Math.max(0, (curL / totalPath) * (W - padL - padR)));
        ribbon.setAttribute('height', 14);
        ribbon.setAttribute('rx', 7); ribbon.setAttribute('class', 'path-ribbon');
        svg.appendChild(ribbon);
      } else {
        const rNote = document.createElementNS(SVGNS, 'text');
        rNote.setAttribute('x', padL + 4); rNote.setAttribute('y', ribbonY + 11);
        rNote.setAttribute('class', 'tick');
        rNote.textContent = 'путь 0 м — тело не двигалось';
        svg.appendChild(rNote);
      }
      host.appendChild(svg);
    }

    renderLiveStats() {
      const st = M.stateAt(this.model, this.t);
      const cells = [
        { l: 'Время t', v: M.fmtNum(st.t, 1) + ' с', c: 'st-t' },
        { l: 'Координата x(t)', v: M.fmtNum(st.x) + ' м', c: 'st-x' },
        { l: 'Скорость v_x', v: M.fmtNum(st.vx) + ' м/с', c: 'st-v' },
        { l: 'Накопленный путь', v: M.fmtNum(st.L) + ' м', c: 'st-s' }
      ];
      this.liveStats.innerHTML = cells.map(function (c) {
        return '<div class="stat-cell ' + c.c + '"><div class="stat-l">' + c.l + '</div><div class="stat-v">' + c.v + '</div></div>';
      }).join('');
    }

    renderPathBox() {
      const segs = M.clippedSegments(this.model, 0, this.t);
      let html = '<div class="path-seg-title">Пройденные отрезки (каждый учитывается, даже если тело прошло участок дважды):</div>';
      if (!segs.length) html += '<div class="muted">Пока тело не двигалось.</div>';
      else {
        html += '<ol class="path-seg-list">';
        segs.forEach(function (s, i) {
          html += '<li>от ' + M.fmtNum(s.t0, 1) + ' с до ' + M.fmtNum(s.t1, 1) + ' с: ' +
            (s.vx === 0 ? 'стояло' : 'двигалось ' + (s.vx > 0 ? 'вправо' : 'влево') + ' со скоростью ' + M.fmtNum(s.vx) + ' м/с') +
            ' — пройдено ' + M.fmtNum(s.path) + ' м</li>';
        });
        html += '</ol>';
      }
      this.pathBox.innerHTML = html;
    }

    renderIntervalStats() {
      const st = M.intervalStats(this.model, this.ta, this.tb);
      const turn = M.hasTurn(this.model, this.ta, this.tb);
      let html = '<div class="stat-grid stat-grid-sm">';
      html += stat('x(tа)', M.fmtNum(st.xa) + ' м', 'st-x');
      html += stat('x(tб)', M.fmtNum(st.xb) + ' м', 'st-x');
      html += stat('Δx = x(tб) − x(tа)', M.fmtNum(st.dx) + ' м', 'st-dx');
      html += stat('Модуль перемещения |Δx|', M.fmtNum(st.dispMag) + ' м', 'st-dx');
      html += stat('Путь s', M.fmtNum(st.path) + ' м', 'st-s');
      html += stat('Смена направления', turn ? 'была' : 'не было', 'st-t');
      html += '</div>';
      const segs = st.pathSegments;
      if (segs.length) {
        html += '<div class="muted small">Путь складывается из участков:</div><ol class="path-seg-list small">';
        segs.forEach(function (s) {
          html += '<li>' + M.fmtNum(s.path) + ' м' + (s.vx === 0 ? ' (покой)' : ' (' + (s.vx > 0 ? 'вправо' : 'влево') + ', ' + M.fmtNum(Math.abs(s.vx)) + ' м/с × ' + M.fmtNum(s.dt, 1) + ' с)') + '</li>';
        });
        html += '</ol>';
      }
      this.ivStats.innerHTML = html;
      function stat(l, v, c) { return '<div class="stat-cell ' + c + '"><div class="stat-l">' + l + '</div><div class="stat-v">' + v + '</div></div>'; }
    }

    renderTable() {
      let html = '<div class="table-wrap"><table><thead><tr><th>№</th><th>t от, с</th><th>t до, с</th><th>v_x, м/с</th><th>Δx участка, м</th><th>Путь участка, м</th></tr></thead><tbody>';
      this.model.segments.forEach(function (s) {
        const dx = s.x1 - s.x0;
        const path = s.L1 - s.L0;
        html += '<tr><td>' + (s.index + 1) + '</td><td>' + M.fmtNum(s.t0, 1) + '</td><td>' + M.fmtNum(s.t1, 1) +
          '</td><td>' + M.fmtNum(s.vx) + '</td><td>' + M.fmtNum(dx) + '</td><td>' + M.fmtNum(path) + '</td></tr>';
      });
      html += '</tbody></table></div>';
      this.tableHost.innerHTML = html;
    }
  }

  global.Lab = Lab;
})(typeof window !== 'undefined' ? window : globalThis);
