/*
 * 수강생 참여 기능 — 투표 · 수강 신청서 · 로그인/출석/과제 제출 · 안내 팝업 · 환영 효과
 * 글과 설정은 config.js에서 고치세요.
 */
(function () {
  "use strict";
  var S = window.SITE;
  if (!S) return;
  var C = S.config, el = S.el;

  /* ── 브라우저 저장소 (막혀 있어도 오류 없이 동작) ── */
  var PREFIX = "kucourse:";
  function load(key, def, session) {
    try {
      var v = (session ? sessionStorage : localStorage).getItem(PREFIX + key);
      return v == null ? def : JSON.parse(v);
    } catch (e) { return def; }
  }
  function save(key, val, session) {
    try { (session ? sessionStorage : localStorage).setItem(PREFIX + key, JSON.stringify(val)); } catch (e) {}
  }
  function remove(key, session) {
    try { (session ? sessionStorage : localStorage).removeItem(PREFIX + key); } catch (e) {}
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  // 받침에 따라 '을/를' 고르기 (예: 이름을, 학과를)
  function eulReul(word) {
    var code = word.charCodeAt(word.length - 1) - 0xAC00;
    if (code < 0 || code > 11171) return word + "을(를)";
    return word + (code % 28 ? "을" : "를");
  }
  function hhmm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  /* ════════════════════════════════════════════════
   *  데이터 연결: 구글 시트(Apps Script) 또는 체험 모드(이 브라우저에만 저장)
   * ════════════════════════════════════════════════ */
  var API = (function () {
    var url = (C.backend || {}).url || "";
    var demo = !url;

    function remote(action, payload) {
      var body = Object.assign({ action: action }, payload || {});
      // text/plain으로 보내야 Apps Script가 추가 확인 요청 없이 받습니다.
      return fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || "서버 응답을 읽지 못했습니다.");
          return res;
        }, function () {
          // 네트워크·응답 형식 오류 (서버가 보낸 안내 문구는 위에서 그대로 전달)
          throw new Error("서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        });
    }

    /* 체험 모드: 같은 동작을 이 브라우저 저장소로 흉내 냅니다 */
    function session(token) {
      var s = load("demoSessions", {})[token];
      if (!s) throw new Error("로그인이 만료되었습니다. 다시 로그인해 주세요.");
      return s;
    }
    function myRecords(id) {
      return {
        attendance: load("demoAttendance", []).filter(function (a) { return a.id === id; }),
        submissions: load("demoSubmissions", []).filter(function (a) { return a.id === id; })
      };
    }
    var local = {
      pollGet: function () { return { counts: load("demoPoll", {}) }; },
      pollVote: function (p) {
        var voters = load("demoPollVoters", {});
        if (voters[p.voter]) throw new Error("이미 투표하셨습니다.");
        var counts = load("demoPoll", {});
        counts[p.option] = (counts[p.option] || 0) + 1;
        voters[p.voter] = p.option;
        save("demoPoll", counts); save("demoPollVoters", voters);
        return { counts: counts };
      },
      apply: function (p) {
        var list = load("demoApplications", []);
        if (p.data.studentId && list.some(function (a) { return a.studentId === p.data.studentId; })) {
          throw new Error("이미 신청된 학번입니다. 수정이 필요하면 교수자에게 문의해 주세요.");
        }
        list.push(Object.assign({ time: new Date().toISOString() }, p.data));
        save("demoApplications", list);
        return {};
      },
      login: function (p) {
        // 관리자가 명단을 등록했다면 명단과 맞는지 확인 (서버와 같은 규칙)
        var roster = load("demoRoster", []);
        if (roster.length) {
          var row = roster.filter(function (r) { return String(r.id) === p.id && String(r.name) === p.name; })[0];
          if (!row) throw new Error("학번 또는 이름이 수강생 명단과 다릅니다.");
          if (row.pin && String(row.pin) !== p.pin) throw new Error("인증번호가 맞지 않습니다.");
        }
        var token = "demo-" + Math.random().toString(36).slice(2);
        var sessions = load("demoSessions", {});
        sessions[token] = { id: p.id, name: p.name };
        save("demoSessions", sessions);
        return Object.assign({ token: token, id: p.id, name: p.name }, myRecords(p.id));
      },
      me: function (p) { var s = session(p.token); return Object.assign({ id: s.id, name: s.name }, myRecords(s.id)); },
      attend: function (p) {
        var s = session(p.token);
        if (p.date !== S.dateKey(S.now())) throw new Error("오늘 수업에만 출석할 수 있습니다.");
        var list = load("demoAttendance", []);
        if (list.some(function (a) { return a.id === s.id && a.week === p.week; })) throw new Error("이미 출석하셨습니다.");
        list.push({ id: s.id, name: s.name, week: p.week, date: p.date, time: S.now().toISOString() });
        save("demoAttendance", list);
        return myRecords(s.id);
      },
      submit: function (p) {
        var s = session(p.token);
        var list = load("demoSubmissions", []);
        // 체험 모드에서는 파일 내용은 저장하지 않고 이름·크기만 기록합니다.
        list.push({ id: s.id, name: s.name, week: p.week, title: p.title, fileName: p.fileName, size: p.size, time: S.now().toISOString(), late: !!p.late });
        save("demoSubmissions", list);
        return myRecords(s.id);
      },

      /* 공지 (누구나 읽기) */
      noticeList: function () { return { notices: load("demoNotices", []) }; },

      /* 관리자 전용 */
      adminLogin: function () { return { token: "demo-admin" }; },
      noticeAdd: function (p) {
        needAdmin(p.token);
        var list = load("demoNotices", []);
        list.unshift({ id: "n" + Date.now(), time: new Date().toISOString(), title: p.title, body: p.body, important: !!p.important });
        save("demoNotices", list);
        return { notices: list };
      },
      noticeDelete: function (p) {
        needAdmin(p.token);
        var list = load("demoNotices", []).filter(function (n) { return n.id !== p.id; });
        save("demoNotices", list);
        return { notices: list };
      },
      rosterGet: function (p) { needAdmin(p.token); return { roster: load("demoRoster", []) }; },
      rosterSave: function (p) { needAdmin(p.token); save("demoRoster", p.roster || []); return { roster: p.roster || [] }; },
      adminData: function (p) {
        needAdmin(p.token);
        var fields = (C.applyForm || {}).fields || [];
        var apps = load("demoApplications", []);
        return {
          applications: {
            headers: ["시각"].concat(fields.map(function (f) { return f.type === "checkbox" ? "개인정보 동의" : f.label; })),
            rows: apps.map(function (a) {
              return [a.time].concat(fields.map(function (f) {
                var v = a[f.name];
                return v === true ? "동의" : v === false || v == null ? "" : v;
              }));
            })
          },
          attendance: load("demoAttendance", []),
          submissions: load("demoSubmissions", []),
          roster: load("demoRoster", [])
        };
      }
    };
    function needAdmin(token) { if (token !== "demo-admin") throw new Error("관리자 로그인이 필요합니다."); }

    function call(action, payload) {
      if (!demo) return remote(action, payload);
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          try { resolve(local[action](payload || {})); } catch (e) { reject(e); }
        }, 350);
      });
    }
    return { call: call, demo: demo };
  })();
  S.API = API;
  S.store = { load: load, save: save, remove: remove };

  function demoNote(text) {
    if (!API.demo) return null;
    var n = el("p", "demo-note");
    n.appendChild(el("strong", null, "체험 모드 "));
    n.appendChild(document.createTextNode(text));
    return n;
  }

  /* ════════════════════════════════════════════════
   *  0. 공지사항 (관리자가 올린 글)
   * ════════════════════════════════════════════════ */
  (function () {
    var N = C.notice || {}, sec = document.getElementById("notice");
    if (!sec) return;
    sec.hidden = true;
    var c = S.container(sec);
    var showAll = false, notices = [];
    function render() {
      c.textContent = "";
      sec.hidden = !notices.length;
      if (!notices.length) return;
      var head = el("div", "notice-head");
      head.appendChild(el("h2", null, "📢 " + (N.title || "공지사항")));
      c.appendChild(head);
      // 중요 공지를 먼저, 그다음 최신순
      var sorted = notices.slice().sort(function (a, b) {
        return (b.important ? 1 : 0) - (a.important ? 1 : 0) || new Date(b.time) - new Date(a.time);
      });
      var max = N.maxShown || 3;
      var list = el("div", "notice-list");
      sorted.slice(0, showAll ? sorted.length : max).forEach(function (n) {
        var d = el("details", "card notice-item" + (n.important ? " important" : ""));
        var sm = el("summary");
        if (n.important) sm.appendChild(el("span", "tag tag-next", "중요"));
        sm.appendChild(el("span", "notice-title", n.title));
        sm.appendChild(el("span", "notice-date", S.fmtDate(new Date(n.time))));
        d.appendChild(sm);
        if (n.body) d.appendChild(el("p", "notice-body", n.body));
        list.appendChild(d);
      });
      c.appendChild(list);
      if (sorted.length > max) {
        var more = el("button", "link-btn notice-more", showAll ? "접기" : "공지 " + sorted.length + "개 모두 보기");
        more.addEventListener("click", function () { showAll = !showAll; render(); });
        c.appendChild(more);
      }
    }
    S.reloadNotices = function () {
      return API.call("noticeList").then(function (res) { notices = res.notices || []; render(); }, function () {});
    };
    S.reloadNotices();
  })();

  /* ════════════════════════════════════════════════
   *  1. 주제 투표 + 막대그래프
   * ════════════════════════════════════════════════ */
  (function () {
    var P = C.poll, sec = document.getElementById("poll");
    if (!P || !P.options || !P.options.length) { if (sec) sec.hidden = true; return; }
    var c = S.container(sec);
    c.appendChild(S.sectionHead(P.title, P.subtitle));

    var card = el("div", "card poll-card");
    c.appendChild(card);
    var note = demoNote("결과가 이 브라우저에만 저장됩니다. 구글 시트를 연결하면 모든 수강생의 투표가 모입니다.");

    var voter = load("voterId", null);
    if (!voter) { voter = "v-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); save("voterId", voter); }
    var myVote = load("myVote", null);
    var counts = {};
    var showResults = !!myVote;

    // 투표 화면
    var form = el("form", "poll-form");
    var fs = el("fieldset");
    fs.appendChild(el("legend", "sr-only", P.title));
    P.options.forEach(function (opt, i) {
      var lab = el("label", "poll-option");
      var r = el("input"); r.type = "radio"; r.name = "poll"; r.value = opt; r.id = "poll-" + i;
      lab.appendChild(r);
      lab.appendChild(el("span", "poll-dot"));
      lab.appendChild(el("span", "poll-text", opt));
      fs.appendChild(lab);
    });
    form.appendChild(fs);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    form.appendChild(msg);
    var actions = el("div", "poll-actions");
    var voteBtn = el("button", "btn primary", "투표하기"); voteBtn.type = "submit";
    var peek = el("button", "link-btn", "결과만 보기"); peek.type = "button";
    actions.appendChild(voteBtn); actions.appendChild(peek);
    form.appendChild(actions);

    // 결과 화면
    var result = el("div", "poll-result");
    var bars = el("div", "poll-bars");
    var meta = el("p", "poll-meta"); meta.setAttribute("aria-live", "polite");
    var back = el("button", "link-btn", "← 투표하러 가기"); back.type = "button";
    result.appendChild(bars); result.appendChild(meta); result.appendChild(back);

    card.appendChild(form); card.appendChild(result);
    if (note) card.appendChild(note);

    function render() {
      form.hidden = showResults;
      result.hidden = !showResults;
      back.hidden = !!myVote;
      if (!showResults) return;
      var total = P.options.reduce(function (s, o) { return s + (counts[o] || 0); }, 0);
      var max = Math.max.apply(null, P.options.map(function (o) { return counts[o] || 0; }).concat([1]));
      bars.textContent = "";
      P.options.forEach(function (o) {
        var n = counts[o] || 0, pct = total ? Math.round(n / total * 100) : 0;
        var row = el("div", "poll-row" + (o === myVote ? " mine" : ""));
        row.title = o + ": " + n + "표 (" + pct + "%)";
        var top = el("div", "poll-row-top");
        var name = el("span", "poll-name", o);
        if (o === myVote) name.appendChild(el("span", "tag tag-mine", "내 선택"));
        top.appendChild(name);
        top.appendChild(el("span", "poll-val", n + "표 · " + pct + "%"));
        row.appendChild(top);
        var track = el("div", "poll-track");
        var fill = el("div", "poll-fill");
        track.appendChild(fill);
        row.appendChild(track);
        bars.appendChild(row);
        // 막대 길이: 가장 많은 표를 100%로 맞춰 차이가 잘 보이게
        requestAnimationFrame(function () { fill.style.width = (n / max * 100) + "%"; });
        setTimeout(function () { fill.style.width = (n / max * 100) + "%"; }, 50);
      });
      var t = new Date();
      meta.textContent = "총 " + total + "명 참여 · " + (P.refreshSeconds || 10) + "초마다 갱신 · 마지막 갱신 " + hhmm(t) + ":" + pad(t.getSeconds());
    }

    function refresh() {
      return API.call("pollGet").then(function (res) { counts = res.counts || {}; render(); }, function () {
        if (showResults) meta.textContent = "결과를 불러오지 못했습니다. 잠시 후 다시 시도합니다.";
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = form.querySelector("input:checked");
      if (!picked) { msg.textContent = "주제를 하나 골라 주세요."; return; }
      msg.textContent = "";
      voteBtn.disabled = true; voteBtn.textContent = "투표 중…";
      API.call("pollVote", { option: picked.value, voter: voter }).then(function (res) {
        myVote = picked.value; save("myVote", myVote);
        counts = res.counts || counts; showResults = true; render();
      }, function (err) {
        msg.textContent = err.message;
        if (/이미/.test(err.message)) { myVote = myVote || picked.value; save("myVote", myVote); showResults = true; refresh(); }
      }).then(function () { voteBtn.disabled = false; voteBtn.textContent = "투표하기"; });
    });
    peek.addEventListener("click", function () { showResults = true; refresh(); });
    back.addEventListener("click", function () { showResults = false; render(); });

    render();
    refresh();
    // 실시간 갱신: 화면이 보일 때만 주기적으로 다시 불러오기
    setInterval(function () { if (showResults && !document.hidden) refresh(); }, (P.refreshSeconds || 10) * 1000);
    document.addEventListener("visibilitychange", function () { if (showResults && !document.hidden) refresh(); });
    // 체험 모드: 같은 브라우저의 다른 탭에서 투표하면 바로 반영
    window.addEventListener("storage", function (e) { if (e.key === PREFIX + "demoPoll") refresh(); });
  })();

  /* ════════════════════════════════════════════════
   *  2. 수강 신청서 (빠진 항목 안내)
   * ════════════════════════════════════════════════ */
  (function () {
    var F = C.applyForm, host = document.querySelector("#enroll .container");
    if (!F || !host) return;
    var wrap = el("div", "apply-wrap");
    wrap.id = "apply";
    wrap.appendChild(el("h3", "sub-title", F.title));
    var card = el("div", "card apply-card");
    wrap.appendChild(card);
    host.insertBefore(wrap, host.children[1] || null);   // 섹션 제목 바로 아래

    var form = el("form", "apply-form");
    form.noValidate = true;
    if (F.intro) form.appendChild(el("p", "form-intro", F.intro));
    var summary = el("div", "error-summary");
    summary.setAttribute("role", "alert");
    summary.tabIndex = -1;
    summary.hidden = true;
    form.appendChild(summary);

    var grid = el("div", "form-grid");
    form.appendChild(grid);
    var fields = F.fields || [];
    fields.forEach(function (f) { grid.appendChild(buildField(f)); });

    var serverMsg = el("p", "form-msg"); serverMsg.setAttribute("role", "alert");
    form.appendChild(serverMsg);
    var submit = el("button", "btn primary", F.submitLabel || "제출"); submit.type = "submit";
    form.appendChild(submit);
    var note = demoNote("신청서는 이 브라우저에만 저장됩니다.");
    if (note) form.appendChild(note);
    card.appendChild(form);

    function buildField(f) {
      var id = "apply-" + f.name;
      var box = el("div", "field" + (f.type === "textarea" || f.type === "radio" || f.type === "checkbox" ? " wide" : ""));
      box.dataset.name = f.name;
      var err = el("p", "field-error"); err.id = id + "-err";
      if (f.type === "radio") {
        var fs = el("fieldset");
        var lg = el("legend", "field-label", f.label);
        if (f.required) lg.appendChild(el("span", "req", " *"));
        fs.appendChild(lg);
        var opts = el("div", "choice-row");
        f.options.forEach(function (o, i) {
          var lab = el("label", "choice");
          var r = el("input"); r.type = "radio"; r.name = f.name; r.value = o; r.id = id + "-" + i;
          r.setAttribute("aria-describedby", err.id);
          lab.appendChild(r); lab.appendChild(el("span", null, o));
          opts.appendChild(lab);
        });
        fs.appendChild(opts);
        box.appendChild(fs);
      } else if (f.type === "checkbox") {
        var lab = el("label", "check");
        var cb = el("input"); cb.type = "checkbox"; cb.name = f.name; cb.id = id;
        cb.setAttribute("aria-describedby", err.id);
        lab.appendChild(cb);
        var t = el("span", null, f.label);
        if (f.required) t.appendChild(el("span", "req", " *"));
        lab.appendChild(t);
        box.appendChild(lab);
      } else {
        var l = el("label", "field-label", f.label); l.htmlFor = id;
        if (f.required) l.appendChild(el("span", "req", " *"));
        box.appendChild(l);
        var input;
        if (f.type === "select") {
          input = el("select");
          var ph = el("option", null, "선택해 주세요"); ph.value = "";
          input.appendChild(ph);
          f.options.forEach(function (o) { var op = el("option", null, o); op.value = o; input.appendChild(op); });
        } else if (f.type === "textarea") {
          input = el("textarea"); input.rows = 4;
        } else {
          input = el("input"); input.type = f.type || "text";
          if (f.type === "tel") input.inputMode = "tel";
          if (f.type === "email") input.autocomplete = "email";
          if (f.name === "name") input.autocomplete = "name";
        }
        input.id = id; input.name = f.name;
        if (f.placeholder) input.placeholder = f.placeholder;
        input.setAttribute("aria-describedby", err.id);
        box.appendChild(input);
      }
      box.appendChild(err);
      return box;
    }

    function valueOf(f) {
      if (f.type === "radio") { var r = form.querySelector('input[name="' + f.name + '"]:checked'); return r ? r.value : ""; }
      if (f.type === "checkbox") return form.elements[f.name].checked;
      return form.elements[f.name].value.trim();
    }
    function check(f) {
      var v = valueOf(f);
      if (f.type === "checkbox") return f.required && !v ? "동의가 필요합니다." : "";
      if (!v) {
        if (!f.required) return "";
        return eulReul(f.label) + ((f.type === "select" || f.type === "radio") ? " 선택해 주세요." : " 입력해 주세요.");
      }
      if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "이메일 주소 형식이 올바르지 않습니다.";
      if (f.pattern && !new RegExp(f.pattern).test(v)) return f.patternMessage || f.label + " 형식을 확인해 주세요.";
      if (f.minLength && v.length < f.minLength) return "최소 " + f.minLength + "자 이상 적어 주세요. (지금 " + v.length + "자)";
      return "";
    }
    function show(f, message) {
      var box = form.querySelector('.field[data-name="' + f.name + '"]');
      box.classList.toggle("invalid", !!message);
      box.querySelector(".field-error").textContent = message;
      box.querySelectorAll("input, select, textarea").forEach(function (i) {
        if (message) i.setAttribute("aria-invalid", "true"); else i.removeAttribute("aria-invalid");
      });
    }
    function firstControl(f) { return form.querySelector('.field[data-name="' + f.name + '"] input, .field[data-name="' + f.name + '"] select, .field[data-name="' + f.name + '"] textarea'); }

    var tried = false;
    function validateAll() {
      var bad = [];
      fields.forEach(function (f) { var m = check(f); show(f, m); if (m) bad.push({ f: f, m: m }); });
      summary.textContent = "";
      summary.hidden = !bad.length;
      if (bad.length) {
        summary.appendChild(el("strong", null, "확인이 필요한 항목이 " + bad.length + "개 있습니다."));
        var ul = el("ul");
        bad.forEach(function (b) {
          var li = el("li"), a = el("a", null, b.f.label.replace(/\s*\(.*\)$/, "") + " — " + b.m);
          a.href = "#apply-" + b.f.name;
          a.addEventListener("click", function (e) { e.preventDefault(); firstControl(b.f).focus(); });
          li.appendChild(a); ul.appendChild(li);
        });
        summary.appendChild(ul);
      }
      return bad;
    }
    // 한 번 제출을 시도한 뒤에는 고치는 즉시 안내가 사라지도록
    form.addEventListener("input", function (e) {
      if (!tried) return;
      var f = fields.filter(function (x) { return x.name === e.target.name; })[0];
      if (f) { show(f, check(f)); if (!summary.hidden) validateAll(); }
    });
    form.addEventListener("change", function () { if (tried) validateAll(); });
    form.addEventListener("focusout", function (e) {
      var f = fields.filter(function (x) { return x.name === e.target.name; })[0];
      if (f && f.type !== "radio" && f.type !== "checkbox" && valueOf(f)) show(f, check(f));
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      tried = true;
      serverMsg.textContent = "";
      var bad = validateAll();
      if (bad.length) { summary.focus(); return; }
      var data = {}, labels = {};
      fields.forEach(function (f) {
        data[f.name] = valueOf(f);
        labels[f.name] = f.type === "checkbox" ? "개인정보 동의" : f.label;   // 시트의 열 제목
      });
      submit.disabled = true; submit.textContent = "제출 중…";
      API.call("apply", { data: data, labels: labels }).then(function () {
        card.textContent = "";
        var ok = el("div", "apply-success");
        ok.appendChild(el("div", "success-icon", "✓"));
        ok.appendChild(el("h4", null, F.successTitle || "신청이 접수되었습니다"));
        ok.appendChild(el("p", null, data.name + " 님, " + (F.successText || "")));
        card.appendChild(ok);
        ok.tabIndex = -1; ok.focus();
        burst({ x: 0.5, y: 0.5, count: 80 });
      }, function (err) {
        serverMsg.textContent = err.message;
        submit.disabled = false; submit.textContent = F.submitLabel || "제출";
      });
    });
  })();

  /* ════════════════════════════════════════════════
   *  3. 수강생 공간: 로그인 · 출석 · 과제 제출
   * ════════════════════════════════════════════════ */
  (function () {
    var U = C.student, sec = document.getElementById("student");
    if (!U) { if (sec) sec.hidden = true; return; }
    var c = S.container(sec);
    c.appendChild(S.sectionHead(U.title, U.subtitle));
    var root = el("div", "student-root");
    c.appendChild(root);
    var anchor = el("div"); anchor.id = "submit"; anchor.className = "anchor";

    var sessionInfo = load("session", null, true);
    var records = { attendance: [], submissions: [] };
    var pendingWeek = null;
    var assignments = S.weeks.filter(function (w) { return w.data.assignment; });

    function renderLogin(message) {
      root.textContent = "";
      root.appendChild(anchor);
      var card = el("form", "card login-card");
      card.noValidate = true;
      card.appendChild(el("div", "card-icon", "🔐"));
      card.appendChild(el("h3", null, "수강생 로그인"));
      card.appendChild(el("p", null, "로그인하면 출석 체크와 과제 제출을 할 수 있습니다."));
      var inputs = [
        { name: "id", label: "학번", type: "text", mode: "numeric", auto: "username" },
        { name: "name", label: "이름", type: "text", auto: "name" }
      ];
      if (U.usePin) inputs.push({ name: "pin", label: "인증번호", type: "password", mode: "numeric", auto: "current-password", hint: "교수자가 안내한 번호" });
      inputs.forEach(function (f) {
        var box = el("div", "field");
        var l = el("label", "field-label", f.label); l.htmlFor = "login-" + f.name;
        box.appendChild(l);
        var i = el("input"); i.id = "login-" + f.name; i.name = f.name; i.type = f.type;
        if (f.mode) i.inputMode = f.mode;
        i.autocomplete = f.auto;
        if (f.hint) i.placeholder = f.hint;
        box.appendChild(i);
        card.appendChild(box);
      });
      var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
      if (message) msg.textContent = message;
      card.appendChild(msg);
      var btn = el("button", "btn primary", "로그인"); btn.type = "submit";
      card.appendChild(btn);
      var note = demoNote("아무 학번·이름" + (U.usePin ? "·인증번호" : "") + "로 들어와 기능을 시험해 볼 수 있습니다.");
      if (note) card.appendChild(note);
      card.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = { id: card.elements.id.value.trim(), name: card.elements.name.value.trim(), pin: U.usePin ? card.elements.pin.value.trim() : "" };
        var missing = [];
        if (!v.id) missing.push("학번");
        if (!v.name) missing.push("이름");
        if (U.usePin && !v.pin) missing.push("인증번호");
        if (missing.length) {
          msg.textContent = eulReul(missing.join(", ")) + " 입력해 주세요.";
          card.elements[!v.id ? "id" : !v.name ? "name" : "pin"].focus();
          return;
        }
        btn.disabled = true; btn.textContent = "확인 중…";
        API.call("login", v).then(function (res) {
          sessionInfo = { token: res.token, id: res.id, name: res.name };
          save("session", sessionInfo, true);
          records = { attendance: res.attendance || [], submissions: res.submissions || [] };
          renderSpace();
          var h = root.querySelector(".student-hello"); if (h) { h.tabIndex = -1; h.focus(); }
        }, function (err) {
          msg.textContent = err.message;
          btn.disabled = false; btn.textContent = "로그인";
        });
      });
      root.appendChild(card);
    }

    function renderSpace() {
      root.textContent = "";
      var bar = el("div", "student-bar");
      var hello = el("p", "student-hello");
      hello.appendChild(el("strong", null, sessionInfo.name + " 님"));
      hello.appendChild(document.createTextNode(" (" + sessionInfo.id + ")"));
      bar.appendChild(hello);
      var out = el("button", "chip-btn", "로그아웃");
      out.addEventListener("click", function () { remove("session", true); sessionInfo = null; renderLogin(); });
      bar.appendChild(out);
      root.appendChild(bar);

      var grid = el("div", "student-grid");
      grid.appendChild(attendanceCard());
      var subCard = submitCard();
      grid.appendChild(subCard);
      root.appendChild(grid);
      subCard.insertBefore(anchor, subCard.firstChild);
      var note = demoNote("출석·제출 기록은 이 브라우저에만 저장되고, 파일 내용은 저장되지 않습니다.");
      if (note) root.appendChild(note);
    }

    /* 출석 */
    function attendanceCard() {
      var card = el("div", "card attend-card");
      card.appendChild(el("div", "card-icon", "✅"));
      card.appendChild(el("h3", null, "출석 체크"));
      var todayKey = S.dateKey(S.now());
      var todayWeek = S.weeks.filter(function (w) { return S.dateKey(w.date) === todayKey; })[0];
      var attended = {};
      records.attendance.forEach(function (a) { attended[a.week] = a; });

      var box = el("div", "attend-today");
      if (todayWeek) {
        box.appendChild(el("p", "attend-info", "오늘은 " + todayWeek.no + "주차 수업일입니다 · " + todayWeek.data.title));
        if (attended[todayWeek.no]) {
          box.appendChild(el("p", "attend-done", "✓ 출석 완료 (" + hhmm(new Date(attended[todayWeek.no].time)) + ")"));
        } else {
          var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
          var btn = el("button", "btn primary attend-btn", "지금 출석하기");
          btn.addEventListener("click", function () {
            btn.disabled = true; btn.textContent = "확인 중…";
            API.call("attend", { token: sessionInfo.token, week: todayWeek.no, date: todayKey }).then(function (res) {
              records.attendance = res.attendance || records.attendance;
              renderSpace();
              burst({ x: 0.5, y: 0.4, count: 50 });
            }, function (err) { handleAuthError(err) || (msg.textContent = err.message); btn.disabled = false; btn.textContent = "지금 출석하기"; });
          });
          box.appendChild(btn);
          box.appendChild(msg);
        }
      } else {
        var next = S.weeks.filter(function (w) { return w.date > S.now(); })[0];
        box.appendChild(el("p", "attend-info", "오늘은 수업일이 아닙니다."));
        box.appendChild(el("p", "attend-sub", next ? "다음 수업: " + S.fmtDate(next.date) + " · " + next.no + "주차" : "이번 학기 수업이 모두 끝났습니다."));
      }
      card.appendChild(box);

      // 주차별 출석 현황
      var today0 = S.startOfDay(S.now());
      var past = 0, done = 0;
      var strip = el("ol", "attend-strip");
      S.weeks.forEach(function (w) {
        var state, label;
        if (attended[w.no]) { state = "done"; label = "출석"; done++; past++; }
        else if (w.date < today0) { state = "miss"; label = "미출석"; past++; }
        else if (S.dateKey(w.date) === todayKey) { state = "today"; label = "오늘"; }
        else { state = "future"; label = "예정"; }
        var li = el("li", "att " + state);
        li.appendChild(el("span", "att-no", w.no));
        li.appendChild(el("span", "att-label", label));
        li.title = w.no + "주차 · " + S.fmtDate(w.date) + " · " + label;
        strip.appendChild(li);
      });
      card.appendChild(el("p", "attend-sum", "출석 " + done + "회 / 지난 수업 " + past + "회"));
      card.appendChild(strip);
      return card;
    }

    /* 과제 제출 */
    function submitCard() {
      var card = el("div", "card submit-card");
      card.appendChild(el("div", "card-icon", "📤"));
      card.appendChild(el("h3", null, "과제 제출"));
      if (!assignments.length) { card.appendChild(el("p", null, "등록된 과제가 없습니다.")); return card; }

      var form = el("form", "submit-form");
      form.noValidate = true;
      var l = el("label", "field-label", "과제 선택"); l.htmlFor = "submit-week";
      var sel = el("select"); sel.id = "submit-week";
      var nowT = S.now();
      var defaultWeek = null;
      assignments.forEach(function (w) {
        var over = w.due && w.due <= nowT;
        var o = el("option", null, w.no + "주차 · " + w.data.assignment.title + (over ? " (마감)" : ""));
        o.value = w.no;
        if (over && !U.allowLate) o.disabled = true;
        sel.appendChild(o);
        if (!defaultWeek && !over) defaultWeek = w.no;
      });
      sel.value = pendingWeek || defaultWeek || assignments[assignments.length - 1].no;
      form.appendChild(l); form.appendChild(sel);

      var dueLine = el("p", "submit-due");
      var cd = el("span", "as-countdown");
      form.appendChild(dueLine);

      var drop = el("label", "dropzone");
      drop.htmlFor = "submit-file";
      var file = el("input"); file.type = "file"; file.id = "submit-file";
      if (U.accept) file.accept = U.accept;
      drop.appendChild(file);
      drop.appendChild(el("span", "drop-icon", "📎"));
      var dropText = el("span", "drop-text", "파일을 끌어다 놓거나 눌러서 선택하세요");
      drop.appendChild(dropText);
      drop.appendChild(el("span", "drop-hint", "최대 " + (U.maxFileMB || 10) + "MB" + (U.accept ? " · " + U.accept.replace(/\./g, "").replace(/,/g, ", ") : "")));
      form.appendChild(drop);

      var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
      form.appendChild(msg);
      var btn = el("button", "btn primary", "제출하기"); btn.type = "submit";
      form.appendChild(btn);
      card.appendChild(form);

      var histTitle = el("h4", "hist-title", "내 제출 내역");
      var hist = el("ul", "hist");
      card.appendChild(histTitle); card.appendChild(hist);

      var chosen = null;
      function currentWeek() { return S.weeks.filter(function (w) { return w.no === +sel.value; })[0]; }
      function updateDue() {
        var w = currentWeek();
        dueLine.textContent = "";
        if (!w || !w.due) return;
        dueLine.appendChild(document.createTextNode("마감 " + S.fmtDateTime(w.due) + " · "));
        cd.dataset.due = w.due.getTime();
        var rem = S.remaining(w.due);
        cd.textContent = rem.text; cd.className = "as-countdown " + rem.state;
        dueLine.appendChild(cd);
        var over = w.due <= S.now();
        btn.disabled = over && !U.allowLate;
        btn.textContent = over ? (U.allowLate ? "지각 제출하기" : "제출 마감") : "제출하기";
      }
      function pick(f) {
        msg.textContent = ""; msg.classList.remove("ok");
        var max = (U.maxFileMB || 10) * 1024 * 1024;
        if (f && f.size > max) { msg.textContent = "파일이 너무 큽니다. " + (U.maxFileMB || 10) + "MB 이하로 올려 주세요. (지금 " + mb(f.size) + ")"; f = null; }
        if (f && U.accept) {
          var ext = "." + (f.name.split(".").pop() || "").toLowerCase();
          if (U.accept.split(",").indexOf(ext) < 0) { msg.textContent = "올릴 수 없는 파일 형식입니다. (" + ext + ")"; f = null; }
        }
        chosen = f || null;
        drop.classList.toggle("has-file", !!chosen);
        dropText.textContent = chosen ? "📄 " + chosen.name + " (" + mb(chosen.size) + ")" : "파일을 끌어다 놓거나 눌러서 선택하세요";
        if (!chosen) file.value = "";
      }
      file.addEventListener("change", function () { pick(file.files[0]); });
      ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
      ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove("over"); }); });
      drop.addEventListener("drop", function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
      sel.addEventListener("change", function () { pendingWeek = +sel.value; updateDue(); renderHist(); });

      function renderHist() {
        hist.textContent = "";
        var mine = records.submissions.slice().sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
        if (!mine.length) { hist.appendChild(el("li", "hist-empty", "아직 제출한 과제가 없습니다.")); return; }
        mine.forEach(function (s) {
          var w = S.weeks.filter(function (x) { return x.no === +s.week; })[0];
          var li = el("li");
          li.appendChild(el("strong", null, (w ? w.no + "주차 · " + w.data.assignment.title : s.week + "주차")));
          var line = S.fmtDateTime(new Date(s.time)) + " · " + s.fileName + (s.size ? " (" + mb(s.size) + ")" : "");
          li.appendChild(el("span", null, line));
          if (s.late) li.appendChild(el("span", "tag tag-exam", "지각"));
          if (s.url) { var a = el("a", null, "파일 보기"); a.href = s.url; a.target = "_blank"; a.rel = "noopener"; li.appendChild(a); }
          hist.appendChild(li);
        });
      }

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        msg.textContent = ""; msg.classList.remove("ok");
        var w = currentWeek();
        if (!w) { msg.textContent = "과제를 선택해 주세요."; sel.focus(); return; }
        if (!chosen) { msg.textContent = "제출할 파일을 선택해 주세요."; file.focus(); return; }
        var late = w.due && w.due <= S.now();
        if (late && !U.allowLate) { msg.textContent = "마감된 과제입니다."; return; }
        btn.disabled = true; btn.textContent = "올리는 중…";
        readFile(chosen).then(function (data) {
          return API.call("submit", {
            token: sessionInfo.token, week: w.no, title: w.data.assignment.title,
            fileName: chosen.name, mimeType: chosen.type || "application/octet-stream", size: chosen.size,
            late: !!late, data: API.demo ? undefined : data
          });
        }).then(function (res) {
          records.submissions = res.submissions || records.submissions;
          pick(null);
          renderHist();
          msg.textContent = "✓ 제출되었습니다.";
          msg.classList.add("ok");
          updateDue();
        }, function (err) {
          handleAuthError(err) || (msg.textContent = err.message);
          updateDue();
        });
      });

      updateDue();
      renderHist();
      pendingWeek = null;
      return card;
    }

    function readFile(f) {
      if (API.demo) return Promise.resolve(null);
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(String(r.result).split(",")[1]); };
        r.onerror = function () { reject(new Error("파일을 읽지 못했습니다.")); };
        r.readAsDataURL(f);
      });
    }
    function mb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + "MB" : Math.max(1, Math.round(n / 1024)) + "KB"; }
    function handleAuthError(err) {
      if (!/로그인/.test(err.message)) return false;
      remove("session", true); sessionInfo = null; renderLogin(err.message);
      return true;
    }

    // 커리큘럼의 '사이트에서 제출하기' 버튼에서 호출
    S.selectAssignment = function (week) {
      pendingWeek = week;
      if (sessionInfo) {
        var sel = document.getElementById("submit-week");
        if (sel) { sel.value = week; sel.dispatchEvent(new Event("change")); }
      } else {
        renderLogin("과제를 제출하려면 먼저 로그인해 주세요.");
        setTimeout(function () { var i = document.getElementById("login-id"); if (i) i.focus({ preventScroll: true }); }, 400);
      }
    };

    if (sessionInfo) {
      renderSpace();
      API.call("me", { token: sessionInfo.token }).then(function (res) {
        records = { attendance: res.attendance || [], submissions: res.submissions || [] };
        renderSpace();
      }, function (err) { handleAuthError(err); });
    } else {
      renderLogin();
    }
  })();

  /* ════════════════════════════════════════════════
   *  4. 첫 방문 환영 폭죽 + 5. 수강 신청 안내 팝업
   * ════════════════════════════════════════════════ */
  var firstVisit = !load("visited", false);
  if (firstVisit) save("visited", true);

  if (C.welcome && C.welcome.enabled !== false && firstVisit) {
    setTimeout(function () {
      burst({ x: 0.15, y: 0.9, count: 90, angle: -60 });
      burst({ x: 0.85, y: 0.9, count: 90, angle: -120 });
      if (C.welcome.message) toast(C.welcome.message);
    }, 400);
  }

  (function () {
    var P = C.popup;
    if (!P || P.enabled === false) return;
    if (load("popupHideUntil", 0) > Date.now()) return;
    setTimeout(openPopup, (P.delaySeconds == null ? 1.5 : P.delaySeconds) * 1000);

    function openPopup() {
      var prevFocus = document.activeElement;
      var overlay = el("div", "modal-overlay");
      var box = el("div", "modal");
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-labelledby", "modal-title");
      var x = el("button", "modal-x", "×"); x.setAttribute("aria-label", "닫기");
      box.appendChild(x);
      box.appendChild(el("div", "modal-icon", "🌸"));
      var h = el("h2", null, P.title); h.id = "modal-title";
      box.appendChild(h);
      if (P.text) box.appendChild(el("p", null, P.text));
      var acts = el("div", "modal-actions");
      var go = el("a", "btn primary", P.buttonLabel || "자세히 보기");
      go.href = P.link || "#apply";
      acts.appendChild(go);
      box.appendChild(acts);
      var foot = el("div", "modal-foot");
      var hide = el("button", "link-btn", "오늘 하루 보지 않기");
      var close = el("button", "link-btn", "닫기");
      foot.appendChild(hide); foot.appendChild(close);
      box.appendChild(foot);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      document.body.classList.add("modal-open");
      requestAnimationFrame(function () { overlay.classList.add("show"); });
      setTimeout(function () { overlay.classList.add("show"); }, 30);
      go.focus();

      function dismiss() {
        overlay.classList.remove("show");
        document.body.classList.remove("modal-open");
        document.removeEventListener("keydown", onKey);
        setTimeout(function () { overlay.remove(); }, 250);
        if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
      }
      function onKey(e) {
        if (e.key === "Escape") dismiss();
        if (e.key === "Tab") {   // 팝업 안에서만 이동
          var f = box.querySelectorAll("a, button");
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener("keydown", onKey);
      x.addEventListener("click", dismiss);
      close.addEventListener("click", dismiss);
      go.addEventListener("click", dismiss);
      overlay.addEventListener("click", function (e) { if (e.target === overlay) dismiss(); });
      hide.addEventListener("click", function () {
        var end = new Date(); end.setHours(23, 59, 59, 999);
        save("popupHideUntil", end.getTime());
        dismiss();
      });
    }
  })();

  /* ── 알림 문구 ── */
  function toast(text) {
    var t = el("div", "toast", text);
    t.setAttribute("role", "status");
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("show"); }, 30);
    setTimeout(function () { t.classList.remove("show"); setTimeout(function () { t.remove(); }, 400); }, 3800);
  }

  /* ── 폭죽 효과 (벚꽃 색 종이 조각) ── */
  function burst(opt) {
    if (S.reduceMotion) return;
    var canvas = document.querySelector(".confetti");
    if (!canvas) {
      canvas = el("canvas", "confetti");
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
    }
    var ctx = canvas.getContext("2d");
    var dpr = window.devicePixelRatio || 1;
    function size() { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size();
    var colors = ["#f4b3cf", "#e27aa8", "#fad4e4", "#b49ae3", "#e2d4f6", "#ffd6a5", "#ffffff"];
    var parts = canvas._parts || (canvas._parts = []);
    var baseAngle = (opt.angle == null ? -90 : opt.angle) * Math.PI / 180;
    var spread = opt.angle == null ? Math.PI * 2 : Math.PI / 3;
    for (var i = 0; i < (opt.count || 80); i++) {
      var a = opt.angle == null ? Math.random() * spread : baseAngle + (Math.random() - 0.5) * spread;
      var v = 6 + Math.random() * (opt.angle == null ? 6 : 10);
      parts.push({
        x: opt.x * innerWidth, y: opt.y * innerHeight,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
        shape: Math.random() < 0.4 ? "petal" : Math.random() < 0.5 ? "rect" : "circle",
        color: colors[(Math.random() * colors.length) | 0], life: 0
      });
    }
    if (canvas._running) return;
    canvas._running = true;
    var last = performance.now();
    function frame(t) {
      var dt = Math.min(2, (t - last) / 16.7); last = t;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.vy += 0.25 * dt; p.vx *= Math.pow(0.985, dt); p.vy *= Math.pow(0.985, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life += dt;
        if (p.y > innerHeight + 30 || p.life > 260) { parts.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - p.life / 260);
        ctx.fillStyle = p.color;
        if (p.color === "#ffffff") { ctx.strokeStyle = "#f4b3cf"; ctx.lineWidth = 1; }
        ctx.beginPath();
        if (p.shape === "petal") { ctx.ellipse(0, 0, p.w * 0.6, p.h * 0.45, 0, 0, Math.PI * 2); }
        else if (p.shape === "circle") { ctx.arc(0, 0, p.h * 0.45, 0, Math.PI * 2); }
        else { ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h); }
        ctx.fill();
        if (p.color === "#ffffff") ctx.stroke();
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(frame);
      else { canvas._running = false; canvas.remove(); }
    }
    requestAnimationFrame(frame);
    window.addEventListener("resize", size, { once: true });
  }
})();
