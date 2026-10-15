/* ============================================================
   Графики: x(t) и v_x(t). SVG, синхронный курсор времени,
   клик/перетаскивание выбирает момент времени.
   ============================================================ */
(function (global) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const M = global.Motion;

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVGNS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, str, cls, anchor) {
    const t = el('text', { x: x, y: y, 'text-anchor': anchor || 'start', class: cls || '' }, parent);
    t.textContent = str;
    return t;
  }
  function niceStep(range, target) {
    if (range <= 0) return 1;
    const raw = range / Math.max(1, target);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) {
      if (raw <= m * mag) return m * mag;
    }
    return 10 * mag;
  }

  /* ---------- График x(t) ---------- */
  class XtChart {
    constructor(opts) {
      this.opts = opts || {};
      this.W = opts.width || (global.Charts.isCompact() ? 420 : 640); this.H = opts.height || 300;
      this.padL = 58; this.padR = 18; this.padT = 18; this.padB = 42;
      this.model = null;
      this.svg = null;
      this.cursorG = null;
    }
    setModel(model) { this.model = model; this.render(); }
    render() {
      const host = this.opts.host;
      host.innerHTML = '';
      const svg = this.svg = el('svg', { viewBox: '0 0 ' + this.W + ' ' + this.H, class: 'chart', role: 'img', 'aria-label': 'График координаты x(t)' }, host);
      const m = this.model;
      const T = Math.max(m.totalTime, 1e-9);
      const xspan = Math.max(m.maxX - m.minX, 1e-9);
      const xlo = m.minX - xspan * 0.08, xhi = m.maxX + xspan * 0.08;
      const px = (t) => this.padL + (t / T) * (this.W - this.padL - this.padR);
      const py = (x) => this.H - this.padB - ((x - xlo) / (xhi - xlo)) * (this.H - this.padT - this.padB);

      // сетка по времени
      const tStep = niceStep(T, 8);
      for (let t = 0; t <= T + 1e-9; t += tStep) {
        const X = px(t);
        el('line', { x1: X, y1: this.padT, x2: X, y2: this.H - this.padB, class: 'grid' }, svg);
        txt(svg, X, this.H - this.padB + 18, M.fmtNum(t, 1), 'tick', 'middle');
      }
      txt(svg, this.W - this.padR, this.H - 6, 't, с', 'axis-label', 'end');
      // сетка по координате
      const xStep = niceStep(xhi - xlo, 5);
      for (let x = Math.ceil(xlo / xStep) * xStep; x <= xhi + 1e-9; x += xStep) {
        const Y = py(x);
        el('line', { x1: this.padL, y1: Y, x2: this.W - this.padR, y2: Y, class: 'grid' }, svg);
        txt(svg, this.padL - 8, Y + 4, M.fmtNum(x, 1), 'tick', 'end');
      }
      txt(svg, 10, 16, 'x, м', 'axis-label');
      // оси
      el('line', { x1: this.padL, y1: this.padT, x2: this.padL, y2: this.H - this.padB, class: 'axis' }, svg);
      el('line', { x1: this.padL, y1: this.H - this.padB, x2: this.W - this.padR, y2: this.H - this.padB, class: 'axis' }, svg);

      // ломаная x(t)
      const pts = m.marks.map(function (mk) { return px(mk.t) + ',' + py(mk.x); }).join(' ');
      el('polyline', { points: pts, class: 'xt-line' }, svg);
      // точки
      for (const mk of m.marks) {
        el('circle', { cx: px(mk.t), cy: py(mk.x), r: 4, class: 'xt-dot' }, svg);
      }
      // подписи ключевых точек
      txt(svg, px(0) + 6, py(m.marks[0].x) - 8, 'x₀ = ' + M.fmtNum(m.marks[0].x) + ' м', 'chart-note');
      const last = m.marks[m.marks.length - 1];
      txt(svg, px(last.t) - 4, py(last.x) - 8, 'x = ' + M.fmtNum(last.x) + ' м', 'chart-note', 'end');

      // курсор
      this.cursorG = el('g', {}, svg);
      this.cursorLine = el('line', { y1: this.padT, y2: this.H - this.padB, class: 'cursor-line' }, this.cursorG);
      this.cursorDot = el('circle', { r: 6, class: 'cursor-dot' }, this.cursorG);
      this.cursorTxt = txt(this.cursorG, 0, 0, '', 'cursor-txt');
      this.update(this.lastT || 0);

      // взаимодействие: выбор времени
      const self = this;
      let dragging = false;
      function tFromEvent(ev) {
        const r = svg.getBoundingClientRect();
        const xPix = (ev.clientX - r.left) * (self.W / r.width);
        return Math.max(0, Math.min(T, (xPix - self.padL) / (self.W - self.padL - self.padR) * T));
      }
      svg.addEventListener('pointerdown', function (ev) {
        dragging = true; svg.setPointerCapture(ev.pointerId);
        if (self.opts.onTimeSelected) self.opts.onTimeSelected(tFromEvent(ev));
      });
      svg.addEventListener('pointermove', function (ev) {
        if (dragging && self.opts.onTimeSelected) self.opts.onTimeSelected(tFromEvent(ev));
      });
      svg.addEventListener('pointerup', function () { dragging = false; });
    }
    update(t) {
      this.lastT = t;
      if (!this.model || !this.svg) return;
      const T = Math.max(this.model.totalTime, 1e-9);
      const xspan = Math.max(this.model.maxX - this.model.minX, 1e-9);
      const xlo = this.model.minX - xspan * 0.08, xhi = this.model.maxX + xspan * 0.08;
      const px = (tt) => this.padL + (tt / T) * (this.W - this.padL - this.padR);
      const py = (x) => this.H - this.padB - ((x - xlo) / (xhi - xlo)) * (this.H - this.padT - this.padB);
      const st = M.stateAt(this.model, t);
      const X = px(st.t);
      this.cursorLine.setAttribute('x1', X); this.cursorLine.setAttribute('x2', X);
      this.cursorDot.setAttribute('cx', X); this.cursorDot.setAttribute('cy', py(st.x));
      this.cursorTxt.setAttribute('x', Math.min(X + 8, this.W - this.padR - 150));
      this.cursorTxt.setAttribute('y', this.padT + 14);
      this.cursorTxt.textContent = 't = ' + M.fmtNum(st.t, 1) + ' с; x = ' + M.fmtNum(st.x) + ' м';
    }
  }

  /* ---------- График v_x(t) ---------- */
  class VtChart {
    constructor(opts) {
      this.opts = opts || {};
      this.W = opts.width || (global.Charts.isCompact() ? 420 : 640); this.H = opts.height || 300;
      this.padL = 58; this.padR = 18; this.padT = 18; this.padB = 42;
      this.module = false;
      this.model = null;
    }
    setModel(model, module) {
      this.model = model;
      if (module !== undefined) this.module = module;
      this.render();
    }
    render() {
      const host = this.opts.host;
      host.innerHTML = '';
      const svg = this.svg = el('svg', { viewBox: '0 0 ' + this.W + ' ' + this.H, class: 'chart', role: 'img', 'aria-label': this.module ? 'График модуля скорости' : 'График скорости v_x(t)' }, host);
      const m = this.model;
      const T = Math.max(m.totalTime, 1e-9);
      let vlo = 0, vhi = 0;
      for (const s of m.segments) {
        const v = this.module ? Math.abs(s.vx) : s.vx;
        vlo = Math.min(vlo, v); vhi = Math.max(vhi, v);
      }
      if (vhi - vlo < 1e-9) { vhi = 1; vlo = 0; }
      const vpad = (vhi - vlo) * 0.15;
      vlo -= vpad; vhi += vpad;
      if (!this.module && vlo > 0) vlo = 0;
      if (vhi < 0) vhi = 0;
      const px = (t) => this.padL + (t / T) * (this.W - this.padL - this.padR);
      const py = (v) => this.H - this.padB - ((v - vlo) / (vhi - vlo)) * (this.H - this.padT - this.padB);
      const y0 = py(0);

      // сетка по времени
      const tStep = niceStep(T, 8);
      for (let t = 0; t <= T + 1e-9; t += tStep) {
        const X = px(t);
        el('line', { x1: X, y1: this.padT, x2: X, y2: this.H - this.padB, class: 'grid' }, svg);
        txt(svg, X, this.H - this.padB + 18, M.fmtNum(t, 1), 'tick', 'middle');
      }
      txt(svg, this.W - this.padR, this.H - 6, 't, с', 'axis-label', 'end');
      // сетка по скорости
      const vStep = niceStep(vhi - vlo, 5);
      for (let v = Math.ceil(vlo / vStep) * vStep; v <= vhi + 1e-9; v += vStep) {
        const Y = py(v);
        el('line', { x1: this.padL, y1: Y, x2: this.W - this.padR, y2: Y, class: Math.abs(v) < 1e-9 ? 'axis' : 'grid' }, svg);
        txt(svg, this.padL - 8, Y + 4, M.fmtNum(v, 1), 'tick', 'end');
      }
      txt(svg, 10, 16, this.module ? '|v_x|, м/с' : 'v_x, м/с', 'axis-label');

      // прямоугольники площадей: соседние участки с одинаковой скоростью
      // объединяем в один диапазон, чтобы подписи не наезжали друг на друга
      const ranges = [];
      for (const seg of m.segments) {
        if (seg.dt <= 1e-9) continue;
        const v = this.module ? Math.abs(seg.vx) : seg.vx;
        const last = ranges[ranges.length - 1];
        if (last && Math.abs(last.v - v) < 1e-9) last.t1 = seg.t1;
        else ranges.push({ v: v, t0: seg.t0, t1: seg.t1 });
      }
      for (const rg of ranges) {
        const x1 = px(rg.t0), x2 = px(rg.t1);
        const yTop = py(Math.max(rg.v, 0)), yBot = py(Math.min(rg.v, 0));
        const isPos = (this.module ? true : rg.v >= 0);
        el('rect', {
          x: x1, y: yTop, width: Math.max(x2 - x1, 0), height: Math.max(yBot - yTop, 0),
          class: isPos ? 'vt-rect-pos' : 'vt-rect-neg'
        }, svg);
        // подпись площади
        const areaTxt = (this.module ? 's = ' : 'площадь = ') + M.fmtNum(Math.abs(rg.v)) + ' м/с × ' + M.fmtNum(rg.t1 - rg.t0, 1) + ' с = ' + M.fmtNum(Math.abs(rg.v) * (rg.t1 - rg.t0)) + ' м';
        if (x2 - x1 > 60) {
          txt(svg, (x1 + x2) / 2, (isPos ? yTop + 16 : yBot - 8), areaTxt, 'area-label', 'middle');
        }
      }
      // ступенчатая линия
      for (const seg of m.segments) {
        const v = this.module ? Math.abs(seg.vx) : seg.vx;
        el('line', { x1: px(seg.t0), y1: py(v), x2: px(seg.t1), y2: py(v), class: 'vt-line' }, svg);
      }
      for (let i = 1; i < m.segments.length; i++) {
        const prev = m.segments[i - 1], cur = m.segments[i];
        const v1 = this.module ? Math.abs(prev.vx) : prev.vx;
        const v2 = this.module ? Math.abs(cur.vx) : cur.vx;
        el('line', { x1: px(prev.t1), y1: py(v1), x2: px(prev.t1), y2: py(v2), class: 'vt-step' }, svg);
      }

      // курсор
      this.cursorG = el('g', {}, svg);
      this.cursorLine = el('line', { y1: this.padT, y2: this.H - this.padB, class: 'cursor-line' }, this.cursorG);
      this.cursorTxt = txt(this.cursorG, 0, 0, '', 'cursor-txt');
      this.update(this.lastT || 0);

      const self = this;
      let dragging = false;
      function tFromEvent(ev) {
        const r = svg.getBoundingClientRect();
        const xPix = (ev.clientX - r.left) * (self.W / r.width);
        return Math.max(0, Math.min(T, (xPix - self.padL) / (self.W - self.padL - self.padR) * T));
      }
      svg.addEventListener('pointerdown', function (ev) {
        dragging = true; svg.setPointerCapture(ev.pointerId);
        if (self.opts.onTimeSelected) self.opts.onTimeSelected(tFromEvent(ev));
      });
      svg.addEventListener('pointermove', function (ev) {
        if (dragging && self.opts.onTimeSelected) self.opts.onTimeSelected(tFromEvent(ev));
      });
      svg.addEventListener('pointerup', function () { dragging = false; });
    }
    update(t) {
      this.lastT = t;
      if (!this.model || !this.svg) return;
      const T = Math.max(this.model.totalTime, 1e-9);
      const X = this.padL + (t / T) * (this.W - this.padL - this.padR);
      this.cursorLine.setAttribute('x1', X); this.cursorLine.setAttribute('x2', X);
      const st = M.stateAt(this.model, t);
      const v = this.module ? Math.abs(st.vx) : st.vx;
      this.cursorTxt.setAttribute('x', Math.min(X + 8, this.W - this.padR - 120));
      this.cursorTxt.setAttribute('y', this.padT + 14);
      this.cursorTxt.textContent = 't = ' + M.fmtNum(t, 1) + ' с; v = ' + M.fmtNum(v) + ' м/с';
    }
  }

  global.Charts = {
    XtChart: XtChart, VtChart: VtChart, niceStep: niceStep,
    /* Компактный режим для телефонов: уже viewBox + крупнее шрифты. */
    isCompact: function () { return (typeof window !== 'undefined' && window.innerWidth < 760); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
