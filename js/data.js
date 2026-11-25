/* =====================================================================
   منصة طموح — طبقة البيانات والهوية
   ---------------------------------------------------------------------
   - Store: واجهة موحّدة للبيانات التشغيلية (الأعضاء، المهام، التقييمات،
     الحضور، الساعات، الفعاليات، التأكيدات، المتقدمون، الإعدادات).
   - Auth: عمليات الهوية الحساسة (الدخول، التفعيل، إصدار رموز التفعيل،
     حفظ هوية المتقدم، قبول المتقدم). في وضع Supabase تُنفَّذ كدوال على
     الخادم (security definer) ولا تُقرأ تجزئات الهوية من المتصفح أبداً.
   - LocalBackend يعمل فوراً على جهاز واحد. SupabaseBackend يُفعَّل
     تلقائياً عند تعبئة المفاتيح في config.js.
   ===================================================================== */
(() => {
  const CFG = window.TAMOOH_CONFIG;

  /* ---------- SHA-256 (نقي، بدون مكتبات، نتيجة متطابقة في كل المتصفحات) ---------- */
  const K = [], H0 = [];
  { const primes = []; for (let n = 2; primes.length < 64; n++) if (primes.every(p => n % p)) primes.push(n);
    primes.forEach((p, i) => { K[i] = (Math.pow(p, 1 / 3) % 1) * 4294967296 | 0; if (i < 8) H0[i] = (Math.pow(p, 1 / 2) % 1) * 4294967296 | 0; }); }
  function sha256(str) {
    const r = (x, n) => (x >>> n) | (x << (32 - n));
    const b = unescape(encodeURIComponent(str)), l = b.length;
    const n = ((l + 9 + 63) >> 6) << 4, w = new Array(n).fill(0);
    for (let i = 0; i < l; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - 8 * (i & 3));
    w[l >> 2] |= 0x80 << (24 - 8 * (l & 3));
    w[n - 1] = l * 8;
    let h = H0.slice(); const W = new Array(64);
    for (let j = 0; j < n; j += 16) {
      let [a, bb, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        if (i < 16) W[i] = w[j + i] | 0;
        else { const x = W[i - 15], y = W[i - 2]; W[i] = (W[i - 16] + (r(x, 7) ^ r(x, 18) ^ (x >>> 3)) + W[i - 7] + (r(y, 17) ^ r(y, 19) ^ (y >>> 10))) | 0; }
        const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
        const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      h = [h[0] + a, h[1] + bb, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x | 0);
    }
    return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  }
  const idHash = nid => sha256(CFG.ID_SALT + ':' + nid);
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const newCode = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return s.slice(0, 4) + '-' + s.slice(4); };

  const COLS = ['members', 'tasks', 'evals', 'attendance', 'hours', 'events', 'rsvps', 'applicants', 'settings'];

  /* =================== Local backend (جهاز واحد) =================== */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return LS.mem[k] ?? d; } },
    set(k, v) { LS.mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    mem: {}
  };
  class LocalBackend {
    constructor() { this.mode = 'local'; }
    async loadAll() { const db = {}; COLS.forEach(c => db[c] = LS.get('tamooh.' + c, [])); return db; }
    async put(c, obj, arr) { LS.set('tamooh.' + c, arr); }
    async del(c, id, arr) { LS.set('tamooh.' + c, arr); }
    /* أسرار الهوية — مفصولة عن البيانات التشغيلية */
    _c() { const c = LS.get('tamooh.__creds', null); if (c) return c; const init = { 'm-lead': { code: CFG.BOOTSTRAP_CODE, level: 'super', committee: null, activated: false } }; LS.set('tamooh.__creds', init); return init; }
    _s(c) { LS.set('tamooh.__creds', c); }
    _admin(creds, id, h) { const a = creds[id]; return a && a.activated && a.h === h && (a.level === 'super' || a.level === 'cadmin') ? a : null; }
    async login(sid, h) { const c = this._c(); const id = Object.keys(c).find(k => c[k].activated && c[k].sid === sid && c[k].h === h); return id || null; }
    async sidExists(sid) { const c = this._c(); return Object.values(c).some(x => x.activated && x.sid === sid); }
    async activate(memberId, code, sid, h) { const c = this._c(), e = c[memberId];
      if (!e || e.activated || !e.code || e.code !== code.trim().toUpperCase()) return 'bad_code';
      if (Object.values(c).some(x => x.activated && x.sid === sid)) return 'sid_taken';
      Object.assign(e, { sid, h, activated: true, code: null }); this._s(c); return 'ok'; }
    async issueCode(adminId, adminH, targetId, level, committee) { const c = this._c(), a = this._admin(c, adminId, adminH);
      if (!a) throw new Error('صلاحية غير كافية');
      if (a.level !== 'super' && (level !== 'member' || committee !== a.committee)) throw new Error('يمكن لقائد اللجنة إصدار رموز لأعضاء لجنته فقط');
      const code = newCode(); c[targetId] = { code, level, committee, activated: false }; this._s(c); return code; }
    async setLevel(adminId, adminH, targetId, level, committee) { const c = this._c(), a = this._admin(c, adminId, adminH);
      if (!a || a.level !== 'super') throw new Error('هذه العملية للإدارة العليا'); if (c[targetId]) { c[targetId].level = level; c[targetId].committee = committee; this._s(c); } }
    async revoke(adminId, adminH, targetId) { const c = this._c(), a = this._admin(c, adminId, adminH);
      if (!a) throw new Error('صلاحية غير كافية'); if (a.level !== 'super' && c[targetId]?.committee !== a.committee) throw new Error('خارج نطاق لجنتك');
      delete c[targetId]; this._s(c); }
    async credStatus() { const c = this._c(); const o = {}; Object.keys(c).forEach(k => o[k] = c[k].activated ? 'active' : 'pending'); return o; }
    async applySecret(appId, sid, h) { const s = LS.get('tamooh.__appsec', {}); s[appId] = { sid, h }; LS.set('tamooh.__appsec', s); }
    async accept(adminId, adminH, appId, memberId, committee) { const c = this._c(), a = this._admin(c, adminId, adminH);
      if (!a) throw new Error('صلاحية غير كافية'); if (a.level !== 'super' && committee !== a.committee) throw new Error('يمكنك قبول المتقدمين في لجنتك فقط');
      const s = LS.get('tamooh.__appsec', {})[appId]; if (!s) throw new Error('لا توجد بيانات هوية محفوظة لهذا الطلب');
      if (Object.values(c).some(x => x.activated && x.sid === s.sid)) throw new Error('يوجد حساب مفعّل بنفس الرقم الجامعي');
      c[memberId] = { sid: s.sid, h: s.h, level: 'member', committee, activated: true }; this._s(c); return 'ok'; }
  }

  /* =================== Supabase backend (تشغيل فعلي من أي جهاز) =================== */
  class SupabaseBackend {
    constructor(client) { this.mode = 'supabase'; this.sb = client; }
    async loadAll() { const db = {}; COLS.forEach(c => db[c] = []);
      const { data, error } = await this.sb.from('records').select('collection,id,data'); if (error) throw error;
      data.forEach(r => { if (db[r.collection]) db[r.collection].push(r.data); }); return db; }
    async put(c, obj) { const { error } = await this.sb.from('records').upsert({ collection: c, id: obj.id, data: obj, updated_at: new Date().toISOString() }); if (error) throw error; }
    async del(c, id) { const { error } = await this.sb.from('records').delete().match({ collection: c, id }); if (error) throw error; }
    async rpc(fn, args) { const { data, error } = await this.sb.rpc(fn, args); if (error) throw new Error(error.message); return data; }
    login(sid, h) { return this.rpc('tamooh_login', { p_sid: sid, p_hash: h }); }
    sidExists(sid) { return this.rpc('tamooh_sid_exists', { p_sid: sid }); }
    activate(m, code, sid, h) { return this.rpc('tamooh_activate', { p_member: m, p_code: code.trim().toUpperCase(), p_sid: sid, p_hash: h }); }
    issueCode(a, ah, t, level, committee) { return this.rpc('tamooh_issue_code', { p_admin: a, p_admin_hash: ah, p_target: t, p_level: level, p_committee: committee }); }
    setLevel(a, ah, t, level, committee) { return this.rpc('tamooh_set_level', { p_admin: a, p_admin_hash: ah, p_target: t, p_level: level, p_committee: committee }); }
    revoke(a, ah, t) { return this.rpc('tamooh_revoke', { p_admin: a, p_admin_hash: ah, p_target: t }); }
    credStatus() { return this.rpc('tamooh_cred_status', {}); }
    applySecret(app, sid, h) { return this.rpc('tamooh_apply', { p_app: app, p_sid: sid, p_hash: h }); }
    accept(a, ah, app, m, committee) { return this.rpc('tamooh_accept', { p_admin: a, p_admin_hash: ah, p_app: app, p_member: m, p_committee: committee }); }
  }

  function loadScript(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }

  /* =================== Store (ذاكرة مؤقتة + كتابة مباشرة) =================== */
  const Store = {
    db: {}, backend: null, mode: 'local',
    async init(seedFn) {
      if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY) {
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js');
          this.backend = new SupabaseBackend(window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY));
          this.db = await this.backend.loadAll();
        } catch (e) { console.error('Supabase unavailable, falling back to local storage', e); this.backend = null; this.error = 'تعذّر الاتصال بقاعدة البيانات — يعمل النظام مؤقتاً بالتخزين المحلي.'; }
      }
      if (!this.backend) { this.backend = new LocalBackend(); this.db = await this.backend.loadAll(); }
      this.mode = this.backend.mode;
      if (!this.db.members.length && seedFn) { const seed = seedFn(); for (const c of Object.keys(seed)) for (const o of seed[c]) await this.save(c, o, true); }
    },
    async refresh() { this.db = await this.backend.loadAll(); },
    all(c) { return this.db[c] || []; },
    get(c, id) { return this.all(c).find(o => o.id === id) || null; },
    async save(c, obj, silent) {
      if (!obj.id) obj.id = uid(c.slice(0, 3)); if (!obj.createdAt) obj.createdAt = new Date().toISOString(); obj.updatedAt = new Date().toISOString();
      const arr = this.db[c] = this.all(c); const i = arr.findIndex(o => o.id === obj.id); if (i >= 0) arr[i] = obj; else arr.push(obj);
      await this.backend.put(c, obj, arr); return obj; },
    async remove(c, id) { this.db[c] = this.all(c).filter(o => o.id !== id); await this.backend.del(c, id, this.db[c]); }
  };

  window.TamoohData = { Store, sha256, idHash, uid };
})();
