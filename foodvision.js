/* 本地食物识别引擎（无需任何外部 API）
 * - 用浏览器内 TensorFlow.js 加载本地 MobileNet 模型（models/mobilenet）
 * - 用本地营养库 foods.json 估算热量 + 宏量
 * - 照片不出本机、不联网
 */
(function () {
  let model = null, loading = null, foods = null;
  const classes = () => (window.IMAGENET_CLASSES || null);

  async function loadFoods() {
    if (foods) return foods;
    const r = await fetch("foods.json");
    const j = await r.json();
    foods = j.foods || j;
    return foods;
  }

  async function loadModel() {
    if (model) return model;
    if (loading) return loading;
    loading = (async () => {
      if (typeof tf === "undefined") throw new Error("TensorFlow.js 未加载");
      await tf.ready();
      model = await tf.loadLayersModel("models/mnet/model.json");
      return model;
    })();
    return loading;
  }

  function preprocess(imgEl) {
    const c = document.createElement("canvas");
    c.width = 224; c.height = 224;
    const x = c.getContext("2d");
    x.drawImage(imgEl, 0, 0, 224, 224);
    const t = tf.browser.fromPixels(c).toFloat().div(127.5).sub(1);
    return t.expandDims(0);
  }

  function softmax(arr) {
    const m = Math.max.apply(null, arr);
    const e = arr.map((v) => Math.exp(v - m));
    const s = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / s);
  }

  // 对一张已加载的 <img> 做分类，返回 topK 个 {className, prob}
  async function classify(imgEl, topK) {
    topK = topK || 6;
    const m = await loadModel();
    const input = preprocess(imgEl);
    const out = m.predict(input);
    const data = await out.data();
    out.dispose(); input.dispose();
    const order = Array.from(data.keys())
      .map((i) => ({ i, v: data[i] }))
      .sort((a, b) => b.v - a.v)
      .slice(0, topK);
    const probs = softmax(order.map((o) => o.v));
    const C = classes();
    return order.map((o, k) => ({
      className: C ? (C[o.i] || ("#" + o.i)) : ("#" + o.i),
      prob: probs[k]
    }));
  }

  function norm(s) { return (s || "").toLowerCase().replace(/[\s_\-.(,),]/g, ""); }

  // 关键词搜索营养库
  function search(q) {
    const list = foods || [];
    const n = norm(q);
    if (!n) return [];
    return list.filter((f) =>
      norm(f.name).indexOf(n) >= 0 ||
      (f.aliases || []).some((a) => norm(a).indexOf(n) >= 0)
    ).slice(0, 14);
  }

  // 将模型识别出的类名匹配到营养库食物
  function matchClass(className) {
    const n = norm(className);
    const words = n.split(/[^a-z]/).filter((w) => w.length >= 3);
    return (foods || []).filter((f) => {
      const aliases = (f.aliases || []).map(norm);
      return aliases.some((na) =>
        words.some((w) => na.indexOf(w) >= 0) || na.indexOf(n) >= 0 || n.indexOf(na) >= 0
      );
    }).slice(0, 6);
  }

  // 按典型份量估算该食物一餐的营养（总量），返回 {kcal,p,c,f}
  function estimate(food) {
    const k = food.portion / 100;
    return {
      kcal: Math.round(food.kcal * k),
      p: Math.round(food.p * k),
      c: Math.round(food.c * k),
      f: Math.round(food.f * k)
    };
  }

  window.FoodVision = {
    loadFoods, loadModel, classify, search, matchClass, estimate,
    getFoods: () => foods
  };
})();
