document.documentElement.classList.add("js");

(function () {
      var root = document.documentElement;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* theme toggle */
      try { var saved = localStorage.getItem('theme'); if (saved) root.setAttribute('data-theme', saved); } catch (e) {}
      var tb = document.getElementById('theme');
      tb.addEventListener('click', function () {
        var cur = root.getAttribute('data-theme') ||
          (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        var next = cur === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        document.dispatchEvent(new Event('themechange'));
      });

      /* scroll progress */
      var bar = document.getElementById('bar');
      function prog() {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (h > 0 ? window.scrollY / h * 100 : 0) + '%';
      }
      window.addEventListener('scroll', prog, { passive: true }); prog();

      /* reveal + counters */
      function count(el) {
        var end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        if (reduce) { el.textContent = end; return; }
        function step(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1100, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0'; requestAnimationFrame(step);
      }
      var els = document.querySelectorAll('.reveal');
      if (!('IntersectionObserver' in window)) {
        els.forEach(function (e) { e.classList.add('show'); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add('show');
              var c = en.target.querySelector('[data-count]'); if (c) count(c);
              io.unobserve(en.target);
            }
          });
        }, { threshold: 0.12 });
        els.forEach(function (e) { io.observe(e); });
      }

    })();

(function () {
      var cv = document.getElementById('calc');
      if (!cv || !cv.getContext) return;
      var ctx = cv.getContext('2d');
      var sel = document.getElementById('calcFn');
      var rng = document.getElementById('calcX');
      var out = document.getElementById('calcOut');
      var F = {
        sin:  { f: Math.sin, d: Math.cos, x: [-6.3, 6.3], y: [-2, 2], start: 1,
                name: 'sin x', dname: 'cos x' },
        sq:   { f: function (x) { return x * x; }, d: function (x) { return 2 * x; },
                x: [-3, 3], y: [-7, 10], start: 1, name: 'xÂ²', dname: '2x' },
        cube: { f: function (x) { return x * x * x - 3 * x; }, d: function (x) { return 3 * x * x - 3; },
                x: [-2.5, 2.5], y: [-9, 16], start: 1.5, name: 'xÂ³ âˆ’ 3x', dname: '3xÂ² âˆ’ 3' }
      };
      function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
      function setup() {
        var c = F[sel.value];
        rng.min = c.x[0]; rng.max = c.x[1]; rng.value = c.start;
      }
      function draw() {
        var c = F[sel.value], a = parseFloat(rng.value);
        var W = cv.clientWidth, H = Math.max(240, Math.round(W * 0.5)), dpr = window.devicePixelRatio || 1;
        cv.style.height = H + 'px';
        cv.width = W * dpr; cv.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var text = css('--text'), muted = css('--muted'), accent = css('--accent'), line = css('--line');
        var pad = 28;
        function X(x) { return pad + (x - c.x[0]) / (c.x[1] - c.x[0]) * (W - 2 * pad); }
        function Y(y) { return H - pad - (y - c.y[0]) / (c.y[1] - c.y[0]) * (H - 2 * pad); }
        ctx.clearRect(0, 0, W, H);
        ctx.strokeStyle = line; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(W - pad, Y(0)); ctx.stroke();
        if (c.x[0] < 0 && c.x[1] > 0) { ctx.beginPath(); ctx.moveTo(X(0), pad); ctx.lineTo(X(0), H - pad); ctx.stroke(); }
        ctx.save();
        ctx.beginPath(); ctx.rect(pad, pad, W - 2 * pad, H - 2 * pad); ctx.clip();
        function plot(fn, color, w, dash) {
          ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || []);
          ctx.beginPath();
          for (var i = 0; i <= 400; i++) {
            var x = c.x[0] + (c.x[1] - c.x[0]) * i / 400;
            if (i === 0) ctx.moveTo(X(x), Y(fn(x))); else ctx.lineTo(X(x), Y(fn(x)));
          }
          ctx.stroke(); ctx.setLineDash([]);
        }
        plot(c.d, muted, 2, [6, 5]);
        plot(c.f, accent, 3);
        var fa = c.f(a), da = c.d(a);
        plot(function (x) { return fa + da * (x - a); }, text, 1.5);
        ctx.restore();
        ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(X(a), Y(fa), 6, 0, 7); ctx.fill();
        ctx.fillStyle = muted;
        if (da >= c.y[0] && da <= c.y[1]) { ctx.beginPath(); ctx.arc(X(a), Y(da), 5, 0, 7); ctx.fill(); }
        ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textBaseline = 'middle';
        var items = [[accent, 'f(x) = ' + c.name, []], [muted, "fâ€²(x) = " + c.dname, [6, 5]], [text, 'tangent at x', []]];
        items.forEach(function (it, i) {
          var y = pad + 6 + i * 18;
          ctx.strokeStyle = it[0]; ctx.lineWidth = 2.5; ctx.setLineDash(it[2]);
          ctx.beginPath(); ctx.moveTo(pad + 8, y); ctx.lineTo(pad + 34, y); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = text; ctx.fillText(it[1], pad + 42, y);
        });
        out.textContent = 'At x = ' + a.toFixed(2) + ':  f(x) = ' + fa.toFixed(2) + ',  slope fâ€²(x) = ' + da.toFixed(2);
      }
      sel.addEventListener('change', function () { setup(); draw(); });
      rng.addEventListener('input', draw);
      window.addEventListener('resize', draw);
      document.addEventListener('themechange', draw);
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', draw);
      }
      setup(); draw();
    })();

(function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
      function whenVisible(el, on, off) {
        if (!('IntersectionObserver' in window)) { on(); return; }
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) on(); else if (off) off(); });
        }).observe(el);
      }
      function ticker(el, ms, fn) {
        var id = null;
        whenVisible(el, function () { if (!id) id = setInterval(fn, ms); },
                        function () { clearInterval(id); id = null; });
      }
      function sizeCanvas(cv) {
        var dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
          cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
        }
        var c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { c: c, W: w, H: h };
      }
      function loop(cv, draw) {
        var run = false;
        function frame(t) { if (!run) return; draw(t); requestAnimationFrame(frame); }
        if (reduce) { draw(0); document.addEventListener('themechange', function () { draw(0); }); window.addEventListener('resize', function () { draw(0); }); return; }
        whenVisible(cv, function () { if (!run) { run = true; requestAnimationFrame(frame); } }, function () { run = false; });
      }

      /* 1. proof, step by step */
      var pr = document.getElementById('proof');
      if (pr) {
        var lines = pr.children, n = 0;
        var show = function (k) { for (var i = 0; i < lines.length; i++) lines[i].classList.toggle('on', i < k); };
        if (reduce) show(lines.length);
        else ticker(pr, 1100, function () { n = (n + 1) % (lines.length + 2); show(Math.min(n, lines.length)); });
      }

      /* 2. function machine */
      var fx = document.getElementById('fmx'), fy = document.getElementById('fmy');
      if (fx && !reduce) {
        var xs = [3, 4, 5, 6, 1, 2], xi = 0;
        ticker(fx, 1400, function () {
          var x = xs[xi++ % xs.length];
          fx.textContent = x; fy.textContent = x * x;
          fy.classList.remove('pop'); void fy.offsetWidth; fy.classList.add('pop');
        });
      }

      /* 3. try again until solved */
      var att = document.getElementById('att'), done = document.getElementById('done');
      if (att) {
        if (reduce) { att.textContent = '14'; done.textContent = 'print("found it!")  \u2713'; }
        else {
          var a = 1, hold = 0;
          ticker(att, 220, function () {
            if (a < 14) { a++; att.textContent = a; done.innerHTML = '&nbsp;'; }
            else if (hold < 7) { done.textContent = 'print("found it!")  \u2713'; hold++; }
            else { a = 1; hold = 0; att.textContent = 1; done.innerHTML = '&nbsp;'; }
          });
        }
      }

      /* 4. rose curve r = cos(k*theta) */
      var rose = document.getElementById('rose');
      if (rose) {
        var ks = [2, 3, 4, 5, 6, 7], ki = 0, t0 = null;
        loop(rose, function (t) {
          var o = sizeCanvas(rose), c = o.c, W = o.W, H = o.H;
          if (reduce) { t0 = 0; t = 3500; }
          if (t0 === null) t0 = t;
          var ph = t - t0;
          if (ph > 4200) { ki = (ki + 1) % ks.length; t0 = t; ph = 0; }
          var p = Math.min(ph / 3300, 1), k = ks[ki], R = Math.min(W, H) / 2 - 8, N = 500, upto = Math.floor(p * N);
          c.clearRect(0, 0, W, H);
          c.strokeStyle = css('--accent'); c.lineWidth = 2; c.lineJoin = 'round';
          c.beginPath();
          for (var i = 0; i <= upto; i++) {
            var th = i / N * 2 * Math.PI, r = Math.cos(k * th) * R;
            var x = W / 2 + r * Math.cos(th), y = H / 2 + r * Math.sin(th);
            if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
          }
          c.stroke();
          c.fillStyle = css('--muted'); c.font = '12px ui-monospace, Menlo, Consolas, monospace';
          c.textBaseline = 'top'; c.fillText('r = cos(' + k + '\u03B8)', 12, 10);
        });
      }

      /* 5. AND gate */
      var bA = document.getElementById('bA'), bB = document.getElementById('bB'),
          led = document.getElementById('led'), eqs = document.getElementById('eqs');
      if (bA) {
        var combos = [[0, 0], [0, 1], [1, 0], [1, 1]], gi = 3;
        var setG = function () {
          var a = combos[gi][0], b = combos[gi][1], o = a & b;
          bA.textContent = a; bB.textContent = b;
          bA.classList.toggle('hi', !!a); bB.classList.toggle('hi', !!b);
          led.classList.toggle('on', !!o);
          eqs.textContent = a + ' AND ' + b + ' = ' + o;
        };
        setG();
        if (!reduce) ticker(bA, 1300, function () { gi = (gi + 1) % 4; setG(); });
      }

      /* 6. derivative of an integral with moving limits */
      var tc = document.getElementById('thmCv'), tout = document.getElementById('thmOut');
      if (tc) {
        var f = function (t) { return 1.5 + Math.sin(t); };
        var F = function (t) { return 1.5 * t - Math.cos(t); };
        var hh = function (x) { return 1.5 + 0.8 * Math.sin(x); };
        var gg = function (x) { return 4.5 + 0.8 * Math.cos(x); };
        var dh = function (x) { return 0.8 * Math.cos(x); };
        var dg = function (x) { return -0.8 * Math.sin(x); };
        var A = function (x) { return F(gg(x)) - F(hh(x)); };
        loop(tc, function (t) {
          var o = sizeCanvas(tc), c = o.c, W = o.W, H = o.H, pad = 30;
          var x = reduce ? 1.2 : t / 1000 * 0.6;
          var X = function (v) { return pad + v / 6 * (W - 2 * pad); };
          var Y = function (v) { return H - pad - v / 3 * (H - 2 * pad); };
          var accent = css('--accent'), text = css('--text'), muted = css('--muted'), line = css('--line');
          var hx = hh(x), gx = gg(x);
          c.clearRect(0, 0, W, H);
          c.strokeStyle = line; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(pad, Y(0)); c.lineTo(W - pad, Y(0)); c.moveTo(pad, pad - 6); c.lineTo(pad, Y(0)); c.stroke();
          c.beginPath(); c.moveTo(X(hx), Y(0));
          for (var i = 0; i <= 120; i++) { var tt = hx + (gx - hx) * i / 120; c.lineTo(X(tt), Y(f(tt))); }
          c.lineTo(X(gx), Y(0)); c.closePath();
          c.fillStyle = accent; c.globalAlpha = 0.28; c.fill(); c.globalAlpha = 1;
          c.strokeStyle = accent; c.lineWidth = 3; c.beginPath();
          for (var j = 0; j <= 240; j++) { var u = 6 * j / 240; if (j === 0) c.moveTo(X(u), Y(f(u))); else c.lineTo(X(u), Y(f(u))); }
          c.stroke();
          c.setLineDash([5, 4]); c.strokeStyle = text; c.lineWidth = 1.5;
          [hx, gx].forEach(function (v) { c.beginPath(); c.moveTo(X(v), Y(0)); c.lineTo(X(v), Y(f(v))); c.stroke(); });
          c.setLineDash([]);
          c.fillStyle = text; c.font = '600 12px Inter, system-ui, sans-serif'; c.textBaseline = 'top'; c.textAlign = 'center';
          c.fillText('h(x)', X(hx), Y(0) + 6); c.fillText('g(x)', X(gx), Y(0) + 6);
          c.textAlign = 'left'; c.fillStyle = muted; c.fillText('f(t)', X(0.15), Y(f(0.15)) - 22);
          var formula = f(gx) * dg(x) - f(hx) * dh(x), e = 1e-4;
          var numeric = (A(x + e) - A(x - e)) / (2 * e);
          tout.textContent = 'Formula: ' + formula.toFixed(3) + '   |   Numerical check: ' + numeric.toFixed(3);
        });
      }
    })();

(function () {
      var rest = document.getElementById('rest'), root = document.documentElement;
      var btn = document.getElementById('openProfile');
      if (!rest) return;
      function openRest(then) {
        if (!rest.classList.contains('open')) {
          rest.classList.add('open'); root.classList.add('opened');
          window.dispatchEvent(new Event('resize'));
        }
        if (then) requestAnimationFrame(function () { requestAnimationFrame(then); });
      }
      function go(sel) {
        var t = sel ? document.querySelector(sel) : rest;
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (btn) btn.addEventListener('click', function () { openRest(function () { go(); }); });
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        var h = a.getAttribute('href');
        if (h === '#top' || h === '#') return;
        a.addEventListener('click', function (e) {
          if (!rest.classList.contains('open')) { e.preventDefault(); openRest(function () { go(h); }); }
        });
      });
      if (location.hash && location.hash !== '#top') {
        var tgt = null; try { tgt = document.querySelector(location.hash); } catch (e) {}
        if (tgt && rest.contains(tgt)) openRest(function () { go(location.hash); });
      }
    })();
