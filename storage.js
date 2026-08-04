/* storage.js — 照片存入 IndexedDB，文本数据仍走 localStorage
 * 暴露全局函数：offloadPhotos / hydratePhotos / gcPhotos
 * 用法：
 *   const refs = await offloadPhotos(store);   // 把 dataURL 照片搬进 IDB，原位替换为 "IDBIMG:<hash>"
 *   await hydratePhotos(store);                // 把 "IDBIMG:<hash>" 还原为真实 dataURL（缺失则置 null）
 *   gcPhotos(refs);                            // 清理 IDB 中不再被引用的照片
 */
(function () {
  "use strict";

  var DB_NAME = "workbench_photos";
  var STORE = "photos";
  var MARKER = "IDBIMG:";
  var _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) { reject(new Error("no-indexeddb")); return; }
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error("idb-open-failed")); };
    });
    return _dbPromise;
  }

  function putPhoto(key, dataURL) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(dataURL, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function getPhoto(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readonly");
        var r = tx.objectStore(STORE).get(key);
        r.onsuccess = function () { resolve(r.result); }; // undefined 表示缺失
        r.onerror = function () { reject(r.error); };
      });
    });
  }

  function delPhoto(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  // 53-bit 字符串哈希（双 FNV-1a），输出 base36；末尾追加长度以进一步避免碰撞
  function hashStr(s) {
    var h1 = 0x811c9dc5, h2 = 0x1000193, i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      h1 = (h1 ^ c) >>> 0; h1 = (h1 * 0x01000193) >>> 0;
      h2 = (h2 ^ (c + 0x9e37)) >>> 0; h2 = (h2 * 0x85ebca6b) >>> 0;
    }
    var combined = (h1 >>> 0) + ((h2 >>> 0) * 0x100000000);
    return combined.toString(36) + "_" + s.length.toString(36);
  }

  function isPhoto(v) { return typeof v === "string" && v.indexOf("data:image/") === 0; }
  function isMarker(v) { return typeof v === "string" && v.indexOf(MARKER) === 0; }

  // 深遍历：把 dataURL 照片写入 IDB，原位替换为 MARKER；返回被引用的 hash 集合
  async function offloadPhotos(root) {
    var referenced = new Set();
    async function walk(node) {
      if (node === null || typeof node !== "object") return;
      if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) await walk(node[i]); return; }
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var v = node[k];
        if (isPhoto(v)) {
          var h = hashStr(v);
          referenced.add(h);
          try { await putPhoto(h, v); node[k] = MARKER + h; }
          catch (e) { /* IDB 不可用：保留原 dataURL（退化为 localStorage 存储） */ }
        } else if (isMarker(v)) {
          referenced.add(v.slice(MARKER.length));
        } else if (v !== null && typeof v === "object") {
          await walk(v);
        }
      }
    }
    try { await walk(root); } catch (e) {}
    return referenced;
  }

  // 深遍历：把 MARKER 还原为真实 dataURL（缺失则置 null）；已是真实 dataURL 则不动（兼容旧数据）
  async function hydratePhotos(root) {
    async function walk(node) {
      if (node === null || typeof node !== "object") return;
      if (Array.isArray(node)) { for (var i = 0; i < node.length; i++) await walk(node[i]); return; }
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        var v = node[k];
        if (isMarker(v)) {
          var h = v.slice(MARKER.length);
          try {
            var data = await getPhoto(h);
            node[k] = (typeof data === "string") ? data : null;
          } catch (e) { node[k] = null; }
        } else if (isPhoto(v)) {
          // 旧存档尚未迁移，保留真实照片
        } else if (v !== null && typeof v === "object") {
          await walk(v);
        }
      }
    }
    try { await walk(root); } catch (e) {}
  }

  // 清理 IDB 中不再被引用的照片
  async function gcPhotos(referenced) {
    try {
      var db = await openDB();
      await new Promise(function (resolve) {
        var tx = db.transaction(STORE, "readwrite");
        var cur = tx.objectStore(STORE).openCursor();
        cur.onsuccess = function () {
          var c = cur.result;
          if (c) { if (!referenced.has(c.key)) c.delete(); c.continue(); }
          else resolve();
        };
        cur.onerror = function () { resolve(); };
      });
    } catch (e) {}
  }

  window.offloadPhotos = offloadPhotos;
  window.hydratePhotos = hydratePhotos;
  window.gcPhotos = gcPhotos;
  window.WBStore = { offloadPhotos: offloadPhotos, hydratePhotos: hydratePhotos, gcPhotos: gcPhotos, putPhoto: putPhoto, getPhoto: getPhoto, delPhoto: delPhoto, MARKER: MARKER };
})();
