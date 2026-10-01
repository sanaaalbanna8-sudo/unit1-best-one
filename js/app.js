const COPYRIGHT = "جميع الحقوق محفوظة 2026 Sanaa albanna";
const STORE_KEY = "u1-best-one-v1";
const LETTERS = ["أ", "ب", "ج"];

const $app = document.getElementById("app");
const $who = document.getElementById("who");

const state = {
  name: "",
  klass: "",
  index: 0,
  picks: {},
  order: {},
  startedAt: 0,
  finishedAt: 0,
  filter: "gaps",
  phase: "start",
  sendNote: "",
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function aimOf(id) {
  return AIMS.find((a) => a.id === id);
}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    name: state.name,
    klass: state.klass,
    index: state.index,
    picks: state.picks,
    order: state.order,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    filter: state.filter,
    phase: state.phase,
    sendNote: state.sendNote,
  }));
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(STORE_KEY);
}

function optionOrder(q) {
  if (!state.order[q.id]) state.order[q.id] = shuffle(q.options.map((o) => o.id));
  return state.order[q.id].map((id) => q.options.find((o) => o.id === id));
}

function pickOf(q) {
  return (state.picks[q.id] || [])[0] || "";
}

function isAnswered(q) {
  return Boolean(pickOf(q));
}

function scoreQuestion(q) {
  const picked = q.options.find((o) => o.id === pickOf(q));
  return { hit: picked && picked.ok ? 1 : 0, max: 1 };
}

function grade() {
  const rows = QUESTIONS.map((q, i) => ({ q, i, ...scoreQuestion(q) }));
  const earned = rows.reduce((n, r) => n + r.hit, 0);
  const max = rows.length;
  const percent = max ? Math.round((earned / max) * 100) : 0;
  const byAim = AIMS.map((a) => {
    const part = rows.filter((r) => r.q.aim === a.id);
    const e = part.reduce((n, r) => n + r.hit, 0);
    const m = part.length;
    return { ...a, earned: e, max: m, percent: m ? Math.round((e / m) * 100) : 0 };
  }).filter((a) => a.max);
  return { rows, earned, max, percent, byAim };
}

function verdict(percent) {
  if (percent >= 85) {
    return {
      title: "تمييزك للأنسب واضح",
      text: "حين تتشابه ثلاثة خيارات صالحة، تربطين القرار بالقيد المكتوب: الوقت، الميزانية، أو صاحب المصلحة.",
    };
  }
  if (percent >= 70) {
    return {
      title: "الغالب أنسب، وبعض القيود انفلتت",
      text: "الخيارات التي فاتتك ليست خاطئة في كل شركة. هي تأخرت لأن قيد هذا الموقف أضيق.",
    };
  }
  if (percent >= 55) {
    return {
      title: "تعرفين الأداة وتختلفين في لحظة استخدامها",
      text: "راجعي الجملة التي تحسم الأنسب في كل بطاقة، لا اسم الجهاز وحده.",
    };
  }
  return {
    title: "القرار يحتاج إعادة بناء",
    text: "ابدئي من البطاقات الحمراء. كل واحدة تشرح لماذا تأخر اختيارك ولماذا تقدم غيره.",
  };
}

function showWho() {
  if (!state.name) {
    $who.hidden = true;
    return;
  }
  $who.hidden = false;
  $who.innerHTML = "<b>" + esc(state.name) + "</b><span>" + esc(state.klass || "بلا شعبة") + " · الأنسب الواحد</span>";
}

function renderStart(saved) {
  state.phase = "start";
  showWho();
  const resume = saved && saved.name && saved.phase !== "start"
    ? `<div class="resume">
        <strong>${saved.phase === "done" ? "نتيجة محفوظة" : "محاولة محفوظة"} باسم ${esc(saved.name)}</strong>
        <p>${saved.phase === "done" ? "هذه نتيجة هذا الامتحان فقط." : "توقفت عند السؤال " + Math.min((saved.index || 0) + 1, QUESTIONS.length) + " من " + QUESTIONS.length + "."}</p>
        <div class="row-btns">
          <button class="btn" type="button" id="resume">${saved.phase === "done" ? "افتحي النتيجة" : "أكملي الامتحان"}</button>
          <button class="btn ghost" type="button" id="fresh">ابدئي من جديد</button>
        </div>
      </div>`
    : "";
  $app.innerHTML = `
    <p class="kicker">امتحان مستقل · ليس تمرين الستين</p>
    <h1>واحد فقط هو الأنسب</h1>
    <p class="lead">في كل موقف ثلاثة خيارات قد تصلح في ظرف آخر. المطلوب الأنسب لهذا القيد.</p>
    <div class="stats">
      <div class="stat"><b>30</b><span>سيناريو مستقل</span></div>
      <div class="stat"><b>1 من 3</b><span>الأنسب يفوز على الاثنين</span></div>
      <div class="stat"><b>Excel</b><span>ملف علامات لهذا الامتحان فقط</span></div>
    </div>
    <section class="panel">
      <h2>قبل ما تبدئي</h2>
      <ul>
        <li>اكتبي اسمك. يظهر على الشاشة وفي ملف الإكسل الخاص بهذا الامتحان.</li>
        <li>اقرئي النوع والميزانية والأولوية والقيد قبل الخيارات.</li>
        <li>لا تختارين «الأداة الأقوى». اختاري ما يخدم هذا القيد الآن.</li>
        <li>بمجرد الضغط يظهر إن كان اختيارك صحيحًا أو لا.</li>
        <li>الإجابة تُقفل بعد الضغط. العلامة تُحسب من أول اختيار.</li>
      </ul>
      <form class="form" id="start-form">
        <div class="form-row">
          <div>
            <label for="student-name">اسمك</label>
            <input id="student-name" name="student-name" type="text" autocomplete="name" required placeholder="الاسم الثلاثي" />
          </div>
          <div>
            <label for="student-class">الشعبة</label>
            <input id="student-class" name="student-class" type="text" placeholder="مثال: 12 ب" />
          </div>
        </div>
        <p class="err" id="start-err"></p>
        <button class="btn" type="submit">ابدئي الامتحان</button>
      </form>
      ${resume}
    </section>
    <p class="copyline">${COPYRIGHT}</p>
  `;
  document.getElementById("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("student-name").value.trim();
    const klass = document.getElementById("student-class").value.trim();
    if (name.length < 3) {
      document.getElementById("start-err").textContent = "اكتبي اسمك كاملًا قبل البدء.";
      return;
    }
    state.name = name;
    state.klass = klass;
    state.index = 0;
    state.picks = {};
    state.order = {};
    state.startedAt = Date.now();
    state.finishedAt = 0;
    state.filter = "gaps";
    state.phase = "exam";
    save();
    renderExam();
  });
  const resumeBtn = document.getElementById("resume");
  if (resumeBtn) {
    resumeBtn.addEventListener("click", () => {
      Object.assign(state, {
        name: saved.name,
        klass: saved.klass || "",
        index: saved.index || 0,
        picks: saved.picks || {},
        order: saved.order || {},
        startedAt: saved.startedAt || Date.now(),
        finishedAt: saved.finishedAt || 0,
        filter: saved.filter || "gaps",
        phase: saved.phase === "done" ? "done" : "exam",
      });
      if (state.phase === "done") renderResults();
      else renderExam();
    });
    document.getElementById("fresh").addEventListener("click", () => {
      clearSave();
      renderStart(null);
    });
  }
}

function renderExam() {
  state.phase = "exam";
  showWho();
  const q = QUESTIONS[state.index];
  const aim = aimOf(q.aim);
  const opts = optionOrder(q);
  const pick = pickOf(q);
  const revealed = Boolean(pick);
  const picked = revealed ? q.options.find((o) => o.id === pick) : null;
  const pct = Math.round((state.index / QUESTIONS.length) * 100);
  const instant = revealed
    ? `<div class="instant ${picked.ok ? "good" : "bad"}" role="status">
        <strong>${picked.ok ? "صحيح. هذا هو الأنسب." : "غير صحيح. هذا ليس الأنسب."}</strong>
        <p>${picked.ok
          ? esc(picked.why)
          : "اختيارك يصلح في ظرف آخر. السبب تحته، والأنسب موضّح بالأخضر."}</p>
      </div>`
    : "";
  $app.innerHTML = `
    <div class="progress-wrap">
      <div class="progress-meta">
        <span>سؤال ${state.index + 1} من ${QUESTIONS.length}</span>
        <span>${esc(state.name)}</span>
      </div>
      <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
    </div>
    <article class="case">
      <div class="case-top">
        <span class="aim-pill">${esc(aim.ar)} · ${esc(aim.title)}</span>
        <span class="topic-pill">${esc(q.topic)}</span>
      </div>
      <h2>${esc(q.org)}</h2>
      <ul class="facts">
        ${q.facts.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}
      </ul>
      <p class="scene">${esc(q.scene)}</p>
      <p class="ask">اختاري الأنسب لهذا القيد. الخياران الآخران قد يصلحان في ظرف مختلف.</p>
      ${instant}
      <div class="opts" id="opts">
        ${opts.map((o, i) => optionButton(o, i, pick, revealed)).join("")}
      </div>
      ${revealed ? `<p class="rule">${esc(q.rule)}</p>` : `<p class="pick-note" id="pick-note">اختاري خيارًا واحدًا.</p>`}
    </article>
    <div class="nav">
      <button class="btn ghost" type="button" id="prev" ${state.index === 0 ? "disabled" : ""}>السابق</button>
      <button class="btn navy" type="button" id="next">${state.index === QUESTIONS.length - 1 ? "تسليم وملف الإكسل" : "التالي"}</button>
    </div>
    <div class="map" id="map" aria-label="خريطة الأسئلة"></div>
  `;
  document.getElementById("opts").addEventListener("click", (e) => {
    const btn = e.target.closest(".opt");
    if (!btn || btn.disabled || revealed) return;
    state.picks[q.id] = [btn.getAttribute("data-id")];
    save();
    renderExam();
  });
  document.getElementById("prev").addEventListener("click", () => {
    if (state.index === 0) return;
    state.index -= 1;
    save();
    renderExam();
  });
  document.getElementById("next").addEventListener("click", () => {
    if (!revealed) {
      const note = document.getElementById("pick-note");
      if (note) {
        note.textContent = "اختاري خيارًا أولًا.";
        note.classList.add("warn");
      }
      return;
    }
    if (state.index === QUESTIONS.length - 1) {
      openConfirm();
      return;
    }
    state.index += 1;
    save();
    renderExam();
  });
  paintMap();
  window.scrollTo(0, 0);
}

function optionButton(o, i, pick, revealed) {
  let cls = "opt";
  let tag = "";
  if (revealed && o.ok) {
    cls += " good";
    tag = "الأنسب";
  } else if (revealed && o.id === pick) {
    cls += " bad";
    tag = "اختيارك";
  } else if (revealed) {
    cls += " dim";
    tag = "ظرف آخر";
  }
  const why = revealed ? `<small class="why">${esc(o.why)}</small>` : "";
  return `<button type="button" class="${cls}" data-id="${esc(o.id)}" ${revealed ? "disabled" : ""}>
    <span class="letter">${LETTERS[i]}</span>
    <span>${tag ? `<b class="opt-tag">${tag}</b><br />` : ""}${esc(o.text)}${why}</span>
  </button>`;
}

function paintMap() {
  const map = document.getElementById("map");
  map.innerHTML = QUESTIONS.map((q, i) => {
    const done = isAnswered(q);
    const wrong = done && scoreQuestion(q).hit === 0;
    return `<button type="button" data-go="${i}" class="${done ? "done" : ""} ${wrong ? "miss" : ""} ${i === state.index ? "here" : ""}">${i + 1}</button>`;
  }).join("");
  map.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    state.index = Number(btn.getAttribute("data-go"));
    save();
    renderExam();
  };
}

function openConfirm() {
  const missing = QUESTIONS.filter((q) => !isAnswered(q)).length;
  const box = document.createElement("div");
  box.className = "modal";
  box.innerHTML = `
    <div class="panel">
      <h2>تسليم هذا الامتحان؟</h2>
      <p>${missing
        ? "ما زال " + missing + " سؤالًا بلا إجابة. ارجعي إليه من الخريطة."
        : "تُحفظ نتيجة هذا الامتحان وحدها، وينزل ملف إكسل مستقل عن تمرين الستين."}</p>
      <div class="row-btns">
        <button class="btn" type="button" id="do-finish" ${missing ? "disabled" : ""}>سلّمي وافتحي الدفتر</button>
        <button class="btn ghost" type="button" id="do-back">رجوع</button>
      </div>
    </div>
  `;
  document.body.appendChild(box);
  box.querySelector("#do-back").onclick = () => box.remove();
  box.querySelector("#do-finish").onclick = () => {
    box.remove();
    finish();
  };
}

function finish() {
  state.finishedAt = Date.now();
  state.phase = "done";
  state.filter = "gaps";
  const report = grade();
  sendCloud(report);
  save();
  renderResults();
}

function durationText() {
  const sec = Math.max(0, Math.round(((state.finishedAt || Date.now()) - state.startedAt) / 1000));
  return Math.floor(sec / 60) + " د و " + (sec % 60) + " ث";
}

function renderResults() {
  state.phase = "done";
  showWho();
  const report = grade();
  const v = verdict(report.percent);
  const gaps = report.rows.filter((r) => r.hit < 1).length;
  $app.innerHTML = `
    <p class="kicker">نتيجة الأنسب الواحد · ${esc(state.name)}</p>
    <div class="score-hero panel">
      <div class="ring" style="--p:${report.percent}"><span>${report.percent}%</span></div>
      <div>
        <p class="verdict">${esc(v.title)}</p>
        <p>${esc(v.text)}</p>
        <p>الدرجة ${report.earned} من ${report.max} · الوقت ${durationText()} · أخطاء ${gaps} من 30</p>
        <p>هذا الامتحان مستقل. ملف الإكسل نسخة عند الطالبة، والنتيجة تُحفظ في جدوله الخاص.</p>
        ${state.sendNote ? `<p>${esc(state.sendNote)}</p>` : ""}
        <div class="row-btns">
          <button class="btn" type="button" id="excel">تنزيل Excel لهذا الامتحان</button>
          <button class="btn ghost" type="button" id="again">محاولة جديدة</button>
        </div>
      </div>
    </div>
    <section class="panel">
      <h2>النواتج</h2>
      <div class="aims">
        ${report.byAim.map((a) => `
          <div class="aim-row${a.percent < 70 ? " weak" : ""}">
            <span>${esc(a.ar)} ${esc(a.title)}</span>
            <div class="track"><i style="width:${a.percent}%"></i></div>
            <b>${a.percent}%</b>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="panel review-head">
      <h2>مراجعة الأخطاء</h2>
      <p>كل بطاقة حمراء تعرض اختيارك ولماذا تأخر، والأنسب ولماذا تقدم، والخيار الثالث والظرف الذي يناسبه.</p>
    </section>
    <div class="filters">
      <button class="btn ghost${state.filter === "gaps" ? " on" : ""}" type="button" data-filter="gaps">أخطائي</button>
      <button class="btn ghost${state.filter === "all" ? " on" : ""}" type="button" data-filter="all">الثلاثون</button>
      ${report.byAim.map((a) => `<button class="btn ghost${state.filter === a.id ? " on" : ""}" type="button" data-filter="${a.id}">${a.ar}</button>`).join("")}
    </div>
    <div id="lessons"></div>
    <p class="copyline">${COPYRIGHT}</p>
  `;
  paintLessons(report);
  document.getElementById("excel").onclick = () => downloadExcel(report);
  document.getElementById("again").onclick = () => {
    clearSave();
    state.name = "";
    state.klass = "";
    state.picks = {};
    state.order = {};
    state.index = 0;
    state.finishedAt = 0;
    renderStart(null);
  };
  $app.querySelector(".filters").onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    state.filter = btn.getAttribute("data-filter");
    save();
    renderResults();
  };
}

function paintLessons(report) {
  const host = document.getElementById("lessons");
  let rows = report.rows;
  if (state.filter === "gaps") rows = rows.filter((r) => r.hit < 1);
  else if (state.filter !== "all") rows = rows.filter((r) => r.q.aim === state.filter);
  if (!rows.length) {
    host.innerHTML = `<section class="panel"><p>لا أخطاء في هذا العرض. افتحي «الثلاثون» لمراجعة سبب كل أنسب.</p></section>`;
    return;
  }
  host.innerHTML = rows.map((r) => lessonHtml(r)).join("");
}

function choiceCard(o, tone, label) {
  return `<div class="choice ${tone}">
    <span class="tag ${tone === "bad" ? "no" : "ok"}">${label}</span>
    <p><strong>${esc(o.text)}</strong><br />${esc(o.why)}</p>
  </div>`;
}

function lessonHtml(r) {
  const q = r.q;
  const aim = aimOf(q.aim);
  const pick = pickOf(q);
  const picked = q.options.find((o) => o.id === pick);
  const best = q.options.find((o) => o.ok);
  const others = q.options.filter((o) => !o.ok);
  const body = r.hit === 1
    ? `<h3>لماذا تقدم هذا الخيار</h3>
       ${choiceCard(best, "good", "الأنسب لهذا القيد")}
       <h3>لماذا تأخر الخياران</h3>
       ${others.map((o) => choiceCard(o, "bad", "صالح في ظرف آخر")).join("")}`
    : `<h3>اختيارك ولماذا ليس الأنسب هنا</h3>
       ${choiceCard(picked, "bad", "اختيارك")}
       <h3>الأنسب ولماذا تقدم</h3>
       ${choiceCard(best, "good", "الأنسب لهذا القيد")}
       <h3>الخيار الثالث</h3>
       ${others.filter((o) => o.id !== pick).map((o) => choiceCard(o, "bad", "ظرف آخر")).join("")}`;
  return `
    <details class="lesson${r.hit < 1 ? " miss" : ""}"${r.hit < 1 ? " open" : ""}>
      <summary>
        <span>${r.i + 1}. ${esc(q.org)} · ${esc(q.topic)}</span>
        <span class="tag ${r.hit === 1 ? "ok" : "no"}">${r.hit}/1</span>
      </summary>
      <div class="body">
        <p><span class="aim-pill">${esc(aim.ar)} · ${esc(aim.title)}</span></p>
        <p>${esc(q.scene)}</p>
        <p class="rule">${esc(q.rule)}</p>
        ${body}
      </div>
    </details>
  `;
}

function xml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sheet(name, rows) {
  const body = rows.map((r) => "<Row>" + r.map((c) => {
    const num = typeof c === "number";
    return `<Cell><Data ss:Type="${num ? "Number" : "String"}">${num ? c : xml(c)}</Data></Cell>`;
  }).join("") + "</Row>").join("");
  return `<Worksheet ss:Name="${xml(name)}" ss:RightToLeft="1"><Table>${body}</Table></Worksheet>`;
}

function downloadExcel(report) {
  const v = verdict(report.percent);
  const summary = [
    ["الامتحان", "الأنسب الواحد — امتحان مستقل"],
    ["الاسم", state.name],
    ["الشعبة", state.klass || ""],
    ["التاريخ", new Date(state.finishedAt).toLocaleString("ar-JO")],
    ["المدة", durationText()],
    ["الدرجة", report.earned],
    ["من", report.max],
    ["النسبة", report.percent],
    ["التقدير", v.title],
    ["ملاحظة", "هذا الملف لا يحتوي نتائج تمرين الستين"],
    ["الحقوق", COPYRIGHT],
  ];
  report.byAim.forEach((a) => summary.push([a.ar + " " + a.title, a.percent]));
  const details = [[
    "رقم", "الناتج", "الموضوع", "المؤسسة", "اختيار الطالبة", "الأنسب", "الدرجة", "من", "القاعدة",
  ]];
  report.rows.forEach((r) => {
    const chosen = r.q.options.find((o) => o.id === pickOf(r.q));
    const right = r.q.options.find((o) => o.ok);
    details.push([
      r.i + 1,
      aimOf(r.q.aim).ar,
      r.q.topic,
      r.q.org,
      chosen ? chosen.text : "",
      right.text,
      r.hit,
      1,
      r.q.rule,
    ]);
  });
  const gaps = [details[0]].concat(details.slice(1).filter((_, i) => report.rows[i].hit < 1));
  const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheet("ملخص", summary)}
${sheet("التفاصيل", details)}
${sheet("الفجوات", gaps)}
</Workbook>`;
  const blob = new Blob(["\uFEFF" + xmlDoc], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a");
  const safe = state.name.replace(/[\\/:*?"<>|]/g, "").trim() || "student";
  a.href = URL.createObjectURL(blob);
  a.download = "الأنسب-الواحد-" + safe + ".xls";
  a.click();
  URL.revokeObjectURL(a.href);
}

function sheetsUrl() {
  return String((window.BEST_CLOUD || {}).sheetsUrl || "").trim();
}

function cloudPayload(report) {
  const v = verdict(report.percent);
  const weak = report.byAim.filter((a) => a.percent < 70).map((a) => a.ar + " " + a.title);
  return {
    kind: "best",
    name: state.name,
    klass: state.klass,
    startedAt: state.startedAt ? new Date(state.startedAt).toLocaleString("ar-JO") : "",
    finishedAt: state.finishedAt ? new Date(state.finishedAt).toLocaleString("ar-JO") : "",
    durationText: durationText(),
    earned: report.earned,
    max: report.max,
    percent: report.percent,
    band: v.title,
    weakAims: weak.join(" | "),
    aims: report.byAim.map((a) => ({
      id: a.id,
      title: a.title,
      earned: a.earned,
      max: a.max,
      percent: a.percent,
    })),
    details: report.rows.map((r) => {
      const chosen = r.q.options.find((o) => o.id === pickOf(r.q));
      const correct = r.q.options.find((o) => o.ok);
      return {
        num: r.i + 1,
        aim: aimOf(r.q.aim).ar,
        topic: r.q.topic,
        org: r.q.org,
        chosen: chosen ? chosen.text : "",
        correct: correct ? correct.text : "",
        hit: r.hit,
        max: 1,
        result: r.hit === 1 ? "أنسب" : "ليس الأنسب",
        rule: r.q.rule,
      };
    }),
  };
}

function sendCloud(report) {
  const url = sheetsUrl();
  if (!url) {
    state.sendNote = "";
    return;
  }
  const body = JSON.stringify(cloudPayload(report));
  state.sendNote = "أُرسلت النتيجة إلى جدول هذا الامتحان.";
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.target = "bestSink";
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  ["payload", "data"].forEach((name) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = body;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

function boot() {
  const saved = load();
  if (saved && saved.phase === "done" && saved.name) {
    Object.assign(state, saved);
    renderResults();
    return;
  }
  renderStart(saved);
}

boot();
