/*
 * 화면 그리기 스크립트 — 내용은 config.js에서 고치세요.
 * 이 파일은 config.js의 내용을 읽어 페이지를 만듭니다.
 */
(function () {
  "use strict";
  var C = window.SITE_CONFIG;
  // 관리자 화면에서 고친 설정(미리 보기)이 이 브라우저에 있으면 그것으로 표시
  var draftActive = false;
  try {
    var draft = localStorage.getItem("kucourse:configDraft");
    if (draft) {
      var parsed = JSON.parse(draft);
      if (C && JSON.stringify(parsed) === JSON.stringify(C)) {
        // 저장한 내용이 사이트(config.js)에 반영되었으면 미리 보기 정리
        localStorage.removeItem("kucourse:configDraft");
        localStorage.removeItem("kucourse:publishedAt");
      } else {
        C = window.SITE_CONFIG = parsed; draftActive = true;
      }
    }
  } catch (e) {}
  if (!C) {
    document.body.insertAdjacentHTML("afterbegin",
      '<p style="padding:16px;background:#fde;color:#900">config.js를 불러오지 못했습니다. 파일 이름과 위치, 쉼표·따옴표를 확인해 주세요.</p>');
    return;
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 작은 요소 생성 도우미 */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o ? o[k] : undefined; }, C);
  }
  function sectionHead(title, subtitle) {
    var head = el("div", "sec-head");
    head.appendChild(el("h2", null, title));
    if (subtitle) head.appendChild(el("p", null, subtitle));
    return head;
  }
  function container(section) {
    var c = el("div", "container");
    section.appendChild(c);
    return c;
  }
  function iconCard(d, cls) {
    var card = el("article", "card" + (cls ? " " + cls : ""));
    if (d.icon) card.appendChild(el("div", "card-icon", d.icon));
    card.appendChild(el("h3", null, d.title));
    if (d.text) card.appendChild(el("p", null, d.text));
    if (d.items && d.items.length) {
      var ul = el("ul");
      d.items.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      card.appendChild(ul);
    }
    return card;
  }
  function hideSection(id) { var s = document.getElementById(id); if (s) s.hidden = true; }

  var S = C.site || {};
  var computed = { brandSub: [S.university, S.department].filter(Boolean).join(" · ") };

  /* data-bind 채우기 */
  document.querySelectorAll("[data-bind]").forEach(function (n) {
    var key = n.getAttribute("data-bind");
    var v = key in computed ? computed[key] : get(key);
    if (v) n.textContent = v; else n.hidden = true;
  });
  document.title = [S.courseName, [S.university, S.department].filter(Boolean).join(" ")].filter(Boolean).join(" | ");

  /* 메뉴 */
  var nav = document.getElementById("site-nav");
  (C.nav || []).forEach(function (item) {
    var a = el("a", null, item.label);
    a.href = "#" + item.id;
    a.dataset.target = item.id;
    nav.appendChild(a);
  });

  /* ── 첫 화면 ── */
  (function () {
    var H = C.hero || {};
    var btns = document.querySelector(".hero-buttons");
    [[H.applyButton, true], [H.curriculumButton, false]].forEach(function (pair) {
      var b = pair[0]; if (!b || !b.label) return;
      var a = el("a", "btn" + (pair[1] ? " primary" : ""), b.label);
      a.href = b.link || "#";
      if (/^https?:/.test(a.getAttribute("href"))) { a.target = "_blank"; a.rel = "noopener"; }
      btns.appendChild(a);
    });
    var dl = document.querySelector(".quick-info");
    (H.quickInfo || []).forEach(function (i) {
      var box = el("div", "quick-item");
      if (i.icon) box.appendChild(el("span", "quick-icon", i.icon));
      var txt = el("div");
      txt.appendChild(el("dt", null, i.label));
      txt.appendChild(el("dd", null, i.value));
      box.appendChild(txt);
      dl.appendChild(box);
    });
    if (!dl.children.length) dl.hidden = true;
  })();

  /* ── 프로그램 소개: 숫자 카드 + 장점 슬라이드 ── */
  (function () {
    var A = C.about; if (!A) return hideSection("about");
    var c = container(document.getElementById("about"));
    c.appendChild(sectionHead(A.title, A.subtitle));

    if (A.stats && A.stats.length) {
      var stats = el("div", "stats");
      A.stats.forEach(function (s) {
        var card = el("div", "card stat");
        var num = el("div", "stat-num");
        var v = el("span", "stat-value", s.value);
        if (/^\d+$/.test(String(s.value))) v.dataset.count = s.value;
        num.appendChild(v);
        if (s.unit) num.appendChild(el("span", "stat-unit", s.unit));
        card.appendChild(num);
        card.appendChild(el("div", "stat-label", s.label));
        stats.appendChild(card);
      });
      c.appendChild(stats);
    }

    if (A.strengths && A.strengths.length) {
      if (A.strengthsTitle) c.appendChild(el("h3", "sub-title", A.strengthsTitle));
      c.appendChild(buildSlider(A.strengths, A.strengthsTitle || "장점"));
    }
  })();

  function buildSlider(items, label) {
    var wrap = el("div", "slider");
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-roledescription", "carousel");
    wrap.setAttribute("aria-label", label);

    var track = el("div", "slider-track");
    track.tabIndex = 0;
    items.forEach(function (d, i) {
      var slide = iconCard(d, "slide");
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", (i + 1) + " / " + items.length);
      slide.insertBefore(el("span", "slide-no", String(i + 1).padStart(2, "0")), slide.firstChild);
      track.appendChild(slide);
    });
    wrap.appendChild(track);

    var controls = el("div", "slider-controls");
    var prev = el("button", "slider-btn", "‹"); prev.setAttribute("aria-label", "이전");
    var next = el("button", "slider-btn", "›"); next.setAttribute("aria-label", "다음");
    var dots = el("div", "slider-dots");
    var dotEls = items.map(function (_, i) {
      var d = el("button", "dot");
      d.setAttribute("aria-label", (i + 1) + "번째 장점으로 이동");
      d.addEventListener("click", function () { go(i); });
      dots.appendChild(d);
      return d;
    });
    controls.appendChild(prev); controls.appendChild(dots); controls.appendChild(next);
    wrap.appendChild(controls);

    var slides = track.children;
    var idx = 0;          // 지금 보고 있는(또는 이동 중인) 슬라이드 번호
    function posOf(i) { return slides[i].offsetLeft - slides[0].offsetLeft; }
    function maxScroll() { return track.scrollWidth - track.clientWidth; }
    function lastIndex() {
      // 한 화면에 여러 장이 보이면 마지막 몇 장은 따로 멈출 자리가 없음
      for (var i = 0; i < slides.length; i++) if (posOf(i) >= maxScroll() - 4) return i;
      return slides.length - 1;
    }
    function current() {
      if (track.scrollLeft >= maxScroll() - 4) return lastIndex();
      var best = 0, min = Infinity;
      for (var i = 0; i < slides.length; i++) {
        var d = Math.abs(posOf(i) - track.scrollLeft);
        if (d < min) { min = d; best = i; }
      }
      return best;
    }
    function render(i) {
      var last = lastIndex();
      dotEls.forEach(function (d, k) {
        var on = i >= last ? k >= last : k === i;   // 끝에서는 화면에 보이는 마지막 장들을 함께 표시
        d.classList.toggle("active", on);
        d.setAttribute("aria-current", on ? "true" : "false");
      });
      prev.disabled = i <= 0;
      next.disabled = i >= last;
    }
    var busyUntil = 0;    // 버튼으로 이동하는 동안에는 중간 위치를 무시
    function go(i) {
      busyUntil = Date.now() + 800;
      idx = Math.max(0, Math.min(lastIndex(), i));
      track.scrollTo({ left: posOf(idx), behavior: reduceMotion ? "auto" : "smooth" });
      render(idx);
    }
    prev.addEventListener("click", function () { go(idx - 1); });
    next.addEventListener("click", function () { go(idx + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    });
    // 손가락으로 밀어 넘긴 경우: 스크롤이 멈추면 위치를 다시 읽음
    var t;
    track.addEventListener("scroll", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        if (Date.now() < busyUntil) return;
        idx = current(); render(idx);
      }, 120);
    }, { passive: true });
    window.addEventListener("resize", function () { idx = current(); render(idx); });
    setTimeout(function () { render(idx); }, 0);   // 페이지에 붙은 뒤 첫 표시
    return wrap;
  }

  /* ── 커리큘럼: 15주 펼쳐 보기 + 과제 마감 + 수업 달력 ── */
  var DAY = 86400000;
  var WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
  function parseDate(s) {             // "2026-03-03" 또는 "2026-03-03T23:59" → 현지 시각
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(s || "");
    return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
  }
  function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function fmtDate(d) { return (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" + WEEKDAYS[d.getDay()] + ")"; }
  function fmtDateTime(d) {
    return fmtDate(d) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  // 주소 끝에 ?today=2026-03-20 (또는 2026-03-20T09:00)을 붙이면 그날 기준으로 미리 볼 수 있습니다.
  var nowOffset = 0;
  (function () {
    var q = /[?&]today=([^&]+)/.exec(location.search);
    var d = q && parseDate(decodeURIComponent(q[1]));
    if (d) nowOffset = d.getTime() - Date.now();
  })();
  function now() { return new Date(Date.now() + nowOffset); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  /* 주차별 날짜 계산 */
  var SCH = C.schedule || {};
  var holidayMap = {};
  (SCH.holidays || []).forEach(function (h) { holidayMap[h.date] = h.name || "휴강"; });
  var allWeeks = [];
  (function () {
    var K = C.curriculum; if (!K) return;
    var cur = parseDate(SCH.firstClass) || startOfDay(now());
    (K.phases || []).forEach(function (p, pi) {
      (p.weeks || []).forEach(function (w) {
        while (holidayMap[dateKey(cur)]) cur = addDays(cur, 7);
        var date = parseDate(w.date) || cur;
        cur = addDays(cur, 7);
        allWeeks.push({
          no: allWeeks.length + 1, phase: pi, data: w, date: date,
          time: w.time || SCH.time, place: w.place || SCH.place,
          due: w.assignment ? parseDate(w.assignment.due) : null
        });
      });
    });
  })();
  var byDate = {}, dueByDate = {};
  allWeeks.forEach(function (w) {
    byDate[dateKey(w.date)] = w;
    if (w.due) (dueByDate[dateKey(w.due)] = dueByDate[dateKey(w.due)] || []).push(w);
  });

  /* 남은 시간 문구 */
  function remaining(due) {
    var diff = due - now();
    if (diff <= 0) return { text: "마감되었습니다", state: "over" };
    var d = Math.floor(diff / DAY), h = Math.floor(diff % DAY / 3600000), m = Math.floor(diff % 3600000 / 60000);
    if (d >= 1) return { text: "마감까지 " + d + "일 " + h + "시간 남음", state: d < 3 ? "soon" : "open" };
    if (h >= 1) return { text: "마감까지 " + h + "시간 " + m + "분 남음", state: "urgent" };
    return { text: "마감까지 " + Math.max(1, m) + "분 남음", state: "urgent" };
  }
  function dLabel(due) {
    if (due - now() <= 0) return "마감";
    var days = Math.round((startOfDay(due) - startOfDay(now())) / DAY);
    return days === 0 ? "D-day" : "D-" + days;
  }

  (function () {
    var K = C.curriculum; if (!K) return hideSection("curriculum");
    var c = container(document.getElementById("curriculum"));
    c.appendChild(sectionHead(K.title, K.subtitle));

    // 다음 수업(오늘 포함) 찾기
    var today = startOfDay(now());
    var nextWeek = allWeeks.filter(function (w) { return w.date >= today; })[0];

    var tools = el("div", "curr-tools");
    var expand = el("button", "chip-btn", "모두 펼치기");
    tools.appendChild(expand);
    c.appendChild(tools);

    var list = el("div", "week-list");
    var lastPhase = -1;
    allWeeks.forEach(function (w) {
      var phases = K.phases;
      if (w.phase !== lastPhase) {
        lastPhase = w.phase;
        var p = phases[w.phase];
        var members = allWeeks.filter(function (x) { return x.phase === w.phase; });
        var range = members[0].no + (members.length > 1 ? "–" + members[members.length - 1].no : "") + "주";
        var lab = el("div", "phase-label");
        lab.appendChild(el("span", "phase-range", range));
        lab.appendChild(el("h3", null, p.title));
        if (p.summary) lab.appendChild(el("p", null, p.summary));
        list.appendChild(lab);
      }
      list.appendChild(weekItem(w, w === nextWeek));
    });
    c.appendChild(list);

    var items = list.querySelectorAll("details");
    function syncExpand() {
      var allOpen = Array.prototype.every.call(items, function (d) { return d.open; });
      expand.textContent = allOpen ? "모두 접기" : "모두 펼치기";
    }
    expand.addEventListener("click", function () {
      var allOpen = Array.prototype.every.call(items, function (d) { return d.open; });
      items.forEach(function (d) { d.open = !allOpen; });
      syncExpand();
    });
    items.forEach(function (d) { d.addEventListener("toggle", syncExpand); });

    if (K.calendarTitle !== false) {
      c.appendChild(el("h3", "sub-title", K.calendarTitle || "수업 달력"));
      c.appendChild(buildCalendar());
    }

    updateDeadlines();
    setInterval(updateDeadlines, 30000);
  })();

  function weekItem(w, isNext) {
    var d = w.data;
    var item = el("details", "card week-item" + (d.exam ? " exam" : "") + (isNext ? " next" : ""));
    item.id = "week-" + w.no;

    var sum = el("summary");
    sum.appendChild(el("span", "wk-no", w.no + "주"));
    var mid = el("span", "wk-mid");
    mid.appendChild(el("span", "wk-date", fmtDate(w.date)));
    mid.appendChild(el("span", "wk-title", d.title));
    sum.appendChild(mid);
    var badges = el("span", "wk-badges");
    if (isNext) badges.appendChild(el("span", "tag tag-next", "다음 수업"));
    if (d.exam) badges.appendChild(el("span", "tag tag-exam", "시험"));
    if (w.due) {
      var tb = el("span", "tag tag-hw");
      tb.dataset.dueBadge = w.due.getTime();
      badges.appendChild(tb);
    }
    sum.appendChild(badges);
    item.appendChild(sum);

    var body = el("div", "wk-body");
    var meta = el("dl", "wk-meta");
    [["📅", "날짜", fmtDate(w.date)], ["⏰", "시간", w.time], ["📍", "장소", w.place]].forEach(function (m) {
      if (!m[2]) return;
      var row = el("div");
      row.appendChild(el("dt", null, m[0] + " " + m[1]));
      row.appendChild(el("dd", null, m[2]));
      meta.appendChild(row);
    });
    body.appendChild(meta);

    if (d.content && d.content.length) {
      body.appendChild(el("h4", null, "학습 내용"));
      var ul = el("ul", "wk-content");
      d.content.forEach(function (t) { ul.appendChild(el("li", null, t)); });
      body.appendChild(ul);
    }
    if (d.videos && d.videos.length) {
      body.appendChild(el("h4", null, "참고 영상"));
      var vids = el("div", "wk-videos");
      d.videos.forEach(function (v) {
        var a = el("a", "video-link", "▶ " + v.label);
        a.href = v.url; a.target = "_blank"; a.rel = "noopener";
        vids.appendChild(a);
      });
      body.appendChild(vids);
    }
    if (d.assignment) {
      var A = d.assignment;
      var box = el("div", "assignment");
      box.appendChild(el("div", "as-label", "📝 과제"));
      box.appendChild(el("h4", "as-title", A.title));
      if (A.desc) box.appendChild(el("p", "as-desc", A.desc));
      var foot = el("div", "as-foot");
      var info = el("div", "as-info");
      info.appendChild(el("div", "as-due", "마감 " + (w.due ? fmtDateTime(w.due) : "○○")));
      var cd = el("div", "as-countdown");
      if (w.due) cd.dataset.due = w.due.getTime();
      info.appendChild(cd);
      foot.appendChild(info);
      var btn = el("a", "btn primary as-submit", "과제 제출하기");
      btn.dataset.url = A.submitUrl || SCH.submitUrl || "";
      if (w.due) btn.dataset.dueBtn = w.due.getTime();
      btn.dataset.week = w.no;
      foot.appendChild(btn);
      box.appendChild(foot);
      body.appendChild(box);
    }
    item.appendChild(body);
    return item;
  }

  /* 마감 표시를 현재 시각에 맞춰 갱신 (30초마다) */
  function updateDeadlines() {
    document.querySelectorAll("[data-due]").forEach(function (n) {
      var r = remaining(new Date(+n.dataset.due));
      n.textContent = r.text;
      n.className = "as-countdown " + r.state;
    });
    document.querySelectorAll("[data-due-badge]").forEach(function (n) {
      var due = new Date(+n.dataset.dueBadge);
      n.textContent = "과제 " + dLabel(due);
      n.classList.toggle("over", due - now() <= 0);
    });
    document.querySelectorAll(".as-submit").forEach(function (b) {
      var over = b.dataset.dueBtn && new Date(+b.dataset.dueBtn) - now() <= 0;
      var url = b.dataset.url;
      var lateOk = C.student && C.student.allowLate;
      if (!url && C.student && (!over || lateOk)) {
        // 별도 제출 주소가 없으면 사이트 안 '수강생 공간'에서 제출
        b.href = "#submit"; b.removeAttribute("target");
        b.removeAttribute("aria-disabled");
        b.classList.remove("disabled");
        b.textContent = over ? "지각 제출하기" : "사이트에서 제출하기";
        b.onclick = function () {
          if (window.SITE && SITE.selectAssignment) SITE.selectAssignment(+this.dataset.week);
        };
      } else if (over || !url) {
        b.onclick = null;
        b.removeAttribute("href");
        b.setAttribute("aria-disabled", "true");
        b.classList.add("disabled");
        b.textContent = over ? "제출 마감" : "제출 링크 준비 중";
      } else {
        b.onclick = null;
        b.href = url; b.target = "_blank"; b.rel = "noopener";
        b.removeAttribute("aria-disabled");
        b.classList.remove("disabled");
        b.textContent = "과제 제출하기";
      }
    });
  }

  function openWeek(no) {
    var d = document.getElementById("week-" + no);
    if (!d) return;
    d.open = true;
    d.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    d.querySelector("summary").focus({ preventScroll: true });
  }

  /* ── 월간 수업 달력 ── */
  function buildCalendar() {
    var wrap = el("div", "calendar-wrap");
    var cal = el("div", "card calendar");
    var head = el("div", "cal-head");
    var prev = el("button", "slider-btn", "‹"); prev.setAttribute("aria-label", "이전 달");
    var next = el("button", "slider-btn", "›"); next.setAttribute("aria-label", "다음 달");
    var title = el("h4", "cal-title"); title.setAttribute("aria-live", "polite");
    var todayBtn = el("button", "chip-btn", "오늘");
    head.appendChild(prev); head.appendChild(title); head.appendChild(next); head.appendChild(todayBtn);
    cal.appendChild(head);

    var grid = el("div", "cal-grid");
    cal.appendChild(grid);
    var legend = el("div", "cal-legend");
    [["lg-class", "수업"], ["lg-exam", "시험"], ["lg-due", "과제 마감"], ["lg-off", "휴강"]].forEach(function (l) {
      var s = el("span"); s.appendChild(el("i", l[0])); s.appendChild(document.createTextNode(l[1])); legend.appendChild(s);
    });
    cal.appendChild(legend);
    wrap.appendChild(cal);

    var panel = el("div", "card cal-panel");
    panel.setAttribute("aria-live", "polite");
    wrap.appendChild(panel);

    var first = allWeeks.length ? allWeeks[0].date : now();
    var last = allWeeks.length ? allWeeks[allWeeks.length - 1].date : now();
    var minM = first.getFullYear() * 12 + first.getMonth();
    var maxM = last.getFullYear() * 12 + last.getMonth();
    var t = now();
    var view = Math.min(maxM, Math.max(minM, t.getFullYear() * 12 + t.getMonth()));
    var selected = null;

    function render() {
      var y = Math.floor(view / 12), m = view % 12;
      title.textContent = y + "년 " + (m + 1) + "월";
      grid.textContent = "";
      WEEKDAYS.forEach(function (w, i) {
        grid.appendChild(el("div", "cal-dow" + (i === 0 ? " sun" : i === 6 ? " sat" : ""), w));
      });
      var start = new Date(y, m, 1).getDay();
      for (var i = 0; i < start; i++) grid.appendChild(el("div", "cal-empty"));
      var days = new Date(y, m + 1, 0).getDate();
      var todayKey = dateKey(now());
      for (var d = 1; d <= days; d++) {
        var date = new Date(y, m, d), k = dateKey(date);
        var w = byDate[k], dues = dueByDate[k], off = holidayMap[k];
        var cell = el("button", "cal-day");
        cell.type = "button";
        if (date.getDay() === 0) cell.classList.add("sun");
        if (date.getDay() === 6) cell.classList.add("sat");
        if (k === todayKey) cell.classList.add("today");
        if (k === selected) cell.classList.add("selected");
        if (w) cell.classList.add(w.data.exam ? "has-exam" : "has-class");
        if (off) cell.classList.add("is-off");
        cell.appendChild(el("span", "cal-num", d));
        var label = (m + 1) + "월 " + d + "일 " + WEEKDAYS[date.getDay()] + "요일";
        if (w) {
          cell.appendChild(el("span", "cal-chip", w.no + "주" + (w.data.exam ? " 시험" : "")));
          label += ", " + w.no + "주차 " + (w.data.exam ? "시험" : "수업");
        }
        if (off) { cell.appendChild(el("span", "cal-off", "휴강")); label += ", " + off; }
        if (dues) { cell.appendChild(el("span", "cal-due", "마감")); label += ", 과제 마감"; }
        cell.setAttribute("aria-label", label);
        if (k === selected) cell.setAttribute("aria-pressed", "true");
        cell.dataset.key = k;
        grid.appendChild(cell);
      }
      prev.disabled = view <= minM;
      next.disabled = view >= maxM;
    }

    function showDay(k) {
      selected = k;
      grid.querySelectorAll(".cal-day").forEach(function (c) {
        var on = c.dataset.key === k;
        c.classList.toggle("selected", on);
        if (on) c.setAttribute("aria-pressed", "true"); else c.removeAttribute("aria-pressed");
      });
      var d = parseDate(k), w = byDate[k], dues = dueByDate[k], off = holidayMap[k];
      panel.textContent = "";
      panel.appendChild(el("div", "panel-date", fmtDate(d)));
      if (w) {
        panel.appendChild(el("div", "panel-week", w.no + "주차" + (w.data.exam ? " · 시험" : "")));
        panel.appendChild(el("h4", "panel-title", w.data.title));
        var meta = el("dl", "wk-meta");
        [["⏰ 시간", w.time], ["📍 장소", w.place]].forEach(function (m) {
          if (!m[1]) return;
          var r = el("div"); r.appendChild(el("dt", null, m[0])); r.appendChild(el("dd", null, m[1])); meta.appendChild(r);
        });
        panel.appendChild(meta);
        if (w.data.content && w.data.content.length) {
          var ul = el("ul", "wk-content");
          w.data.content.forEach(function (t) { ul.appendChild(el("li", null, t)); });
          panel.appendChild(ul);
        }
        var go = el("button", "btn", "주차 상세 보기");
        go.addEventListener("click", function () { openWeek(w.no); });
        panel.appendChild(go);
      }
      if (off) panel.appendChild(el("p", "panel-off", "🌸 " + off));
      if (dues) dues.forEach(function (x) {
        var box = el("div", "panel-due");
        box.appendChild(el("strong", null, "📝 과제 마감 " + String(x.due.getHours()).padStart(2, "0") + ":" + String(x.due.getMinutes()).padStart(2, "0")));
        box.appendChild(el("span", null, x.no + "주차 · " + x.data.assignment.title));
        var cd = el("span", "as-countdown");
        cd.dataset.due = x.due.getTime();
        box.appendChild(cd);
        var link = el("button", "link-btn", "과제 보기 →");
        link.addEventListener("click", function () { openWeek(x.no); });
        box.appendChild(link);
        panel.appendChild(box);
      });
      if (!w && !off && !dues) panel.appendChild(el("p", "panel-empty", "이 날은 수업이 없습니다."));
      updateDeadlines();
    }

    function defaultDay() {
      // 보고 있는 달에서: 오늘 → 오늘 이후 첫 수업 → 그 달 첫 수업 순으로 선택
      var y = Math.floor(view / 12), m = view % 12, tk = dateKey(now());
      var inMonth = allWeeks.filter(function (w) { return w.date.getFullYear() === y && w.date.getMonth() === m; });
      if (byDate[tk] && inMonth.indexOf(byDate[tk]) >= 0) return tk;
      var up = inMonth.filter(function (w) { return w.date >= startOfDay(now()); })[0];
      if (up) return dateKey(up.date);
      return inMonth.length ? dateKey(inMonth[0].date) : dateKey(new Date(y, m, 1));
    }

    grid.addEventListener("click", function (e) {
      var b = e.target.closest(".cal-day");
      if (b) showDay(b.dataset.key);
    });
    prev.addEventListener("click", function () { view--; render(); showDay(defaultDay()); });
    next.addEventListener("click", function () { view++; render(); showDay(defaultDay()); });
    todayBtn.addEventListener("click", function () {
      var t = now();
      view = t.getFullYear() * 12 + t.getMonth();
      render(); showDay(dateKey(t));
    });

    render();
    showDay(defaultDay());
    return wrap;
  }

  /* ── 실습 AI 도구 ── */
  (function () {
    var T = C.tools; if (!T || !T.items || !T.items.length) return hideSection("tools");
    var c = container(document.getElementById("tools"));
    c.appendChild(sectionHead(T.title, T.subtitle));
    var grid = el("div", "grid cols-3 tools");
    T.items.forEach(function (t) {
      var card = el("article", "card tool");
      card.appendChild(el("div", "card-icon", t.icon));
      var body = el("div");
      body.appendChild(el("h3", null, t.name));
      if (t.use) body.appendChild(el("p", null, t.use));
      card.appendChild(body);
      grid.appendChild(card);
    });
    c.appendChild(grid);
  })();

  /* ── 수강 안내 ── */
  (function () {
    var E = C.enroll; if (!E) return hideSection("enroll");
    var c = container(document.getElementById("enroll"));
    c.appendChild(sectionHead(E.title, E.subtitle));
    if (E.prep && E.prep.length) {
      if (E.prepTitle) c.appendChild(el("h3", "sub-title", E.prepTitle));
      var prep = el("div", "grid cols-4 prep");
      E.prep.forEach(function (d) { prep.appendChild(iconCard(d, "prep-card")); });
      c.appendChild(prep);
    }
    if (E.cards && E.cards.length) {
      var grid = el("div", "grid cols-3");
      grid.style.marginTop = "28px";
      E.cards.forEach(function (d) { grid.appendChild(iconCard(d)); });
      c.appendChild(grid);
    }
  })();

  /* ── FAQ ── */
  (function () {
    var F = C.faq; if (!F) return hideSection("faq");
    var c = container(document.getElementById("faq"));
    c.appendChild(sectionHead(F.title, F.subtitle));
    var list = el("div", "faq-list");
    (F.items || []).forEach(function (f) {
      var d = el("details", "card faq-item");
      d.appendChild(el("summary", null, f.q));
      d.appendChild(el("p", "faq-answer", f.a));
      list.appendChild(d);
    });
    c.appendChild(list);
  })();

  /* ── 푸터: 교수자 소개 ── */
  (function () {
    var I = C.instructor || {};
    var footer = document.getElementById("instructor");
    var c = container(footer);

    var prof = el("div", "footer-prof");
    var av = el("div", "avatar");
    var initial = (I.name || "").charAt(0);
    if (I.photo) {
      var img = el("img"); img.src = I.photo; img.alt = (I.name || "") + " 교수 사진";
      img.onerror = function () { av.textContent = initial; };
      av.appendChild(img);
    } else {
      av.textContent = initial;
    }
    prof.appendChild(av);

    var body = el("div", "footer-body");
    if (I.role) body.appendChild(el("div", "instructor-role", I.role));
    if (I.name) body.appendChild(el("h2", "instructor-name", I.name + " 교수"));
    if (I.bio) body.appendChild(el("p", "instructor-bio", I.bio));
    prof.appendChild(body);

    if (I.contacts && I.contacts.length) {
      var dl = el("dl", "contacts");
      I.contacts.forEach(function (x) {
        var row = el("div");
        var dt = el("dt");
        if (x.icon) dt.appendChild(el("span", "contact-icon", x.icon));
        dt.appendChild(document.createTextNode(x.label));
        row.appendChild(dt);
        var dd = el("dd");
        if (/^[^\s@○]+@[^\s@○]+\.[a-z]{2,}$/i.test(x.value)) {
          var a = el("a", null, x.value); a.href = "mailto:" + x.value; dd.appendChild(a);
        } else {
          dd.textContent = x.value;
        }
        row.appendChild(dd);
        dl.appendChild(row);
      });
      prof.appendChild(dl);
    }
    c.appendChild(prof);

    var bottom = el("div", "footer-bottom");
    bottom.appendChild(el("p", "footer-title",
      [S.university, S.department, "「" + S.courseName + "」", S.semester].filter(Boolean).join(" · ")));
    if (S.footerNote) bottom.appendChild(el("p", "footer-note", S.footerNote));
    c.appendChild(bottom);
  })();

  /* ── 동작 ── */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var toTop = document.querySelector(".to-top");

  function closeMenu() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");
  }
  toggle.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") closeMenu(); });
  document.addEventListener("click", function (e) { if (!header.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  toTop.addEventListener("click", function () { window.scrollTo({ top: 0 }); });

  /* 스크롤에 따라 헤더 그림자·맨 위로 버튼·현재 메뉴 표시 */
  var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("scrolled", y > 8);
    toTop.classList.toggle("show", y > 500);
    var current = null;
    var line = header.offsetHeight + window.innerHeight * 0.3;
    links.forEach(function (a) {
      var s = document.getElementById(a.dataset.target);
      if (s && !s.hidden && s.getBoundingClientRect().top <= line) current = a;
    });
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 4 && links.length) {
      current = links[links.length - 1];
    }
    links.forEach(function (a) { a.classList.toggle("active", a === current); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 숫자 카드: 화면에 들어오면 0부터 올라가기 */
  (function () {
    var nums = document.querySelectorAll("[data-count]");
    if (!nums.length || reduceMotion || !("IntersectionObserver" in window)) return;
    function run(n) {
      var target = parseInt(n.dataset.count, 10), start = null, dur = 1200, done = false;
      function step(ts) {
        if (done) return;
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        n.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else done = true;
      }
      n.textContent = "0";
      requestAnimationFrame(step);
      // 애니메이션이 멈추더라도 최종 숫자는 반드시 표시
      setTimeout(function () { done = true; n.textContent = target; }, dur + 150);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* 다른 스크립트(participate.js)에서 함께 쓰는 도구 */
  window.SITE = {
    config: C, el: el, sectionHead: sectionHead, container: container,
    now: now, parseDate: parseDate, dateKey: dateKey, startOfDay: startOfDay,
    fmtDate: fmtDate, fmtDateTime: fmtDateTime, remaining: remaining,
    weeks: allWeeks, openWeek: openWeek, reduceMotion: reduceMotion,
    refreshDeadlines: updateDeadlines, draftActive: draftActive
  };

  /* 벚꽃잎 */
  if (!reduceMotion) {
    var box = document.querySelector(".petals");
    var count = window.innerWidth < 640 ? 8 : 14;
    for (var i = 0; i < count; i++) {
      var p = el("span", "petal");
      p.style.left = Math.random() * 100 + "%";
      p.style.animationDuration = 10 + Math.random() * 10 + "s";
      p.style.animationDelay = -Math.random() * 20 + "s";
      var s = 0.6 + Math.random() * 0.8;
      p.style.width = 12 * s + "px"; p.style.height = 10 * s + "px";
      if (i % 3 === 0) p.style.background = "var(--lilac-200)";
      box.appendChild(p);
    }
  }
})();
