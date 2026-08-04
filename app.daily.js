/* ===================== 个人工作台 app.js ===================== */
(function () {
  "use strict";

  const STORE_KEY = "workbench_v1";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 数据存储 ---------- */
  const defaultStore = {
    daily: {},     // { "YYYY-MM-DD": [{id, text, done}] }
    dailyHabit: {},   // { "YYYY-MM-DD": {water:int, sleep:int, mood:int(-1未选/0-6), workoutVideos:[], custom:[]} }
    dailyTimeline: {}, // { "YYYY-MM-DD": [{id, time, text, done}] }
    dailySegments: {}, // { "YYYY-MM-DD": { s1, s2, s3 } } 时间轴三段时段备忘
    dailyPhotos: {},  // { "YYYY-MM-DD": { top: dataURL|null, bottom: dataURL|null } } 对比图照片
    dailyCompareNote: {}, // { "YYYY-MM-DD": 备注文本 } 对比图底部输入框
    dailyMetrics: {},   // { "YYYY-MM-DD": [{id, name, prev, curr}] } 对比图数据对比
    weekly: {},    // { "MonDate": { focus:[..], reward:"", checks:{1..7:bool} } } 周计划（重点/奖励/打卡）
    resources: [], // [{id, name, url, cat, note}]
    hundred: {
      start: null,
      startAuto: true,        // true=计划起点自动跟随「2026 年历」打卡起点；false=用户手动设定
      entries: {},            // {"YYYY-MM-DD":{text,rating}}
      startBody: { height: "", weight: "", bust: "", waist: "", hip: "", hbr: "", hsr: "" },
      photos: { start: null, end: null }, // 第1天 / 第100天 对比照片 dataURL
      startFace: { three: 0, five: 0, jaw: 0, noseLip: 0, browEye: 0 }, // 起始面部 5 项评分 0-100
      currFace: { three: 0, five: 0, jaw: 0, noseLip: 0, browEye: 0 },  // 当前面部 5 项评分 0-100
      rewardClaimed: {},      // { 奖励文案: true }
      rewardList: [],         // 用户在「完成奖励确认」自行添加的奖励文案数组
      nextStarted: null
    },
    calendar: { checkinStart: null }, // 年历 100 天打卡起点（含当日）
    pet: { // 宠物之家（养成陪伴）
      name: "团子",
      food: 0,                 // 食物数量
      fullness: 100,           // 饱食度 0-100（每天减少 20）
      intimacy: 0,             // 亲密度（陪伴天数，抚摸也会少量增加）
      totalCheckins: 0,        // 累计打卡天数（解锁成长阶段）
      streak: 0,               // 当前连续打卡天数（解锁饰品）
      stage: "baby",           // baby 幼崽期 → growing 成长期 → guardian 守护期
      accessories: [],         // 已解锁饰品 id 列表
      lastDecayDate: null,     // 上次饱食度衰减日期
      lastCheckinRewardDate: null, // 上次「打卡得食物」结算日期（防重复）
      lastCheckinDate: null,   // 上次打卡日期（计算连续）
      intimacyDate: null,      // 当天是否已计入陪伴天数
      reminderDate: null       // 当天是否已弹过晚 8 点提醒
    },
    body: { // 个人数据面板
      photo: null,            // 全身照 dataURL（已压缩）
      photoFront: null, photoSide45: null, photoSide: null, // 面部三视角参考照：正面 / 侧面45° / 纯侧面（独立参考，不参与面部分析）
      ffPhoto: null, ffPoints: null, ffResults: null, ffCm: null, // 区块六：正面分析（照片/关键点/结果/手动cm）
      height: "", weight: "", frame: "",
      hbr: "", hsr: "",       // 头身比 / 头肩比（手动或测量得到）
      bust: "", waist: "", hip: "",
      bodyType: "", features: [], hairVol: "", hairTex: [], skin: "",
      meas: { headLen: null }  // 测量得到的头长像素，供头肩比复用
    },
    emotion: { // 情绪治愈盲盒
      dailyLimit: 3,        // 同一盲盒每天最多打开次数
      boxes: [              // 情绪种类（管理员可在设置页增删）
        { id: "happy", emoji: "🥰", icon: "happy", label: "开心", color: "#f6c453", phrases: [
          "你的笑容是世界上最美好的东西",
          "今天的你值得被好好奖励",
          "开心的时候全世界都在对你笑",
          "把今天的好心情收进口袋吧",
          "你让这个世界亮了一点",
          "快乐不用等理由，此刻就很好",
          "记得今天的这份轻盈，真好",
          "你值得所有温柔的好事",
          "认真生活的你，值得这份开心",
          "笑起来，连风都变得柔软了"
        ]},
        { id: "sad", emoji: "🥺", icon: "sad", label: "难过", color: "#6aa9e0", phrases: [
          "难过是暂时的，你比自己想象的更坚强",
          "允许自己难过，但不要忘了明天还有光",
          "你已经很棒了，抱抱自己",
          "眼泪流完，心里会轻一些",
          "不是所有时刻都要坚强，可以歇一歇",
          "我会陪着你，哪怕只是安静坐着",
          "今天的难过，明天会慢慢退潮",
          "你不需要立刻好起来，慢慢来",
          "被理解很难，但你的感受是真的",
          "难熬的时候，记得先照顾好自己"
        ]},
        { id: "wronged", emoji: "🥹", icon: "wronged", label: "委屈", color: "#b48ad6", phrases: [
          "你的感受很重要，不要否定自己",
          "委屈的时候记得抬头看看天空",
          "被误解的时候，先抱抱自己",
          "你没错，只是还没被好好听见",
          "心里堵着没关系，慢慢会通的",
          "说出来吧，哪怕只是对自己说",
          "不是你敏感，是你真的很在意",
          "等一个懂你的人，你也值得",
          "受了委屈还温柔，你很了不起",
          "今晚允许自己什么都不解释"
        ]},
        { id: "anxious", emoji: "😣", icon: "anxious", label: "焦虑", color: "#f2994a", phrases: [
          "慢慢来，你不需要一下子解决所有问题",
          "焦虑是大脑在保护你，但你已经很安全了",
          "深呼吸，今天只做今天的事",
          "把大的担心拆成小小的一步",
          "你现在所在的这里，是安全的",
          "想不清楚的时候，先放下也没事",
          "你已经比昨天多撑了一会儿",
          "允许计划有缝隙，没关系",
          "把肩膀放下来，世界不会塌",
          "今晚先睡一觉，明天再说"
        ]},
        { id: "tired", emoji: "🥱", icon: "tired", label: "疲惫", color: "#88b89a", phrases: [
          "累了就停下来歇一歇，你不需要一直奔跑",
          "你已经做得很好了，现在可以休息了",
          "疲惫的时候记得给自己一杯温水",
          "休息不是偷懒，是给自己充电",
          "今天的你，已经尽力了",
          "允许自己什么都不做一会儿",
          "身体在提醒你，该心疼它了",
          "慢一点，路还长，不用赶",
          "撑了这么久，辛苦你了",
          "今晚早点睡，是最好的奖励"
        ]},
        { id: "lost", emoji: "🫥", icon: "lost", label: "迷茫", color: "#8fa8c0", phrases: [
          "不知道去哪里的时候，先走好脚下的路",
          "迷茫是成长的信号，你正在变得更好",
          "答案会在你安静下来的时候慢慢浮现",
          "走一步算一步，也是一种方向",
          "迷路的人，也在认真寻找自己",
          "不必现在就看清全部，先看脚下",
          "你不是落后，只是在自己的时区",
          "试着相信，下一步会自然出现",
          "迷茫里藏着还没发现的自己",
          "慢慢来，你正在成为想成为的人"
        ]}
      ],
      records: {},      // { "YYYY-MM-DD": {emotion, emoji, label, color, phrase, time} }
      dailyCounts: {},  // { "YYYY-MM-DD": { emotionId: 次数 } }
      bag: {}           // { emotionId: [待抽索引队列] } 抽完一轮再洗牌，避免连续重复
    }
  };
  let store = load();

  // 深合并：旧存档加载时自动补齐新版本新增的嵌套字段，避免 undefined 访问崩溃
  function deepMerge(base, override) {
    if (base === null || typeof base !== "object") return (override === undefined ? base : override);
    if (Array.isArray(base)) return Array.isArray(override) ? override : base;
    const out = {};
    for (const k in base) {
      const ov = (override && typeof override === "object" && !Array.isArray(override)) ? override[k] : undefined;
      out[k] = deepMerge(base[k], ov);
    }
    if (override && typeof override === "object" && !Array.isArray(override)) {
      for (const k in override) if (!(k in out)) out[k] = override[k];
    }
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return structuredClone(defaultStore);
      return deepMerge(structuredClone(defaultStore), JSON.parse(raw));
    } catch (e) {
      return structuredClone(defaultStore);
    }
  }
  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  }
  const uid = () => Math.random().toString(36).slice(2, 9);

  /* ---------- 日期工具 ---------- */
  const WK = ["日", "一", "二", "三", "四", "五", "六"];
  function fmt(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function parse(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function getMonday(d) {
    const x = new Date(d); const day = (x.getDay() + 6) % 7; // Mon=0
    x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x;
  }
  const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
  const TODAY_STR = fmt(TODAY);

  /* ===================== 导航切换 ===================== */
  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const t = btn.dataset.target;
      $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.target === t));
      $$(".view").forEach((v) => v.classList.remove("active"));
      $("#view-" + t).classList.add("active");
      if (t === "analysis") renderAnalysis();
      if (t === "calendar") renderCalendar();
      if (t === "hundred") renderHundred();
      if (t === "weekly") renderWeekly();
      if (t === "emotion") renderEmotion();
      if (t === "pet" && window.Pet) window.Pet.renderHome();
    });
  });

  /* ===================== 1. 2026 年历 ===================== */
  // 2026 年法定节假日（国务院办公厅放假调休安排）：全部放假日集合
  const HOLIDAYS_2026 = new Set([
    "2026-01-01", "2026-01-02", "2026-01-03",                                   // 元旦 3 天
    "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19",     // 春节 9 天
    "2026-02-20", "2026-02-21", "2026-02-22", "2026-02-23",
    "2026-04-04", "2026-04-05", "2026-04-06",                                   // 清明 3 天
    "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05",     // 劳动 5 天
    "2026-06-19", "2026-06-20", "2026-06-21",                                   // 端午 3 天
    "2026-09-25", "2026-09-26", "2026-09-27",                                   // 中秋 3 天
    "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05",     // 国庆 7 天
    "2026-10-06", "2026-10-07"
  ]);
  // 各假期首日 → 节日名称（年历格子下方标注）
  const HOLIDAY_FIRST_2026 = {
    "2026-01-01": "元旦", "2026-02-15": "春节", "2026-04-04": "清明",
    "2026-05-01": "劳动节", "2026-06-19": "端午", "2026-09-25": "中秋", "2026-10-01": "国庆"
  };
  let pickMode = false; // 年历「点选起始日」模式

  // 计算 100 天打卡区间（含起始日）的日期集合
  function checkinSet() {
    const s = store.calendar.checkinStart;
    if (!s) return null;
    const set = new Set();
    const base = parse(s);
    for (let i = 0; i < 100; i++) set.add(fmt(addDays(base, i)));
    return set;
  }

  function renderCalendar() {
    const grid = $("#calendarGrid");
    const set = checkinSet();
    const startStr = store.calendar.checkinStart;
    // 区间信息
    const info = $("#calCheckinInfo");
    if (startStr) {
      const endStr = fmt(addDays(parse(startStr), 99));
      info.textContent = `${startStr} → ${endStr}（共 100 天）`;
    } else {
      info.textContent = "未设定起始日";
    }
    // 点选模式按钮状态
    const pickBtn = $("#calPickMode");
    pickBtn.classList.toggle("active", pickMode);
    pickBtn.textContent = pickMode ? "✎ 点选日历中的某一天…" : "✎ 设定打卡起点";
    $("#calPickHint").hidden = !pickMode;

    grid.innerHTML = "";
    const months = ["一月", "二月", "三月", "四月", "五月", "六月",
      "七月", "八月", "九月", "十月", "十一月", "十二月"];
    for (let m = 0; m < 12; m++) {
      const first = new Date(2026, m, 1);
      const startWk = (first.getDay() + 6) % 7; // Mon=0
      const days = new Date(2026, m + 1, 0).getDate();
      const box = document.createElement("div");
      box.className = "month";
      let html = `<div class="month-title">${2026} 年 ${months[m]}</div><div class="month-grid">`;
      WK.slice(1).concat("日").forEach((w) => html += `<div class="wk">${w}</div>`);
      for (let i = 0; i < startWk; i++) html += `<div class="day blank"></div>`;
      for (let d = 1; d <= days; d++) {
        const dateStr = `2026-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dow = new Date(2026, m, d).getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isToday = dateStr === TODAY_STR;
        const isStart = dateStr === startStr;
        const inWindow = set && set.has(dateStr);
        const hasTask = store.daily[dateStr] && store.daily[dateStr].length;
        const emoRec = store.emotion && store.emotion.records[dateStr];
        const hasEmo = !!emoRec;
        const isHoli = HOLIDAYS_2026.has(dateStr);
        const holiName = HOLIDAY_FIRST_2026[dateStr] || "";
        const cls = ["day", isWeekend ? "weekend" : "", isToday ? "today" : "",
          inWindow ? "checkin" : "", isStart ? "checkin-start" : "",
          hasTask ? "has-task" : "", isHoli ? "holi" : "", hasEmo ? "has-emo" : ""].join(" ").trim();
        const mark = isHoli ? `<span class="day-holi">*${holiName ? " " + holiName : ""}</span>` : "";
        const emoDot = hasEmo ? `<span class="emo-dot" style="background:${emoRec.color}" title="${emoRec.emoji} ${emoRec.label}"></span>` : "";
        const titleTxt = (holiName ? holiName + "（法定节假日）" : "") + (hasEmo ? (holiName ? "；" : "") + emoRec.label + " 治愈盲盒" : "");
        html += `<div class="${cls}" data-date="${dateStr}"${titleTxt ? ` title="${titleTxt}"` : ""}><span class="day-num">${d}</span>${mark}${emoDot}</div>`;
      }
      html += `</div></div>`;
      box.innerHTML = html;
      box.querySelectorAll(".day[data-date]").forEach((el) => {
        el.addEventListener("click", () => {
          if (pickMode) {
            store.calendar.checkinStart = el.dataset.date;
            store.hundred.startAuto = true; // 年历起点变化 → 恢复 100 天总结自动跟随
            weekMon = parse(store.calendar.checkinStart); // 周计划起点 = 年历起始日（即第 1 天）
            save();
            pickMode = false;
            renderCalendar();
          } else {
            const rec = store.emotion && store.emotion.records[el.dataset.date];
            if (rec) { rec.dateStr = el.dataset.date; showEmotionRecord(rec); }
            else { openDaily(el.dataset.date); }
          }
        });
      });
      grid.appendChild(box);
    }
  }

  // 工具栏：进入/退出「点选起始日」模式
  $("#calPickMode").addEventListener("click", () => {
    pickMode = !pickMode;
    renderCalendar();
  });
  // 工具栏：清除打卡区间
  $("#calClear").addEventListener("click", () => {
    if (!store.calendar.checkinStart) return;
    if (confirm("确认清除 100 天打卡区间标记？")) {
      store.calendar.checkinStart = null;
      save();
      renderCalendar();
    }
  });

  /* ===================== 2. 个人分析 ===================== */
  /* ===================== 2. 个人数据面板 ===================== */
  const BODY_FEATURES = ["直角肩","天鹅颈","锁骨明显","马甲线","腰线明显","腿修长","臀型饱满","肩背薄"];
  const HAIR_TEX = ["细软","粗硬","油性","干枯","自然卷","受损"];
  const SKIN_TONES = [
    { v: "浅", c: "#fde7d6" }, { v: "白皙", c: "#f6d3b0" }, { v: "自然", c: "#e8b48a" },
    { v: "小麦", c: "#cf9b6e" }, { v: "深褐", c: "#9c6b45" }
  ];
  let bodyInited = false;
  // 面部三视角照片（独立参考照，不参与面部分析）
  const EXTRA_PHOTOS = [
    { key: "photoFront",  box: "frontBox",   img: "frontPhoto",   empty: "frontEmpty",   input: "frontInput",   up: "frontUploadBtn",   clear: "frontClearBtn" },
    { key: "photoSide45", box: "side45Box",  img: "side45Photo",  empty: "side45Empty",  input: "side45Input",  up: "side45UploadBtn",  clear: "side45ClearBtn" },
    { key: "photoSide",   box: "sideBox",    img: "sidePhoto",    empty: "sideEmpty",    input: "sideInput",    up: "sideUploadBtn",    clear: "sideClearBtn" }
  ];
  let measureMode = null;   // 'hb' | 'hs' | null
  let measurePts = [];

  function renderAnalysis() { initBodyPanel(); }

  function initBodyPanel() {
    if (!bodyInited) {
      // 生成多选 / 肤色色块（静态渲染，便于日后增删选项）
      $("#bFeatures").innerHTML = BODY_FEATURES.map((t) =>
        `<label class="chk"><input type="checkbox" value="${t}"><span>${t}</span></label>`).join("");
      $("#bHairTex").innerHTML = HAIR_TEX.map((t) =>
        `<label class="chk"><input type="checkbox" value="${t}"><span>${t}</span></label>`).join("");
      $("#bSkin").innerHTML = SKIN_TONES.map((s) =>
        `<button type="button" class="skin-sw" data-v="${s.v}"><span class="skin-color" style="background:${s.c}"></span><span>${s.v}</span></button>`).join("");
      bindBodyEvents();
      bodyInited = true;
    }
    loadBody();
    requestAnimationFrame(sizeCanvas);
  }

  function bindBodyEvents() {
    // 照片：上传 / 拖拽 / 移除
    $("#photoUploadBtn").addEventListener("click", () => $("#photoInput").click());
    $("#photoInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) handlePhoto(f); e.target.value = ""; });
    $("#photoClearBtn").addEventListener("click", () => { store.body.photo = null; store.body.meas = { headLen: null }; showPhoto(null); });
    const box = $("#photoBox");
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("drag"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("drag"); const f = e.dataTransfer.files[0]; if (f) handlePhoto(f); });

    // 自动计算（纯数值）
    $("#bHeight").addEventListener("input", recomputeBMI);
    $("#bWeight").addEventListener("input", recomputeBMI);
    $("#bWaist").addEventListener("input", recomputeWHR);
    $("#bHip").addEventListener("input", recomputeWHR);

    // 分段单选（骨架量感 / 体型 / 发量）
    $$(".seg.single").forEach((g) => g.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      $$("button", g).forEach((x) => x.classList.toggle("active", x === b));
      switch (g.id) {
        case "bFrame": store.body.frame = b.dataset.v; break;
        case "bBodyType": store.body.bodyType = b.dataset.v; break;
        case "bHairVol": store.body.hairVol = b.dataset.v; break;
      }
    }));

    // 多选（身材特征 / 发质）
    $("#bFeatures").addEventListener("change", (e) => { if (e.target.matches('input[type=checkbox]')) toggleArr(store.body.features, e.target.value, e.target.checked); });
    $("#bHairTex").addEventListener("change", (e) => { if (e.target.matches('input[type=checkbox]')) toggleArr(store.body.hairTex, e.target.value, e.target.checked); });

    // 肤色（单选色块）
    $("#bSkin").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      $$("button", $("#bSkin")).forEach((x) => x.classList.toggle("active", x === b));
      store.body.skin = b.dataset.v;
    });

    // 头身比 / 头肩比 手动输入
    $("#bHbr").addEventListener("input", () => { store.body.hbr = $("#bHbr").value; });
    $("#bHsr").addEventListener("input", () => { store.body.hsr = $("#bHsr").value; });

    // 重新计算（照片标记）
    $$("[data-meas]").forEach((b) => b.addEventListener("click", () => startMeasure(b.dataset.meas)));
    $("#measureCanvas").addEventListener("click", onMeasureClick);

    // 保存
    $("#bodySaveBtn").addEventListener("click", saveBody);

    // 面部三视角照片上传区
    EXTRA_PHOTOS.forEach(setupExtraPhoto);
    // 区块六：正面分析
    setupFrontFace();
  }

  function toggleArr(arr, v, on) {
    const i = arr.indexOf(v);
    if (on && i < 0) arr.push(v);
    if (!on && i >= 0) arr.splice(i, 1);
  }

  // 压缩上传图片为 dataURL（复用同一逻辑，避免超出 localStorage 配额）
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { reject(new Error("请上传图片文件")); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1000, w = img.width, h = img.height;
          const scale = Math.min(1, max / Math.max(w, h));
          const cw = Math.round(w * scale), ch = Math.round(h * scale);
          const c = document.createElement("canvas"); c.width = cw; c.height = ch;
          c.getContext("2d").drawImage(img, 0, 0, cw, ch);
          let data; try { data = c.toDataURL("image/jpeg", 0.82); } catch (e) { data = reader.result; }
          resolve(data);
        };
        img.onerror = () => reject(new Error("图片解码失败"));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });
  }

  // 上传照片：压缩后存入 localStorage
  function handlePhoto(file) {
    compressImage(file).then((data) => { store.body.photo = data; showPhoto(data); })
      .catch((e) => alert(e.message));
  }

  // 面部三视角照片上传区（与全身照同款：压缩存 dataURL、可更换、本地保存）
  function setupExtraPhoto(cfg) {
    const box = $("#" + cfg.box), input = $("#" + cfg.input),
          img = $("#" + cfg.img), empty = $("#" + cfg.empty),
          up = $("#" + cfg.up), clr = $("#" + cfg.clear);
    up.addEventListener("click", () => input.click());
    input.addEventListener("change", (e) => { const f = e.target.files[0]; if (f) handlePhotoFile(f, cfg.key); e.target.value = ""; });
    box.addEventListener("click", (e) => { if (e.target === up || up.contains(e.target)) return; input.click(); });
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("drag"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("drag"); const f = e.dataTransfer.files[0]; if (f) handlePhotoFile(f, cfg.key); });
    clr.addEventListener("click", () => { store.body[cfg.key] = null; showExtraPhoto(cfg, null); });
  }

  // 压缩上传图片为 dataURL（复用全身照的压缩逻辑，避免超出 localStorage 配额）
  function handlePhotoFile(file, key) {
    compressImage(file).then((data) => {
      store.body[key] = data;
      const cfg = EXTRA_PHOTOS.find((x) => x.key === key);
      if (cfg) showExtraPhoto(cfg, data);
    }).catch((e) => alert(e.message));
  }

  function showExtraPhoto(cfg, src) {
    const img = $("#" + cfg.img), empty = $("#" + cfg.empty), clr = $("#" + cfg.clear);
    if (src) { img.src = src; img.style.display = "block"; empty.hidden = true; clr.hidden = false; }
    else { img.removeAttribute("src"); img.style.display = "none"; empty.hidden = false; clr.hidden = true; }
  }

  function showPhoto(src) {
    const img = $("#bodyPhoto"), empty = $("#photoEmpty"), clear = $("#photoClearBtn");
    if (src) {
      img.onload = () => requestAnimationFrame(sizeCanvas);
      img.src = src; img.style.display = "block"; empty.hidden = true; clear.hidden = false;
    } else {
      img.removeAttribute("src"); img.style.display = "none"; empty.hidden = false; clear.hidden = true;
      clearCanvas();
    }
  }

  // 让测量画布与显示中的照片同尺寸对齐
  function sizeCanvas() {
    const img = $("#bodyPhoto"); if (!img || !img.clientWidth) return;
    const cv = $("#measureCanvas");
    cv.width = img.clientWidth; cv.height = img.clientHeight;
    cv.style.width = img.clientWidth + "px"; cv.style.height = img.clientHeight + "px";
  }

  // 进入测量模式：在照片上点选关键点
  function startMeasure(mode) {
    if (!store.body.photo) { alert("请先上传全身照，再使用重新计算。"); return; }
    measureMode = mode; measurePts = []; clearCanvas();
    const hint = $("#measureHint");
    hint.hidden = false;
    hint.textContent = mode === "hb"
      ? "头身比测量：请在照片上依次点击【头顶 → 下巴 → 脚底】"
      : "头肩比测量：请在照片上依次点击【左肩 → 右肩】（需先完成头身比测量以取得头长）";
    sizeCanvas();
  }

  function onMeasureClick(e) {
    if (!measureMode) return;
    const cv = $("#measureCanvas"); const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    measurePts.push([x, y]); drawMarkers();
    const need = measureMode === "hb" ? 3 : 2;
    if (measurePts.length >= need) finishMeasure();
  }

  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  function drawMarkers() {
    const cv = $("#measureCanvas"); const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (measurePts.length >= 2) {
      ctx.strokeStyle = "rgba(196,122,135,.9)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(measurePts[0][0], measurePts[0][1]);
      for (let i = 1; i < measurePts.length; i++) ctx.lineTo(measurePts[i][0], measurePts[i][1]);
      ctx.stroke();
    }
    measurePts.forEach((p, i) => {
      ctx.fillStyle = "#c9a227"; ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#3d2a17"; ctx.font = "11px serif"; ctx.fillText(String(i + 1), p[0] + 7, p[1] - 6);
    });
  }

  function clearCanvas() { const cv = $("#measureCanvas"); if (cv) { const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height); } }

  function finishMeasure() {
    const mode = measureMode;
    if (mode === "hb") {
      const [crown, chin, feet] = measurePts;
      const headLen = dist(crown, chin), full = dist(crown, feet);
      if (headLen < 5) { alert("标记距离过近，请重新点击。"); resetMeasure(); return; }
      const ratio = full / headLen;
      store.body.meas = { headLen };
      store.body.hbr = ratio.toFixed(1);
      $("#bHbr").value = ratio.toFixed(1);
      const h = parseFloat($("#bHeight").value);
      $("#measureHint").textContent = `头身比 ≈ ${ratio.toFixed(1)} 头身` + (h > 0 ? `（估算头长 ${(h / ratio).toFixed(1)} cm）` : "");
    } else {
      const headLen = store.body.meas && store.body.meas.headLen;
      if (!headLen) { alert("请先完成「头身比」测量以取得头长，或在头肩比输入框手动填写。"); resetMeasure(); return; }
      const shoulder = dist(measurePts[0], measurePts[1]);
      const ratio = shoulder / headLen;
      store.body.hsr = ratio.toFixed(1);
      $("#bHsr").value = ratio.toFixed(1);
      $("#measureHint").textContent = `头肩比 ≈ ${ratio.toFixed(1)} 头肩`;
    }
    measureMode = null; measurePts = [];
    setTimeout(clearCanvas, 1500);
  }

  function resetMeasure() { measureMode = null; measurePts = []; clearCanvas(); $("#measureHint").hidden = true; }

  function recomputeBMI() {
    const h = parseFloat($("#bHeight").value), w = parseFloat($("#bWeight").value);
    const tag = $("#bmiTag");
    if (h > 0 && w > 0) {
      const bmi = w / Math.pow(h / 100, 2);
      $("#bBMI").textContent = bmi.toFixed(1);
      let cat, cls;
      if (bmi < 18.5) { cat = "偏瘦"; cls = "thin"; }
      else if (bmi < 24) { cat = "正常"; cls = "normal"; }
      else { cat = "偏胖"; cls = "fat"; }
      tag.textContent = cat;
      tag.className = "bmi-tag " + cls;
    } else {
      $("#bBMI").textContent = "—";
      tag.textContent = "";
      tag.className = "bmi-tag";
    }
  }
  function recomputeWHR() {
    const wa = parseFloat($("#bWaist").value), hi = parseFloat($("#bHip").value);
    if (wa > 0 && hi > 0) $("#bWhr").textContent = (wa / hi).toFixed(2);
    else $("#bWhr").textContent = "—";
  }

  function loadBody() {
    const d = store.body;
    $("#bHeight").value = d.height || "";
    $("#bWeight").value = d.weight || "";
    $("#bBust").value = d.bust || "";
    $("#bWaist").value = d.waist || "";
    $("#bHip").value = d.hip || "";
    $("#bHbr").value = d.hbr || "";
    $("#bHsr").value = d.hsr || "";
    recomputeBMI(); recomputeWHR();
    setSeg("#bFrame", d.frame); setSeg("#bBodyType", d.bodyType); setSeg("#bHairVol", d.hairVol);
    $$("#bFeatures input").forEach((c) => c.checked = d.features.includes(c.value));
    $$("#bHairTex input").forEach((c) => c.checked = d.hairTex.includes(c.value));
    $$("#bSkin button").forEach((b) => b.classList.toggle("active", b.dataset.v === d.skin));
    if (d.photo) showPhoto(d.photo); else showPhoto(null);
    EXTRA_PHOTOS.forEach((cfg) => showExtraPhoto(cfg, d[cfg.key]));
    loadFF();
  }
  function setSeg(sel, val) {
    const g = $(sel); if (!g) return;
    $$("button", g).forEach((b) => b.classList.toggle("active", b.dataset.v === val));
  }

  function saveBody() {
    const d = store.body;
    d.height = $("#bHeight").value; d.weight = $("#bWeight").value;
    d.bust = $("#bBust").value; d.waist = $("#bWaist").value; d.hip = $("#bHip").value;
    d.hbr = $("#bHbr").value; d.hsr = $("#bHsr").value;
    save();
    const t = $("#saveToast"); t.hidden = false; setTimeout(() => t.hidden = true, 2000);
  }

  function svgEl(w, h, inner) {
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block">${inner}</svg>`;
  }

  /* ===================== 区块六：正面分析（关键点校准 + 指标计算） ===================== */
  // 关键点定义：key / 标签 / 默认比例坐标（0~1，相对显示中的照片）
  const FF_POINTS = [
    { k: "hairline",   label: "发际线",   x: 0.50, y: 0.16 },
    { k: "brow",       label: "眉心",     x: 0.50, y: 0.37 },
    { k: "noseBottom", label: "鼻尖下缘", x: 0.50, y: 0.61 },
    { k: "lnose",      label: "左鼻翼",   x: 0.45, y: 0.63 },
    { k: "rnose",      label: "右鼻翼",   x: 0.55, y: 0.63 },
    { k: "chin",       label: "下巴尖",   x: 0.50, y: 0.93 },
    { k: "leoc",       label: "左眼外角", x: 0.34, y: 0.39 },
    { k: "leic",       label: "左眼内角", x: 0.45, y: 0.39 },
    { k: "reic",       label: "右眼内角", x: 0.55, y: 0.39 },
    { k: "reoc",       label: "右眼外角", x: 0.66, y: 0.39 },
    { k: "leTop",      label: "左睑上",   x: 0.395, y: 0.355 },
    { k: "leBot",      label: "左睑下",   x: 0.395, y: 0.420 },
    { k: "reTop",      label: "右睑上",   x: 0.605, y: 0.355 },
    { k: "reBot",      label: "右睑下",   x: 0.605, y: 0.420 },
    { k: "lmc",        label: "左嘴角",   x: 0.43, y: 0.75 },
    { k: "rmc",        label: "右嘴角",   x: 0.57, y: 0.75 },
    { k: "mouthTop",   label: "上唇中点", x: 0.50, y: 0.69 },
    { k: "ljaw",       label: "左下颌角", x: 0.33, y: 0.79 },
    { k: "rjaw",       label: "右下颌角", x: 0.67, y: 0.79 },
    { k: "lface",      label: "左脸缘",   x: 0.22, y: 0.50 },
    { k: "rface",      label: "右脸缘",   x: 0.78, y: 0.50 }
  ];
  let ffPoints = {};        // key -> {x,y} 比例坐标
  let ffDragKey = null;
  // 叠加显示开关
  let ffShowPoints = true;      // 关键点标注（标点校准层）
  let ffShowThreeFive = false;  // 三庭五眼辅助线
  let ffShowHeat = false;       // 对称性热力图

  function setupFrontFace() {
    $("#ffUploadBtn").addEventListener("click", () => $("#ffInput").click());
    $("#ffInput").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) ffHandleFile(f); e.target.value = ""; });
    $("#ffClearBtn").addEventListener("click", () => { store.body.ffPhoto = null; store.body.ffPoints = null; ffPoints = {}; ffShowPhoto(null); $("#ffAnalyzeArea").hidden = true; save(); });
    const box = $("#ffBox");
    box.addEventListener("click", (e) => { if (e.target === $("#ffUploadBtn") || $("#ffUploadBtn").contains(e.target)) return; if (!store.body.ffPhoto) $("#ffInput").click(); });
    box.addEventListener("dragover", (e) => { e.preventDefault(); box.classList.add("drag"); });
    box.addEventListener("dragleave", () => box.classList.remove("drag"));
    box.addEventListener("drop", (e) => { e.preventDefault(); box.classList.remove("drag"); const f = e.dataTransfer.files[0]; if (f) ffHandleFile(f); });
    $("#ffStartBtn").addEventListener("click", ffStart);
    $("#ffRerunBtn").addEventListener("click", () => { autoPlaceFF(); renderFF(); recomputeFF(); deriveFFAuto(); });
    $("#ffConfirmBtn").addEventListener("click", confirmFF);
    const cv = $("#ffCanvas");
    cv.addEventListener("pointerdown", ffPointerDown);
    cv.addEventListener("pointermove", ffPointerMove);
    cv.addEventListener("pointerup", ffPointerUp);
    cv.addEventListener("pointercancel", () => { ffDragKey = null; });
    // 手动输入三庭 / 五眼：实时计算比例（指标区始终可见，无需等待分析）
    ["ffUpper", "ffMid", "ffLower", "ffSeg1", "ffSeg2", "ffSeg3", "ffSeg4", "ffSeg5"].forEach((id) =>
      $("#" + id).addEventListener("input", recomputeFF));
    // 颅顶 / 眼型 / 眼距 / 下颌 单选
    ["ffCrown", "ffEyeShape", "ffBrowEye", "ffEyeDist", "ffNoseWidth", "ffPhiltrum", "ffJaw"].forEach((gid) => {
      $("#" + gid).addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]"); if (!b) return;
        $$(`#${gid} button`).forEach((x) => x.classList.toggle("active", x === b));
        const map = { ffCrown: "crown", ffEyeShape: "eyeShape", ffBrowEye: "browEye", ffEyeDist: "eyeDist", ffNoseWidth: "noseWidth", ffPhiltrum: "philtrum", ffJaw: "jaw" };
        store.body.ffResults = store.body.ffResults || {};
        store.body.ffResults[map[gid]] = b.dataset.v;
      });
    });
    // 脸型（多选，最多 2 项）：圆 / 方 / 短 / 长
    $("#ffFaceShape").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      const actives = $$("#ffFaceShape button.active");
      if (b.classList.contains("active")) b.classList.remove("active");
      else if (actives.length < 2) b.classList.add("active");
      store.body.ffResults = store.body.ffResults || {};
      store.body.ffResults.faceShape = $$("#ffFaceShape button.active").map((x) => x.dataset.v);
    });

    // 叠加层开关
    $("#ffTogglePoints").addEventListener("click", () => { ffShowPoints = !ffShowPoints; $("#ffTogglePoints").classList.toggle("active", ffShowPoints); renderFF(); });
    $("#ffToggleThree").addEventListener("click", () => { ffShowThreeFive = !ffShowThreeFive; $("#ffToggleThree").classList.toggle("active", ffShowThreeFive); renderFF(); });
    $("#ffToggleHeat").addEventListener("click", () => { ffShowHeat = !ffShowHeat; $("#ffToggleHeat").classList.toggle("active", ffShowHeat); renderFF(); });
  }

  function ffHandleFile(file) {
    compressImage(file).then((data) => { store.body.ffPhoto = data; ffShowPhoto(data); }).catch((e) => alert(e.message));
  }

  function ffShowPhoto(src) {
    const img = $("#ffPhoto"), empty = $("#ffEmpty"), clr = $("#ffClearBtn"), area = $("#ffAnalyzeArea");
    if (src) {
      img.onload = () => { requestAnimationFrame(sizeFFCanvas); };
      img.src = src; img.style.display = "block"; empty.hidden = true; clr.hidden = false; area.hidden = false;
    } else {
      img.removeAttribute("src"); img.style.display = "none"; empty.hidden = false; clr.hidden = true; area.hidden = true;
      clearFFCanvas();
    }
  }

  function sizeFFCanvas() {
    const img = $("#ffPhoto"); if (!img || !img.clientWidth) return;
    const cv = $("#ffCanvas");
    cv.width = img.clientWidth; cv.height = img.clientHeight;
    cv.style.width = img.clientWidth + "px";     cv.style.height = img.clientHeight + "px";
    if (Object.keys(ffPoints).length) renderFF();
  }

  function autoPlaceFF() {
    ffPoints = {};
    FF_POINTS.forEach((p) => { ffPoints[p.k] = { x: p.x, y: p.y }; });
  }

  function clearFFCanvas() { const cv = $("#ffCanvas"); if (cv) { cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); } }

  function drawGuides() {
    const cv = $("#ffCanvas"); if (!cv || !cv.width) return;
    const ctx = cv.getContext("2d");
    ctx.strokeStyle = "rgba(196,122,135,.35)"; ctx.lineWidth = 1;
    const P = (k) => ffPoints[k];
    const px = (k) => ({ x: P(k).x * cv.width, y: P(k).y * cv.height });
    const line = (a, b) => { if (!P(a) || !P(b)) return; const A = px(a), B = px(b); ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke(); };
    line("hairline", "brow"); line("brow", "noseBottom"); line("noseBottom", "chin");
    ["lface", "leoc", "leic", "reic", "reoc", "rface"].forEach((k, i, arr) => { if (i > 0) line(arr[i - 1], k); });
    line("lmc", "rmc"); line("ljaw", "rjaw"); line("lnose", "rnose"); line("noseBottom", "mouthTop");
  }

  function drawPoints() {
    const cv = $("#ffCanvas"); if (!cv || !cv.width) return;
    const ctx = cv.getContext("2d");
    FF_POINTS.forEach((p) => {
      const pt = ffPoints[p.k]; if (!pt) return;
      const x = pt.x * cv.width, y = pt.y * cv.height;
      ctx.fillStyle = "#c9a227"; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = "#fff8"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#3d2a17"; ctx.font = "11px serif"; ctx.fillText(p.label, x + 9, y + 4);
    });
  }

  // 主渲染：按开关叠加各图层
  function renderFF() {
    const cv = $("#ffCanvas"); if (!cv || !cv.width) return;
    const ctx = cv.getContext("2d"); ctx.clearRect(0, 0, cv.width, cv.height);
    if (!Object.keys(ffPoints).length) { updateLegend(); return; }
    if (ffShowHeat) drawHeat();
    else { const st = $("#ffToolStatus"); if (st) st.textContent = ""; }
    if (ffShowPoints) drawGuides();
    if (ffShowThreeFive) drawThreeFive();
    if (ffShowPoints) drawPoints();
    updateLegend();
  }

  // ---------- 三庭五眼辅助线 ----------
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function drawThreeFiveCore(ctx, w, h, pts) {
    if (!pts || !pts.hairline) return;
    const X = (k) => pts[k].x * w, Y = (k) => pts[k].y * h;
    const x0 = X("lface"), x1 = X("rface");
    const yH = Y("hairline"), yB = Y("brow"), yN = Y("noseBottom"), yC = Y("chin");
    const court = [["rgba(217,143,176,.22)", "上庭"], ["rgba(217,180,106,.22)", "中庭"], ["rgba(111,174,155,.22)", "下庭"]];
    const bands = [[yH, yB], [yB, yN], [yN, yC]];
    ctx.save();
    ctx.textAlign = "left";
    bands.forEach((bd, i) => {
      ctx.fillStyle = court[i][0]; ctx.fillRect(x0, bd[0], x1 - x0, bd[1] - bd[0]);
      ctx.fillStyle = "rgba(61,42,23,.75)"; ctx.font = "11px serif";
      ctx.fillText(court[i][1], x0 + 4, (bd[0] + bd[1]) / 2);
    });
    ctx.strokeStyle = "rgba(61,42,23,.55)"; ctx.lineWidth = 1; ctx.setLineDash([]);
    [yH, yB, yN, yC].forEach((y) => { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); });
    // 五眼：5 等分竖向条带 + 分割线（不同颜色）
    const left = X("lface"), right = X("rface"), n = 5, step = (right - left) / n;
    const segC = ["#e57373", "#f0a35e", "#f4d35e", "#7fb98a", "#6fa8d9"];
    for (let i = 0; i < n; i++) {
      const sx = left + i * step;
      ctx.fillStyle = hexA(segC[i], .16); ctx.fillRect(sx, yH, step, yC - yH);
      ctx.strokeStyle = segC[i]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx, yH); ctx.lineTo(sx, yC); ctx.stroke();
    }
    ctx.strokeStyle = segC[4]; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(right, yH); ctx.lineTo(right, yC); ctx.stroke();
    ctx.fillStyle = "rgba(61,42,23,.85)"; ctx.font = "10px serif"; ctx.textAlign = "center";
    for (let i = 0; i < n; i++) ctx.fillText(String(i + 1), left + i * step + step / 2, yC + 12);
    ctx.restore();
  }
  function drawThreeFive() {
    const cv = $("#ffCanvas"); if (!cv || !cv.width) return;
    drawThreeFiveCore(cv.getContext("2d"), cv.width, cv.height, ffPoints);
  }

  // ---------- 对称性热力图 ----------
  function drawHeat() {
    const cv = $("#ffCanvas"); if (!cv || !cv.width) return;
    const ctx = cv.getContext("2d");
    if (!Object.keys(ffPoints).length) return;
    const w = cv.width, h = cv.height;
    const mid = (ffPoints.lface.x + ffPoints.rface.x) / 2;
    const faceW = ffPoints.rface.x - ffPoints.lface.x;
    const pairs = [["leoc", "reoc"], ["leic", "reic"], ["leTop", "reTop"], ["leBot", "reBot"], ["lmc", "rmc"], ["lnose", "rnose"], ["ljaw", "rjaw"], ["lface", "rface"]];
    ctx.save();
    ctx.strokeStyle = "rgba(80,80,120,.5)"; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(mid * w, 0); ctx.lineTo(mid * w, h); ctx.stroke(); ctx.setLineDash([]);
    let tot = 0, n = 0, worstMag = 0, worstDir = 0;
    pairs.forEach(([l, r]) => {
      const L = ffPoints[l], Rr = ffPoints[r];
      const mirrorR = 2 * mid - L.x, offset = Rr.x - mirrorR, mag = Math.abs(offset) / (faceW || 1);
      tot += mag; n++;
      if (mag > worstMag) { worstMag = mag; worstDir = offset; }
      if (mag < 0.004) return;
      const cx = ((mirrorR + Rr.x) / 2) * w, cy = ((L.y + Rr.y) / 2) * h;
      const rad = Math.max(18, faceW * w * 0.16);
      const col = offset > 0 ? [226, 85, 63] : [63, 127, 226];
      const alpha = Math.min(.7, .18 + mag * 4);
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${alpha})`);
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
    });
    ctx.restore();
    const avg = tot / n, sym = Math.max(0, Math.min(100, Math.round(100 - avg * 300)));
    const dirTxt = worstMag < 0.01 ? "基本对称" : (worstDir > 0 ? "整体偏右" : "整体偏左");
    const st = $("#ffToolStatus"); if (st) st.textContent = `对称度 ≈ ${sym}% · ${dirTxt}`;
  }

  function updateLegend() {
    const el = $("#ffLegend"); if (!el) return;
    let html = "";
    if (ffShowThreeFive) {
      html += `<span class="lg"><i style="background:rgba(217,143,176,.6)"></i>上庭</span>
        <span class="lg"><i style="background:rgba(217,180,106,.6)"></i>中庭</span>
        <span class="lg"><i style="background:rgba(111,174,155,.6)"></i>下庭</span>
        <span class="lg-sep"></span>
        <span class="lg"><i style="background:#e57373"></i>五眼①</span>
        <span class="lg"><i style="background:#f0a35e"></i>②</span>
        <span class="lg"><i style="background:#f4d35e"></i>③</span>
        <span class="lg"><i style="background:#7fb98a"></i>④</span>
        <span class="lg"><i style="background:#6fa8d9"></i>⑤</span>`;
    }
    if (ffShowHeat) {
      html += `<span class="lg-sep"></span><span class="lg"><i style="background:#3f7fe2"></i>偏左不对称</span><span class="lg"><i style="background:#e2553f"></i>偏右不对称</span><span class="lg-note">颜色越深越不对称</span>`;
    }
    el.innerHTML = html; el.hidden = !html;
  }

  function ffPointerDown(e) {
    if (!Object.keys(ffPoints).length) return;
    const cv = $("#ffCanvas"); const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    let best = null, bd = 0.06;
    FF_POINTS.forEach((p) => { const d = Math.hypot(ffPoints[p.k].x - x, ffPoints[p.k].y - y); if (d < bd) { bd = d; best = p.k; } });
    if (best) { ffDragKey = best; cv.setPointerCapture(e.pointerId); }
  }
  function ffPointerMove(e) {
    if (!ffDragKey) return;
    const cv = $("#ffCanvas"); const r = cv.getBoundingClientRect();
    let x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    x = Math.max(0, Math.min(1, x)); y = Math.max(0, Math.min(1, y));
    ffPoints[ffDragKey] = { x, y }; renderFF(); recomputeFF();
  }
  function ffPointerUp() { ffDragKey = null; }

  function ffStart() {
    autoPlaceFF(); renderFF();
    $("#ffRerunBtn").hidden = false; $("#ffConfirmBtn").hidden = false;
    ffShowThreeFive = true; $("#ffToggleThree").classList.add("active");
    recomputeFF(); deriveFFAuto();
  }

  function ffNum(id) { const v = parseFloat($("#" + id).value); return isNaN(v) ? null : v; }

  function recomputeFF() {
    const noPts = !Object.keys(ffPoints).length;
    // 三庭
    const up = ffNum("ffUpper"), md = ffNum("ffMid"), lo = ffNum("ffLower");
    let threeTxt = "—";
    if (up != null && md != null && lo != null && (up + md + lo) > 0) {
      const mean = (up + md + lo) / 3;
      threeTxt = `${(up / mean).toFixed(2)} : ${(md / mean).toFixed(2)} : ${(lo / mean).toFixed(2)}`;
    } else if (!noPts) {
      const u = ffPoints.brow.y - ffPoints.hairline.y;
      const m = ffPoints.noseBottom.y - ffPoints.brow.y;
      const l = ffPoints.chin.y - ffPoints.noseBottom.y;
      if (u > 0 && m > 0 && l > 0) {
        const mean = (u + m + l) / 3;
        threeTxt = `${(u / mean).toFixed(2)} : ${(m / mean).toFixed(2)} : ${(l / mean).toFixed(2)}`;
      }
    }
    $("#ffThree").textContent = threeTxt;

    // 五眼
    const s = ["ffSeg1", "ffSeg2", "ffSeg3", "ffSeg4", "ffSeg5"].map(ffNum);
    let fiveTxt = "—";
    if (s.every((v) => v != null) && s.reduce((a, b) => a + b, 0) > 0) {
      const total = s.reduce((a, b) => a + b, 0), ideal = total / 5;
      fiveTxt = s.map((v) => (v / ideal).toFixed(2)).join(" · ");
    } else if (!noPts) {
      const segs = [ffPoints.leoc.x - ffPoints.lface.x, ffPoints.leic.x - ffPoints.leoc.x,
        ffPoints.reic.x - ffPoints.leic.x, ffPoints.reoc.x - ffPoints.reic.x, ffPoints.rface.x - ffPoints.reoc.x];
      const total = segs.reduce((a, b) => a + b, 0), ideal = total / 5;
      if (total > 0) fiveTxt = segs.map((v) => (v / ideal).toFixed(2)).join(" · ");
    }
    $("#ffFive").textContent = fiveTxt;
  }

  // 仅在校准/分析时，根据关键点自动推导 眼型 / 眼距 / 下颌宽度（手动选择不会被三庭/五眼输入覆盖）
  function deriveFFAuto() {
    if (!Object.keys(ffPoints).length) return;
    // 眼型（左右平均 眼裂高/宽）
    const ewL = Math.abs(ffPoints.leic.x - ffPoints.leoc.x), ehL = Math.abs(ffPoints.leBot.y - ffPoints.leTop.y);
    const ewR = Math.abs(ffPoints.reic.x - ffPoints.reoc.x), ehR = Math.abs(ffPoints.reBot.y - ffPoints.reTop.y);
    const ratio = ((ehL / (ewL || 1)) + (ehR / (ewR || 1))) / 2;
    setSeg("#ffEyeShape", ratio >= 0.5 ? "圆眼" : "细长眼");
    // 眼距（两眼间距 / 单眼宽）
    const inter = ffPoints.reic.x - ffPoints.leic.x;
    const eyeW = (Math.abs(ffPoints.leic.x - ffPoints.leoc.x) + Math.abs(ffPoints.reoc.x - ffPoints.reic.x)) / 2;
    const r = eyeW > 0 ? inter / eyeW : 1;
    setSeg("#ffEyeDist", r > 1.1 ? "偏宽" : (r < 0.9 ? "偏窄" : "正常"));
    // 下颌宽度（下颌角间距 / 脸宽）
    const jawW = ffPoints.rjaw.x - ffPoints.ljaw.x;
    const faceW = ffPoints.rface.x - ffPoints.lface.x;
    const rj = faceW > 0 ? jawW / faceW : 0.8;
    setSeg("#ffJaw", rj >= 0.75 ? "偏宽" : "偏窄");
    // 眉眼间距（眉心到上睑的垂直距离 / 眼宽）
    const browGap = ((ffPoints.leTop.y + ffPoints.reTop.y) / 2) - ffPoints.brow.y;
    const bEw = eyeW > 0 ? browGap / eyeW : 1;
    setSeg("#ffBrowEye", bEw >= 1.1 ? "宽" : (bEw <= 0.8 ? "近" : "适中"));
    // 鼻翼宽度（两鼻翼间距 / 眼宽）
    const noseW = ffPoints.rnose.x - ffPoints.lnose.x;
    const nEw = eyeW > 0 ? noseW / eyeW : 1;
    setSeg("#ffNoseWidth", nEw >= 1.15 ? "偏宽" : (nEw <= 0.9 ? "偏窄" : "标准"));
    // 人中长度（鼻底到上唇中点的垂直距离 / 眼宽）
    const phil = ffPoints.mouthTop.y - ffPoints.noseBottom.y;
    const pEw = eyeW > 0 ? phil / eyeW : 0.7;
    setSeg("#ffPhiltrum", pEw >= 0.9 ? "偏长" : (pEw <= 0.6 ? "偏短" : "适中"));
  }

  function confirmFF() {
    recomputeFF(); deriveFFAuto();
    const res = store.body.ffResults || {};
    res.crown = $("#ffCrown button.active")?.dataset.v || "";
    res.faceShape = $$("#ffFaceShape button.active").map((b) => b.dataset.v);
    res.eyeShape = $("#ffEyeShape button.active")?.dataset.v || "";
    res.browEye = $("#ffBrowEye button.active")?.dataset.v || "";
    res.eyeDist = $("#ffEyeDist button.active")?.dataset.v || "";
    res.noseWidth = $("#ffNoseWidth button.active")?.dataset.v || "";
    res.philtrum = $("#ffPhiltrum button.active")?.dataset.v || "";
    res.jaw = $("#ffJaw button.active")?.dataset.v || "";
    res.three = $("#ffThree").textContent;
    res.five = $("#ffFive").textContent;
    res.confirmed = true;
    store.body.ffResults = res;
    store.body.ffPoints = JSON.parse(JSON.stringify(ffPoints));
    store.body.ffCm = {
      upper: ffNum("ffUpper"), mid: ffNum("ffMid"), lower: ffNum("ffLower"),
      seg1: ffNum("ffSeg1"), seg2: ffNum("ffSeg2"), seg3: ffNum("ffSeg3"), seg4: ffNum("ffSeg4"), seg5: ffNum("ffSeg5")
    };
    save();
    const t = $("#saveToast"); t.hidden = false; setTimeout(() => t.hidden = true, 2000);
  }

  function loadFF() {
    const d = store.body;
    if (d.ffPhoto) ffShowPhoto(d.ffPhoto); else { ffShowPhoto(null); return; }
    if (d.ffPoints) { ffPoints = JSON.parse(JSON.stringify(d.ffPoints)); }
    if (d.ffResults && d.ffResults.confirmed) {
      requestAnimationFrame(() => {
        sizeFFCanvas();
        if (Object.keys(ffPoints).length) renderFF();
        $("#ffRerunBtn").hidden = false; $("#ffConfirmBtn").hidden = false;
        setSeg("#ffCrown", d.ffResults.crown);
        const fs = d.ffResults.faceShape;
        if (Array.isArray(fs)) $$("#ffFaceShape button").forEach((b) => b.classList.toggle("active", fs.includes(b.dataset.v)));
        else if (fs) setSeg("#ffFaceShape", fs);
        setSeg("#ffEyeShape", d.ffResults.eyeShape);
        setSeg("#ffBrowEye", d.ffResults.browEye);
        setSeg("#ffEyeDist", d.ffResults.eyeDist);
        setSeg("#ffNoseWidth", d.ffResults.noseWidth);
        setSeg("#ffPhiltrum", d.ffResults.philtrum);
        setSeg("#ffJaw", d.ffResults.jaw);
        const cm = d.ffCm || {};
        $("#ffUpper").value = cm.upper ?? ""; $("#ffMid").value = cm.mid ?? ""; $("#ffLower").value = cm.lower ?? "";
        $("#ffSeg1").value = cm.seg1 ?? ""; $("#ffSeg2").value = cm.seg2 ?? ""; $("#ffSeg3").value = cm.seg3 ?? "";
        $("#ffSeg4").value = cm.seg4 ?? ""; $("#ffSeg5").value = cm.seg5 ?? "";
        recomputeFF();
        ffShowThreeFive = true; $("#ffToggleThree").classList.add("active"); renderFF();
      });
    }
  }

  /* ===================== 区块六扩展：可视化叠加 ===================== */

  function drawTaskChart() {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = addDays(TODAY, -i);
      const arr = store.daily[fmt(d)] || [];
      const done = arr.filter((t) => t.done).length;
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, total: arr.length, done });
    }
    const w = 460, h = 200, pad = 28, bw = (w - pad * 2) / days.length;
    const max = Math.max(1, ...days.map((d) => d.total));
    let bars = "", labels = "";
    days.forEach((d, i) => {
      const x = pad + i * bw + bw * 0.2;
      const bwi = bw * 0.6;
      const hT = (d.total / max) * (h - pad * 2);
      const hD = (d.done / max) * (h - pad * 2);
      bars += `<rect x="${x}" y="${h - pad - hT}" width="${bwi}" height="${hT}" rx="3" fill="#cdd6f6"/>`;
      bars += `<rect x="${x}" y="${h - pad - hD}" width="${bwi}" height="${hD}" rx="3" fill="#4f6ef7"/>`;
      if (i % 2 === 0) labels += `<text x="${x + bwi / 2}" y="${h - 8}" font-size="9" fill="#6b7785" text-anchor="middle">${d.label}</text>`;
    });
    $("#chartTasks").innerHTML = svgEl(w, h, bars + labels);
  }

  function drawMoodChart() {
    const entries = store.hundred.entries || {};
    const pts = Object.keys(entries).map((k) => ({ d: parse(k), r: entries[k].rating || 0 }))
      .sort((a, b) => a.d - b.d).filter((p) => p.r > 0);
    const w = 460, h = 200, pad = 28;
    if (pts.length < 2) {
      $("#chartMood").innerHTML = `<div class="res-empty" style="padding:40px">记录满 2 天评分后显示趋势</div>`;
      return;
    }
    const maxR = 5;
    const stepX = (w - pad * 2) / (pts.length - 1);
    let path = "", dots = "";
    pts.forEach((p, i) => {
      const x = pad + i * stepX;
      const y = h - pad - (p.r / maxR) * (h - pad * 2);
      path += (i === 0 ? "M" : "L") + x + " " + y + " ";
      dots += `<circle cx="${x}" cy="${y}" r="3.5" fill="#f7a14f"/>`;
    });
    const grid = [1, 2, 3, 4, 5].map((r) => {
      const y = h - pad - (r / maxR) * (h - pad * 2);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#eef1f6"/><text x="6" y="${y + 3}" font-size="9" fill="#9aa5b1">${r}</text>`;
    }).join("");
    $("#chartMood").innerHTML = svgEl(w, h, grid + `<path d="${path}" fill="none" stroke="#f7a14f" stroke-width="2"/>` + dots);
  }

  function drawResChart() {
    const cats = {};
    store.resources.forEach((r) => { const c = r.cat || "未分类"; cats[c] = (cats[c] || 0) + 1; });
    const keys = Object.keys(cats);
    const box = $("#chartRes");
    if (!keys.length) { box.innerHTML = `<div class="res-empty" style="padding:40px">暂无资源</div>`; return; }
    const palette = ["#4f6ef7", "#f7a14f", "#2bb673", "#e36b9b", "#9b6bf7", "#39c0c8", "#f0b429"];
    const total = store.resources.length;
    let acc = 0; const segs = [];
    keys.forEach((k, i) => {
      const frac = cats[k] / total;
      const a0 = acc * 2 * Math.PI, a1 = (acc + frac) * 2 * Math.PI;
      acc += frac;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const cx = 80, cy = 90, R = 70;
      const x0 = cx + R * Math.sin(a0), y0 = cy - R * Math.cos(a0);
      const x1 = cx + R * Math.sin(a1), y1 = cy - R * Math.cos(a1);
      segs.push(`<path d="M${cx} ${cy} L${x0} ${y0} A${R} ${R} 0 ${large} 1 ${x1} ${y1} Z" fill="${palette[i % palette.length]}"/>`);
    });
    const legend = keys.map((k, i) =>
      `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin:3px 0">
        <span style="width:10px;height:10px;border-radius:3px;background:${palette[i % palette.length]}"></span>${k} (${cats[k]})</div>`).join("");
    box.innerHTML = `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 160 180" width="160" height="180" style="flex:0 0 auto">${segs.join("")}
        <circle cx="80" cy="90" r="38" fill="#fff"/></svg>
      <div style="flex:1;min-width:120px">${legend}</div></div>`;
  }

  function drawWeekChart() {
    const mon = getMonday(TODAY);
    const key = fmt(mon);
    const wk = store.weekly[key] || {};
    const counts = [];
    for (let i = 1; i <= 7; i++) counts.push((wk[String(i)] || []).length);
    const w = 460, h = 200, pad = 28, bw = (w - pad * 2) / 7;
    const max = Math.max(1, ...counts);
    let bars = "", labels = "";
    counts.forEach((c, i) => {
      const x = pad + i * bw + bw * 0.2, bwi = bw * 0.6;
      const bh = (c / max) * (h - pad * 2);
      bars += `<rect x="${x}" y="${h - pad - bh}" width="${bwi}" height="${bh}" rx="3" fill="#7b8cff"/>`;
      labels += `<text x="${x + bwi / 2}" y="${h - 8}" font-size="10" fill="#6b7785" text-anchor="middle">${WK[i % 7]}</text>`;
    });
    $("#chartWeek").innerHTML = svgEl(w, h, bars + labels);
  }

  /* ===================== 3. 资源库 ===================== */
  function renderResources() {
    const list = $("#resList");
    const q = $("#resSearch").value.trim().toLowerCase();
    const f = $("#resFilter").value;
    const cats = [...new Set(store.resources.map((r) => r.cat || "未分类"))];
    $("#resFilter").innerHTML = `<option value="">全部分类</option>` +
      cats.map((c) => `<option value="${c}" ${c === f ? "selected" : ""}>${c}</option>`).join("");
    const items = store.resources.filter((r) => {
      const okQ = !q || (r.name + " " + (r.note || "")).toLowerCase().includes(q);
      const okC = !f || (r.cat || "未分类") === f;
      return okQ && okC;
    });
    if (!items.length) { list.innerHTML = `<div class="res-empty">没有匹配的资源，点右上角「+ 新增资源」开始收藏。</div>`; return; }
    list.innerHTML = items.map((r) => {
      const cat = r.cat || "未分类";
      const link = r.url ? `<a class="res-link" href="${r.url}" target="_blank" rel="noopener">${r.url}</a>` : "";
      return `<div class="res-card">
        <div class="res-top"><span class="res-name">${esc(r.name)}</span><span class="res-cat">${esc(cat)}</span></div>
        ${link ? "<div>" + link + "</div>" : ""}
        ${r.note ? `<div class="res-note">${esc(r.note)}</div>` : ""}
        <div class="res-actions">
          <button class="edit" data-id="${r.id}">编辑</button>
          <button class="del" data-id="${r.id}">删除</button>
        </div></div>`;
    }).join("");
    list.querySelectorAll(".edit").forEach((b) => b.addEventListener("click", () => openResModal(b.dataset.id)));
    list.querySelectorAll(".del").forEach((b) => b.addEventListener("click", () => openResDel(b.dataset.id)));
  }
  function openResModal(id) {
    const ed = store.resources.find((r) => r.id === id);
    $("#resModalTitle").textContent = ed ? "编辑资源" : "新增资源";
    $("#resName").value = ed ? ed.name : "";
    $("#resUrl").value = ed ? ed.url : "";
    $("#resCat").value = ed ? (ed.cat || "") : "";
    $("#resNote").value = ed ? (ed.note || "") : "";
    const cats = [...new Set(store.resources.map((r) => r.cat).filter(Boolean))];
    $("#catList").innerHTML = cats.map((c) => `<option value="${c}">`).join("");
    $("#resModal").dataset.editId = id || "";
    $("#resModal").hidden = false;
    $("#resName").focus();
  }
  $("#resAddBtn").addEventListener("click", () => openResModal(null));
  $("#resCancel").addEventListener("click", () => $("#resModal").hidden = true);
  function openResDel(id) { $("#resDelModal").dataset.delId = id; $("#resDelModal").hidden = false; }
  $("#resDelSure").addEventListener("click", () => {
    const id = $("#resDelModal").dataset.delId;
    store.resources = store.resources.filter((r) => r.id !== id);
    save(); renderResources();
    $("#resDelModal").hidden = true;
  });
  $("#resDelCancel").addEventListener("click", () => { $("#resDelModal").hidden = true; });
  $("#resDelModal").addEventListener("click", (e) => { if (e.target === $("#resDelModal")) $("#resDelModal").hidden = true; });
  $("#resSave").addEventListener("click", () => {
    const name = $("#resName").value.trim();
    if (!name) { alert("请填写名称"); return; }
    const id = $("#resModal").dataset.editId;
    const data = { name, url: $("#resUrl").value.trim(), cat: $("#resCat").value.trim(), note: $("#resNote").value.trim() };
    if (id) { const r = store.resources.find((x) => x.id === id); Object.assign(r, data); }
    else store.resources.push({ id: uid(), ...data });
    save(); $("#resModal").hidden = true; renderResources();
  });
  $("#resSearch").addEventListener("input", renderResources);
  $("#resFilter").addEventListener("change", renderResources);

  /* ===================== 4. 日计划 ===================== */
  let dailyCur = TODAY_STR;
  function openDaily(dateStr) {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.target === "daily"));
    $$(".view").forEach((v) => v.classList.remove("active"));
    $("#view-daily").classList.add("active");
    dailyCur = dateStr;
    $("#dailyDate").value = dateStr;
    renderDaily();
  }
  function gotoWeekly(dateStr) {
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.target === "weekly"));
    $$(".view").forEach((v) => v.classList.remove("active"));
    $("#view-weekly").classList.add("active");
    weekMon = planWeekStart(dateStr || TODAY_STR);
    renderWeekly();
    $$("#weekChecks .week-check").forEach((c) => {
      c.classList.toggle("target-day", c.dataset.date === dateStr);
    });
    const t = $("#weekChecks .week-check.target-day");
    if (t) t.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  /* ---- 日计划：各模块的当日数据存取（与任务数组分离，互不影响） ---- */
  const WATER_GOAL = 8;
  const SLEEP_GOAL = 8;
  function getHabit() {
    if (!store.dailyHabit[dailyCur]) store.dailyHabit[dailyCur] = { water: 0, sleep: 0, workoutVideos: [], custom: [] };
    const h = store.dailyHabit[dailyCur];
    if (typeof h.water !== "number") h.water = 0;
    if (typeof h.sleep !== "number") h.sleep = h.sleep ? 8 : 0;
    if (!Array.isArray(h.workoutVideos)) h.workoutVideos = [];
    if (!Array.isArray(h.custom)) h.custom = [];
    if (typeof h.mood !== "number" || h.mood < -1 || h.mood > 6) h.mood = -1;
    // 兼容旧档：workoutVideos 早期为字符串数组，统一为 {id, done}
    h.workoutVideos = h.workoutVideos
      .map((x) => (typeof x === "string" ? { id: x, done: false } : (x && x.id ? { id: x.id, done: !!x.done } : null)))
      .filter(Boolean);
    return h;
  }
  function getTimeline() {
    if (!store.dailyTimeline[dailyCur]) store.dailyTimeline[dailyCur] = [];
    return store.dailyTimeline[dailyCur];
  }
  function getCompareNote() {
    if (store.dailyCompareNote[dailyCur] === undefined) store.dailyCompareNote[dailyCur] = "";
    return store.dailyCompareNote[dailyCur];
  }
  function getDailyMetrics() {
    if (!Array.isArray(store.dailyMetrics[dailyCur])) store.dailyMetrics[dailyCur] = [];
    return store.dailyMetrics[dailyCur];
  }
  function getSegments() {
    if (!store.dailySegments[dailyCur]) store.dailySegments[dailyCur] = { s1: "", s2: "", s3: "" };
    return store.dailySegments[dailyCur];
  }
  function getPhotos() {
    if (!store.dailyPhotos[dailyCur]) store.dailyPhotos[dailyCur] = { top: null, bottom: null };
    return store.dailyPhotos[dailyCur];
  }
  function renderComparePhotos() {
    const p = getPhotos();
    $$(".cmp-photo").forEach((box) => {
      const side = box.dataset.side;
      const img = box.querySelector(".cmp-img");
      const add = box.querySelector(".cmp-add");
      const acts = box.querySelector(".cmp-acts");
      const val = p[side];
      if (val) { img.src = val; img.hidden = false; add.hidden = true; acts.hidden = false; }
      else { img.removeAttribute("src"); img.hidden = true; add.hidden = false; acts.hidden = true; }
    });
  }
  function renderDailyMetrics() {
    const list = $("#dayMetricList");
    const arr = getDailyMetrics();
    list.innerHTML = "";
    arr.forEach((m) => {
      const row = document.createElement("div");
      row.className = "metric-row";
      row.dataset.id = m.id;
      row.innerHTML =
        `<input class="inp metric-name" placeholder="指标名，如：体重" value="${esc(m.name || "")}" />` +
        `<div class="metric-nums">` +
          `<label class="metric-lab">前<input class="inp metric-prev" type="number" step="0.1" value="${m.prev === null || m.prev === undefined ? "" : m.prev}" /></label>` +
          `<label class="metric-lab">后<input class="inp metric-curr" type="number" step="0.1" value="${m.curr === null || m.curr === undefined ? "" : m.curr}" /></label>` +
        `</div>` +
        `<div class="metric-delta"></div>` +
        `<button class="metric-del" type="button" title="删除">✕</button>`;
      list.appendChild(row);
      const delta = row.querySelector(".metric-delta");
      const updateDelta = () => {
        const r = fmtDelta(row.querySelector(".metric-prev").value, row.querySelector(".metric-curr").value);
        delta.className = "metric-delta " + r.cls;
        delta.textContent = r.text;
      };
      updateDelta();
      row.querySelector(".metric-name").addEventListener("input", (e) => { m.name = e.target.value; save(); });
      row.querySelector(".metric-prev").addEventListener("input", (e) => { m.prev = e.target.value === "" ? null : parseFloat(e.target.value); save(); updateDelta(); });
      row.querySelector(".metric-curr").addEventListener("input", (e) => { m.curr = e.target.value === "" ? null : parseFloat(e.target.value); save(); updateDelta(); });
      row.querySelector(".metric-del").addEventListener("click", () => {
        store.dailyMetrics[dailyCur] = getDailyMetrics().filter((x) => x.id !== m.id);
        save(); renderDailyMetrics();
      });
    });
  }
  function setupComparePhotos() {
    $$(".cmp-photo").forEach((box) => {
      const side = box.dataset.side;
      const file = box.querySelector(".cmp-file");
      const add = box.querySelector(".cmp-add");
      const img = box.querySelector(".cmp-img");
      const acts = box.querySelector(".cmp-acts");
      add.addEventListener("click", () => file.click());
      acts.querySelector(".cmp-change").addEventListener("click", () => file.click());
      acts.querySelector(".cmp-remove").addEventListener("click", () => { getPhotos()[side] = null; save(); renderComparePhotos(); });
      file.addEventListener("change", (e) => {
        const f = e.target.files[0]; e.target.value = "";
        if (!f) return;
        compressImage(f).then((d) => { getPhotos()[side] = d; save(); renderComparePhotos(); })
          .catch((err) => alert(err.message));
      });
    });
  }

  function renderDailyDone() {
    const btn = $("#dailyDoneBtn");
    const status = $("#ddStatus");
    if (!btn) return;
    const done = isWeekChecked(dailyCur);
    if (done) {
      btn.textContent = "✓ 今日已打卡";
      btn.classList.add("done");
      status.textContent = "已在「周计划」对应日期打卡完成";
    } else {
      btn.textContent = "✓ 完成今日打卡";
      btn.classList.remove("done");
      status.textContent = "完成后将自动在「周计划」对应日期打卡";
    }
  }

  function renderDaily() {
    const arr = store.daily[dailyCur] || [];
    const done = arr.filter((t) => t.done).length;
    $("#dailyProgressFill").style.width = (arr.length ? (done / arr.length) * 100 : 0) + "%";
    $("#dailyProgressText").textContent = `${done} / ${arr.length}`;
    const ul = $("#dailyList");
    if (!arr.length) { ul.innerHTML = `<div class="todo-empty">这一天还没有计划，添加第一条吧。</div>`; }
    else {
      ul.innerHTML = arr.map((t) => `<li class="todo-item ${t.done ? "done" : ""}">
        <div class="todo-check ${t.done ? "done" : ""}" data-id="${t.id}">${t.done ? "✓" : ""}</div>
        <div class="todo-text">${esc(t.text)}</div>
        <button class="todo-del" data-id="${t.id}">✕</button></li>`).join("");
      ul.querySelectorAll(".todo-check").forEach((c) => c.addEventListener("click", () => toggleDaily(c.dataset.id)));
      ul.querySelectorAll(".todo-del").forEach((c) => c.addEventListener("click", () => delDaily(c.dataset.id)));
    }
    renderHabit();
    renderTimeline();
    const sg = getSegments();
    $("#seg1").value = sg.s1 || "";
    $("#seg2").value = sg.s2 || "";
    $("#seg3").value = sg.s3 || "";
    renderComparePhotos();
    renderDailyMetrics();
    $("#cmpNote").value = getCompareNote();
    renderDailyDone();
  }

  /* 左栏：习惯打卡 */
  // 根据心情等级 0-7 生成一张笑脸 SVG（0 最差 → 7 最好）
  function moodFaceSVG(level) {
    const smile = (level - 3) / 3;          // 0 皱眉 .. 3 平静 .. 6 大笑
    const cy = 15 - smile * 4.2;            // 嘴角控制点 y：上扬=笑，下垂=愁
    const mouth = `M8.5 15.2 Q12 ${cy.toFixed(1)} 15.5 15.2`;
    let eyes;
    if (level >= 4) { // 开心：弯弯的笑眼
      eyes = `<path d="M8 ${10.6} Q9.2 ${9.2} 10.4 ${10.6}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`
           + `<path d="M13.6 ${10.6} Q14.8 ${9.2} 16 ${10.6}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`;
    } else { // 平静/低落：圆点眼
      eyes = `<circle cx="9.2" cy="10" r="1" fill="currentColor"/><circle cx="14.8" cy="10" r="1" fill="currentColor"/>`;
    }
    const cheeks = (level >= 5)
      ? `<circle cx="7" cy="13.5" r="1.3" fill="#e7a9b3" opacity=".7"/><circle cx="17" cy="13.5" r="1.3" fill="#e7a9b3" opacity=".7"/>` : "";
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
      ${eyes}
      <path d="${mouth}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      ${cheeks}
    </svg>`;
  }
  function renderHabit() {
    const h = getHabit();
    const cups = $("#waterCups");
    let html = "";
    for (let i = 0; i < WATER_GOAL; i++) {
      html += `<span class="cup ${i < h.water ? "full" : ""}" data-i="${i}" title="${i + 1} 杯">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10l-1 14a4 4 0 0 1-4 3.8A4 4 0 0 1 8 18Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 4h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>`;
    }
    cups.innerHTML = html;
    cups.querySelectorAll(".cup").forEach((c) => c.addEventListener("click", () => {
      const i = +c.dataset.i, cur = getHabit().water;
      getHabit().water = (cur === i + 1) ? i : i + 1;
      save(); renderHabit();
    }));
    const moons = $("#sleepMoons");
    let mhtml = "";
    for (let i = 0; i < SLEEP_GOAL; i++) {
      mhtml += `<span class="moon ${i < h.sleep ? "full" : ""}" data-i="${i}" title="${i + 1} 段睡眠">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      </span>`;
    }
    moons.innerHTML = mhtml;
    moons.querySelectorAll(".moon").forEach((c) => c.addEventListener("click", () => {
      const i = +c.dataset.i, cur = getHabit().sleep;
      getHabit().sleep = (cur === i + 1) ? i : i + 1;
      save(); renderHabit();
    }));
    const moodBox = $("#moodFaces");
    let moodHtml = "";
    for (let i = 0; i < 7; i++) {
      moodHtml += `<span class="mood-face ${i === h.mood ? "on" : ""}" data-i="${i}" title="心情 ${i + 1} / 7">${moodFaceSVG(i)}</span>`;
    }
    moodBox.innerHTML = moodHtml;
    moodBox.querySelectorAll(".mood-face").forEach((c) => c.addEventListener("click", () => {
      const i = +c.dataset.i;
      getHabit().mood = (getHabit().mood === i) ? -1 : i; // 再次点击取消
      save(); renderHabit();
    }));
    renderWorkoutList();
    renderCustomHabit();
  }

  function renderCustomHabit() {
    const h = getHabit();
    const box = $("#customHabitList");
    const items = h.custom || [];
    if (!items.length) { box.innerHTML = `<div class="custom-empty">还没有自定义习惯，在上方添加一条吧。</div>`; return; }
    box.innerHTML = items.map((c) => `<div class="custom-item ${c.done ? "done" : ""}">
      <div class="custom-check ${c.done ? "done" : ""}" data-id="${c.id}" title="点击标记完成">${c.done ? "✓" : ""}</div>
      <div class="custom-name">${esc(c.name)}</div>
      <button class="custom-del" data-id="${c.id}" title="移除">✕</button>
    </div>`).join("");
    box.querySelectorAll(".custom-check").forEach((d) => d.addEventListener("click", () => toggleCustomHabit(d.dataset.id)));
    box.querySelectorAll(".custom-del").forEach((b) => b.addEventListener("click", () => delCustomHabit(b.dataset.id)));
  }
  function addCustomHabit() {
    const inp = $("#customHabitInput"); const txt = inp.value.trim();
    if (!txt) return;
    getHabit().custom.push({ id: uid(), name: txt, done: false });
    save(); inp.value = ""; renderCustomHabit();
  }
  function toggleCustomHabit(id) {
    const h = getHabit(); const c = h.custom.find((x) => x.id === id);
    if (c) { c.done = !c.done; save(); renderCustomHabit(); }
  }
  function delCustomHabit(id) {
    const h = getHabit(); h.custom = h.custom.filter((x) => x.id !== id);
    save(); renderCustomHabit();
  }

  /* 跟练内容：从资源库选取，按日期记录 */
  function renderWorkoutList() {
    const h = getHabit();
    const box = $("#workoutList");
    const items = h.workoutVideos || [];
    if (!items.length) { box.innerHTML = `<div class="workout-empty">尚未选择跟练内容，点「+ 添加」从资源库选取。</div>`; return; }
    box.innerHTML = items.map((it) => {
      const r = store.resources.find((x) => x.id === it.id);
      const name = r ? r.name : "（资源已删除）";
      const link = r && r.url ? `<a class="workout-link" href="${r.url}" target="_blank" rel="noopener">打开</a>` : "";
      return `<div class="workout-item">
        <span class="workout-name">${esc(name)}</span>
        ${link}
        <label class="switch sm" title="标记该项已完成跟练"><input type="checkbox" data-id="${it.id}" ${it.done ? "checked" : ""} /><span class="switch-track"></span></label>
        <button class="workout-del" data-id="${it.id}" title="移除">✕</button>
      </div>`;
    }).join("");
    box.querySelectorAll(".workout-del").forEach((b) => b.addEventListener("click", () => removeWorkoutVideo(b.dataset.id)));
    box.querySelectorAll(".switch.sm input").forEach((c) => c.addEventListener("change", () => toggleWorkoutDone(c.dataset.id)));
  }
  function toggleWorkoutDone(id) {
    const h = getHabit();
    const it = h.workoutVideos.find((x) => x.id === id);
    if (it) { it.done = !it.done; save(); renderWorkoutList(); }
  }
  function removeWorkoutVideo(id) {
    const h = getHabit();
    h.workoutVideos = (h.workoutVideos || []).filter((x) => x.id !== id);
    save(); renderWorkoutList();
  }
  function openWorkoutPicker() {
    renderWorkoutPicker();
    $("#workoutPickModal").hidden = false;
  }
  function renderWorkoutPicker() {
    const list = $("#workoutPickList");
    const sel = new Set((getHabit().workoutVideos || []).map((x) => x.id));
    if (!store.resources.length) {
      list.innerHTML = `<div class="workout-empty">资源库还没有内容。先去「资源库」添加跟练视频 / 资料吧。</div>`;
      return;
    }
    list.innerHTML = store.resources.map((r) => {
      const on = sel.has(r.id);
      return `<div class="pick-item ${on ? "on" : ""}" data-id="${r.id}">
        <span class="pick-check">${on ? "✓" : ""}</span>
        <span class="pick-name">${esc(r.name)}</span>
        ${r.cat ? `<span class="pick-cat">${esc(r.cat)}</span>` : ""}
        ${r.url ? `<span class="pick-url">${esc(r.url)}</span>` : ""}
      </div>`;
    }).join("");
    list.querySelectorAll(".pick-item").forEach((el) => el.addEventListener("click", () => {
      const h = getHabit();
      const items = h.workoutVideos || [];
      if (items.some((x) => x.id === el.dataset.id)) h.workoutVideos = items.filter((x) => x.id !== el.dataset.id);
      else h.workoutVideos = items.concat({ id: el.dataset.id, done: false });
      save(); renderWorkoutPicker(); renderWorkoutList();
    }));
  }

  /* 中栏：时间轴 */
  function renderTimeline() {
    const tl = $("#timeline");
    const sch = $("#tlSchedule");
    // 24 小时刻度尺：24 个空心圆点，第 8、16 个为深棕色实心点（将轴分为三段）
    let scale = `<div class="tl-scale">`;
    for (let i = 0; i < 24; i++) {
      const solid = (i === 7 || i === 15) ? " solid" : "";
      scale += `<span class="tl-tick${solid}"></span>`;
    }
    scale += `</div>`;
    const items = getTimeline().slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    let body;
    if (!items.length) body = `<div class="tl-empty">添加时间点的安排，沿时间轴打卡。</div>`;
    else body = `<div class="tl-items">` + items.map((t) => `<div class="tl-item ${t.done ? "done" : ""}">
      <div class="tl-body">
        <div class="tl-dot ${t.done ? "done" : ""}" data-id="${t.id}" title="点击打卡"></div>
        <div class="tl-time">${esc(t.time || "")}</div>
        <div class="tl-text">${esc(t.text)}</div>
        <button class="tl-del" data-id="${t.id}">✕</button>
      </div></div>`).join("") + `</div>`;
    tl.innerHTML = scale;
    sch.innerHTML = body;
    sch.querySelectorAll(".tl-dot").forEach((d) => d.addEventListener("click", () => toggleTL(d.dataset.id)));
    sch.querySelectorAll(".tl-del").forEach((b) => b.addEventListener("click", () => delTL(b.dataset.id)));
  }

  function addDaily() {
    const inp = $("#dailyInput"); const txt = inp.value.trim();
    if (!txt) return;
    if (!store.daily[dailyCur]) store.daily[dailyCur] = [];
    store.daily[dailyCur].push({ id: uid(), text: txt, done: false });
    save(); inp.value = ""; renderDaily();
  }
  function toggleDaily(id) {
    const arr = store.daily[dailyCur]; const t = arr.find((x) => x.id === id);
    if (t) { t.done = !t.done; save(); renderDaily(); }
  }
  function delDaily(id) {
    store.daily[dailyCur] = store.daily[dailyCur].filter((x) => x.id !== id);
    save(); renderDaily();
  }
  function addTL() {
    const time = $("#tlTime").value; const txt = $("#tlText").value.trim();
    if (!txt) return;
    getTimeline().push({ id: uid(), time, text: txt, done: false });
    save(); $("#tlTime").value = ""; $("#tlText").value = ""; renderTimeline();
  }
  function toggleTL(id) {
    const arr = getTimeline(); const t = arr.find((x) => x.id === id);
    if (t) { t.done = !t.done; save(); renderTimeline(); }
  }
  function delTL(id) {
    store.dailyTimeline[dailyCur] = getTimeline().filter((x) => x.id !== id);
    save(); renderTimeline();
  }

  $("#dailyAdd").addEventListener("click", addDaily);
  $("#dailyInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addDaily(); });
  $("#dailyDate").addEventListener("change", (e) => { dailyCur = e.target.value; renderDaily(); });
  $("#dailyPrev").addEventListener("click", () => { dailyCur = fmt(addDays(parse(dailyCur), -1)); $("#dailyDate").value = dailyCur; renderDaily(); });
  $("#dailyNext").addEventListener("click", () => { dailyCur = fmt(addDays(parse(dailyCur), 1)); $("#dailyDate").value = dailyCur; renderDaily(); });
  $("#dailyToday").addEventListener("click", () => { dailyCur = TODAY_STR; $("#dailyDate").value = dailyCur; renderDaily(); });
  $("#dailyToWeekly").addEventListener("click", () => gotoWeekly(dailyCur));
  $("#workoutPickBtn").addEventListener("click", openWorkoutPicker);
  $("#workoutPickClose").addEventListener("click", () => { $("#workoutPickModal").hidden = true; });
  $("#workoutPickModal").addEventListener("click", (e) => { if (e.target === $("#workoutPickModal")) $("#workoutPickModal").hidden = true; });
  $("#tlAdd").addEventListener("click", addTL);
  $("#tlText").addEventListener("keydown", (e) => { if (e.key === "Enter") addTL(); });
  $("#seg1").addEventListener("input", (e) => { getSegments().s1 = e.target.value; save(); });
  $("#seg2").addEventListener("input", (e) => { getSegments().s2 = e.target.value; save(); });
  $("#seg3").addEventListener("input", (e) => { getSegments().s3 = e.target.value; save(); });
  $("#cmpNote").addEventListener("input", (e) => { store.dailyCompareNote[dailyCur] = e.target.value; save(); });
  $("#dailyDoneBtn").addEventListener("click", () => {
    const nowDone = !isWeekChecked(dailyCur);
    setWeekChecked(dailyCur, nowDone);
    if (window.Pet) window.Pet.onCheckin(dailyCur, nowDone);
    renderDailyDone();
    if ($("#view-weekly").classList.contains("active")) renderWeekly();
    if ($("#view-hundred").classList.contains("active")) renderHundred();
    toast(nowDone ? "已在周计划对应日期打卡完成 🎉" : "已取消今日打卡");
  });
  setupComparePhotos();
  $("#dayMetricAdd").addEventListener("click", () => {
    getDailyMetrics().push({ id: uid(), name: "", prev: null, curr: null });
    save(); renderDailyMetrics();
  });
  $("#customHabitAdd").addEventListener("click", addCustomHabit);
  $("#customHabitInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addCustomHabit(); });

  /* ===================== 5. 周计划 ===================== */
  let weekMon = store.calendar.checkinStart ? parse(store.calendar.checkinStart) : getMonday(TODAY);
  function getWeekly(key) {
    let w = store.weekly[key];
    if (!w || Array.isArray(w)) w = { focus: [], reward: "", checks: {} };
    if (Array.isArray(w["1"])) w = { focus: [], reward: "", checks: {} }; // 旧「每日任务」结构迁移
    if (!Array.isArray(w.focus)) w.focus = [];
    if (typeof w.reward !== "string") w.reward = "";
    if (!w.checks || typeof w.checks !== "object") w.checks = {};
    if (w.metrics === undefined) {
      // 首次使用：预置常用指标（用户可改名/删除/新增）
      w.metrics = [
        { id: uid(), name: "体重", prev: null, curr: null },
        { id: uid(), name: "腰围", prev: null, curr: null },
        { id: uid(), name: "体脂率", prev: null, curr: null },
      ];
    }
    if (!Array.isArray(w.metrics)) w.metrics = [];
    if (!w.dayNotes || typeof w.dayNotes !== "object") w.dayNotes = {};
    store.weekly[key] = w;
    return w;
  }
  function renderRewardStatus(w) {
    const checks = w.checks || {};
    const allDone = [1,2,3,4,5,6,7].every((i) => checks[i]);
    const box = $("#rewardStatus");
    if (allDone) {
      box.className = "reward-status reached";
      box.innerHTML = w.reward ? `🎉 本周已全勤！别忘了奖励自己：${esc(w.reward)}` : "🎉 本周已全勤！";
    } else {
      const done = [1,2,3,4,5,6,7].filter((i) => checks[i]).length;
      box.className = "reward-status";
      box.textContent = `已完成 ${done}/7 天打卡，全部完成即解锁奖励`;
    }
  }
  function renderWeekly() {
    const key = fmt(weekMon);
    const w = getWeekly(key);
    const sun = addDays(weekMon, 6);
    $("#weekRange").textContent = `${fmt(weekMon)} ~ ${fmt(sun)}`;
    renderFocusList();
    $("#rewardInput").value = w.reward || "";
    renderRewardStatus(w);
    const checks = w.checks || {};
    const notes = w.dayNotes || {};
    const grid = $("#weekChecks"); grid.innerHTML = "";
    for (let i = 1; i <= 7; i++) {
      const d = addDays(weekMon, i - 1);
      const ds = fmt(d);
      const done = !!checks[i];
      const rest = (i === 7);
      const cell = document.createElement("div");
      cell.className = "week-check" + (done ? " done" : "") + (rest ? " rest" : "");
      cell.dataset.day = i;
      cell.dataset.date = ds;
      cell.innerHTML = `<div class="wc-jump" data-day="${i}" title="查看当天日计划">↗</div>` +
        `<div class="wc-toggle" data-day="${i}" title="点击打卡">` +
        `<span class="wc-day">Day ${i}</span>` +
        `<span class="wc-date">${d.getMonth() + 1}/${d.getDate()}</span>` +
        `<span class="wc-mark">${done ? "✓" : ""}</span>` +
        (rest ? `<span class="wc-rest">休息日</span>` : "") +
        `</div>` +
        `<textarea class="wc-note" data-day="${i}" rows="3" placeholder="当天安排 / 备注…">${esc(notes[i] || "")}</textarea>`;
      grid.appendChild(cell);
    }
    grid.querySelectorAll(".wc-toggle").forEach((b) => b.addEventListener("click", () => {
      const day = +b.dataset.day;
      const wk = getWeekly(fmt(weekMon));
      wk.checks[day] = !wk.checks[day];
      save();
      if (window.Pet) window.Pet.onCheckin(b.closest(".week-check").dataset.date, wk.checks[day]);
      renderWeekly();
    }));
    grid.querySelectorAll(".wc-jump").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      openDaily(b.closest(".week-check").dataset.date);
    }));
    grid.querySelectorAll(".wc-note").forEach((inp) => inp.addEventListener("input", () => {
      const day = +inp.dataset.day;
      const wk = getWeekly(fmt(weekMon));
      wk.dayNotes[day] = inp.value;
      save(); // 不重渲染，避免输入框失焦
    }));
    renderMetrics();
    renderWeekPhotos();
  }
  function fmtDelta(prev, curr) {
    const p = parseFloat(prev), c = parseFloat(curr);
    if (isNaN(p) || isNaN(c)) return { text: "—", cls: "neutral" };
    const d = +((c - p).toFixed(2));
    if (d === 0) return { text: "0", cls: "neutral" };
    return d < 0 ? { text: `↓ ${Math.abs(d)}`, cls: "down" } : { text: `↑ ${d}`, cls: "up" };
  }
  function getWeekPhotos() {
    const w = getWeekly(fmt(weekMon));
    if (!w.photos) w.photos = { prev: null, curr: null };
    return w.photos;
  }
  function renderWeekPhotos() {
    const p = getWeekPhotos();
    $$(".wk-photo").forEach((box) => {
      const side = box.dataset.side;
      const img = box.querySelector(".cmp-img");
      const add = box.querySelector(".cmp-add");
      const acts = box.querySelector(".cmp-acts");
      const val = p[side];
      if (val) { img.src = val; img.hidden = false; add.hidden = true; acts.hidden = false; }
      else { img.removeAttribute("src"); img.hidden = true; add.hidden = false; acts.hidden = true; }
    });
  }
  function setupWeekPhotos() {
    $$(".wk-photo").forEach((box) => {
      const side = box.dataset.side;
      const file = box.querySelector(".cmp-file");
      const add = box.querySelector(".cmp-add");
      const acts = box.querySelector(".cmp-acts");
      add.addEventListener("click", () => file.click());
      acts.querySelector(".cmp-change").addEventListener("click", () => file.click());
      acts.querySelector(".cmp-remove").addEventListener("click", () => { getWeekPhotos()[side] = null; save(); renderWeekPhotos(); });
      file.addEventListener("change", (e) => {
        const f = e.target.files[0]; e.target.value = "";
        if (!f) return;
        compressImage(f).then((d) => { getWeekPhotos()[side] = d; save(); renderWeekPhotos(); })
          .catch((err) => alert(err.message));
      });
    });
  }
  function renderMetrics() {
    const w = getWeekly(fmt(weekMon));
    const list = $("#metricList");
    list.innerHTML = "";
    w.metrics.forEach((m) => {
      const row = document.createElement("div");
      row.className = "metric-row";
      row.dataset.id = m.id;
      row.innerHTML =
        `<input class="inp metric-name" placeholder="指标名，如：体重" value="${esc(m.name || "")}" />` +
        `<div class="metric-nums">` +
          `<label class="metric-lab">上周<input class="inp metric-prev" type="number" step="0.1" value="${m.prev === null || m.prev === undefined ? "" : m.prev}" /></label>` +
          `<label class="metric-lab">本周<input class="inp metric-curr" type="number" step="0.1" value="${m.curr === null || m.curr === undefined ? "" : m.curr}" /></label>` +
        `</div>` +
        `<div class="metric-delta"></div>` +
        `<button class="metric-del" type="button" title="删除">✕</button>`;
      list.appendChild(row);
      const delta = row.querySelector(".metric-delta");
      const updateDelta = () => {
        const r = fmtDelta(row.querySelector(".metric-prev").value, row.querySelector(".metric-curr").value);
        delta.className = "metric-delta " + r.cls;
        delta.textContent = r.text;
      };
      updateDelta();
      row.querySelector(".metric-name").addEventListener("input", (e) => { m.name = e.target.value; save(); });
      row.querySelector(".metric-prev").addEventListener("input", (e) => {
        m.prev = e.target.value === "" ? null : parseFloat(e.target.value);
        save(); updateDelta();
      });
      row.querySelector(".metric-curr").addEventListener("input", (e) => {
        m.curr = e.target.value === "" ? null : parseFloat(e.target.value);
        save(); updateDelta();
      });
      row.querySelector(".metric-del").addEventListener("click", () => {
        const wk = getWeekly(fmt(weekMon));
        wk.metrics = wk.metrics.filter((x) => x.id !== m.id);
        save(); renderMetrics();
      });
    });
  }
  function renderFocusList() {
    const w = getWeekly(fmt(weekMon));
    const list = $("#focusList");
    list.innerHTML = "";
    const items = (Array.isArray(w.focus) && w.focus.length) ? w.focus : [""];
    items.forEach((val, idx) => list.appendChild(makeFocusRow(val, idx)));
  }
  function makeFocusRow(val, idx) {
    const row = document.createElement("div");
    row.className = "focus-row";
    row.innerHTML =
      `<input class="inp focus-inp" placeholder="目标 ${idx + 1}" value="${esc(val || "")}" />` +
      `<button class="focus-del" type="button" title="删除目标">✕</button>`;
    const inp = row.querySelector(".focus-inp");
    inp.addEventListener("input", () => { syncWeeklyFocus(); save(); });
    row.querySelector(".focus-del").addEventListener("click", () => {
      const rows = $$("#focusList .focus-row");
      if (rows.length <= 1) { inp.value = ""; syncWeeklyFocus(); save(); return; }
      row.remove(); syncWeeklyFocus(); save();
    });
    return row;
  }
  function addFocusItem(preset) {
    const list = $("#focusList");
    const idx = list.querySelectorAll(".focus-row").length;
    const row = makeFocusRow(preset || "", idx);
    list.appendChild(row);
    row.querySelector(".focus-inp").focus();
    syncWeeklyFocus(); save();
  }
  function syncWeeklyFocus() {
    const w = getWeekly(fmt(weekMon));
    w.focus = $$("#focusList .focus-inp").map((inp) => inp.value.trim()).filter(Boolean);
  }
  $("#focusChips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip"); if (!chip) return;
    const text = chip.textContent.trim();
    const inputs = $$("#focusList .focus-inp");
    const target = inputs.find((inp) => !inp.value.trim());
    if (!target) { addFocusItem(text); return; }
    target.value = text;
    syncWeeklyFocus(); save();
  });
  $("#focusAdd").addEventListener("click", () => addFocusItem());
  $("#rewardInput").addEventListener("input", () => { getWeekly(fmt(weekMon)).reward = $("#rewardInput").value; });
  $("#weekSave").addEventListener("click", () => {
    syncWeeklyFocus();
    getWeekly(fmt(weekMon)).reward = $("#rewardInput").value;
    save();
    const b = $("#weekSave"); b.textContent = "已保存 ✓"; setTimeout(() => { b.textContent = "保存"; }, 1200);
    renderRewardStatus(getWeekly(fmt(weekMon)));
  });
  $("#weekPrev").addEventListener("click", () => { save(); weekMon = addDays(weekMon, -7); renderWeekly(); });
  $("#weekNext").addEventListener("click", () => { save(); weekMon = addDays(weekMon, 7); renderWeekly(); });
  $("#metricAdd").addEventListener("click", () => {
    const w = getWeekly(fmt(weekMon));
    if (!Array.isArray(w.metrics)) w.metrics = [];
    w.metrics.push({ id: uid(), name: "", prev: null, curr: null });
    save(); renderMetrics();
  });
  setupWeekPhotos();

  /* ===================== 6. 100 天总结 ===================== */
  /* ===================== 100 天总结 ===================== */
  // 区块二：身体数据变化总览（9 项，按需求顺序排列；bmi/whr 为派生只读项）
  const BODY_ITEMS = [
    { k: "weight", label: "体重", unit: "kg", type: "num" },
    { k: "bmi", label: "BMI", unit: "", type: "der" },
    { k: "bust", label: "胸围", unit: "cm", type: "num" },
    { k: "waist", label: "腰围", unit: "cm", type: "num" },
    { k: "hip", label: "臀围", unit: "cm", type: "num" },
    { k: "whr", label: "腰臀比", unit: "", type: "der" }
  ];

  // 由日期反推「计划周」起点：以 checkinStart 为第 1 天；未设定则回退周一
  function planWeekStart(ds) {
    const start = store.calendar.checkinStart;
    if (!start) return getMonday(parse(ds || TODAY_STR));
    const base = parse(start);
    const d = parse(ds || TODAY_STR);
    const diff = Math.round((d - base) / 86400000);
    return addDays(base, Math.floor(diff / 7) * 7);
  }
  // 某天是否在「周计划」中完成当日打卡
  // 新数据：以起点日为第 1 天（planWeek 内第 (diff%7)+1 天）
  // 旧数据兼容：以周一为基准（checks[1..7] = 周一..周日）
  function isWeekChecked(ds) {
    const d = parse(ds);
    const dow = (d.getDay() + 6) % 7; // 0=周一 .. 6=周日
    const mon = addDays(d, -dow);
    const wm = store.weekly[fmt(mon)];
    if (wm && wm.checks && wm.checks[dow + 1]) return true;
    if (!store.calendar.checkinStart) return false;
    const base = parse(store.calendar.checkinStart);
    const diff = Math.round((d - base) / 86400000);
    if (diff < 0) return false;
    const pd = (diff % 7) + 1;
    const ws = addDays(base, Math.floor(diff / 7) * 7);
    const w = store.weekly[fmt(ws)];
    return !!(w && w.checks && w.checks[pd]);
  }

  // 写入某天在「周计划」中的当日打卡状态（与 isWeekChecked 读取逻辑对称）
  function setWeekChecked(ds, val) {
    const d = parse(ds);
    const dow = (d.getDay() + 6) % 7; // 0=周一 .. 6=周日
    const mon = addDays(d, -dow);
    const monKey = fmt(mon);
    // 优先写入「以周一为 key」的周（isWeekChecked 也先查周一）
    if (store.weekly[monKey]) {
      const w = getWeekly(monKey);
      w.checks[dow + 1] = val;
      save();
      return;
    }
    // 否则尝试「计划起点周」基准
    if (store.calendar.checkinStart) {
      const base = parse(store.calendar.checkinStart);
      const diff = Math.round((d - base) / 86400000);
      if (diff >= 0) {
        const pd = (diff % 7) + 1;
        const ws = addDays(base, Math.floor(diff / 7) * 7);
        const w = getWeekly(fmt(ws));
        w.checks[pd] = val;
        save();
        return;
      }
    }
    // 都没有对应周数据：按周一新建一周
    const w = getWeekly(monKey);
    w.checks[dow + 1] = val;
    save();
  }

  // 轻量提示
  function toast(msg) {
    let t = $("#wb-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "wb-toast";
      t.className = "wb-toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  function computeHundredStats() {
    const start = parse(store.hundred.start || TODAY_STR);
    const entries = store.hundred.entries || {};
    const days = [];
    for (let i = 0; i < 100; i++) {
      const d = addDays(start, i);
      const ds = fmt(d);
      const has = isWeekChecked(ds);
      days.push({ i: i + 1, ds, has, entry: entries[ds] || null });
    }
    const totalChecked = days.filter((d) => d.has).length;
    const completionRate = Math.round((totalChecked / 100) * 100);
    let longest = 0, run = 0;
    for (const d of days) { if (d.has) { run++; if (run > longest) longest = run; } else run = 0; }
    return { start, days, totalChecked, completionRate, longest };
  }

  function renderHundredBanner(stats) {
    const b = $("#hBanner");
    b.innerHTML =
      '<div class="daily-block-head"><span class="daily-block-title">恭喜完成 100 天变美计划</span></div>' +
      '<p class="block-note">从 ' + stats.start.getFullYear() + " 年 " + (stats.start.getMonth() + 1) + " 月 " + stats.start.getDate() + " 日启程，你已走过 " + stats.totalChecked + " 个坚持的日子</p>" +
      '<div class="h-block-body"><div class="banner-stats">' +
        '<div class="bstat"><span class="bnum">' + stats.totalChecked + '</span><span class="blab">总打卡天数</span></div>' +
        '<div class="bstat"><span class="bnum">' + stats.longest + '</span><span class="blab">最长连续打卡</span></div>' +
        '<div class="bstat"><span class="bnum">' + stats.completionRate + "%</span><span class=\"blab\">完成率</span></div>" +
      "</div></div>";
  }

  function hBlock(idx, title, sub, inner, noIdx) {
    const sec = document.createElement("section");
    sec.className = "h-block daily-block";
    const head = noIdx ? title : ("区块 " + idx + " · " + title);
    sec.innerHTML = '<div class="daily-block-head">' +
      '<span class="daily-block-title">' + head + "</span>" +
      "</div>" +
      (sub ? '<p class="block-note">' + sub + "</p>" : "") +
      '<div class="h-block-body">' + inner + "</div>";
    return sec;
  }

  function radarSVG(labels, series) {
    const n = labels.length, cx = 110, cy = 110, R = 80;
    const ang = (i) => (Math.PI * 2 * i / n) - Math.PI / 2;
    const pt = (i, r) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
    let grid = "";
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const p = labels.map((_, i) => pt(i, R * f).join(",")).join(" ");
      grid += '<polygon points="' + p + '" fill="none" stroke="#e7d9b8" stroke-width="1"/>';
    });
    let axes = labels.map((lb, i) => {
      const [x, y] = pt(i, R); const [lx, ly] = pt(i, R + 16);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '" stroke="#e7d9b8" stroke-width="1"/>' +
        '<text x="' + lx + '" y="' + ly + '" font-size="9" fill="#8a6a3a" text-anchor="middle" dominant-baseline="middle">' + lb + "</text>";
    }).join("");
    let polys = series.map((s) => {
      const p = s.values.map((v, i) => pt(i, R * Math.max(0, Math.min(100, v)) / 100).join(",")).join(" ");
      return '<polygon points="' + p + '" fill="' + s.color + '33" stroke="' + s.color + '" stroke-width="2"/>';
    }).join("");
    return '<svg viewBox="0 0 220 220" width="220" height="220">' + grid + axes + polys + "</svg>";
  }

  function blockBodyChanges() {
    // first use: migrate fixed 9 items + existing values into a user-editable list
    if (!store.hundred.bodyItems) {
      const sbOld = store.hundred.startBody || {}, cbOld = store.body || {};
      store.hundred.bodyItems = BODY_ITEMS.map((r) => ({ k: r.k, label: r.label, unit: r.unit }));
      store.hundred.bodyStart = {};
      store.hundred.bodyCurr = {};
      BODY_ITEMS.forEach((r) => {
        store.hundred.bodyStart[r.k] = sbOld[r.k] != null ? sbOld[r.k] : "";
        store.hundred.bodyCurr[r.k] = cbOld[r.k] != null ? cbOld[r.k] : "";
      });
      save();
    }
    // 用户要求移除：身高 / 头身比 / 头肩比（幂等清理，已删不会重复删，仍可手动添加回来）
    const RM = ["height", "hbr", "hsr"];
    const len0 = store.hundred.bodyItems.length;
    store.hundred.bodyItems = store.hundred.bodyItems.filter((it) => !RM.includes(it.k));
    if (store.hundred.bodyItems.length !== len0) {
      RM.forEach((k) => { delete store.hundred.bodyStart[k]; delete store.hundred.bodyCurr[k]; });
      save();
    }
    const items = store.hundred.bodyItems;
    const bs = store.hundred.bodyStart || {}, bc = store.hundred.bodyCurr || {};
    const rows = items.map((it) => {
      const nameCell = '<span class="body-name">' + esc(it.label) + (it.unit ? " <i>(" + esc(it.unit) + ")</i>" : "") + "</span>";
      const valsCell = '<span class="body-vals">' +
        '<input class="inp mini" data-bk="' + it.k + '" data-side="start" value="' + esc(bs[it.k] == null ? "" : bs[it.k]) + '" placeholder="起始">' +
        '<span class="arrow">→</span>' +
        '<input class="inp mini" data-bk="' + it.k + '" data-side="curr" value="' + esc(bc[it.k] == null ? "" : bc[it.k]) + '" placeholder="当前">' +
        "</span>";
      return '<div class="body-row" data-row="' + it.k + '">' + nameCell + valsCell +
        '<span class="body-delta" data-bk="' + it.k + '"></span>' +
        '<button class="body-del" data-bk="' + it.k + '" title="删除该指标" aria-label="删除">×</button></div>';
    }).join("");
    const inner = '<div class="body-grid">' + rows + "</div>" +
      '<div class="body-add-row">' +
        '<input class="inp" id="bodyNewName" placeholder="新增指标名称，如 体脂率 / 臂围">' +
        '<input class="inp mini" id="bodyNewUnit" placeholder="单位">' +
        '<button class="primary-btn mini" id="bodyAdd">＋ 添加指标</button>' +
      "</div>" +
      '<p class="body-hint">可自由增删指标：起始值 → 当前值，差值标 <b style="color:#c0392b">红↑</b>、下降标 <b style="color:#2e8b57">绿↓</b>。点每行右侧 × 删除该指标。</p>';
    return hBlock(2, "身体数据变化总览", "100 天前后各项身体数据变化（起始值 → 当前值，可自由增删指标、自动计算差值与方向）。", inner, true);
  }

  // 格式化变化量：上升红↑、下降绿↓；数值取绝对值避免双重负号
  function setBodyDelta(el, diff, unit) {
    if (isNaN(diff)) { el.textContent = "—"; el.className = "body-delta"; return; }
    if (Math.abs(diff) < 1e-9) { el.textContent = "持平"; el.className = "body-delta"; return; }
    const up = diff > 0;
    const txt = (up ? "↑ +" : "↓ ") + Math.abs(diff).toFixed(unit ? 1 : 2) + (unit || "");
    el.textContent = txt;
    el.className = "body-delta " + (up ? "up" : "down");
  }

  function recomputeBody(board) {
    const items = store.hundred.bodyItems || [];
    items.forEach((it) => {
      const sIn = board.querySelector('input[data-bk="' + it.k + '"][data-side="start"]');
      const cIn = board.querySelector('input[data-bk="' + it.k + '"][data-side="curr"]');
      if (!sIn || !cIn) return;
      const s = parseFloat(sIn.value), c = parseFloat(cIn.value);
      const deltaEl = board.querySelector('.body-delta[data-bk="' + it.k + '"]');
      setBodyDelta(deltaEl, c - s, it.unit);
    });
  }

  function blockComparePhotos() {
    const ph = store.hundred.photos;
    const inner =
      '<div class="cmp2">' +
        '<div class="cmp-side"><div class="cmp-label">第 1 天（起始）</div>' +
          '<div class="cmp-imgbox" id="cmpStartBox">' + (ph.start ? '<img src="' + ph.start + '" class="cmp-img">' : '<div class="cmp-ph">请上传第 1 天照片</div>') + "</div>" +
          '<label class="cmp-upload">上传照片<input type="file" accept="image/*" class="h-photo" data-side="start" hidden></label></div>' +
        '<div class="cmp-side"><div class="cmp-label">第 100 天（当前）</div>' +
          '<div class="cmp-imgbox" id="cmpEndBox">' + (ph.end ? '<img src="' + ph.end + '" class="cmp-img">' : '<div class="cmp-ph">请上传第 100 天照片</div>') + "</div>" +
          '<label class="cmp-upload">上传照片<input type="file" accept="image/*" class="h-photo" data-side="end" hidden></label></div>' +
      "</div>" +
      '<div class="slider-wrap"><div class="slider-compare" id="sliderCompare">' +
        (ph.end ? '<img class="sc-after" id="scAfter" src="' + ph.end + '">' : "") +
        '<div class="sc-before" id="scBefore">' + (ph.start ? '<img id="scBeforeImg" src="' + ph.start + '">' : "") + "</div>" +
        '<input type="range" min="0" max="100" value="50" class="sc-range" id="scRange">' +
        '<div class="sc-handle" id="scHandle"></div>' +
      "</div><p class=\"slider-hint\">拖动滑块左右对比两张照片（支持手势缩放查看）</p></div>" +
      '<label class="cmp-note-label">照片备注<textarea class="inp cmp-note2" id="hPhotoNote" placeholder="例如：左为 Day1，右为 Day100，状态对比...">' + esc(store.hundred.photoNote || "") + "</textarea></label>";
    return hBlock(3, "100 天前后对比图", "左侧第 1 天初始照片，右侧第 100 天最终照片，可拖动滑块对比。", inner, true);
  }

  function blockHundredCalendar(stats) {
    const days = stats.days;
    const weeks = Math.ceil(days.length / 7);
    let cells = "";
    for (let w = 0; w < weeks; w++) {
      const arr = days.slice(w * 7, w * 7 + 7);
      if (!arr.length) break;
      const first = arr[0], last = arr[arr.length - 1];
      let g = '<div class="cal-week"><div class="cal-wlabel">第 ' + (w + 1) + " 周" +
        ' <span class="cal-range">' + first.ds + " ~ " + last.ds + "</span></div><div class=\"cal-grid\">";
      arr.forEach((d) => {
        g += '<div class="cal-cell' + (d.has ? " filled" : "") + '" data-ds="' + d.ds + '" data-i="' + d.i + '" title="第' + d.i + "天 · " + d.ds + '">' +
          '<span class="cal-num">' + d.i + "</span>" +
          '<span class="cal-mark">' + (d.has ? "✓" : "") + "</span></div>";
      });
      g += "</div></div>"; cells += g;
    }
    const inner = '<div class="cal-summary">总完成率 <b>' + stats.completionRate + "%</b>（" + stats.totalChecked + " / 100 天） · 点击日期查看当日记录</div>" + cells;
    return hBlock(5, "每日打卡完成日历", "依据「周计划」中每日打卡状态更新，按周（每周 7 天）排列。", inner, true);
  }

  function blockReflections() {
    const entries = store.hundred.entries || {};
    const list = Object.keys(entries).map((ds) => ({ ds, text: entries[ds].text || "", rating: entries[ds].rating || 0 }))
      .filter((x) => x.text.trim()).sort((a, b) => b.ds.localeCompare(a.ds));
    if (!list.length) return hBlock(6, "用户自我反思记录", "整个 100 天计划中的心得与感悟汇总（按时间倒序）。", '<p class="muted">记录你的变美感悟吧 — 在打卡日历里写下每日收获即可在此汇总。</p>', true);
    const html = list.map((x) => {
      const stars = "★".repeat(x.rating) + "☆".repeat(5 - x.rating);
      return '<div class="refl-item"><div class="refl-top"><span class="refl-date">' + x.ds + '</span><span class="refl-rate">' + stars + "</span>" +
        '<span class="refl-acts"><button class="link-btn" data-act="edit" data-ds="' + x.ds + '">编辑</button><button class="link-btn danger" data-act="del" data-ds="' + x.ds + '">删除</button></span></div>' +
        '<p class="refl-text">' + esc(x.text) + "</p></div>";
    }).join("");
    return hBlock(6, "用户自我反思记录", "整个 100 天计划中的心得与感悟汇总（按时间倒序，支持编辑 / 删除）。", html, true);
  }

  function blockRewards() {
    // 周计划设定的奖励（来自各周 reward 字段）+ 用户自行添加奖励，合并去重
    const weeks = Object.keys(store.weekly || {}).sort();
    const list = []; const seen = {};
    weeks.forEach((mon) => { const w = getWeekly(mon); if (w.reward && w.reward.trim() && !seen[w.reward.trim()]) { seen[w.reward.trim()] = true; list.push({ name: w.reward.trim(), custom: false }); } });
    (store.hundred.rewardList || []).forEach((r) => { const n = (r || "").trim(); if (n && !seen[n]) { seen[n] = true; list.push({ name: n, custom: true }); } });
    const html = list.map((it) => {
      const claimed = !!store.hundred.rewardClaimed[it.name];
      return '<div class="reward-item' + (claimed ? " claimed" : "") + '" data-reward="' + esc(it.name) + '">' +
        '<span class="reward-emoji">🎁</span>' +
        '<span class="reward-name">' + esc(it.name) + "</span>" +
        (it.custom ? '<button class="reward-del" data-del="' + esc(it.name) + '" title="删除该奖励" aria-label="删除">×</button>' : "") +
        '<button class="reward-btn' + (claimed ? " on" : "") + '" data-reward="' + esc(it.name) + '">' + (claimed ? "✅ 已领取" : "标记领取") + "</button></div>";
    }).join("") ||
      '<p class="muted">还没有任何奖励，在下方添加你的专属奖励吧。</p>';
    const inner = '<div class="reward-list">' + html + "</div>" +
      '<div class="reward-add-row">' +
        '<input class="inp" id="rewardNew" placeholder="添加你想要的奖励，如 一次旅行 / 一支口红 / 一顿大餐">' +
        '<button class="primary-btn mini" id="rewardAdd">＋ 添加奖励</button>' +
      "</div>" +
      '<p class="body-hint">奖励可来自「周计划」填写的目标，也可在此自行添加。点击「标记领取」记录已兑现，右侧 × 仅可删除自行添加的奖励。</p>';
    return hBlock(7, "完成奖励确认", "100 天计划中设定的所有「完成奖励」，可标记是否已兑现，也可自行添加。", inner, true);
  }

  function blockNextSuggest(stats) {
    const sb = store.hundred.bodyStart || {}, cb = store.hundred.bodyCurr || {};
    const sw = parseFloat(sb.weight), cw = parseFloat(cb.weight);
    const swa = parseFloat(sb.waist), cwa = parseFloat(cb.waist);
    const tips = [];
    if (!isNaN(sw) && !isNaN(cw) && Math.abs(cw - sw) < 2) tips.push("体重变化不明显（" + (isNaN(sw) ? "?" : sw) + "→" + (isNaN(cw) ? "?" : cw) + "kg），建议调整饮食结构：控糖、提高蛋白质比例、规律三餐。");
    if (stats.completionRate < 80) tips.push("打卡完成率仅 " + stats.completionRate + "%，建议优化时间安排，固定每日打卡节奏（如睡前 5 分钟复盘）。");
    if (!isNaN(swa) && !isNaN(cwa) && (swa - cwa) >= 4 && !isNaN(sw) && !isNaN(cw) && Math.abs(cw - sw) < 2) tips.push("腰围明显下降而体重变化不大，提示体脂率可能改善，建议加测体脂率与围度曲线。");
    if (stats.totalChecked >= 90) tips.push("坚持度极高（" + stats.totalChecked + "/100 天），这份自律本身就是成果，请继续保持！");
    if (!tips.length) tips.push("整体推进平稳，下一阶段可针对最想突破的 1–2 个项目设定更精细的小目标。");
    const inner = '<ul class="suggest-list">' + tips.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>";
    return hBlock(9, "下一阶段建议", "基于你 100 天的数据变化，给出个性化建议。", inner, true);
  }

  function blockExportShare() {
    const inner = '<div class="export-actions">' +
      '<button class="primary-btn" id="hExportPdf">📄 导出报告（PDF / 打印）</button>' +
      '<button class="ghost-btn" id="hExportImg">🖼 保存为图片</button>' +
      '<button class="ghost-btn" id="hShare">🔗 分享成果</button>' +
      '</div><p class="export-hint">导出会生成可打印 / 保存的成果页；分享将复制一段成果总结到剪贴板（支持的系统会直接调起分享面板）。</p>';
    return hBlock(8, "数据导出与分享", "将 100 天成果导出保存或分享给朋友。", inner, true);
  }

  function blockNextHundred() {
    const inner = '<p class="next-desc">开启新的 100 天，将自动以「今天」为起点、清空打卡记录，并把当前身体数据作为新的起始快照，继承你已有的模板与习惯。</p>' +
      '<button class="primary-btn big" id="hNext">🌟 开启下一个 100 天</button>';
    return hBlock(10, "开启下一个 100 天", "基于本次成果，继续下一段变美旅程。", inner, true);
  }

  function exportHundredImage(stats) {
    const c = document.createElement("canvas"); c.width = 600; c.height = 360;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 600, 360); g.addColorStop(0, "#fff7ea"); g.addColorStop(1, "#fdeef0");
    x.fillStyle = g; x.fillRect(0, 0, 600, 360);
    x.fillStyle = "#6b3a4a"; x.font = "bold 28px sans-serif"; x.fillText("100 天变美计划 · 成果", 40, 70);
    x.fillStyle = "#8a6a3a"; x.font = "16px sans-serif";
    x.fillText("总打卡 " + stats.totalChecked + " 天 · 最长连续 " + stats.longest + " 天 · 完成率 " + stats.completionRate + "%", 40, 110);
    const items = [["总打卡", stats.totalChecked], ["最长连续", stats.longest], ["完成率", stats.completionRate + "%"]];
    items.forEach((it, i) => {
      const bx = 40 + i * 180;
      x.fillStyle = "#fff"; x.strokeStyle = "#e7b9c4"; x.lineWidth = 2; x.fillRect(bx, 150, 150, 90); x.strokeRect(bx, 150, 150, 90);
      x.fillStyle = "#b8707f"; x.font = "bold 30px sans-serif"; x.fillText(String(it[1]), bx + 20, 200);
      x.fillStyle = "#8a6a3a"; x.font = "14px sans-serif"; x.fillText(it[0], bx + 20, 225);
    });
    x.fillStyle = "#a98b5a"; x.font = "13px sans-serif"; x.fillText("生成于 " + TODAY_STR + " · 变美计划", 40, 330);
    const a = document.createElement("a"); a.download = "100天总结.png"; a.href = c.toDataURL("image/png"); a.click();
  }

  function shareHundred(stats) {
    const txt = "🎉 我完成了 100 天变美计划！\n总打卡 " + stats.totalChecked + " 天 · 最长连续 " + stats.longest + " 天 · 完成率 " + stats.completionRate + "%\n#变美计划 #100天";
    if (navigator.share) { navigator.share({ title: "100天变美计划成果", text: txt }).catch(() => {}); }
    else { if (navigator.clipboard) navigator.clipboard.writeText(txt); alert("成果总结已复制到剪贴板，去微信 / 微博粘贴分享吧！\n\n" + txt); }
  }

  function wireHundredBoard(board, stats) {
    board.querySelectorAll(".body-row input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.bk, side = inp.dataset.side, v = inp.value;
        if (side === "start") store.hundred.bodyStart[k] = v; else store.hundred.bodyCurr[k] = v;
        save(); recomputeBody(board);
      });
    });
    board.querySelectorAll(".body-del").forEach((b) => {
      b.addEventListener("click", () => {
        const k = b.dataset.bk;
        store.hundred.bodyItems = (store.hundred.bodyItems || []).filter((it) => it.k !== k);
        delete store.hundred.bodyStart[k]; delete store.hundred.bodyCurr[k];
        save(); renderHundred();
      });
    });
    const addBtn = board.querySelector("#bodyAdd");
    if (addBtn) addBtn.addEventListener("click", () => {
      const nm = board.querySelector("#bodyNewName");
      const un = board.querySelector("#bodyNewUnit");
      const name = (nm.value || "").trim();
      if (!name) { nm.focus(); return; }
      const unit = (un.value || "").trim();
      const k = "b" + Date.now();
      store.hundred.bodyItems = store.hundred.bodyItems || [];
      store.hundred.bodyItems.push({ k, label: name, unit });
      store.hundred.bodyStart[k] = ""; store.hundred.bodyCurr[k] = "";
      save(); renderHundred();
    });
    recomputeBody(board);

    board.querySelectorAll(".h-photo").forEach((f) => {
      f.addEventListener("change", (e) => {
        const file = e.target.files[0]; if (!file) return;
        const rd = new FileReader();
        rd.onload = () => {
          const side = f.dataset.side;
          store.hundred.photos[side] = rd.result; save();
          board.querySelector(side === "start" ? "#cmpStartBox" : "#cmpEndBox").innerHTML = '<img src="' + rd.result + '" class="cmp-img">';
          const si = board.querySelector(side === "start" ? "#scBeforeImg" : "#scAfter");
          if (si) si.src = rd.result;
        };
        rd.readAsDataURL(file);
      });
    });
    const note = board.querySelector("#hPhotoNote");
    if (note) note.addEventListener("input", () => { store.hundred.photoNote = note.value; save(); });

    const range = board.querySelector("#scRange");
    if (range) {
      const upd = () => {
        const v = range.value;
        const before = board.querySelector("#scBefore");
        const handle = board.querySelector("#scHandle");
        const wrap = board.querySelector("#sliderCompare");
        if (before) before.style.width = v + "%";
        if (handle) handle.style.left = v + "%";
        if (wrap && before) { const img = before.querySelector("img"); if (img) img.style.width = wrap.clientWidth + "px"; }
      };
      range.addEventListener("input", upd); setTimeout(upd, 50); window.addEventListener("resize", upd);
    }

    board.querySelectorAll(".cal-cell").forEach((c) => {
      c.addEventListener("click", () => openHundredPop(c.dataset.ds, Number(c.dataset.i)));
    });
    board.querySelectorAll(".focus-sum").forEach((fs) => {
      fs.querySelector(".fs-head").addEventListener("click", () => fs.classList.toggle("open"));
    });
    board.querySelectorAll("[data-act]").forEach((b) => {
      b.addEventListener("click", () => {
        const ds = b.dataset.ds;
        if (b.dataset.act === "edit") { const d = stats.days.find((x) => x.ds === ds); openHundredPop(ds, d ? d.i : 1); }
        else if (b.dataset.act === "del") { if (confirm("确定删除这条反思记录？")) { delete store.hundred.entries[ds]; save(); renderHundred(); } }
      });
    });
    board.querySelectorAll(".reward-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const r = b.dataset.reward; const on = !!store.hundred.rewardClaimed[r];
        if (on) delete store.hundred.rewardClaimed[r]; else store.hundred.rewardClaimed[r] = true;
        save();
        const item = b.closest(".reward-item");
        item.classList.toggle("claimed", !on);
        b.classList.toggle("on", !on);
        b.textContent = !on ? "✅ 已领取" : "标记领取";
      });
    });
    board.querySelectorAll(".reward-del").forEach((b) => {
      b.addEventListener("click", () => {
        const r = b.dataset.del;
        store.hundred.rewardList = (store.hundred.rewardList || []).filter((x) => x !== r);
        delete store.hundred.rewardClaimed[r];
        save(); renderHundred();
      });
    });
    const rewardAdd = board.querySelector("#rewardAdd");
    if (rewardAdd) rewardAdd.addEventListener("click", () => {
      const inp = board.querySelector("#rewardNew");
      const v = (inp.value || "").trim();
      if (!v) return;
      store.hundred.rewardList = store.hundred.rewardList || [];
      if (!store.hundred.rewardList.includes(v)) store.hundred.rewardList.push(v);
      save(); renderHundred();
    });
    const rewardNew = board.querySelector("#rewardNew");
    if (rewardNew) rewardNew.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); rewardAdd && rewardAdd.click(); } });
    const exPdf = board.querySelector("#hExportPdf"); if (exPdf) exPdf.addEventListener("click", () => window.print());
    const exImg = board.querySelector("#hExportImg"); if (exImg) exImg.addEventListener("click", () => exportHundredImage(stats));
    const sh = board.querySelector("#hShare"); if (sh) sh.addEventListener("click", () => shareHundred(stats));
    const nx = board.querySelector("#hNext"); if (nx) nx.addEventListener("click", () => {
      if (!confirm("开启下一个 100 天？\n将以今天为起点、清空打卡记录，并把当前身体数据作为新的起始快照。")) return;
      store.hundred.start = TODAY_STR; store.hundred.entries = {};
      const items = store.hundred.bodyItems || [];
      const newStart = {};
      items.forEach((it) => {
        newStart[it.k] = store.hundred.bodyCurr[it.k] != null ? store.hundred.bodyCurr[it.k] : "";
      });
      store.hundred.bodyStart = newStart;
      store.hundred.bodyCurr = {};
      store.hundred.rewardClaimed = {}; save(); renderHundred();
    });
  }

  function renderHundred() {
    const startInput = $("#hundredStart");
    if (typeof store.hundred.startAuto !== "boolean") store.hundred.startAuto = true;
    const calStart = store.calendar.checkinStart;
    if (calStart && store.hundred.startAuto !== false) {
      // 年历已设定打卡起点 → 计划起点自动跟随（保证「计划起点 = 年历打卡起点」）
      if (store.hundred.start !== calStart) { store.hundred.start = calStart; save(); }
    } else if (!store.hundred.start) {
      store.hundred.start = TODAY_STR; save();
    }
    startInput.value = store.hundred.start;
    const srcEl = $("#hStartSource");
    if (srcEl) {
      if (calStart && store.hundred.startAuto !== false) {
        srcEl.textContent = `当前起点已自动采用「2026 年历」设定的打卡起点（${calStart}）`;
      } else if (calStart) {
        srcEl.textContent = `已手动设定起点（${store.hundred.start}）；若想改回年历打卡起点，请在年历重新点选起始日。`;
      } else {
        srcEl.textContent = "尚未在「2026 年历」设定打卡起点，已默认使用今天；打开「2026 年历」点选起始日即可自动同步。";
      }
    }
    const stats = computeHundredStats();
    renderHundredBanner(stats);
    const board = $("#hundredBoard");
    board.innerHTML = "";
    board.appendChild(blockRewards());
    board.appendChild(blockBodyChanges());
    board.appendChild(blockComparePhotos());
    board.appendChild(blockHundredCalendar(stats));
    board.appendChild(blockReflections());
    board.appendChild(blockExportShare());
    board.appendChild(blockNextSuggest(stats));
    board.appendChild(blockNextHundred());
    wireHundredBoard(board, stats);
  }
  function openHundredPop(dateStr, dayNo) {
    const entry = store.hundred.entries[dateStr] || { text: "", rating: 0 };
    let rating = entry.rating || 0;
    const mask = document.createElement("div");
    mask.className = "hundred-pop";
    mask.innerHTML = `<div class="modal">
      <h3>第 ${dayNo} 天 · ${dateStr}</h3>
      <label>今日收获 / 总结
        <textarea id="hText" class="inp" rows="4" placeholder="记录今天的一点进展…">${esc(entry.text || "")}</textarea></label>
      <label>评分
        <div class="rating" id="hRating">
          ${[1, 2, 3, 4, 5].map((n) => `<span data-n="${n}" class="${n <= rating ? "on" : ""}">★</span>`).join("")}
        </div></label>
      <div class="modal-actions">
        <button class="ghost-btn" id="hDel">删除</button>
        <button class="ghost-btn" id="hClose">取消</button>
        <button class="primary-btn" id="hSave">保存</button>
      </div></div>`;
    document.body.appendChild(mask);
    mask.querySelector("#hRating").addEventListener("click", (e) => {
      if (e.target.dataset.n) {
        rating = Number(e.target.dataset.n);
        mask.querySelectorAll("#hRating span").forEach((s) => s.classList.toggle("on", Number(s.dataset.n) <= rating));
      }
    });
    mask.querySelector("#hSave").addEventListener("click", () => {
      store.hundred.entries[dateStr] = { text: mask.querySelector("#hText").value.trim(), rating };
      save(); mask.remove(); renderHundred();
    });
    mask.querySelector("#hClose").addEventListener("click", () => mask.remove());
    mask.querySelector("#hDel").addEventListener("click", () => {
      delete store.hundred.entries[dateStr]; save(); mask.remove(); renderHundred();
    });
    mask.addEventListener("click", (e) => { if (e.target === mask) mask.remove(); });
  }
  $("#hundredSet").addEventListener("click", () => {
    if ($("#hundredStart").value) {
      store.hundred.start = $("#hundredStart").value;
      store.hundred.startAuto = false; // 用户手动设定，停止自动跟随年历
      save(); renderHundred();
    }
  });

  /* ===================== 导入 / 导出 ===================== */
  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "workbench-backup.json";
    a.click();
  });
  $("#importBtn").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        store = Object.assign(structuredClone(defaultStore), data);
        save();
        renderCalendar(); renderResources(); renderDaily(); renderWeekly(); renderHundred();
        alert("导入成功！");
      } catch (err) { alert("导入失败：文件格式不正确"); }
    };
    reader.readAsText(f);
    e.target.value = "";
  });

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ===================== 情绪治愈盲盒 ===================== */
  function emotionBoxes() { return Array.isArray(store.emotion.boxes) ? store.emotion.boxes : []; }
  function emotionById(id) { return emotionBoxes().find((b) => b.id === id); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function nowHM() { const n = new Date(); return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"); }
  function todayCount(id) { const d = store.emotion.dailyCounts[TODAY_STR]; return d && d[id] ? d[id] : 0; }
  function anyOpenToday() { const d = store.emotion.dailyCounts[TODAY_STR]; return !!(d && Object.keys(d).some((k) => d[k] > 0)); }

  // 防重复抽取：每个情绪维护一个洗牌后的待抽索引队列，抽完一轮再洗牌
  function drawPhrase(box) {
    if (!box.phrases || !box.phrases.length) return "先去设置里给这个盒子写点温暖的话吧～";
    let bag = store.emotion.bag[box.id];
    if (!Array.isArray(bag) || bag.length === 0) {
      bag = shuffle(box.phrases.map((_, i) => i));
      store.emotion.bag[box.id] = bag;
    }
    let idx = bag.pop();
    if (typeof box.phrases[idx] === "undefined") {
      bag = shuffle(box.phrases.map((_, i) => i));
      store.emotion.bag[box.id] = bag;
      idx = bag.pop();
    }
    return box.phrases[idx];
  }

  function recordOpen(id, phrase, box) {
    const d = store.emotion.dailyCounts;
    if (!d[TODAY_STR]) d[TODAY_STR] = {};
    d[TODAY_STR][id] = (d[TODAY_STR][id] || 0) + 1;
    store.emotion.records[TODAY_STR] = {
      emotion: id, icon: box.icon || box.id, emoji: box.emoji, label: box.label, color: box.color, phrase, time: nowHM()
    };
    save();
    renderCalendar();
  }

  function getEmoModal() {
    let mask = document.getElementById("emoModal");
    if (!mask) {
      mask = document.createElement("div");
      mask.className = "modal-mask emotion-modal-mask";
      mask.id = "emoModal";
      mask.hidden = true;
      mask.innerHTML = '<div class="modal emotion-modal" id="emoModalBox"></div>';
      document.body.appendChild(mask);
      mask.addEventListener("click", (e) => { if (e.target === mask) closeEmoModal(); });
    }
    return mask;
  }
  function closeEmoModal() { const m = document.getElementById("emoModal"); if (m) m.hidden = true; }

  function emoToast(msg) {
    let t = document.getElementById("emoToast");
    if (!t) { t = document.createElement("div"); t.id = "emoToast"; t.className = "emo-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function openEmotionBox(id) {
    const box = emotionById(id); if (!box) return;
    const el = $('#emotionInner .blind-box[data-id="' + id + '"]');
    const limit = store.emotion.dailyLimit || 0;
    const cnt = todayCount(id);
    if (limit && cnt >= limit) {
      emoToast("今天这个盒子已经开过 " + limit + " 次啦，明天再来吧～");
      return;
    }
    const phrase = drawPhrase(box);
    recordOpen(id, phrase, box);
    if (el) el.classList.add("opening");
    setTimeout(() => { if (el) el.classList.remove("opening"); showPhraseCard(box, phrase); }, 580);
  }

  function showPhraseCard(box, phrase) {
    const m = getEmoModal();
    const boxEl = m.querySelector("#emoModalBox");
    const rec = store.emotion.records[TODAY_STR];
    const cnt = todayCount(box.id);
    const limit = store.emotion.dailyLimit || 0;
    boxEl.innerHTML =
      '<div class="emo-card" style="--c:' + box.color + '">' +
        '<div class="emo-card-glow"></div>' +
        '<button class="emo-card-close" id="emoCloseX" title="收好啦">×</button>' +
        '<div class="emo-card-emoji">' + emoFaceSVG(box, 52) + '</div>' +
        '<div class="emo-card-label">' + esc(box.label) + '</div>' +
        '<p class="phrase-text">' + esc(phrase) + '</p>' +
        '<div class="emo-card-actions">' +
          '<button class="ghost-btn" id="emoRedraw">再抽一句</button>' +
          '<button class="primary-btn" id="emoDone">收好啦</button>' +
        '</div>' +
        '<div class="emo-card-foot">' + (rec ? ("记录于 " + esc(rec.time)) : "") +
          (limit ? (" · 今日已开 " + cnt + "/" + limit) : "") + '</div>' +
      '</div>';
    m.hidden = false;
    $("#emoCloseX").onclick = () => { closeEmoModal(); renderEmotion(); };
    $("#emoDone").onclick = () => { closeEmoModal(); renderEmotion(); };
    $("#emoRedraw").onclick = () => {
      const c = todayCount(box.id);
      if (limit && c >= limit) { emoToast("今天这个盒子已经开过 " + limit + " 次啦，明天再来吧～"); closeEmoModal(); renderEmotion(); return; }
      closeEmoModal();
      openEmotionBox(box.id);
    };
  }

  function showEmotionRecord(rec) {
    const m = getEmoModal();
    const boxEl = m.querySelector("#emoModalBox");
    boxEl.innerHTML =
      '<div class="emo-card emo-record" style="--c:' + rec.color + '">' +
        '<div class="emo-card-glow"></div>' +
        '<button class="emo-card-close" id="emoRecClose">×</button>' +
        '<div class="emo-rec-date">' + esc(rec.dateStr || "") + '</div>' +
        '<div class="emo-card-emoji">' + emoFaceSVG({ icon: rec.icon, emotion: rec.emotion, color: rec.color, emoji: rec.emoji }, 52) + '</div>' +
        '<div class="emo-card-label">' + esc(rec.label) + '</div>' +
        '<p class="phrase-text">' + esc(rec.phrase) + '</p>' +
        '<div class="emo-card-foot">记录于 ' + esc(rec.time || "") + '</div>' +
        '<div class="emo-card-actions">' +
          '<button class="ghost-btn" id="emoRecDaily">查看日计划 →</button>' +
          '<button class="primary-btn" id="emoRecClose2">知道了</button>' +
        '</div>' +
      '</div>';
    m.hidden = false;
    $("#emoRecClose").onclick = closeEmoModal;
    $("#emoRecClose2").onclick = closeEmoModal;
    $("#emoRecDaily").onclick = () => { closeEmoModal(); openDaily(rec.dateStr); };
  }

  // 手绘风情绪脸（替代 emoji，风格统一更治愈）
  const EMO_ICONS = [
    { k: "happy", label: "开心小猫" }, { k: "sad", label: "难过小猫" }, { k: "wronged", label: "委屈小猫" },
    { k: "anxious", label: "焦虑小猫" }, { k: "tired", label: "疲惫小猫" }, { k: "lost", label: "迷茫小猫" }
  ];
  const EMO_FALLBACK = { happy: "🥰", sad: "🥺", wronged: "🥹", anxious: "😣", tired: "🥱", lost: "🫥" };
  function emoFaceSVG(box, size) {
    size = size || 40;
    const icon = (box && (box.icon || box.id || box.emotion)) || "";
    if (box && box.emoji) {
      return '<span style="font-size:' + Math.round(size * 0.85) + 'px;line-height:1">' + esc(box.emoji) + '</span>';
    }
    const c = esc(box.color || "#f6c453");
    const ink = "#43301f";
    const pink = "#ffb7c5";
    const cx = 24, cy = 26, R = 14.5;
    // 手绘毛绒边缘：沿头部圆周排列的小弧线
    function furPath(cx, cy, R, n) {
      let d = "";
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const a1 = a - 0.09;
        const a2 = a + 0.09;
        const r1 = R + Math.sin(i * 7.3) * 0.6;
        const r2 = R + Math.cos(i * 5.1) * 0.6;
        const x1 = cx + Math.cos(a1) * r1;
        const y1 = cy + Math.sin(a1) * r1;
        const x2 = cx + Math.cos(a2) * r2;
        const y2 = cy + Math.sin(a2) * r2;
        const mx = cx + Math.cos(a) * (R - 1.4);
        const my = cy + Math.sin(a) * (R - 1.4);
        d += "M" + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1) + " ";
      }
      return d;
    }
    const fur = '<path d="' + furPath(cx, cy, R, 32) + '" fill="none" stroke="' + ink + '" stroke-width="1.5" stroke-linecap="round"/>';
    // 耳朵外（情绪色）+ 内耳（粉色）+ 内耳纹理
    const ears =
      '<path d="M11.5 17.5 L9 3 L22.5 13 Z" fill="' + c + '" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M36.5 17.5 L39 3 L25.5 13 Z" fill="' + c + '" stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M14 14 L12.5 6.5 L19.5 12.5 Z" fill="' + pink + '"/>' +
      '<path d="M34 14 L35.5 6.5 L28.5 12.5 Z" fill="' + pink + '"/>' +
      '<path d="M13.5 10 Q15 13 17.5 13.5" fill="none" stroke="' + ink + '" stroke-width=".9" stroke-linecap="round" opacity=".5"/>' +
      '<path d="M34.5 10 Q33 13 30.5 13.5" fill="none" stroke="' + ink + '" stroke-width=".9" stroke-linecap="round" opacity=".5"/>';
    const head = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#fff" stroke="' + ink + '" stroke-width="1.6"/>';
    const brows =
      '<path d="M14 18 Q17 15 20 18" fill="none" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M28 18 Q31 15 34 18" fill="none" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round"/>';
    const blush = '<g fill="' + c + '" opacity=".22"><ellipse cx="13" cy="32" rx="3.6" ry="2.3"/><ellipse cx="35" cy="32" rx="3.6" ry="2.3"/></g>';
    const nose = '<ellipse cx="24" cy="30.5" rx="1.8" ry="1.3" fill="' + pink + '" stroke="' + ink + '" stroke-width=".9"/>';
    const mouth = '<path d="M24 32 L24 34 M24 34 L21.5 36 M24 34 L26.5 36" fill="none" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>';
    const whiskers = '<g stroke="' + ink + '" stroke-width="1.1" stroke-linecap="round" opacity=".65">' +
      '<path d="M9 30 L4 28"/><path d="M9 33 L3.5 33"/>' +
      '<path d="M39 30 L44 28"/><path d="M39 33 L44.5 33"/></g>';
    const eye = (ex, r) =>
      '<circle cx="' + ex + '" cy="27" r="' + r + '" fill="' + ink + '"/>' +
      '<circle cx="' + (ex - r * 0.35) + '" cy="' + (27 - r * 0.38) + '" r="' + (r * 0.32) + '" fill="#fff"/>';
    let face = "", cue = "";
    if (icon === "happy") {
      face = '<path d="M13 27 Q17 22 21 27" fill="none" stroke="' + ink + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M27 27 Q31 22 35 27" fill="none" stroke="' + ink + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M19 34 Q24 39 29 34" fill="none" stroke="' + ink + '" stroke-width="1.9" stroke-linecap="round"/>';
    } else if (icon === "sad") {
      face = eye(17, 3.2) + eye(31, 3.2) +
        '<path d="M20 36 Q24 33 28 36" fill="none" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>';
      cue = '<path d="M12 28 Q9.5 33 12.5 38 Q15.5 33 14 28 Z" fill="#7fb4e8" stroke="' + ink + '" stroke-width="1.1"/>';
    } else if (icon === "wronged") {
      face = eye(17, 2.9) + eye(31, 2.9) +
        '<path d="M13.5 20 L19 23.5" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M34.5 20 L29 23.5" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M21 36 Q24 34 27 36" fill="none" stroke="' + ink + '" stroke-width="1.8" stroke-linecap="round"/>';
      cue = '<path d="M30 28 Q27.5 33 30.5 38.5 Q33.5 33 32 28 Z" fill="#9bc4ea" stroke="' + ink + '" stroke-width="1.1"/>';
    } else if (icon === "anxious") {
      face = eye(17, 3.4) + eye(31, 3.4) +
        '<path d="M11 18 Q17 15 21 18" fill="none" stroke="' + ink + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M27 18 Q31 15 37 18" fill="none" stroke="' + ink + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M17 36 Q20 33.5 24 36 Q28 33.5 31 36" fill="none" stroke="' + ink + '" stroke-width="1.7" stroke-linecap="round"/>';
      cue = '<path d="M41 9 Q44 15 41 19 Q38 15 41 9 Z" fill="#7fb4e8" stroke="' + ink + '" stroke-width="1.1"/>';
    } else if (icon === "tired") {
      face = '<path d="M13 27 Q17 30.5 21 27" fill="none" stroke="' + ink + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M27 27 Q31 30.5 35 27" fill="none" stroke="' + ink + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<ellipse cx="24" cy="36" rx="2.8" ry="3.2" fill="' + ink + '"/>';
      cue = '<text x="36" y="15" font-size="9" fill="#88b89a" font-family="serif" font-style="italic">Z</text>';
    } else if (icon === "lost") {
      face = '<circle cx="18.5" cy="27" r="1.8" fill="' + ink + '"/><circle cx="29.5" cy="27" r="1.8" fill="' + ink + '"/>' +
        '<path d="M17 36 Q20 33.5 24 36 Q28 33.5 31 36" fill="none" stroke="' + ink + '" stroke-width="1.7" stroke-linecap="round"/>';
      cue = '<text x="35" y="15" font-size="12" fill="' + ink + '" font-family="serif" font-style="italic">?</text>';
    } else {
      face = eye(17, 3) + eye(31, 3) + mouth;
    }
    return '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '" aria-hidden="true" style="display:block">' +
      ears + head + fur + brows + whiskers + blush + nose + face + cue + '</svg>';
  }

  function renderEmotion() {
    const root = $("#emotionInner"); if (!root) return;
    const openedToday = anyOpenToday();
    let html = "";
    if (!openedToday) {
      html += '<div class="emo-reminder">🌿 今天需要一点治愈吗？选一个盒子打开吧～</div>';
    }
    html += '<div class="emo-top">' +
      '<div class="emo-top-tip">轻轻点一下盲盒，让今天的情绪被温柔接住</div>' +
      '<button class="ghost-btn" id="emoSettingsBtn">⚙ 管理情绪与话语</button>' +
      '</div>';
    html += '<div class="blind-grid">';
    emotionBoxes().forEach((b) => {
      const cnt = todayCount(b.id);
      const limit = store.emotion.dailyLimit || 0;
      const full = limit && cnt >= limit;
      html += '<button class="blind-box' + (full ? " is-full" : "") + '" data-id="' + b.id + '" style="--c:' + b.color + '">' +
        '<span class="blind-ribbon"></span>' +
        '<span class="blind-label">' + emoFaceSVG(b, 17) + '<span class="blind-label-txt">' + esc(b.label) + '</span></span>' +
        '<span class="blind-shape">' +
          '<span class="blind-lid"></span>' +
          '<span class="blind-base"></span>' +
          '<span class="blind-face">' + emoFaceSVG(b, 36) + '</span>' +
          '<span class="blind-peek" aria-hidden="true">' + emoFaceSVG(b, 42) + '</span>' +
        '</span>' +
        '<span class="blind-count">' + (limit ? ("今日 " + cnt + "/" + limit) : ("今日 " + cnt)) + '</span>' +
        '</button>';
    });
    html += '</div>';
    root.innerHTML = html;
    $("#emoSettingsBtn").onclick = renderEmotionSettings;
    root.querySelectorAll(".blind-box").forEach((el) => {
      el.addEventListener("click", () => openEmotionBox(el.dataset.id));
    });
  }

  function renderEmotionSettings() {
    const m = getEmoModal();
    const box = m.querySelector("#emoModalBox");
    box.innerHTML =
      '<div class="emo-set">' +
        '<div class="emo-set-head"><h3>管理情绪与话语</h3><button class="emo-card-close" id="emoSetClose">×</button></div>' +
        '<p class="emo-set-sub">编辑每种情绪的话语库，或新增情绪盲盒。改动即时自动保存。</p>' +
        '<div id="emoSetList" class="emo-set-list"></div>' +
        '<div class="emo-set-add">' +
          '<div class="emo-add-title">➕ 新增情绪盲盒</div>' +
          '<div class="emo-add-row">' +
            '<select class="inp" id="newIcon" style="width:120px">' +
              EMO_ICONS.map((o) => '<option value="' + o.k + '">' + o.label + '</option>').join("") +
            '</select>' +
            '<input class="inp" id="newLabel" placeholder="标签，如 平静" />' +
            '<input type="color" id="newColor" value="#f6c453" class="emo-color" />' +
          '</div>' +
          '<textarea class="inp" id="newPhrases" rows="3" placeholder="治愈话语，每行一句（建议 30 字内）"></textarea>' +
          '<button class="primary-btn" id="newEmotionAdd">添加情绪</button>' +
        '</div>' +
      '</div>';
    m.hidden = false;
    $("#emoSetClose").onclick = closeEmoModal;
    renderEmotionSetList();
    $("#newEmotionAdd").onclick = () => {
      const icon = $("#newIcon").value;
      const label = $("#newLabel").value.trim();
      const color = $("#newColor").value;
      const phrases = $("#newPhrases").value.split("\n").map((s) => s.trim()).filter(Boolean);
      if (!label) { emoToast("请填写情绪标签"); return; }
      if (!phrases.length) { emoToast("请至少写一句话语"); return; }
      store.emotion.boxes.push({ id: "emo_" + uid(), icon, emoji: EMO_FALLBACK[icon] || "🫘", label, color, phrases });
      save();
      $("#newLabel").value = ""; $("#newPhrases").value = "";
      renderEmotionSetList(); renderEmotion();
    };
  }

  function renderEmotionSetList() {
    const list = $("#emoSetList"); if (!list) return;
    list.innerHTML = emotionBoxes().map((b, bi) => {
      const phraseRows = b.phrases.map((p, pi) =>
        '<div class="emo-phrase-row" data-bi="' + bi + '" data-pi="' + pi + '">' +
          '<input class="inp emo-phrase-inp" value="' + esc(p) + '" data-bi="' + bi + '" data-pi="' + pi + '" />' +
          '<button class="emo-phrase-del" data-bi="' + bi + '" data-pi="' + pi + '" title="删除这句">×</button>' +
        '</div>').join("");
      return '<div class="emo-set-item" data-bi="' + bi + '">' +
        '<div class="emo-set-item-head" style="--c:' + b.color + '">' +
          '<span class="emo-ico-prev">' + emoFaceSVG(b, 26) + '</span>' +
          '<select class="inp emo-icon-sel" data-bi="' + bi + '">' +
            EMO_ICONS.map((o) => '<option value="' + o.k + '"' + (b.icon === o.k ? " selected" : "") + '>' + o.label + '</option>').join("") +
          '</select>' +
          '<input class="inp emo-label-inp" value="' + esc(b.label) + '" data-bi="' + bi + '" placeholder="标签" />' +
          '<input type="color" class="emo-color" value="' + esc(b.color) + '" data-bi="' + bi + '" />' +
          '<button class="emo-set-del" data-bi="' + bi + '" title="删除该情绪">删除</button>' +
        '</div>' +
        '<div class="emo-phrases">' + phraseRows +
          '<button class="emo-phrase-add" data-bi="' + bi + '">＋ 添加一句</button>' +
        '</div>' +
      '</div>';
    }).join("");
    list.querySelectorAll(".emo-icon-sel").forEach((sel) => sel.onchange = () => {
      const bi = +sel.dataset.bi, k = sel.value;
      const b = store.emotion.boxes[bi];
      b.icon = k; b.emoji = EMO_FALLBACK[k] || b.emoji;
      save(); renderEmotionSetList(); renderEmotion();
    });
    list.querySelectorAll(".emo-label-inp").forEach((inp) => inp.oninput = () => { store.emotion.boxes[+inp.dataset.bi].label = inp.value; save(); });
    list.querySelectorAll(".emo-color").forEach((inp) => inp.oninput = () => { store.emotion.boxes[+inp.dataset.bi].color = inp.value; save(); });
    list.querySelectorAll(".emo-phrase-inp").forEach((inp) => inp.oninput = () => { store.emotion.boxes[+inp.dataset.bi].phrases[+inp.dataset.pi] = inp.value; save(); });
    list.querySelectorAll(".emo-phrase-del").forEach((btn) => btn.onclick = () => {
      const bi = +btn.dataset.bi, pi = +btn.dataset.pi;
      store.emotion.boxes[bi].phrases.splice(pi, 1);
      save(); renderEmotionSetList(); renderEmotion();
    });
    list.querySelectorAll(".emo-phrase-add").forEach((btn) => btn.onclick = () => {
      const bi = +btn.dataset.bi;
      store.emotion.boxes[bi].phrases.push("新的治愈话语");
      save(); renderEmotionSetList(); renderEmotion();
    });
    list.querySelectorAll(".emo-set-del").forEach((btn) => btn.onclick = () => {
      const bi = +btn.dataset.bi;
      if (emotionBoxes().length <= 1) { emoToast("至少保留一种情绪"); return; }
      const delId = store.emotion.boxes[bi].id;
      store.emotion.boxes.splice(bi, 1);
      delete store.emotion.bag[delId];
      save(); renderEmotionSetList(); renderEmotion();
    });
  }

  /* ---------- 初始化 ---------- */
  $("#brandDate").textContent = "2026";
  $("#dailyDate").value = TODAY_STR;
  renderCalendar();
  renderResources();
  renderDaily();
  renderWeekly();
  renderHundred();

  // 暴露最小接口给宠物模块（pet.js）
  window.WB = {
    get store() { return store; },
    save, parse, fmt, addDays, isWeekChecked, TODAY_STR
  };
})();
