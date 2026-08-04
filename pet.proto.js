/* ===================== 宠物之家 pet.js ===================== */
(function () {
  "use strict";
  const WB = window.WB;
  if (!WB) { console.error("WB 未就绪，宠物模块加载失败"); return; }
  const { store, save, parse, fmt, addDays, isWeekChecked } = WB;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 配置 ---------- */
  const STAGES = {
    baby:     { label: "幼崽期", need: 7,  desc: "圆滚滚的小团子，刚来到你身边" },
    growing:  { label: "成长期", need: 21, desc: "羽毛渐丰，开始陪你一起变美" },
    guardian: { label: "守护期", need: null, desc: "成熟可靠的守护者，一直陪着你" }
  };
  const ACCESSORIES = [
    { id: "scarf", label: "小围巾",   need: 7,  desc: "连续打卡 7 天解锁" },
    { id: "stars", label: "星星眼影", need: 21, desc: "连续打卡 21 天解锁" }
  ];
  const FULL_DECAY = 20;   // 每天饱食度衰减
  const FEED_GAIN = 30;    // 喂食增加饱食度

  /* ---------- 工具 ---------- */
  const P = () => store.pet;
  function todayStr() { const d = new Date(); d.setHours(0, 0, 0, 0); return fmt(d); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function accLabel(id) { const a = ACCESSORIES.find((x) => x.id === id); return a ? a.label : id; }
  function stageLabel() { return STAGES[P().stage] ? STAGES[P().stage].label : "幼崽期"; }

  /* ---------- 核心逻辑 ---------- */
  // 每日饱食度衰减
  function applyDailyDecay() {
    const p = P();
    const today = todayStr();
    if (!p.lastDecayDate) { p.lastDecayDate = today; save(); return; }
    if (p.lastDecayDate === today) return;
    const days = Math.round((parse(today) - parse(p.lastDecayDate)) / 86400000);
    if (days > 0) {
      p.fullness = clamp(p.fullness - FULL_DECAY * days, 0, 100);
      p.lastDecayDate = today;
      save();
    }
  }

  // 成长阶段（按累计打卡）
  function recomputeStage() {
    const n = P().totalCheckins || 0;
    P().stage = n >= 21 ? "guardian" : n >= 7 ? "growing" : "baby";
  }
  // 饰品解锁（按连续打卡）
  function recomputeAccessories() {
    const s = P().streak || 0;
    const acc = P().accessories || [];
    ACCESSORIES.forEach((a) => { if (s >= a.need && !acc.includes(a.id)) acc.push(a.id); });
    P().accessories = acc;
  }

  // 打卡钩子：完成一次每日打卡触发
  function onCheckin(dateStr, checked) {
    if (!checked) return;
    const p = P();
    if (p.lastCheckinRewardDate === dateStr) return; // 同一天只结算一次
    p.lastCheckinRewardDate = dateStr;
    p.food = (p.food || 0) + 1;                       // 每日打卡 → 1 份食物
    p.totalCheckins = (p.totalCheckins || 0) + 1;

    // 连续打卡计算
    if (p.lastCheckinDate == null) p.streak = 1;
    else if (p.lastCheckinDate !== dateStr) {
      const diff = Math.round((parse(dateStr) - parse(p.lastCheckinDate)) / 86400000);
      p.streak = (diff === 1) ? (p.streak || 0) + 1 : 1;
    }
    p.lastCheckinDate = dateStr;

    // 陪伴天数（亲密度）+1（每天一次）
    if (p.intimacyDate !== dateStr) { p.intimacy = (p.intimacy || 0) + 1; p.intimacyDate = dateStr; }

    const beforeStage = p.stage;
    const beforeAcc = (p.accessories || []).slice();
    recomputeStage();
    recomputeAccessories();
    save();

    floatToast("🍖 打卡 +1 食物");
    if (p.stage !== beforeStage) floatToast("✨ 成长到「" + STAGES[p.stage].label + "」！");
    (p.accessories || []).forEach((id) => { if (!beforeAcc.includes(id)) floatToast("🎀 解锁饰品：" + accLabel(id)); });

    if (dateStr === todayStr()) celebrate();
    renderHomeIfVisible();
  }

  // 喂食
  function feed() {
    const p = P();
    if ((p.food || 0) <= 0) { floatToast("没有食物啦，去打卡领取 🍖"); return; }
    p.food -= 1;
    p.fullness = clamp(p.fullness + FEED_GAIN, 0, 100);
    save();
    renderHomeIfVisible();
    floatToast("😋 吃饱啦 +" + FEED_GAIN);
    bounce();
  }

  // 抚摸（点击）
  function petPet() {
    const p = P();
    p.intimacy = (p.intimacy || 0) + 1;
    save();
    rub();
    floatToast("💗 蹭蹭~");
    const big = $("#petBig");
    if (big) { big.classList.remove("pet-rub"); void big.offsetWidth; big.classList.add("pet-rub"); setTimeout(() => big && big.classList.remove("pet-rub"), 900); }
    renderHomeIfVisible();
  }
  // 抚摸（滑动，轻量：只蹭蹭、不弹提示）
  function petPetLight() {
    const p = P();
    p.intimacy = (p.intimacy || 0) + 1;
    save();
    rub();
    const big = $("#petBig");
    if (big) { big.classList.remove("pet-rub"); void big.offsetWidth; big.classList.add("pet-rub"); setTimeout(() => big && big.classList.remove("pet-rub"), 900); }
  }

  // 晚 8 点提醒
  function reminderCheck() {
    const d = new Date();
    if (d.getHours() >= 20) {
      const today = todayStr();
      if (!isWeekChecked(today) && P().reminderDate !== today) {
        showBubble("今天还没运动哦，要加油呀！💪");
        P().reminderDate = today; save();
      }
    }
  }

  /* ---------- 渲染：宠物 SVG ---------- */
  function petSVG(opts) {
    opts = opts || {};
    const stage = opts.stage || "baby";
    const acc = opts.accessories || [];
    const big = opts.big ? " big" : "";
    const cls = ["pet-svg", "stage-" + stage];
    if (acc.includes("scarf")) cls.push("has-scarf");
    if (acc.includes("stars")) cls.push("has-stars");
    if (stage === "guardian") cls.push("is-guardian");
    const ink = "#43301f";
    const pink = "#f4a4b0";
    const padPink = "#f9d6dc";
    const eyeGreen = "#6aa89d";
    const eyeDark = "#1f3d36";
    const shadow = "#e5e0da";
    // 阶段大小差异：通过整体缩放实现
    let scale = 1;
    if (stage === "baby") scale = 0.9;
    if (stage === "guardian") scale = 1.06;
    const transform = scale !== 1 ? ' transform="translate(' + (70 * (1 - scale)).toFixed(1) + ' ' + (80 * (1 - scale)).toFixed(1) + ') scale(' + scale + ')"' : '';
    // 卷毛纹理 helper（用于头部和身体表面）
    function curls(d, stroke, width, op) {
      return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + width + '" stroke-linecap="round" opacity="' + op + '"/>';
    }
    const bodyCurls = curls('M36 90 Q46 80 56 90 T76 90 T96 90 T112 90 M40 104 Q52 94 64 104 T88 104 T108 104 M50 118 Q62 110 74 118 T98 118', shadow, 2.2, .45);
    const headCurls = curls('M44 36 Q54 28 64 36 T84 36 T98 36 M48 26 Q56 20 64 26 T80 26 M40 48 Q50 40 60 48 T80 48 T94 48', shadow, 1.6, .4);
    return (
      '<svg class="' + cls.join(" ") + big + '" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<g class="pet-g"' + transform + '>' +
          // 尾巴（蓬松卷曲）
          '<path class="pet-tail" d="M102 96 C132 92 134 58 112 52 C128 72 116 90 98 90" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>' +
          '<path class="pet-tail" d="M102 96 C132 92 134 58 112 52 C128 72 116 90 98 90" fill="none" stroke="' + shadow + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>' +
          // 后肢/身体蓬松底层
          '<ellipse cx="70" cy="108" rx="48" ry="36" fill="#fff" stroke="' + shadow + '" stroke-width="1.4"/>' +
          '<ellipse cx="70" cy="100" rx="38" ry="28" fill="#fdfbf9" stroke="none"/>' +
          bodyCurls +
          // 右前爪（放下）
          '<ellipse cx="92" cy="120" rx="12" ry="8" fill="#fff" stroke="' + shadow + '" stroke-width="1.4"/>' +
          '<ellipse cx="92" cy="121" rx="7" ry="4" fill="' + padPink + '" opacity=".6"/>' +
          // 头部
          '<circle cx="70" cy="54" r="34" fill="#fff" stroke="' + shadow + '" stroke-width="1.4"/>' +
          headCurls +
          // 耳朵外
          '<path d="M40 44 L34 10 L62 38 Z" fill="#fff" stroke="' + shadow + '" stroke-width="1.6" stroke-linejoin="round"/>' +
          '<path d="M100 44 L106 10 L78 38 Z" fill="#fff" stroke="' + shadow + '" stroke-width="1.6" stroke-linejoin="round"/>' +
          // 耳朵内
          '<path d="M44 38 L41 18 L55 35 Z" fill="' + pink + '"/>' +
          '<path d="M96 38 L99 18 L85 35 Z" fill="' + pink + '"/>' +
          // 额头卷毛
          '<path d="M48 28 Q54 20 62 28 M78 28 Q86 20 92 28 M60 22 Q70 16 80 22" fill="none" stroke="' + shadow + '" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>' +
          // 腮红
          '<ellipse class="pet-blush" cx="48" cy="74" rx="6" ry="3.5" fill="#f9c4cc" opacity=".45"/>' +
          '<ellipse class="pet-blush" cx="92" cy="74" rx="6" ry="3.5" fill="#f9c4cc" opacity=".45"/>' +
          // 眼睛（睁）—— 蓝绿色大眼
          '<g class="pet-eyes-open">' +
            '<circle cx="56" cy="56" r="7" fill="#fff" stroke="' + ink + '" stroke-width="1.2"/>' +
            '<circle cx="84" cy="56" r="7" fill="#fff" stroke="' + ink + '" stroke-width="1.2"/>' +
            '<circle cx="56" cy="56" r="4.6" fill="' + eyeGreen + '"/>' +
            '<circle cx="84" cy="56" r="4.6" fill="' + eyeGreen + '"/>' +
            '<circle cx="56" cy="56" r="2.6" fill="' + eyeDark + '"/>' +
            '<circle cx="84" cy="56" r="2.6" fill="' + eyeDark + '"/>' +
            '<circle cx="58" cy="54" r="1.7" fill="#fff"/>' +
            '<circle cx="86" cy="54" r="1.7" fill="#fff"/>' +
          '</g>' +
          // 眼睛（闭/睡）
          '<g class="pet-eyes-closed">' +
            '<path d="M49 58 Q56 64 63 58" stroke="' + ink + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
            '<path d="M77 58 Q84 64 91 58" stroke="' + ink + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
          '</g>' +
          // 鼻子 + 嘴
          '<path d="M70 68 L66 72 H74 Z" fill="' + pink + '" stroke="' + ink + '" stroke-width=".9" stroke-linejoin="round"/>' +
          '<path d="M70 72 L70 76 M70 76 L66 79 M70 76 L74 79" stroke="' + ink + '" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          // 胡须
          '<g stroke="' + ink + '" stroke-width="1.1" stroke-linecap="round" opacity=".5">' +
            '<path d="M40 70 L28 66"/><path d="M40 74 L26 74"/>' +
            '<path d="M100 70 L112 66"/><path d="M100 74 L114 74"/>' +
          '</g>' +
          // 左前爪（抬起，露出肉垫）
          '<g>' +
            '<ellipse cx="44" cy="94" rx="13" ry="15" fill="#fff" stroke="' + shadow + '" stroke-width="1.4" transform="rotate(-22 44 94)"/>' +
            '<ellipse cx="44" cy="98" rx="6" ry="5" fill="' + padPink + '" opacity=".75" transform="rotate(-22 44 98)"/>' +
            '<circle cx="41" cy="96" r="1.6" fill="' + pink + '"/>' +
            '<circle cx="47" cy="96" r="1.6" fill="' + pink + '"/>' +
            '<circle cx="44" cy="101" r="1.6" fill="' + pink + '"/>' +
          '</g>' +
          // 饰品：小围巾
          '<g class="pet-acc-scarf">' +
            '<path d="M46 104 Q70 118 94 104 L94 113 Q70 127 46 113 Z" fill="#e76f8a"/>' +
            '<rect x="58" y="110" width="10" height="22" rx="4" fill="#e76f8a"/>' +
          '</g>' +
          // 饰品：星星眼影
          '<g class="pet-acc-stars">' +
            '<path d="M40 38 l2.2 4.4 4.4 2.2 -4.4 2.2 -2.2 4.4 -2.2 -4.4 -4.4 -2.2 4.4 -2.2 z" fill="#ffd35e"/>' +
            '<path d="M100 38 l2.2 4.4 4.4 2.2 -4.4 2.2 -2.2 4.4 -2.2 -4.4 -4.4 -2.2 4.4 -2.2 z" fill="#ffd35e"/>' +
          '</g>' +
          // 守护期皇冠
          '<g class="pet-crown">' +
            '<path d="M56 26 L60 14 L70 24 L80 14 L84 26 Z" fill="#ffd35e" stroke="#e0a93b" stroke-width="1.5"/>' +
            '<circle cx="70" cy="18" r="2.4" fill="#e76f8a"/>' +
          '</g>' +
          // 睡觉 Zzz
          '<g class="pet-zzz"><text x="98" y="46" font-size="13" fill="#9a8">z</text><text x="106" y="36" font-size="16" fill="#9a8">Z</text></g>' +
        '</g>' +
      '</svg>'
    );
  }

  /* ---------- 悬浮窗 ---------- */
  let avatarEl, bubbleEl, toastEl, floatEl;
  function renderFloat() {
    floatEl = $("#petFloat");
    if (!floatEl) {
      floatEl = document.createElement("div");
      floatEl.id = "petFloat";
      floatEl.className = "pet-float";
      floatEl.innerHTML =
        '<div class="pet-bubble" id="petBubble" hidden></div>' +
        '<div class="pet-toast" id="petToast" hidden></div>' +
        '<div class="pet-avatar a-idle" id="petAvatar">' + petSVG({ stage: P().stage, accessories: P().accessories }) + "</div>";
      document.body.appendChild(floatEl);
    }
    avatarEl = $("#petAvatar");
    bubbleEl = $("#petBubble");
    toastEl = $("#petToast");
    // 点击 / 滑动宠物 = 抚摸
    avatarEl.addEventListener("click", petPet);
    let _lastRub = 0;
    const swipeRub = () => { const now = Date.now(); if (now - _lastRub > 1200) { _lastRub = now; petPetLight(); } };
    avatarEl.addEventListener("mousemove", swipeRub);
    avatarEl.addEventListener("touchmove", swipeRub, { passive: true });
    // 刷新宠物外观（阶段/饰品变化时）
    refreshFloatLook();
    startIdleLoop();
  }
  function refreshFloatLook() {
    if (!avatarEl) return;
    const old = avatarEl.querySelector("svg");
    if (old) old.outerHTML = petSVG({ stage: P().stage, accessories: P().accessories });
    else avatarEl.innerHTML = petSVG({ stage: P().stage, accessories: P().accessories });
  }

  // 空闲随机动作
  let idleTimer = null;
  function startIdleLoop() {
    if (idleTimer) clearTimeout(idleTimer);
    function loop() {
      const acts = ["walk", "sleep", "paw", "idle"];
      const a = acts[Math.floor(Math.random() * acts.length)];
      setAct(a);
      const dur = a === "sleep" ? 4200 : a === "idle" ? 2600 : 3200;
      idleTimer = setTimeout(() => { setAct("idle"); idleTimer = setTimeout(loop, 900 + Math.random() * 1400); }, dur);
    }
    idleTimer = setTimeout(loop, 1200);
  }
  function setAct(a) {
    if (!avatarEl) return;
    avatarEl.classList.remove("a-walk", "a-sleep", "a-paw", "a-idle");
    avatarEl.classList.add("a-" + a);
    const svg = avatarEl.querySelector("svg");
    if (svg) svg.classList.toggle("is-sleep", a === "sleep");
  }

  // 一次性动画
  function celebrate() { oneShot("a-celebrate", 1300); showBubble("打卡完成，一起加油！🎉"); }
  function rub() { oneShot("a-rub", 900); }
  function bounce() { oneShot("a-bounce", 700); }
  function oneShot(cls, ms) {
    if (!avatarEl) return;
    avatarEl.classList.remove(cls);
    void avatarEl.offsetWidth; // 重启动画
    avatarEl.classList.add(cls);
    setTimeout(() => avatarEl && avatarEl.classList.remove(cls), ms);
  }

  // 气泡 / Toast
  function showBubble(text) {
    if (!bubbleEl) return;
    bubbleEl.textContent = text;
    bubbleEl.hidden = false;
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(() => { bubbleEl.hidden = true; }, 8000);
  }
  function floatToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.hidden = false;
    toastEl.classList.add("show");
    clearTimeout(floatToast._t);
    floatToast._t = setTimeout(() => { toastEl.classList.remove("show"); toastEl.hidden = true; }, 1700);
  }

  /* ---------- 宠物之家页面 ---------- */
  function renderHome() {
    const root = $("#petHomeInner");
    if (!root) return;
    const p = P();
    const isNight = (function () { const h = new Date().getHours(); return h < 6 || h >= 18; })();
    const foodIcons = (function () {
      const n = Math.min(p.food || 0, 12);
      let s = "";
      for (let i = 0; i < n; i++) s += '<span class="food-dot">🍖</span>';
      if ((p.food || 0) > 12) s += '<span class="food-more">+' + ((p.food) - 12) + "</span>";
      if (n === 0) s = '<span class="food-empty">还没有食物，去每日打卡领取吧～</span>';
      return s;
    })();
    const stageKeys = ["baby", "growing", "guardian"];
    const curIdx = stageKeys.indexOf(p.stage);
    const stageDots = stageKeys.map((k, i) =>
      '<span class="stage-dot ' + (i === curIdx ? "on" : i < curIdx ? "done" : "") + '">' + STAGES[k].label + "</span>"
    ).join('<span class="stage-line"></span>');
    const accHtml = ACCESSORIES.map((a) => {
      const got = (p.accessories || []).includes(a.id);
      return '<div class="acc-card ' + (got ? "got" : "locked") + '">' +
        '<div class="acc-ico">' + (a.id === "scarf" ? "🧣" : "✨") + "</div>" +
        '<div class="acc-name">' + a.label + "</div>" +
        '<div class="acc-desc">' + (got ? "已解锁" : a.desc) + "</div>" +
        "</div>";
    }).join("");

    root.innerHTML =
      // 舞台
      '<div class="pet-stage ' + (isNight ? "night" : "day") + '">' +
        '<div class="pet-stage-sky"></div>' +
        '<div class="pet-stage-ground"></div>' +
        '<div class="pet-big" id="petBig">' + petSVG({ stage: p.stage, accessories: p.accessories, big: true }) + "</div>" +
        '<div class="pet-name-tag">' + esc(p.name) + " · " + stageLabel() + "</div>" +
        (isNight ? '<div class="pet-moon">🌙</div>' : '<div class="pet-sun">☀️</div>') +
      "</div>" +

      // 状态栏
      '<div class="pet-stats">' +
        statBar("饱食度", p.fullness, 100, p.fullness + " / 100", "full") +
        statBar("亲密度（陪伴 " + (p.intimacy || 0) + " 天）", Math.min(p.intimacy || 0, 100), 100, (p.intimacy || 0) + "", "love") +
        '<div class="pet-stat stage-stat">' +
          '<div class="pet-stat-head"><span>成长阶段</span><span class="pet-stat-val">' + stageLabel() + "</span></div>" +
          '<div class="stage-track">' + stageDots + "</div>" +
          '<div class="pet-stat-sub">累计打卡 ' + (p.totalCheckins || 0) + " 天 · 连续 " + (p.streak || 0) + " 天</div>" +
        "</div>" +
      "</div>" +

      // 食物仓 + 喂食
      '<div class="pet-panel">' +
        '<div class="pet-panel-title">🍖 食物仓（' + (p.food || 0) + " 份）</div>" +
        '<div class="pet-food-row">' + foodIcons + "</div>" +
        '<div class="pet-feed-row">' +
          '<button class="primary-btn" id="petFeed">喂食（+30 饱食度）</button>' +
          '<span class="pet-feed-hint">每完成 1 次每日打卡，自动获得 1 份食物</span>' +
        "</div>" +
      "</div>" +

      // 装扮间
      '<div class="pet-panel">' +
        '<div class="pet-panel-title">🎀 装扮间</div>' +
        '<div class="pet-acc-row">' + accHtml + "</div>" +
        '<div class="pet-feed-hint">连续打卡 7 天解锁「小围巾」，连续打卡 21 天解锁「星星眼影」</div>' +
      "</div>" +

      // 互动提示
      '<div class="pet-tip">💡 点一下右下角的小团子可以抚摸它；每天 20:00 前别忘打卡，它会提醒你哦～</div>';

    // 大宠物也可抚摸
    const big = $("#petBig");
    if (big) big.addEventListener("click", petPet);
    const feedBtn = $("#petFeed");
    if (feedBtn) feedBtn.addEventListener("click", feed);
  }
  function statBar(title, val, max, text, kind) {
    const pct = clamp(Math.round((val / max) * 100), 0, 100);
    return '<div class="pet-stat">' +
      '<div class="pet-stat-head"><span>' + title + '</span><span class="pet-stat-val">' + text + "</span></div>" +
      '<div class="pet-bar"><div class="pet-bar-fill ' + kind + '" style="width:' + pct + '%"></div></div>' +
      "</div>";
  }
  function renderHomeIfVisible() {
    if ($("#view-pet") && $("#view-pet").classList.contains("active")) renderHome();
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

  /* ---------- 初始化 ---------- */
  function init() {
    applyDailyDecay();
    renderFloat();
    reminderCheck();
    setInterval(reminderCheck, 60 * 1000);
  }

  // 暴露给 app.js 调用
  window.Pet = { renderHome, onCheckin };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
