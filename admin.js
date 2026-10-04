/*
 * 관리자 화면 — 오른쪽 위 자물쇠 아이콘으로 엽니다.
 * 내용 편집 · 공지 · 수강생 명단 · 기록 내려받기 · 설정 파일 저장/불러오기 · 비밀번호 변경
 */
(function () {
  "use strict";
  var S = window.SITE;
  if (!S || !S.API) return;
  var C = S.config, el = S.el, API = S.API, store = S.store;
  var lockBtn = document.querySelector(".admin-lock");
  if (!lockBtn) return;

  /* ════════════════════════════════════════════════
   *  비밀번호 확인: 비밀번호 대신 해시값만 비교합니다
   *  해시 = SHA-256을 1000번 반복 ( salt + ":" + 비밀번호 )
   * ════════════════════════════════════════════════ */
  function utf8(s) { return new TextEncoder().encode(s); }
  function toHex(b) { return Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }
  function digest(bytes) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest("SHA-256", bytes).then(function (b) { return new Uint8Array(b); });
    }
    return Promise.resolve(sha256Fallback(bytes));
  }
  function hashPassword(pw, salt) {
    var p = Promise.resolve(utf8(salt + ":" + pw));
    for (var i = 0; i < 1000; i++) p = p.then(digest);
    return p.then(toHex);
  }
  // 오래된 브라우저용 SHA-256
  function sha256Fallback(msg) {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var l = msg.length, nBlocks = ((l + 8) >> 6) + 1, W = new Array(64);
    var words = new Array(nBlocks * 16).fill(0);
    for (var i = 0; i < l; i++) words[i >> 2] |= msg[i] << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    words[nBlocks * 16 - 1] = l * 8;
    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var b = 0; b < nBlocks; b++) {
      for (var t = 0; t < 64; t++) {
        if (t < 16) W[t] = words[b * 16 + t];
        else {
          var s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
          var s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
          W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
        }
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
        var t1 = (h + S1 + ch + K[t] + W[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = new Uint8Array(32);
    for (i = 0; i < 8; i++) { out[i * 4] = H[i] >>> 24; out[i * 4 + 1] = H[i] >>> 16; out[i * 4 + 2] = H[i] >>> 8; out[i * 4 + 3] = H[i]; }
    return out;
  }
  function randomSalt() {
    var b = new Uint8Array(8);
    (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach(function (_, i) { b[i] = Math.random() * 256; });
    return toHex(b);
  }

  /* ── 상태 ── */
  var unlocked = store.load("adminUnlocked", false, true);
  var adminToken = store.load("adminToken", null, true);
  var draft = clone(C);
  var dirty = false;
  var overlay = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function markDirty() { dirty = true; if (overlay) overlay.classList.add("dirty"); }
  function fmtTime(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return iso || "";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") +
      " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  /* ── 엑셀로 열 수 있는 CSV 내려받기 (한글 깨짐 방지 BOM 포함) ── */
  function downloadCSV(name, rows) {
    var csv = rows.map(function (r) {
      return r.map(function (v) {
        v = v == null ? "" : String(v);
        // 학생이 쓴 글이 =, +, -, @로 시작하면 엑셀이 수식으로 실행하지 않도록
        if (/^[=+\-@]/.test(v)) v = "'" + v;
        // 숫자로만 된 학번 등은 엑셀이 지수표기/앞자리 0 삭제를 하지 않도록 글자로 표시
        if (/^0\d+$|^\d{11,}$/.test(v)) v = "=\"" + v + "\"";
        return /[",\n\r]/.test(v) && v.indexOf("=\"") !== 0 ? "\"" + v.replace(/"/g, "\"\"") + "\"" : v;
      }).join(",");
    }).join("\r\n");
    downloadFile(name, "﻿" + csv, "text/csv;charset=utf-8");
  }
  function downloadFile(name, text, type) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function today() { return S.dateKey(new Date()); }

  /* ── 미리 보기 중 알림 띠 ── */
  if (S.draftActive) {
    var bar = el("div", "draft-bar");
    bar.setAttribute("role", "status");
    var waiting = store.load("publishedAt", 0) > Date.now() - 30 * 60000;
    bar.appendChild(el("span", null, waiting
      ? "GitHub에 저장됨 · 사이트에 반영되면 이 표시가 사라집니다"
      : "관리자 미리 보기 중 · 이 브라우저에서만 보입니다"));
    var saveB = el("button", "chip-btn", waiting ? "다시 저장" : targetLabel(getTarget()));
    saveB.addEventListener("click", function () {
      saveB.disabled = true;
      saveToSite(C).then(function (text) { alert(text); location.reload(); }, function (e) { alert(e.message); saveB.disabled = false; });
    });
    var resetB = el("button", "chip-btn", "원래대로");
    resetB.addEventListener("click", function () {
      if (!confirm("미리 보기를 끝내고 config.js의 원래 설정으로 되돌릴까요?\n저장하지 않은 수정 내용은 사라집니다.")) return;
      store.remove("configDraft"); location.reload();
    });
    bar.appendChild(saveB); bar.appendChild(resetB);
    document.body.appendChild(bar);
  }

  lockBtn.addEventListener("click", function () { unlocked ? openPanel() : openLogin(); });
  lockBtn.classList.toggle("unlocked", !!unlocked);

  // '적용' 후 새로고침되면 관리자 화면을 다시 열어 둠
  var reopen = store.load("adminReopen", null, true);
  var reopenMessage = reopen && reopen.message;
  if (reopen && unlocked) { store.remove("adminReopen", true); setTimeout(function () { openPanel(reopen.tab, reopen.section); }, 300); }

  /* ════════════════════════════════════════════════
   *  로그인
   * ════════════════════════════════════════════════ */
  var failCount = 0, lockedUntil = 0;
  function openLogin() {
    var ov = el("div", "modal-overlay");
    var box = el("form", "modal admin-login");
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "admin-login-title");
    var x = el("button", "modal-x", "×"); x.type = "button"; x.setAttribute("aria-label", "닫기");
    box.appendChild(x);
    box.appendChild(el("div", "modal-icon", "🔒"));
    var h = el("h2", null, "관리자 로그인"); h.id = "admin-login-title";
    box.appendChild(h);
    var lab = el("label", "sr-only", "관리자 비밀번호"); lab.htmlFor = "admin-pw";
    box.appendChild(lab);
    var pw = el("input", "admin-pw"); pw.type = "password"; pw.id = "admin-pw"; pw.placeholder = "비밀번호"; pw.autocomplete = "current-password";
    box.appendChild(pw);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    box.appendChild(msg);
    var btn = el("button", "btn primary", "들어가기"); btn.type = "submit";
    var acts = el("div", "modal-actions"); acts.appendChild(btn);
    box.appendChild(acts);
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.body.classList.add("modal-open");
    setTimeout(function () { ov.classList.add("show"); pw.focus(); }, 20);

    function close() {
      ov.classList.remove("show"); document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { ov.remove(); }, 250);
      lockBtn.focus();
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    x.addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });

    box.addEventListener("submit", function (e) {
      e.preventDefault();
      if (Date.now() < lockedUntil) { msg.textContent = "잠시 후 다시 시도해 주세요. (" + Math.ceil((lockedUntil - Date.now()) / 1000) + "초)"; return; }
      var value = pw.value;
      if (!value) { msg.textContent = "비밀번호를 입력해 주세요."; pw.focus(); return; }
      var A = C.admin || {};
      if (!A.passwordHash) { msg.textContent = "config.js에 관리자 비밀번호가 설정되어 있지 않습니다."; return; }
      btn.disabled = true; btn.textContent = "확인 중…";
      hashPassword(value, A.salt || "").then(function (hex) {
        if (hex !== A.passwordHash) {
          failCount++;
          if (failCount >= 5) { lockedUntil = Date.now() + 30000; failCount = 0; msg.textContent = "5번 틀렸습니다. 30초 뒤에 다시 시도해 주세요."; }
          else msg.textContent = "비밀번호가 맞지 않습니다.";
          pw.select();
          btn.disabled = false; btn.textContent = "들어가기";
          return;
        }
        // 구글 시트 연결 시: 서버에서도 비밀번호를 확인받아야 기록을 볼 수 있음
        return API.call("adminLogin", { password: value }).then(function (res) {
          adminToken = res.token; store.save("adminToken", adminToken, true);
        }, function (err) {
          adminToken = null;
          store.save("adminServerError", err.message, true);
        }).then(function () {
          unlocked = true; store.save("adminUnlocked", true, true);
          lockBtn.classList.add("unlocked");
          close();
          openPanel();
        });
      });
    });
  }

  /* ════════════════════════════════════════════════
   *  관리자 화면
   * ════════════════════════════════════════════════ */
  var TABS = [
    { id: "edit", label: "✏️ 내용 편집" },
    { id: "notice", label: "📢 공지" },
    { id: "roster", label: "👥 수강생 명단" },
    { id: "records", label: "📊 기록 · 내려받기" },
    { id: "file", label: "💾 저장 · 설정 파일" },
    { id: "password", label: "🔑 비밀번호" }
  ];

  function openPanel(tab, section) {
    if (overlay) return;
    draft = clone(C); dirty = false;
    overlay = el("div", "admin-overlay");
    var panel = el("div", "admin-panel");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "admin-title");

    var head = el("div", "admin-head");
    var h = el("h2", null, "관리자 화면"); h.id = "admin-title";
    head.appendChild(h);
    head.appendChild(el("span", "tag " + (API.demo ? "tag-demo" : "tag-live"), API.demo ? "체험 모드" : "구글 시트 연결됨"));
    var sp = el("span", "admin-spacer"); head.appendChild(sp);
    var lockOut = el("button", "chip-btn", "잠그기");
    lockOut.title = "관리자 로그아웃";
    var closeB = el("button", "modal-x", "×"); closeB.setAttribute("aria-label", "관리자 화면 닫기");
    head.appendChild(lockOut); head.appendChild(closeB);
    panel.appendChild(head);

    var tabs = el("div", "admin-tabs"); tabs.setAttribute("role", "tablist");
    var body = el("div", "admin-body");
    TABS.forEach(function (t) {
      var b = el("button", "admin-tab", t.label);
      b.setAttribute("role", "tab"); b.dataset.tab = t.id;
      b.addEventListener("click", function () { showTab(t.id); });
      tabs.appendChild(b);
    });
    panel.appendChild(tabs);
    panel.appendChild(body);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    setTimeout(function () { overlay.classList.add("show"); }, 20);

    var serverErr = store.load("adminServerError", null, true);
    if (serverErr && !API.demo) {
      var warn = el("p", "admin-warn", "⚠ 서버 관리자 인증 실패: " + serverErr + " — 기록·명단·공지 기능을 쓰려면 Apps Script의 ADMIN_PASSWORD를 확인하세요.");
      panel.insertBefore(warn, body);
    }

    function showTab(id, sec) {
      tabs.querySelectorAll(".admin-tab").forEach(function (b) {
        var on = b.dataset.tab === id;
        b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false");
      });
      body.textContent = "";
      body.scrollTop = 0;
      var oldFoot = panel.querySelector(".admin-foot"); if (oldFoot) oldFoot.remove();
      ({ edit: tabEdit, notice: tabNotice, roster: tabRoster, records: tabRecords, file: tabFile, password: tabPassword })[id](body, sec);
    }

    function close() {
      if (dirty && !confirm("적용하지 않은 수정 내용이 있습니다. 닫을까요?")) return;
      overlay.classList.remove("show"); document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
      var o = overlay; overlay = null;
      setTimeout(function () { o.remove(); }, 250);
      lockBtn.focus();
    }
    function onKey(e) {
      if (e.key === "Escape" && !e.target.closest("textarea")) close();
    }
    document.addEventListener("keydown", onKey);
    closeB.addEventListener("click", close);
    lockOut.addEventListener("click", function () {
      if (dirty && !confirm("적용하지 않은 수정 내용이 있습니다. 잠글까요?")) return;
      dirty = false;
      unlocked = false; adminToken = null;
      store.remove("adminUnlocked", true); store.remove("adminToken", true); store.remove("adminServerError", true);
      lockBtn.classList.remove("unlocked");
      close();
    });
    showTab(tab || "edit", section);
    closeB.focus();
  }

  function needToken(body) {
    if (adminToken) return true;
    body.appendChild(el("p", "admin-warn", "서버 관리자 인증이 되어 있지 않아 이 기능을 쓸 수 없습니다. '잠그기' 후 다시 로그인하거나, Apps Script의 ADMIN_PASSWORD를 확인해 주세요."));
    return false;
  }
  function adminCall(action, payload) {
    return API.call(action, Object.assign({ token: adminToken }, payload || {})).catch(function (err) {
      if (/관리자 로그인/.test(err.message)) { adminToken = null; store.remove("adminToken", true); }
      throw err;
    });
  }
  function section(title, desc) {
    var s = el("section", "admin-sec");
    s.appendChild(el("h3", null, title));
    if (desc) s.appendChild(el("p", "admin-desc", desc));
    return s;
  }

  /* ════════════════════════════════════════════════
   *  탭 1. 내용 편집 (설정 전체를 자동으로 입력 칸으로 바꿔 보여 줌)
   * ════════════════════════════════════════════════ */
  var SECTIONS = [
    ["site", "기본 정보"], ["nav", "상단 메뉴"], ["hero", "첫 화면"], ["about", "프로그램 소개"],
    ["schedule", "수업 일정"], ["curriculum", "커리큘럼"], ["tools", "AI 도구"], ["enroll", "수강 안내"],
    ["applyForm", "수강 신청서"], ["poll", "투표"], ["student", "수강생 공간"], ["faq", "FAQ"],
    ["instructor", "교수자"], ["notice", "공지 표시"], ["popup", "안내 팝업"], ["welcome", "환영 효과"], ["backend", "데이터 연결"]
  ];
  var LABELS = {
    university: "대학", department: "학과", courseName: "강의 제목", courseNameJp: "강의 제목 (일본어)", semester: "학기",
    footerNote: "맨 아래 안내 문구", id: "이동할 섹션 id", label: "이름", badge: "배지 문구", subtitle: "부제", description: "설명",
    applyButton: "수강 신청 버튼", curriculumButton: "커리큘럼 버튼", link: "연결 주소", quickInfo: "요약 정보", icon: "아이콘 (이모지)",
    value: "값", title: "제목", stats: "숫자 카드", unit: "단위", strengthsTitle: "장점 제목", strengths: "장점 슬라이드", text: "내용",
    firstClass: "첫 수업 날짜", time: "시간", place: "장소", holidays: "휴강일", date: "날짜", name: "이름", submitUrl: "과제 제출 주소",
    calendarTitle: "달력 제목", phases: "단계", summary: "요약", weeks: "주차", content: "학습 내용", videos: "참고 영상", url: "주소",
    assignment: "과제", desc: "설명", due: "마감 일시", exam: "시험 주간", items: "항목", use: "용도", prepTitle: "준비물 제목",
    prep: "수강 준비물", cards: "안내 카드", q: "질문", a: "답변", role: "직함", photo: "사진 파일 경로", bio: "소개", contacts: "연락처",
    refreshSeconds: "결과 갱신 간격 (초)", options: "선택지", intro: "안내 문구", submitLabel: "제출 버튼 문구", successTitle: "접수 완료 제목",
    successText: "접수 완료 문구", fields: "입력 항목", type: "입력 종류", required: "필수 항목", placeholder: "예시 문구",
    pattern: "형식 (정규식)", patternMessage: "형식 오류 안내", minLength: "최소 글자 수", usePin: "인증번호 사용", maxFileMB: "최대 파일 크기 (MB)",
    accept: "허용 파일 형식", allowLate: "마감 후 제출 허용", enabled: "사용", delaySeconds: "표시까지 걸리는 시간 (초)", buttonLabel: "버튼 문구",
    message: "환영 문구", maxShown: "첫 화면에 보일 공지 수", week: "주차"
  };
  var LONG = ["description", "text", "desc", "intro", "a", "bio", "summary", "successText", "footerNote", "lead"];
  var ENUMS = {
    "applyForm.fields[].type": ["text", "email", "tel", "number", "select", "radio", "textarea", "checkbox"]
  };
  var DATE_KEYS = { firstClass: "date", date: "date", due: "datetime-local" };
  // 있으면 쓰고 없으면 비워 두는 항목
  var OPTIONAL = {
    "curriculum.phases[].weeks[]": {
      date: "", time: "", place: "", exam: false,
      videos: [{ label: "", url: "" }],
      assignment: { title: "", desc: "", due: "", submitUrl: "" }
    },
    "applyForm.fields[]": { placeholder: "", required: false, options: [""], pattern: "", patternMessage: "", minLength: 10 },
    "curriculum.phases[].weeks[].assignment": { submitUrl: "" }
  };
  var TEMPLATES = {
    "curriculum.phases[]": { title: "", summary: "", weeks: [{ title: "", content: [""] }] },
    "curriculum.phases[].weeks[]": { title: "", content: [""] },
    "faq.items[]": { q: "", a: "" },
    "nav[]": { id: "", label: "" }
  };

  function tabEdit(body, sec) {
    var current = sec || "site";
    var wrap = el("div", "edit-wrap");
    var pick = el("div", "edit-sections");
    var area = el("div", "edit-area");
    SECTIONS.forEach(function (s) {
      if (!(s[0] in draft)) return;
      var b = el("button", "chip-btn", s[1]);
      b.dataset.key = s[0];
      b.addEventListener("click", function () { current = s[0]; render(); });
      pick.appendChild(b);
    });
    wrap.appendChild(pick);
    wrap.appendChild(area);
    body.appendChild(wrap);

    var foot = el("div", "admin-foot");
    var tgt = getTarget();
    foot.appendChild(el("p", "admin-desc", tgt.type === "github"
      ? "‘GitHub에 바로 저장’을 누르면 저장소의 config.js가 바뀌고, 1~10분 뒤 모든 방문자에게 반영됩니다."
      : tgt.type === "local"
        ? "‘config.js에 바로 저장’을 누르면 사이트 폴더의 설정 파일이 바로 바뀝니다."
        : "지금은 ‘내려받기’ 방식입니다. GitHub나 내 컴퓨터 파일에 바로 저장하려면 ‘💾 저장 · 설정 파일’ 탭에서 연결해 주세요."));
    var saveSite = el("button", "btn primary", targetLabel(tgt));
    var apply = el("button", "btn", "미리 보기만");
    var footMsg = el("p", "form-msg foot-msg"); footMsg.setAttribute("role", "alert");
    apply.addEventListener("click", function () {
      store.save("configDraft", draft);
      store.save("adminReopen", { tab: "edit", section: current }, true);
      dirty = false;
      location.reload();
    });
    saveSite.addEventListener("click", function () {
      footMsg.classList.remove("ok"); footMsg.textContent = "";
      saveSite.disabled = true; var label = saveSite.textContent; saveSite.textContent = "저장 중…";
      saveToSite(draft, (SECTIONS.filter(function (x) { return x[0] === current; })[0] || [])[1]).then(function (text) {
        dirty = false;
        store.save("adminReopen", { tab: "edit", section: current, message: text }, true);
        location.reload();
      }, function (e) {
        footMsg.textContent = e.message;
        saveSite.disabled = false; saveSite.textContent = label;
      });
    });
    var btns = el("div", "admin-foot-btns"); btns.appendChild(saveSite); btns.appendChild(apply);
    foot.appendChild(footMsg);
    foot.appendChild(btns);
    if (reopenMessage) { footMsg.textContent = reopenMessage; footMsg.classList.add("ok"); reopenMessage = null; }
    body.parentNode.appendChild(foot);   // 화면 아래에 고정

    function render() {
      pick.querySelectorAll(".chip-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.key === current); });
      area.textContent = "";
      var label = (SECTIONS.filter(function (s) { return s[0] === current; })[0] || [])[1];
      area.appendChild(el("h3", "edit-title", label));
      area.appendChild(buildNode(draft, current, current, true));
    }
    render();
  }

  function labelFor(key) { return LABELS[key] || key; }
  function norm(path) { return path.replace(/\[\d+\]/g, "[]"); }

  function buildNode(parent, key, path, isRoot) {
    var v = parent[key];
    if (Array.isArray(v)) return buildArray(parent, key, path);
    if (v && typeof v === "object") return buildObject(v, path, isRoot ? null : labelFor(key), parent, key);
    return buildField(parent, key, path);
  }

  function buildField(parent, key, path) {
    var v = parent[key];
    var row = el("div", "ed-field");
    var id = "ed-" + path.replace(/[^\w]/g, "-");
    var lab = el("label", null, labelFor(key)); lab.htmlFor = id;
    var input;
    var en = ENUMS[norm(path)];
    if (typeof v === "boolean") {
      row.classList.add("ed-check");
      input = el("input"); input.type = "checkbox"; input.checked = v;
      input.addEventListener("change", function () { parent[key] = input.checked; markDirty(); });
      input.id = id;
      row.appendChild(input); row.appendChild(lab);
      return row;
    }
    if (en) {
      input = el("select");
      en.forEach(function (o) { var op = el("option", null, o); op.value = o; input.appendChild(op); });
      input.value = v;
    } else if (typeof v === "number") {
      input = el("input"); input.type = "number"; input.value = v; input.step = "any";
    } else if (DATE_KEYS[key]) {
      input = el("input"); input.type = DATE_KEYS[key]; input.value = v || "";
    } else if (LONG.indexOf(key) >= 0 || String(v || "").length > 60 || /\n/.test(v || "")) {
      input = el("textarea"); input.rows = 3; input.value = v == null ? "" : v;
    } else {
      input = el("input"); input.type = "text"; input.value = v == null ? "" : v;
    }
    input.id = id;
    input.addEventListener("input", function () {
      parent[key] = typeof v === "number" ? (input.value === "" ? 0 : Number(input.value)) : input.value;
      markDirty();
    });
    row.appendChild(lab); row.appendChild(input);
    return row;
  }

  function buildObject(obj, path, label, parent, key) {
    var box = el(label ? "fieldset" : "div", "ed-object");
    if (label) box.appendChild(el("legend", null, label));
    var opt = OPTIONAL[norm(path)] || {};
    Object.keys(obj).forEach(function (k) {
      var node = buildNode(obj, k, path + "." + k);
      if (k in opt) {
        // 선택 항목은 빼기 버튼과 함께
        var holder = el("div", "ed-optional");
        holder.appendChild(node);
        var rm = el("button", "ed-mini", "빼기"); rm.type = "button";
        rm.setAttribute("aria-label", labelFor(k) + " 빼기");
        rm.addEventListener("click", function () { delete obj[k]; markDirty(); box.replaceWith(buildObject(obj, path, label, parent, key)); });
        holder.appendChild(rm);
        node = holder;
      }
      box.appendChild(node);
    });
    var missing = Object.keys(opt).filter(function (k) { return !(k in obj); });
    if (missing.length) {
      var adds = el("div", "ed-adds");
      missing.forEach(function (k) {
        var b = el("button", "ed-mini add", "+ " + labelFor(k)); b.type = "button";
        b.addEventListener("click", function () { obj[k] = clone(opt[k]); markDirty(); box.replaceWith(buildObject(obj, path, label, parent, key)); });
        adds.appendChild(b);
      });
      box.appendChild(adds);
    }
    return box;
  }

  function itemTitle(item, i) {
    if (item && typeof item === "object") {
      var t = item.title || item.name || item.label || item.q || item.date || item.value;
      if (!t) for (var k in item) if (typeof item[k] === "string" && item[k]) { t = item[k]; break; }
      return (i + 1) + ". " + (t || "(비어 있음)");
    }
    return (i + 1) + ".";
  }
  function blankFrom(o) {
    if (Array.isArray(o)) return [];
    if (o && typeof o === "object") {
      var r = {}; Object.keys(o).forEach(function (k) { r[k] = blankFrom(o[k]); }); return r;
    }
    return typeof o === "string" ? "" : typeof o === "boolean" ? false : o;
  }

  function buildArray(parent, key, path, openIndex) {
    var arr = parent[key];
    var box = el("fieldset", "ed-array");
    box.appendChild(el("legend", null, labelFor(key) + " (" + arr.length + ")"));
    var list = el("div", "ed-list");
    function rebuild(open) { markDirty(); box.replaceWith(buildArray(parent, key, path, open)); }
    arr.forEach(function (item, i) {
      var ip = path + "[" + i + "]";
      var ctr = el("span", "ed-ctrls");
      [["↑", "위로", function () { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); rebuild(i - 1); } }],
       ["↓", "아래로", function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); rebuild(i + 1); } }],
       ["삭제", "삭제", function () { if (confirm("‘" + itemTitle(item, i) + "’ 항목을 삭제할까요?")) { arr.splice(i, 1); rebuild(); } }]
      ].forEach(function (c) {
        var b = el("button", "ed-mini" + (c[1] === "삭제" ? " danger" : ""), c[0]); b.type = "button";
        b.setAttribute("aria-label", (i + 1) + "번 항목 " + c[1]);
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); c[2](); });
        ctr.appendChild(b);
      });
      if (item && typeof item === "object") {
        var d = el("details", "ed-item");
        if (openIndex === i) d.open = true;
        var sm = el("summary");
        sm.appendChild(el("span", "ed-item-title", itemTitle(item, i)));
        sm.appendChild(ctr);
        d.appendChild(sm);
        d.appendChild(buildObject(item, ip, null, arr, i));
        list.appendChild(d);
      } else {
        var row = el("div", "ed-prim");
        row.appendChild(buildField(arr, i, ip));
        row.querySelector("label").textContent = (i + 1) + ".";
        row.appendChild(ctr);
        list.appendChild(row);
      }
    });
    box.appendChild(list);
    var add = el("button", "ed-mini add", "+ 항목 추가"); add.type = "button";
    add.addEventListener("click", function () {
      var tpl = TEMPLATES[norm(path) + "[]"];
      var sample = arr[arr.length - 1];
      arr.push(tpl ? clone(tpl) : sample === undefined ? "" : blankFrom(sample));
      rebuild(arr.length - 1);
    });
    box.appendChild(add);
    return box;
  }

  /* ════════════════════════════════════════════════
   *  탭 2. 공지
   * ════════════════════════════════════════════════ */
  function tabNotice(body) {
    if (!needToken(body)) return;
    var s1 = section("새 공지 올리기", "올린 공지는 첫 화면 아래 ‘" + ((C.notice || {}).title || "공지사항") + "’에 바로 나타납니다." + (API.demo ? " (체험 모드: 이 브라우저에만 보입니다)" : ""));
    var f = el("form", "admin-form");
    f.noValidate = true;
    var t = el("input"); t.type = "text"; t.placeholder = "제목"; t.setAttribute("aria-label", "공지 제목");
    var b = el("textarea"); b.rows = 4; b.placeholder = "내용"; b.setAttribute("aria-label", "공지 내용");
    var imp = el("label", "check"); var cb = el("input"); cb.type = "checkbox"; imp.appendChild(cb); imp.appendChild(el("span", null, "중요 공지 (맨 위에 고정)"));
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    var go = el("button", "btn primary", "공지 올리기"); go.type = "submit";
    [t, b, imp, msg, go].forEach(function (n) { f.appendChild(n); });
    s1.appendChild(f);
    body.appendChild(s1);

    var s2 = section("올린 공지");
    var list = el("ul", "admin-list");
    s2.appendChild(list);
    body.appendChild(s2);

    function render(notices) {
      list.textContent = "";
      if (!notices.length) { list.appendChild(el("li", "admin-empty", "아직 올린 공지가 없습니다.")); return; }
      notices.forEach(function (n) {
        var li = el("li");
        var txt = el("div");
        var tt = el("strong", null, (n.important ? "📌 " : "") + n.title);
        txt.appendChild(tt);
        txt.appendChild(el("span", "admin-meta", fmtTime(n.time)));
        if (n.body) txt.appendChild(el("p", null, n.body));
        li.appendChild(txt);
        var del = el("button", "ed-mini danger", "삭제");
        del.addEventListener("click", function () {
          if (!confirm("‘" + n.title + "’ 공지를 삭제할까요?")) return;
          adminCall("noticeDelete", { id: n.id }).then(function (r) { render(r.notices); S.reloadNotices(); }, function (e) { alert(e.message); });
        });
        li.appendChild(del);
        list.appendChild(li);
      });
    }
    API.call("noticeList").then(function (r) { render(r.notices || []); }, function (e) { list.appendChild(el("li", "admin-empty", e.message)); });

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.classList.remove("ok");
      if (!t.value.trim()) { msg.textContent = "제목을 입력해 주세요."; t.focus(); return; }
      go.disabled = true;
      adminCall("noticeAdd", { title: t.value.trim(), body: b.value.trim(), important: cb.checked }).then(function (r) {
        t.value = ""; b.value = ""; cb.checked = false;
        msg.textContent = "✓ 공지를 올렸습니다."; msg.classList.add("ok");
        render(r.notices); S.reloadNotices();
      }, function (err) { msg.textContent = err.message; }).then(function () { go.disabled = false; });
    });
  }

  /* ════════════════════════════════════════════════
   *  탭 3. 수강생 명단
   * ════════════════════════════════════════════════ */
  function tabRoster(body) {
    if (!needToken(body)) return;
    var roster = [];
    var s1 = section("명단 추가", "엑셀에서 ‘학번 · 이름 · 인증번호’ 세 칸을 복사해 붙여 넣거나, CSV 파일을 불러오세요. 같은 학번은 새 내용으로 바뀝니다.");
    var ta = el("textarea", "roster-input"); ta.rows = 6;
    ta.placeholder = "2026123456\t홍길동\t4821\n2026123457\t김벚꽃\t1937";
    ta.setAttribute("aria-label", "추가할 수강생 명단");
    var row = el("div", "admin-row");
    var fileL = el("label", "chip-btn file-btn", "CSV 파일 불러오기");
    var fileI = el("input"); fileI.type = "file"; fileI.accept = ".csv,.txt"; fileI.className = "sr-only";
    fileL.appendChild(fileI);
    var auto = el("label", "check"); var autoCb = el("input"); autoCb.type = "checkbox"; autoCb.checked = true;
    auto.appendChild(autoCb); auto.appendChild(el("span", null, "인증번호가 비어 있으면 4자리 숫자로 자동 생성"));
    row.appendChild(fileL); row.appendChild(auto);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    var addB = el("button", "btn primary", "명단에 추가하고 저장");
    [ta, row, msg, addB].forEach(function (n) { s1.appendChild(n); });
    body.appendChild(s1);

    var s2 = section("등록된 수강생");
    var tools = el("div", "admin-row");
    var count = el("strong", "admin-count");
    var dl = el("button", "chip-btn", "명단 내려받기 (CSV)");
    var clearB = el("button", "chip-btn danger", "전체 삭제");
    tools.appendChild(count); tools.appendChild(dl); tools.appendChild(clearB);
    s2.appendChild(tools);
    var tableBox = el("div", "admin-table-box");
    s2.appendChild(tableBox);
    body.appendChild(s2);

    fileI.addEventListener("change", function () {
      var f = fileI.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { ta.value = String(r.result).replace(/^﻿/, ""); };
      r.readAsText(f, "utf-8");
    });

    function parse(text) {
      var out = [], bad = [];
      text.split(/\r?\n/).forEach(function (line, i) {
        if (!line.trim()) return;
        var cells = line.split(/\t|,/).map(function (c) { return c.trim().replace(/^"|"$/g, "").replace(/^="|"$/g, ""); });
        if (i === 0 && /학번|id/i.test(cells[0])) return;   // 제목 줄 건너뛰기
        if (!cells[0] || !cells[1]) { bad.push(i + 1); return; }
        out.push({ id: cells[0], name: cells[1], pin: cells[2] || "" });
      });
      return { list: out, bad: bad };
    }
    function save(list, okText) {
      addB.disabled = true;
      return adminCall("rosterSave", { roster: list }).then(function (r) {
        roster = r.roster || list; render();
        if (okText) { msg.textContent = okText; msg.classList.add("ok"); }
      }, function (err) { msg.textContent = err.message; msg.classList.remove("ok"); }).then(function () { addB.disabled = false; });
    }
    addB.addEventListener("click", function () {
      msg.classList.remove("ok");
      var p = parse(ta.value);
      if (!p.list.length) { msg.textContent = "추가할 수강생이 없습니다. 학번과 이름을 한 줄에 하나씩 적어 주세요."; ta.focus(); return; }
      var map = {};
      roster.forEach(function (r) { map[r.id] = r; });
      p.list.forEach(function (r) {
        if (!r.pin && autoCb.checked) r.pin = String(1000 + Math.floor(Math.random() * 9000));
        map[r.id] = r;
      });
      var merged = Object.keys(map).map(function (k) { return map[k]; });
      save(merged, "✓ " + p.list.length + "명을 저장했습니다." + (p.bad.length ? " (" + p.bad.join(", ") + "번째 줄은 학번·이름이 없어 건너뜀)" : "")).then(function () {
        if (msg.classList.contains("ok")) ta.value = "";
      });
    });
    dl.addEventListener("click", function () {
      downloadCSV("수강생명단_" + today() + ".csv", [["학번", "이름", "인증번호"]].concat(roster.map(function (r) { return [r.id, r.name, r.pin]; })));
    });
    clearB.addEventListener("click", function () {
      if (!roster.length || !confirm("등록된 수강생 " + roster.length + "명을 모두 삭제할까요?")) return;
      save([], "명단을 비웠습니다.");
    });

    function render() {
      count.textContent = "총 " + roster.length + "명";
      tableBox.textContent = "";
      if (!roster.length) { tableBox.appendChild(el("p", "admin-empty", "등록된 수강생이 없습니다. 명단이 비어 있으면 " + (API.demo ? "체험 모드에서는 누구나" : "아무도") + " 로그인할 수 있습니다.")); return; }
      var tbl = el("table", "admin-table");
      var th = el("tr"); ["학번", "이름", "인증번호", ""].forEach(function (h) { th.appendChild(el("th", null, h)); });
      var thead = el("thead"); thead.appendChild(th); tbl.appendChild(thead);
      var tb = el("tbody");
      roster.forEach(function (r, i) {
        var tr = el("tr");
        tr.appendChild(el("td", null, r.id)); tr.appendChild(el("td", null, r.name)); tr.appendChild(el("td", null, r.pin || "—"));
        var td = el("td"); var del = el("button", "ed-mini danger", "삭제");
        del.setAttribute("aria-label", r.name + " 삭제");
        del.addEventListener("click", function () {
          if (!confirm(r.name + " (" + r.id + ") 학생을 명단에서 뺄까요?")) return;
          save(roster.filter(function (_, k) { return k !== i; }), r.name + " 학생을 뺐습니다.");
        });
        td.appendChild(del); tr.appendChild(td); tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      tableBox.appendChild(tbl);
    }
    adminCall("rosterGet").then(function (r) { roster = r.roster || []; render(); }, function (e) { tableBox.appendChild(el("p", "admin-warn", e.message)); });
  }

  /* ════════════════════════════════════════════════
   *  탭 4. 기록 조회 · 엑셀 내려받기
   * ════════════════════════════════════════════════ */
  function tabRecords(body) {
    if (!needToken(body)) return;
    var top = el("div", "admin-row");
    var refresh = el("button", "chip-btn", "↻ 새로 불러오기");
    var status = el("span", "admin-meta");
    top.appendChild(refresh); top.appendChild(status);
    body.appendChild(top);
    var holder = el("div");
    body.appendChild(holder);

    function load() {
      status.textContent = "불러오는 중…";
      holder.textContent = "";
      adminCall("adminData").then(function (d) {
        status.textContent = "마지막 확인 " + fmtTime(new Date().toISOString());
        holder.appendChild(attendanceView(d));
        holder.appendChild(submissionView(d));
        holder.appendChild(applicationView(d));
      }, function (e) { status.textContent = ""; holder.appendChild(el("p", "admin-warn", e.message)); });
    }
    refresh.addEventListener("click", load);
    load();
  }

  function tableFrom(headers, rows, max) {
    var box = el("div", "admin-table-box");
    if (!rows.length) { box.appendChild(el("p", "admin-empty", "아직 기록이 없습니다.")); return box; }
    var tbl = el("table", "admin-table");
    var thead = el("thead"), tr = el("tr");
    headers.forEach(function (h) { tr.appendChild(el("th", null, h)); });
    thead.appendChild(tr); tbl.appendChild(thead);
    var tb = el("tbody");
    rows.slice(0, max || 500).forEach(function (r) {
      var row = el("tr");
      r.forEach(function (c) {
        var td = el("td");
        if (c && typeof c === "object" && c.node) td.appendChild(c.node); else td.textContent = c == null ? "" : c;
        if (c && c.cls) td.className = c.cls;
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    tbl.appendChild(tb);
    box.appendChild(tbl);
    return box;
  }
  function plain(rows) { return rows.map(function (r) { return r.map(function (c) { return c && typeof c === "object" ? c.text : c; }); }); }

  function attendanceView(d) {
    var s = section("출석부", "명단의 학생과 출석한 학생을 주차별로 보여 줍니다. ✓ 출석 · ✗ 지난 수업 미출석");
    var students = {};
    (d.roster || []).forEach(function (r) { students[r.id] = { id: r.id, name: r.name, weeks: {} }; });
    (d.attendance || []).forEach(function (a) {
      var st = students[a.id] || (students[a.id] = { id: a.id, name: a.name || "", weeks: {} });
      if (!st.name && a.name) st.name = a.name;
      st.weeks[a.week] = a.time;
    });
    var today0 = S.startOfDay(S.now());
    var weeks = S.weeks;
    var headers = ["학번", "이름"].concat(weeks.map(function (w) { return w.no + "주"; }), ["출석"]);
    var list = Object.keys(students).map(function (k) { return students[k]; }).sort(function (a, b) { return String(a.id).localeCompare(String(b.id)); });
    var rows = list.map(function (st) {
      var n = 0;
      var cells = weeks.map(function (w) {
        if (st.weeks[w.no]) { n++; return { text: "출석", node: document.createTextNode("✓"), cls: "att-o" }; }
        if (w.date < today0) return { text: "결석", node: document.createTextNode("✗"), cls: "att-x" };
        return { text: "", node: document.createTextNode("") };
      });
      return [st.id, st.name].concat(cells, [n + "회"]);
    });
    var dl = el("button", "chip-btn", "⬇ 엑셀용 파일 (CSV)");
    dl.addEventListener("click", function () { downloadCSV("출석부_" + today() + ".csv", [headers].concat(plain(rows))); });
    s.appendChild(dl);
    s.appendChild(tableFrom(headers, rows));
    return s;
  }

  function submissionView(d) {
    var s = section("과제 제출", null);
    var subs = (d.submissions || []).slice().sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
    var total = (d.roster || []).length;
    var chips = el("div", "admin-chips");
    S.weeks.filter(function (w) { return w.data.assignment; }).forEach(function (w) {
      var who = {};
      subs.forEach(function (x) { if (+x.week === w.no) who[x.id] = 1; });
      var n = Object.keys(who).length;
      chips.appendChild(el("span", "tag tag-hw", w.no + "주차 " + w.data.assignment.title + " · " + n + (total ? "/" + total : "") + "명"));
    });
    s.appendChild(chips);
    var headers = ["제출 시각", "학번", "이름", "주차", "과제", "파일명", "크기(KB)", "지각", "파일"];
    var rows = subs.map(function (x) {
      var w = S.weeks.filter(function (k) { return k.no === +x.week; })[0];
      var link = x.url ? (function () { var a = el("a", null, "열기"); a.href = x.url; a.target = "_blank"; a.rel = "noopener"; return { text: x.url, node: a }; })() : "";
      return [fmtTime(x.time), x.id, x.name || "", x.week + "주", x.title || (w && w.data.assignment ? w.data.assignment.title : ""),
        x.fileName, x.size ? Math.round(x.size / 1024) : "", x.late ? "지각" : "", link];
    });
    var dl = el("button", "chip-btn", "⬇ 엑셀용 파일 (CSV)");
    dl.addEventListener("click", function () { downloadCSV("과제제출_" + today() + ".csv", [headers].concat(plain(rows))); });
    s.appendChild(dl);
    if (API.demo) s.appendChild(el("p", "admin-desc", "체험 모드에서는 파일 이름과 크기만 기록되고, 파일 자체는 저장되지 않습니다."));
    s.appendChild(tableFrom(headers, rows));
    return s;
  }

  function applicationView(d) {
    var s = section("수강 신청", null);
    var a = d.applications || { headers: [], rows: [] };
    var rows = (a.rows || []).map(function (r) { return r.map(function (c, i) { return i === 0 ? fmtTime(c) : c; }); });
    var dl = el("button", "chip-btn", "⬇ 엑셀용 파일 (CSV) · " + rows.length + "건");
    dl.addEventListener("click", function () { downloadCSV("수강신청_" + today() + ".csv", [a.headers].concat(rows)); });
    s.appendChild(dl);
    s.appendChild(tableFrom(a.headers || [], rows));
    return s;
  }

  /* ════════════════════════════════════════════════
   *  탭 5. 설정 파일 저장 · 불러오기
   * ════════════════════════════════════════════════ */
  function configText(cfg) {
    return "/*\n" +
      " * 사이트 설정 파일 — 관리자 화면에서 저장함 (" + fmtTime(new Date().toISOString()) + ")\n" +
      " * 이 파일로 사이트 폴더의 config.js를 바꾸면 모든 방문자에게 반영됩니다.\n" +
      " * 직접 고칠 때는 따옴표(\"\") 안의 글만 바꾸고, 쉼표·괄호는 지우지 마세요.\n" +
      " */\n" +
      "window.SITE_CONFIG = " + JSON.stringify(cfg, null, 2) + ";\n";
  }
  function saveConfigFile(cfg) { downloadFile("config.js", configText(cfg), "text/javascript;charset=utf-8"); }
  function parseConfigText(text) {
    text = String(text).replace(/^﻿/, "");
    var t = text.trim();
    if (t.charAt(0) === "{") return JSON.parse(t);
    // config.js 형식: window.SITE_CONFIG = {...};  — 가짜 window에 담아 읽기
    var fake = {};
    new Function("window", text)(fake);
    if (!fake.SITE_CONFIG) throw new Error("SITE_CONFIG를 찾지 못했습니다.");
    return fake.SITE_CONFIG;
  }

  /* ════════════════════════════════════════════════
   *  사이트에 바로 저장
   *  · GitHub Pages: GitHub API로 저장소의 config.js를 바로 고침 (토큰 필요)
   *  · 내 컴퓨터에서 열었을 때(크롬·엣지): 사이트 폴더의 config.js에 바로 씀
   *  · 그 밖: config.js 내려받기
   * ════════════════════════════════════════════════ */
  function guessTarget() {
    var m = /^([^.]+)\.github\.io$/i.exec(location.hostname);
    if (m) {
      var first = location.pathname.split("/").filter(Boolean)[0];
      var repo = first && first.indexOf(".") < 0 ? first : m[1] + ".github.io";
      return { type: "github", owner: m[1], repo: repo, branch: "main", path: "config.js" };
    }
    if (location.protocol === "file:" && window.showSaveFilePicker) return { type: "local" };
    return { type: "download" };
  }
  function getTarget() { return store.load("saveTarget", null) || guessTarget(); }
  function getToken() { return store.load("ghToken", null, true) || store.load("ghToken", null) || ""; }
  function targetLabel(t) {
    return t.type === "github" ? "GitHub에 바로 저장" : t.type === "local" ? "config.js에 바로 저장" : "config.js 내려받기";
  }

  function b64(text) {
    var bytes = new TextEncoder().encode(text), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function gh(token, method, url, body) {
    var headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + token };
    if (body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com" + url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .catch(function () { throw new Error("GitHub에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요."); })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.ok) return j;
          var msg = {
            401: "토큰이 올바르지 않거나 만료되었습니다.",
            403: "토큰에 이 저장소의 쓰기 권한(Contents: Read and write)이 없습니다.",
            404: "저장소나 파일을 찾지 못했습니다. 소유자·저장소 이름·브랜치와 토큰의 저장소 선택을 확인해 주세요.",
            409: "다른 곳에서 먼저 저장되어 충돌했습니다. 다시 시도해 주세요.",
            422: "저장 요청이 거절되었습니다. 브랜치 이름을 확인해 주세요."
          }[r.status] || ("GitHub 오류 (" + r.status + "): " + (j.message || ""));
          var e = new Error(msg); e.status = r.status; throw e;
        });
      });
  }
  function contentsPath(t) {
    return "/repos/" + encodeURIComponent(t.owner) + "/" + encodeURIComponent(t.repo) + "/contents/" +
      String(t.path || "config.js").split("/").map(encodeURIComponent).join("/");
  }
  function githubSave(t, token, text, message) {
    var path = contentsPath(t);
    function attempt(retry) {
      return gh(token, "GET", path + "?ref=" + encodeURIComponent(t.branch || "main"))
        .catch(function (e) { if (e.status === 404) return {}; throw e; })   // 파일이 없으면 새로 만듦
        .then(function (cur) {
          return gh(token, "PUT", path, { message: message, content: b64(text), sha: cur.sha, branch: t.branch || "main" });
        })
        .catch(function (e) { if (retry && (e.status === 409 || e.status === 422)) return attempt(false); throw e; });
    }
    return attempt(true);
  }
  function githubCheck(t, token) {
    return gh(token, "GET", "/repos/" + encodeURIComponent(t.owner) + "/" + encodeURIComponent(t.repo)).then(function () {
      return gh(token, "GET", contentsPath(t) + "?ref=" + encodeURIComponent(t.branch || "main"));
    });
  }

  /* 내 컴퓨터의 config.js에 바로 쓰기 — 고른 파일은 다음에도 기억(IndexedDB) */
  function idb(mode, fn) {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open("kucourse-admin", 1);
      req.onupgradeneeded = function () { req.result.createObjectStore("handles"); };
      req.onerror = function () { reject(req.error); };
      req.onsuccess = function () {
        var tx = req.result.transaction("handles", mode), st = tx.objectStore("handles");
        var r = fn(st);
        tx.oncomplete = function () { resolve(r && r.result); };
        tx.onerror = function () { reject(tx.error); };
      };
    });
  }
  function pickLocal() {
    alert("저장할 파일을 고르는 창이 열립니다.\n사이트 폴더(index.html이 있는 폴더)의 config.js를 고르고 ‘저장’ → ‘바꾸기’를 눌러 주세요.\n처음 한 번만 고르면 다음부터는 바로 저장됩니다.");
    return window.showSaveFilePicker({
      suggestedName: "config.js",
      types: [{ description: "사이트 설정 파일", accept: { "text/javascript": [".js"] } }]
    }).then(function (h) {
      return idb("readwrite", function (st) { return st.put(h, "config"); }).then(function () { return h; }, function () { return h; });
    });
  }
  function localSave(text) {
    if (!window.showSaveFilePicker) return Promise.reject(new Error("이 브라우저는 파일에 바로 저장할 수 없습니다. 크롬이나 엣지를 쓰거나 ‘내려받기’를 이용해 주세요."));
    return idb("readonly", function (st) { return st.get("config"); }).catch(function () { return null; })
      .then(function (h) {
        if (!h) return pickLocal();
        return h.requestPermission({ mode: "readwrite" }).then(function (p) { return p === "granted" ? h : pickLocal(); });
      })
      .then(function (h) {
        return h.createWritable().then(function (w) { return w.write(text).then(function () { return w.close(); }); });
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") throw new Error("저장을 취소했습니다.");
        throw e;
      });
  }

  /* 공통: 설정을 사이트에 저장 → 결과 문구를 돌려줌 */
  function saveToSite(cfg, note) {
    var t = getTarget(), text = configText(cfg);
    if (t.type === "github") {
      var token = getToken();
      if (!token) return Promise.reject(new Error("GitHub 토큰이 없습니다. ‘💾 저장 · 설정 파일’ 탭에서 먼저 연결해 주세요."));
      return githubSave(t, token, text, "관리자 화면에서 설정 수정" + (note ? " (" + note + ")" : "")).then(function () {
        // 새 config.js가 배포될 때까지 내 화면은 미리 보기로 유지 (배포되면 자동으로 해제)
        store.save("configDraft", cfg);
        store.save("publishedAt", Date.now());
        return "✓ GitHub에 저장했습니다. 1~10분 뒤 모든 방문자에게 반영됩니다.";
      });
    }
    if (t.type === "local") {
      return localSave(text).then(function () {
        store.remove("configDraft");
        return "✓ config.js에 저장했습니다.";
      });
    }
    saveConfigFile(cfg);
    store.save("configDraft", cfg);
    return Promise.resolve("config.js를 내려받았습니다. 사이트 폴더의 config.js를 이 파일로 바꿔 주세요.");
  }

  function tabFile(body) {
    body.appendChild(connectSection());
    var s1 = section("config.js 내려받기", "지금 보이는 설정을 파일로 받아 둡니다. 백업용으로 쓰거나, 바로 저장을 쓰지 않을 때 사이트 폴더의 config.js를 이 파일로 바꾸면 됩니다.");
    var b1 = el("button", "btn primary", "config.js 내려받기");
    b1.addEventListener("click", function () { saveConfigFile(C); });
    s1.appendChild(b1);
    body.appendChild(s1);

    var s2 = section("설정 파일 불러오기", "전에 저장해 둔 config.js(또는 .json)를 불러와 이 브라우저에서 미리 봅니다. 직접 저장한 파일만 불러오세요.");
    var lab = el("label", "btn file-btn", "파일 선택");
    var inp = el("input"); inp.type = "file"; inp.accept = ".js,.json"; inp.className = "sr-only";
    lab.appendChild(inp);
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    s2.appendChild(lab); s2.appendChild(msg);
    body.appendChild(s2);
    inp.addEventListener("change", function () {
      var f = inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var cfg = parseConfigText(r.result);
          if (!cfg.site || !cfg.nav) throw new Error("사이트 설정 파일이 아닌 것 같습니다. (site, nav 항목 없음)");
          if (!confirm("‘" + f.name + "’ 설정으로 미리 보기를 시작할까요?")) return;
          store.save("configDraft", cfg);
          store.save("adminReopen", { tab: "file" }, true);
          location.reload();
        } catch (e) { msg.textContent = "불러오지 못했습니다: " + e.message; }
      };
      r.readAsText(f, "utf-8");
    });

    var s3 = section("원래 설정으로 되돌리기", S.draftActive ? "지금은 관리자 미리 보기 설정이 적용되어 있습니다. 되돌리면 사이트 폴더의 config.js 내용으로 다시 보입니다." : "지금은 사이트 폴더의 config.js 그대로입니다.");
    var b3 = el("button", "btn", "미리 보기 끝내기");
    b3.disabled = !S.draftActive;
    b3.addEventListener("click", function () {
      if (!confirm("미리 보기를 끝낼까요? 저장하지 않은 수정 내용은 사라집니다.")) return;
      store.remove("configDraft"); store.save("adminReopen", { tab: "file" }, true); location.reload();
    });
    s3.appendChild(b3);
    body.appendChild(s3);
  }

  function connectSection() {
    var t = getTarget();
    var s = section("바로 저장 연결", "관리자 화면에서 고친 내용을 어디에 저장할지 정합니다. 연결해 두면 ‘내용 편집’의 저장 버튼 한 번으로 사이트에 반영됩니다.");
    var types = [
      ["github", "GitHub Pages 저장소", "GitHub에 올린 사이트일 때"],
      ["local", "이 컴퓨터의 config.js", "index.html을 내 컴퓨터에서 열어 쓸 때 (크롬·엣지)"],
      ["download", "내려받기만", "파일을 받아 직접 바꿔 넣기"]
    ];
    var row = el("div", "choice-row target-row");
    types.forEach(function (x) {
      var lab = el("label", "choice");
      var r = el("input"); r.type = "radio"; r.name = "save-target"; r.value = x[0]; r.checked = t.type === x[0];
      if (x[0] === "local" && !window.showSaveFilePicker) { r.disabled = true; lab.title = "이 브라우저에서는 쓸 수 없습니다"; }
      lab.appendChild(r);
      var txt = el("span"); txt.appendChild(el("strong", null, x[1])); txt.appendChild(el("small", null, x[2]));
      lab.appendChild(txt);
      row.appendChild(lab);
    });
    s.appendChild(row);

    var ghBox = el("div", "gh-box");
    var fields = [["owner", "GitHub 아이디(소유자)", "예: myname"], ["repo", "저장소 이름", "예: japanese-literature-course"],
                  ["branch", "브랜치", "main"], ["path", "설정 파일 위치", "config.js"]];
    var inputs = {};
    var g = el("div", "gh-grid");
    fields.forEach(function (f) {
      var box = el("div", "field");
      var l = el("label", "field-label", f[1]); l.htmlFor = "gh-" + f[0];
      var i = el("input"); i.type = "text"; i.id = "gh-" + f[0]; i.placeholder = f[2];
      i.value = t[f[0]] || (f[0] === "branch" ? "main" : f[0] === "path" ? "config.js" : "");
      i.autocomplete = "off"; i.spellcheck = false;
      box.appendChild(l); box.appendChild(i); g.appendChild(box);
      inputs[f[0]] = i;
    });
    ghBox.appendChild(g);
    var tokBox = el("div", "field");
    var tl = el("label", "field-label", "GitHub 토큰"); tl.htmlFor = "gh-token";
    var tok = el("input"); tok.type = "password"; tok.id = "gh-token"; tok.autocomplete = "off";
    tok.placeholder = getToken() ? "저장된 토큰 있음 (바꾸려면 새로 입력)" : "github_pat_로 시작하는 토큰";
    tokBox.appendChild(tl); tokBox.appendChild(tok);
    ghBox.appendChild(tokBox);
    var rem = el("label", "check"); var remCb = el("input"); remCb.type = "checkbox"; remCb.checked = !!store.load("ghToken", null);
    rem.appendChild(remCb); rem.appendChild(el("span", null, "이 브라우저에 토큰 기억하기 (공용 컴퓨터에서는 끄세요)"));
    ghBox.appendChild(rem);
    var help = el("details", "gh-help");
    help.appendChild(el("summary", null, "토큰 만드는 방법"));
    var ol = el("ol");
    ["GitHub 로그인 → 오른쪽 위 프로필 → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token",
     "Repository access: Only select repositories → 이 사이트 저장소 하나만 고르기",
     "Permissions → Repository permissions → Contents: Read and write",
     "만들어진 토큰(github_pat_…)을 복사해 위 칸에 붙여 넣기. 토큰은 사이트 파일에 들어가지 않고 이 브라우저에만 보관됩니다."
    ].forEach(function (x) { ol.appendChild(el("li", null, x)); });
    help.appendChild(ol);
    ghBox.appendChild(help);
    s.appendChild(ghBox);

    var localBox = el("p", "admin-desc local-box", "저장 버튼을 처음 누를 때 파일 고르기 창이 열립니다. 사이트 폴더의 config.js를 골라 ‘바꾸기’를 누르면, 다음부터는 묻지 않고 바로 저장됩니다.");
    s.appendChild(localBox);

    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    var saveB = el("button", "btn primary", "연결 저장");
    var acts = el("div", "admin-row"); acts.appendChild(saveB);
    s.appendChild(msg); s.appendChild(acts);

    function cur() { var c = row.querySelector("input:checked"); return c ? c.value : "download"; }
    function sync() { ghBox.hidden = cur() !== "github"; localBox.hidden = cur() !== "local"; }
    row.addEventListener("change", sync); sync();

    saveB.addEventListener("click", function () {
      msg.classList.remove("ok"); msg.textContent = "";
      var type = cur();
      if (type !== "github") {
        store.save("saveTarget", { type: type });
        msg.textContent = "✓ 저장 방식: " + (type === "local" ? "이 컴퓨터의 config.js" : "내려받기"); msg.classList.add("ok");
        return;
      }
      var nt = { type: "github" };
      fields.forEach(function (f) { nt[f[0]] = inputs[f[0]].value.trim(); });
      if (!nt.branch) nt.branch = "main";
      if (!nt.path) nt.path = "config.js";
      if (!nt.owner || !nt.repo) { msg.textContent = "GitHub 아이디와 저장소 이름을 입력해 주세요."; return; }
      var token = tok.value.trim() || getToken();
      if (!token) { msg.textContent = "GitHub 토큰을 입력해 주세요."; tok.focus(); return; }
      saveB.disabled = true; saveB.textContent = "확인 중…";
      githubCheck(nt, token).then(function () {
        store.save("saveTarget", nt);
        store.remove("ghToken"); store.remove("ghToken", true);
        store.save("ghToken", token, !remCb.checked);   // 기억하기를 끄면 창을 닫을 때 지워짐
        tok.value = ""; tok.placeholder = "저장된 토큰 있음 (바꾸려면 새로 입력)";
        msg.textContent = "✓ 연결되었습니다. 이제 ‘내용 편집’에서 ‘GitHub에 바로 저장’을 누르면 사이트에 반영됩니다."; msg.classList.add("ok");
      }, function (e) {
        msg.textContent = e.status === 404 ? "저장소나 " + nt.branch + " 브랜치의 " + nt.path + " 파일을 찾지 못했습니다. 이름과 토큰의 저장소 선택을 확인해 주세요." : e.message;
      }).then(function () { saveB.disabled = false; saveB.textContent = "연결 저장"; });
    });
    if (getTarget().type === "github" && getToken()) {
      var forget = el("button", "chip-btn danger", "토큰 지우기");
      forget.addEventListener("click", function () {
        store.remove("ghToken"); store.remove("ghToken", true);
        tok.placeholder = "github_pat_로 시작하는 토큰"; forget.remove();
        msg.textContent = "토큰을 지웠습니다."; msg.classList.add("ok");
      });
      acts.appendChild(forget);
    }
    return s;
  }

  /* ════════════════════════════════════════════════
   *  탭 6. 비밀번호 변경
   * ════════════════════════════════════════════════ */
  function tabPassword(body) {
    var s = section("관리자 비밀번호 바꾸기", "새 비밀번호는 config.js에 해시값으로만 저장되고, 지금 저장 방식(" + targetLabel(getTarget()) + ")으로 바로 반영됩니다." +
      (API.demo ? "" : " 구글 시트 쪽 비밀번호(Apps Script의 ADMIN_PASSWORD)는 따로 바꿔야 합니다."));
    var f = el("form", "admin-form");
    f.noValidate = true;
    var inputs = {};
    [["cur", "지금 비밀번호", "current-password"], ["n1", "새 비밀번호 (8자 이상)", "new-password"], ["n2", "새 비밀번호 확인", "new-password"]].forEach(function (x) {
      var box = el("div", "field");
      var l = el("label", "field-label", x[1]); l.htmlFor = "pw-" + x[0];
      var i = el("input"); i.type = "password"; i.id = "pw-" + x[0]; i.autocomplete = x[2];
      box.appendChild(l); box.appendChild(i); f.appendChild(box);
      inputs[x[0]] = i;
    });
    var msg = el("p", "form-msg"); msg.setAttribute("role", "alert");
    var go = el("button", "btn primary", "비밀번호 바꾸기"); go.type = "submit";
    f.appendChild(msg); f.appendChild(go);
    s.appendChild(f);
    body.appendChild(s);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      msg.classList.remove("ok");
      var cur = inputs.cur.value, n1 = inputs.n1.value, n2 = inputs.n2.value;
      if (!cur || !n1 || !n2) { msg.textContent = "세 칸을 모두 입력해 주세요."; return; }
      if (n1.length < 8) { msg.textContent = "새 비밀번호는 8자 이상이어야 합니다."; inputs.n1.focus(); return; }
      if (n1 !== n2) { msg.textContent = "새 비밀번호 두 칸이 서로 다릅니다."; inputs.n2.focus(); return; }
      var A = C.admin || {};
      hashPassword(cur, A.salt || "").then(function (hex) {
        if (hex !== A.passwordHash) { msg.textContent = "지금 비밀번호가 맞지 않습니다."; inputs.cur.focus(); return; }
        var salt = randomSalt();
        return hashPassword(n1, salt).then(function (h) {
          var cfg = clone(C);
          cfg.admin = { salt: salt, passwordHash: h };
          return saveToSite(cfg, "비밀번호 변경").then(function (text) {
            C.admin = cfg.admin;
            f.reset();
            msg.textContent = text.replace("✓ ", "✓ 비밀번호를 바꿨습니다. ");
            msg.classList.add("ok");
          }, function (e) { msg.textContent = "비밀번호를 저장하지 못했습니다: " + e.message; });
        });
      });
    });
  }

  // 시험·점검용으로 공개 (콘솔에서 SITE.admin.hashPassword("비밀번호", "salt"))
  S.admin = { hashPassword: hashPassword, parseConfigText: parseConfigText, configText: configText };
})();
