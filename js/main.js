/* ==========================================================
   CopperTrace Labs — site scripts
   - Animated PCB background (canvas)
   - Mobile nav, sticky header, scroll reveal, counters
   - Product filters, contact form (mailto)
   ========================================================== */

(function () {
  "use strict";

  var CONTACT_EMAIL = "info@coppertracelabs.com"; // TODO: replace with your real email

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- PCB background ---------------- */
  function initPcb() {
    var canvas = document.getElementById("pcb-bg");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var G = 22; // grid pitch in px
    var DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    var W = 0, H = 0, dpr = 1, board = null, traces = [], pulses = [], rafId = null;

    function rand(n) { return Math.floor(Math.random() * n); }

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      var cols = Math.ceil(W / G) + 1;
      var rows = Math.ceil(H / G) + 1;
      var used = new Uint8Array(cols * rows);
      function free(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows && !used[y * cols + x]; }
      function mark(x, y) { used[y * cols + x] = 1; }

      // Reserve a few IC footprints first
      var ics = [];
      var icCount = Math.max(2, Math.floor((cols * rows) / 900));
      for (var k = 0; k < icCount; k++) {
        var w = 4 + rand(4), h = 4 + rand(4);
        var ix = 2 + rand(Math.max(1, cols - w - 4)), iy = 2 + rand(Math.max(1, rows - h - 4));
        var ok = true;
        for (var yy = iy - 1; yy <= iy + h && ok; yy++)
          for (var xx = ix - 1; xx <= ix + w; xx++) if (!free(xx, yy)) { ok = false; break; }
        if (!ok) continue;
        for (yy = iy; yy < iy + h; yy++) for (xx = ix; xx < ix + w; xx++) mark(xx, yy);
        ics.push({ x: ix, y: iy, w: w, h: h });
      }

      // Route traces: random walks on the grid, mostly straight, 45° bends
      traces = [];
      var attempts = Math.floor((cols * rows) / 9);
      for (var i = 0; i < attempts; i++) {
        var x = rand(cols), y = rand(rows);
        if (!free(x, y)) continue;
        var d = rand(4) * 2;
        var pts = [[x, y]];
        mark(x, y);
        var maxLen = 5 + rand(26);
        for (var s = 0; s < maxLen; s++) {
          if (s > 2 && Math.random() < 0.18) d = (d + (Math.random() < 0.5 ? 1 : 7)) % 8;
          var nx = x + DIRS[d][0], ny = y + DIRS[d][1];
          if (!free(nx, ny)) break;
          // avoid diagonal crossings
          if (d % 2 === 1 && !free(x + DIRS[d][0], y) && !free(x, y + DIRS[d][1])) break;
          x = nx; y = ny;
          mark(x, y);
          pts.push([x, y]);
        }
        if (pts.length < 4) continue;
        var px = pts.map(function (p) { return [p[0] * G, p[1] * G]; });
        var lens = [0];
        for (var j = 1; j < px.length; j++) {
          lens.push(lens[j - 1] + Math.hypot(px[j][0] - px[j - 1][0], px[j][1] - px[j - 1][1]));
        }
        traces.push({ pts: px, lens: lens, total: lens[lens.length - 1], via: Math.random() < 0.35 });
      }

      // Pre-render static board to offscreen canvas
      board = document.createElement("canvas");
      board.width = canvas.width;
      board.height = canvas.height;
      var b = board.getContext("2d");
      b.scale(dpr, dpr);

      // faint grid dots
      b.fillStyle = "rgba(217,178,90,0.06)";
      for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) b.fillRect(gx * G - 0.5, gy * G - 0.5, 1, 1);

      b.lineCap = "round";
      b.lineJoin = "round";
      traces.forEach(function (t) {
        b.beginPath();
        b.moveTo(t.pts[0][0], t.pts[0][1]);
        for (var n = 1; n < t.pts.length; n++) b.lineTo(t.pts[n][0], t.pts[n][1]);
        b.strokeStyle = "rgba(217,178,90,0.08)";
        b.lineWidth = 6;
        b.stroke();
        b.strokeStyle = "rgba(217,178,90,0.30)";
        b.lineWidth = 2;
        b.stroke();
        [t.pts[0], t.pts[t.pts.length - 1]].forEach(function (p, idx) {
          b.beginPath();
          b.arc(p[0], p[1], idx === 0 && t.via ? 4.5 : 3.5, 0, Math.PI * 2);
          b.fillStyle = "rgba(217,178,90,0.55)";
          b.fill();
          if (idx === 0 && t.via) {
            b.beginPath();
            b.arc(p[0], p[1], 1.8, 0, Math.PI * 2);
            b.fillStyle = "#04140b";
            b.fill();
          }
        });
      });

      // IC footprints with pins and silkscreen outline
      ics.forEach(function (c) {
        var x0 = c.x * G, y0 = c.y * G, w = (c.w - 1) * G, h = (c.h - 1) * G;
        b.fillStyle = "rgba(2,10,5,0.75)";
        b.strokeStyle = "rgba(230,240,230,0.18)";
        b.lineWidth = 1;
        b.fillRect(x0, y0, w, h);
        b.strokeRect(x0 - 4, y0 - 4, w + 8, h + 8);
        b.fillStyle = "rgba(217,178,90,0.45)";
        for (var p = x0 + 6; p < x0 + w - 4; p += 8) {
          b.fillRect(p, y0 - 9, 3, 6);
          b.fillRect(p, y0 + h + 3, 3, 6);
        }
        for (p = y0 + 6; p < y0 + h - 4; p += 8) {
          b.fillRect(x0 - 9, p, 6, 3);
          b.fillRect(x0 + w + 3, p, 6, 3);
        }
        b.beginPath();
        b.arc(x0 + 7, y0 + 7, 2.5, 0, Math.PI * 2);
        b.fillStyle = "rgba(230,240,230,0.25)";
        b.fill();
      });

      pulses = [];
    }

    function pointAt(t, dist) {
      if (dist <= 0) return t.pts[0];
      if (dist >= t.total) return t.pts[t.pts.length - 1];
      var i = 1;
      while (t.lens[i] < dist) i++;
      var seg = t.lens[i] - t.lens[i - 1];
      var f = (dist - t.lens[i - 1]) / seg;
      var a = t.pts[i - 1], c = t.pts[i];
      return [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f];
    }

    function spawn(t) {
      if (!t) t = traces[rand(traces.length)];
      if (!t) return;
      var forward = Math.random() < 0.5;
      pulses.push({ t: t, d: 0, speed: 1.6 + Math.random() * 2.2, forward: forward, hue: Math.random() < 0.75 ? "gold" : "green" });
    }

    function frame() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(board, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var target = Math.min(45, Math.floor(traces.length / 6));
      while (pulses.length < target) spawn();

      ctx.lineCap = "round";
      for (var i = pulses.length - 1; i >= 0; i--) {
        var p = pulses[i];
        p.d += p.speed;
        var tail = 46;
        if (p.d - tail > p.t.total) { pulses.splice(i, 1); continue; }
        var col = p.hue === "gold" ? "255,214,120" : "125,255,178";
        var steps = 8;
        for (var s = 0; s < steps; s++) {
          var d1 = p.d - (tail * s) / steps, d2 = p.d - (tail * (s + 1)) / steps;
          if (d1 < 0) break;
          var A = pointAt(p.t, p.forward ? d1 : p.t.total - d1);
          var B = pointAt(p.t, p.forward ? Math.max(0, d2) : p.t.total - Math.max(0, d2));
          ctx.strokeStyle = "rgba(" + col + "," + (0.9 * (1 - s / steps)) + ")";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(B[0], B[1]);
          ctx.stroke();
        }
        if (p.d <= p.t.total) {
          var head = pointAt(p.t, p.forward ? p.d : p.t.total - p.d);
          var g = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 10);
          g.addColorStop(0, "rgba(" + col + ",0.95)");
          g.addColorStop(1, "rgba(" + col + ",0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(head[0], head[1], 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    function drawStatic() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(board, 0, 0);
    }

    function start() {
      build();
      if (reduceMotion) { drawStatic(); return; }
      if (rafId) cancelAnimationFrame(rafId);
      frame();
    }

    // Light up traces near the pointer
    var lastSpawn = 0;
    window.addEventListener("pointermove", function (e) {
      if (reduceMotion) return;
      var now = performance.now();
      if (now - lastSpawn < 90) return;
      lastSpawn = now;
      var best = null, bestD = 140 * 140;
      for (var i = 0; i < traces.length; i++) {
        var p = traces[i].pts[0];
        var dx = p[0] - e.clientX, dy = p[1] - e.clientY, dd = dx * dx + dy * dy;
        if (dd < bestD) { bestD = dd; best = traces[i]; }
      }
      if (best && pulses.length < 80) {
        pulses.push({ t: best, d: 0, speed: 3, forward: true, hue: "green" });
      }
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (reduceMotion) return;
      if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId) frame();
    });

    var resizeTimer, lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // ignore small height changes from mobile browser toolbars
        if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return;
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        start();
      }, 200);
    });

    start();
  }

  /* ---------------- Header & nav ---------------- */
  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 20); }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.querySelectorAll(".nav-links a").forEach(function (a) {
        a.addEventListener("click", function () {
          document.body.classList.remove("nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ---------------- Scroll reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Counters ---------------- */
  function initCounters() {
    var els = document.querySelectorAll("[data-count]");
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var suffix = el.getAttribute("data-suffix") || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var start = performance.now(), dur = 1600;
      (function tick(now) {
        var k = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      })(start);
    }
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { run(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- Product filters ---------------- */
  function initFilters() {
    var btns = document.querySelectorAll(".filter-btn");
    var items = document.querySelectorAll(".product[data-cat]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        btns.forEach(function (b) { b.classList.toggle("active", b === btn); });
        items.forEach(function (it) {
          var cats = it.getAttribute("data-cat").split(" ");
          it.classList.toggle("hidden", f !== "all" && cats.indexOf(f) === -1);
        });
      });
    });
  }

  /* ---------------- Contact form (mailto) ---------------- */
  function initContact() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (n) { return (form.elements[n] && form.elements[n].value || "").trim(); };
      var subject = "[Website] " + (v("service") || "Enquiry") + " — " + v("name");
      var body = "Name: " + v("name") + "\nEmail: " + v("email") + "\nCompany: " + v("company") +
        "\nService: " + v("service") + "\n\n" + v("message");
      window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }

  /* ---------------- Footer year ---------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPcb();
    initNav();
    initReveal();
    initCounters();
    initFilters();
    initContact();
    initYear();
  });
})();
