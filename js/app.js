/* =====================================================================
   منصة طموح — منطق التطبيق
   الأقسام: أدوات · بيانات مرجعية · صلاحيات · محرك حركة النص · عن المبادرة ·
   بوابة العضو (دخول/تفعيل، مهام، تقرير الجودة، إدارة الأعضاء) · الفعاليات ·
   صفحتي ولجنتي · التقديم والقبول · التنقل
   ===================================================================== */
(async () => {
const { Store, idHash, uid } = window.TamoohData;
const CFG = window.TAMOOH_CONFIG;
const HOURS_TARGET = 40;

/* ------------------------------ أدوات ------------------------------ */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (n, st = '') => `<svg class="ic"${st ? ` style="${st}"` : ''}><use href="#i-${n}"/></svg>`;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function toast(t, bad) { const e = $('#toast'); e.textContent = t; e.style.background = bad ? 'var(--bad)' : ''; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 3200); }
const DAY = 864e5; const today = new Date(); today.setHours(0, 0, 0, 0);
const iso = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const pd = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (s, o) => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', o || { day: 'numeric', month: 'long', year: 'numeric' }).format(pd(s)); } catch (e) { return s; } };
const hij = s => { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(pd(s)); } catch (e) { return ''; } };
const toEn = s => String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\s/g, '');
const initials = n => esc(String(n || '؟').trim()[0] || '؟');
const csvCell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
function download(name, text) {
  try { const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); toast('جارٍ تنزيل الملف ' + name); }
  catch (e) { copyText(text); }
}
function copyText(t) { const fb = () => openModal(`<div class="mhead"><h3>انسخ البيانات</h3><button class="xbtn" data-close aria-label="إغلاق">×</button></div><textarea class="in" rows="12" readonly>${esc(t)}</textarea>`); try { navigator.clipboard.writeText(t).then(() => toast('تم النسخ إلى الحافظة'), fb); } catch (e) { fb(); } }

/* ---------------------------- التحقق ---------------------------- */
const luhn = s => { let t = 0; for (let i = 0; i < s.length; i++) { let d = +s[i]; if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; } t += d; } return t % 10 === 0; };
const V = {
  nid(v) { if (!v) return 'أدخل رقم الهوية الوطنية'; if (/\D/.test(v)) return 'رقم الهوية أرقام فقط'; if (v.length !== 10) return `رقم الهوية 10 أرقام (أدخلت ${v.length})`; if (v[0] !== '1') return 'رقم الهوية الوطنية السعودية يبدأ بالرقم 1'; if (!luhn(v)) return 'رقم الهوية غير صحيح (فشل التحقق من الرقم الختامي)'; return ''; },
  sid(v) { if (!v) return 'أدخل الرقم الجامعي'; if (/\D/.test(v)) return 'الرقم الجامعي أرقام فقط'; if (v.length !== 9) return `الرقم الجامعي 9 أرقام (أدخلت ${v.length})`; if (v[0] !== '4') return 'الرقم الجامعي في جامعة الملك سعود يبدأ بالرقم 4'; const y = +v.slice(1, 3); if (y < 38 || y > 48) return 'سنة القبول في الرقم الجامعي غير منطقية (من 438 إلى 448)'; return ''; },
  name(v, parts = 3) { v = String(v).trim(); if (!v) return 'أدخل الاسم'; if (!/^[؀-ۿ\s]+$/.test(v)) return 'اكتب الاسم بالأحرف العربية'; if (v.split(/\s+/).length < parts) return parts === 4 ? 'أدخل الاسم رباعياً' : 'أدخل الاسم ثلاثياً على الأقل'; return ''; },
  phone(v) { if (!v) return 'أدخل رقم الجوال'; if (!/^05\d{8}$/.test(v)) return 'رقم الجوال 10 أرقام يبدأ بـ 05'; return ''; },
  email(v) { v = String(v).trim().toLowerCase(); if (!v) return 'أدخل البريد الجامعي'; if (!/^[^\s@]+@[^\s@]+$/.test(v)) return 'صيغة البريد غير صحيحة'; if (!CFG.EMAIL_DOMAINS.some(d => v.endsWith('@' + d))) return 'استخدم بريدك الجامعي (@' + CFG.EMAIL_DOMAINS[0] + ')'; return ''; },
  url(v) { if (!v) return ''; try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? '' : 'الرابط يجب أن يبدأ بـ https://'; } catch (e) { return 'الرابط غير صحيح'; } },
  req(v, l = 'هذا الحقل') { return String(v || '').trim() ? '' : l + ' مطلوب'; }
};
const mask = n => n.slice(0, 1) + '••••••' + n.slice(-3);
function setErr(id, msg) { const i = document.getElementById(id), m = document.getElementById(id + 'M'); if (i) { i.classList.toggle('err', !!msg); i.setAttribute('aria-invalid', !!msg); } if (m) { m.textContent = msg || ''; m.classList.remove('ok'); } return msg; }
function liveNum(id, fn, len) { const i = document.getElementById(id); if (!i) return; i.addEventListener('input', () => { i.value = toEn(i.value).replace(/\D/g, ''); const v = i.value; if (!v) return setErr(id, ''); const m = fn(v); if (m && v.length >= len) setErr(id, m); else { setErr(id, ''); if (!m) { const e = document.getElementById(id + 'M'); if (e) { e.textContent = '✓ صيغة صحيحة'; e.classList.add('ok'); } } } }); i.addEventListener('blur', () => { if (i.value) setErr(id, fn(i.value)); }); }
const fld = (id, label, inner, req = true, cls = '') => `<div class="field ${cls}"><label for="${id}">${label}${req ? ' <span class="req">*</span>' : ''}</label>${inner}<div class="fmsg" id="${id}M"></div></div>`;
const val = id => (document.getElementById(id)?.value ?? '').trim();

/* ------------------------- بيانات مرجعية ------------------------- */
const C = {
  finance: { n: 'اللجنة المالية', i: 'chart', c: '#1f7a8c', d: 'حارس موارد المبادرة: إعداد ميزانيات الأنشطة، متابعة المصروفات والعُهد، تنظيم ملفات الرعاية، وإصدار تقارير مالية شفافة للإدارة العليا.', p: ['ميزانية تقديرية معتمدة لكل نشاط قبل تنفيذه', 'ملف الرعايات وباقاتها للدورة الحالية', 'إقفال العُهد خلال أسبوع من انتهاء كل فعالية'], o: ['تقرير مصروفات شهري', 'ميزانية معتمدة لكل فعالية', 'سجل عُهد محدّث'] },
  design: { n: 'لجنة التصميم والمحتوى', i: 'pen', c: '#c8604a', d: 'هوية طموح البصرية والكتابية: تصميم الإعلانات والشهادات والعروض، كتابة المحتوى وتدقيقه، والحفاظ على اتساق الهوية في كل مخرج.', p: ['قوالب موحّدة للإعلانات والشهادات والعروض', 'دليل هوية مختصر للأعضاء', 'تقويم محتوى شهري بالتنسيق مع اللجنة الإعلامية'], o: ['تصميم كل إعلان قبل الفعالية بأسبوع', 'شهادات الحضور خلال 5 أيام', 'محتوى مدقّق لغوياً'] },
  quality: { n: 'لجنة الجودة والتطوير', i: 'shield', c: '#b08a4e', d: 'ضمير المبادرة التشغيلي: وضع معايير الجودة، قياس رضا المستفيدين، تقييم أداء الأعضاء واللجان، ورفع تقارير ما بعد الفعالية بتوصيات تطويرية قابلة للتنفيذ.', p: ['اعتماد نموذج التقييم الفصلي للأعضاء', 'استبيان رضا موحّد لكل الفعاليات', 'مؤشرات أداء شهرية للجان السبع'], o: ['تقرير جودة لكل فعالية خلال أسبوع', 'تقييم فصلي لكل عضو', 'لوحة مؤشرات اللجان'] },
  hr: { n: 'لجنة الموارد البشرية', i: 'users', c: '#1d8a5f', d: 'رعاية فريق طموح: الاستقطاب والمقابلات، تسكين الأعضاء في اللجان، متابعة الحضور واعتماد الساعات التطوعية، والتحفيز وبرامج تهيئة الأعضاء الجدد.', p: ['إدارة دورة الاستقطاب والمقابلات', 'اعتماد الساعات التطوعية شهرياً', 'برنامج تهيئة الأعضاء الجدد'], o: ['سجل حضور وساعات معتمد', 'تسكين كل عضو جديد خلال أسبوع', 'خطة تحفيز فصلية'] },
  media: { n: 'اللجنة الإعلامية', i: 'mic', c: '#2f7fd1', d: 'صوت طموح أمام الجمهور: تغطية الفعاليات بالصورة والفيديو، إدارة الحسابات الرسمية وهاشتاق #خلك_طموح، وإعداد الأخبار والإعلانات.', p: ['خطة تغطية لكل فعالية', 'إدارة الحسابات الرسمية وجدولة النشر', 'أرشيف صور وفيديو منظّم'], o: ['تقرير تغطية خلال 48 ساعة', 'محتوى أسبوعي منتظم', 'بنك صور معتمد'] },
  pr: { n: 'لجنة العلاقات العامة', i: 'net', c: '#5b5fb8', d: 'جسر طموح مع الجهات: بناء الشراكات، التواصل مع المتحدثين والجهات المستضيفة، إعداد الخطابات والدعوات، والاستقبال والبروتوكول في الفعاليات.', p: ['قاعدة بيانات الشركاء والمتحدثين', 'خطابات رسمية للجهات قبل كل نشاط', 'خطة استقبال وبروتوكول لكل فعالية'], o: ['خطاب رسمي قبل أسبوعين', 'سجل شراكات محدّث', 'خطابات شكر بعد كل فعالية'] },
  projects: { n: 'لجنة إدارة المشاريع', i: 'flag', c: '#0f8f7a', d: 'محرّك التنفيذ: تخطيط الفعاليات والزيارات والمعارض من الفكرة حتى الإغلاق، إعداد الخطط التنفيذية والجداول الزمنية، والتنسيق بين اللجان والجهات.', p: ['خطة تنفيذية معتمدة لكل نشاط', 'جدول زمني محدّث أسبوعياً', 'تقرير إغلاق لكل مشروع'], o: ['خطط تنفيذية', 'جداول زمنية', 'تقارير إغلاق'] }
};
const CK = Object.keys(C);
const LEVEL = { super: 'الإدارة العليا', cadmin: 'قيادة لجنة', member: 'عضو' };
const TS = { new: ['جديدة', ''], doing: ['قيد التنفيذ', 'sky'], review: ['تحت المراجعة', 'warn'], done: ['مكتملة', 'ok'], late: ['متأخرة', 'bad'] };
const PRIO = { high: ['عالية', 'coral'], medium: ['متوسطة', 'gold'], low: ['منخفضة', ''] };
const AS = { review: ['قيد المراجعة', 'sky', '#2f7fd1'], interview: ['مرشح للمقابلة', 'gold', '#b08a4e'], prelim: ['مقبول مبدئياً', '', '#0f8f7a'], accepted: ['مقبول نهائياً', 'ok', '#1d8a5f'], waitlist: ['قائمة الانتظار', 'warn', '#b7791f'], rejected: ['مرفوض', 'bad', '#c0392b'] };
const TYPES = { ws: 'ورش عمل', visit: 'زيارات ميدانية', meet: 'لمّات ولقاءات', expo: 'معارض وفعاليات' };
const TCH = { ws: 'coral', visit: 'sky', meet: '', expo: 'gold' };
const LEVELS_STUDY = ['المستوى الأول', 'المستوى الثاني', 'المستوى الثالث', 'المستوى الرابع', 'المستوى الخامس', 'المستوى السادس', 'المستوى السابع', 'المستوى الثامن', 'المستوى التاسع', 'المستوى العاشر'];
const COLLEGES = ['كلية السياحة والآثار', 'كلية إدارة الأعمال', 'كلية الآداب', 'كلية اللغات والترجمة', 'كلية علوم الحاسب والمعلومات', 'كلية الهندسة', 'كلية العلوم', 'كلية التربية', 'كلية الحقوق والعلوم السياسية', 'كلية العمارة والتخطيط', 'كلية علوم الأغذية والزراعة', 'كلية علوم الرياضة والنشاط البدني'];
const GOALS = [['spark', 'تغيير الصورة النمطية عن السياحة والضيافة في المجتمع'], ['sprout', 'تهيئة البيئة المناسبة لتنمية قدرات الأعضاء ومهاراتهم التي يتميزون بها'], ['brief', 'تمكين الأعضاء لمواكبة سوق العمل السياحي'], ['cal', 'إقامة الأنشطة المتنوعة المتعلقة بمجال السياحة والضيافة'], ['users', 'المشاركة في الفعاليات والمناسبات الداخلية والخارجية من أجل تبادل الخبرات'], ['net', 'بناء شبكة علاقات وشراكات استراتيجية']];
const TL = [['2024-10', 'من هنا بدايتنا: تنظيم زيارة إلى المعهد الملكي للفنون التقليدية', 'زيارة'], ['2024-10', 'لقاء معالي وزير السياحة الأستاذ أحمد الخطيب', 'لقاء'], ['2024-11', 'تنظيم معرض «واعد» بنسخته الأولى', 'معرض'], ['2025-03', 'تنظيم فعالية «نور رمضان» لعبق التأسيس', 'فعالية'], ['2025-03', 'جلسة «مستقبل الضيافة في المملكة» مع الرئيس التنفيذي لشركة طيبة للاستثمار', 'لقاء'], ['2025-05', 'تنظيم ورشة عمل «على مفترق الطرق»', 'ورشة'], ['2025-10', 'المشاركة في الاحتفاء باليوم العالمي للسياحة بفعالية لتعزيز الوعي بأهمية السياحة ودورها في التنمية', 'فعالية'], ['2025-11', 'ورش عمل وجلسات حوارية ودورات بمشاركة مختصين، منهم أ. إبراهيم الخنفري وأ. المها الرويلي', 'ورشة'], ['2025-12', 'زيارة بيت عيسى بتنظيم من جمعية سمو', 'زيارة'], ['2025-12', 'زيارة مجانية إلى مشروع مدينة القدية', 'زيارة'], ['2026-02', 'زيارة مجانية إلى حي طريف في الدرعية بالتعاون مع نسر', 'زيارة'], ['2026-02', 'في 22 فبراير، احتفالاً بيوم التأسيس: عمل خاص بالمناسبة ومشهد يجسّد هوية يوم التأسيس وقيمته التاريخية والثقافية', 'فعالية'], ['2026-05', 'المشاركة في فعالية «مسار السائح» بتجربة ثرية تعزز المعرفة وترفع الوعي السياحي', 'فعالية'], ['2026-05', 'معرض «واعد 2» وورش عمل مصاحبة بمشاركة د. عماد منشي ود. سامح رفعت', 'معرض']];
const TLI = { 'زيارة': ['pin', 'sky'], 'لقاء': ['mic', 'coral'], 'معرض': ['flag', 'gold'], 'فعالية': ['award', ''], 'ورشة': ['pen', 'sky'] };

/* الهيكل التنظيمي الرسمي 1448هـ — يُزرع في قاعدة البيانات عند أول تشغيل */
function seed() {
  const M = (id, name, title, level, committee, order) => ({ id, name, title, level, committee, order, status: 'active', source: 'structure' });
  const members = [
    M('m-lead', 'عبدالإله سعود الهلقمي', 'قائد المبادرة', 'super', null, 1),
    M('m-deputy', 'وريف أحمد العروج', 'نائب المبادرة', 'super', null, 2),
    M('m-as1', 'عبدالوهاب صالح بن حميد', 'مساعد إداري', 'super', null, 3),
    M('m-as2', 'دينا عامر الشهري', 'مساعد إداري', 'super', null, 4),
    M('m-as3', 'صهيب سعود الحزيم', 'مساعد إداري', 'super', null, 5),
    M('m-fin-l', 'يزيد عبدالمحسن العتيبي', 'قائد اللجنة', 'cadmin', 'finance', 1),
    M('m-des-l', 'وصايف هزاع القحطاني', 'قائدة اللجنة', 'cadmin', 'design', 1), M('m-des-d', 'أروى منصور الزهراني', 'نائبة القائدة', 'cadmin', 'design', 2),
    M('m-qa-l', 'ميعاد إبراهيم الطاسان', 'قائدة اللجنة', 'cadmin', 'quality', 1), M('m-qa-d', 'شوق فهد الحربي', 'نائبة القائدة', 'cadmin', 'quality', 2),
    M('m-hr-l', 'أحمد محمد المظهور', 'قائد اللجنة', 'cadmin', 'hr', 1), M('m-hr-d', 'عبدالله فهد الوهبي', 'نائب القائد', 'cadmin', 'hr', 2),
    M('m-med-l', 'سلمان مشعل الرفيعه', 'قائد اللجنة', 'cadmin', 'media', 1), M('m-med-d', 'أحمد منصور الأحمد', 'نائب القائد', 'cadmin', 'media', 2),
    M('m-pr-l', 'فيصل بدر الدويش', 'قائد اللجنة', 'cadmin', 'pr', 1), M('m-pr-d', 'ريماس ماجد الحربي', 'نائبة القائد', 'cadmin', 'pr', 2),
    M('m-prj-l', 'ليان عايش الحارثي', 'قائدة اللجنة', 'cadmin', 'projects', 1), M('m-prj-d', 'نوره عبدالله الفراوي', 'نائبة القائدة', 'cadmin', 'projects', 2)
  ];
  const E = (id, t, type, date, time, loc, host, cm, f, desc, cap) => ({ id, t, type, date, time, loc, host, cm, f: !!f, desc, cap: cap || null, createdBy: 'system' });
  const events = [
    E('ev-01', 'لمة طموح الشهرية — ديسمبر', 'meet', '2026-12-02', '7:30 م', 'قاعة الأنشطة الطلابية — عمادة شؤون الطلاب', 'مبادرة طموح', 'hr', 1, 'مراجعة إنجازات نوفمبر، تكريم عضو الشهر، وتوزيع مهام ديسمبر.'),
    E('ev-02', 'فعالية اليوم العالمي للتطوع', 'expo', '2026-12-06', '11:00 ص', 'بهو كلية السياحة والآثار', 'مبادرة طموح', 'hr', 1, 'ركن تعريفي بالعمل التطوعي في قطاع السياحة والضيافة.'),
    E('ev-03', 'ورشة: أساسيات الإرشاد السياحي', 'ws', '2026-12-09', '12:00 م', 'كلية السياحة والآثار', 'المتحدث قيد التأكيد', 'projects', 1, 'مهارات تقديم الموقع، إدارة المجموعة، وبناء القصة السياحية.'),
    E('ev-04', 'جلسة عصف ذهني: معرض واعد 3', 'meet', '2026-12-13', '8:00 م', 'عن بُعد — Microsoft Teams', 'لجنة إدارة المشاريع', 'projects', 0, 'محاور النسخة الثالثة والجهات المرشحة وتجربة الزائر.'),
    E('ev-05', 'زيارة ميدانية: حي البجيري — الدرعية', 'visit', '2026-12-17', '4:00 م', 'حي البجيري، الدرعية', 'الجهة المستضيفة قيد التأكيد', 'pr', 1, 'جولة تعريفية بالتراث العمراني النجدي وتجربة الضيافة.', 40),
    E('ev-06', 'بروفة التنظيم والتغطية الإعلامية', 'meet', '2027-01-06', '6:00 م', 'كلية السياحة والآثار', 'اللجنة الإعلامية ولجنة إدارة المشاريع', 'media', 0, 'محاكاة الاستقبال والتغطية الحية وتوزيع نقاط التنظيم.'),
    E('ev-07', 'لقاء دوري لقادة اللجان', 'meet', '2027-01-10', '8:00 م', 'عن بُعد — Microsoft Teams', 'الإدارة العليا', 'quality', 0, 'مراجعة مؤشرات الأداء الشهرية للجان واعتماد الخطط.'),
    E('ev-08', 'فعالية يوم التأسيس', 'expo', '2027-02-18', '11:00 ص', 'كلية السياحة والآثار', 'مبادرة طموح', 'projects', 0, 'مشهد تراثي وركن ضيافة احتفاءً بيوم التأسيس (22 فبراير).')
  ];
  return { members, events, settings: [{ id: 'recruitment', open: false, cycle: CFG.CYCLE, seq: 0 }] };
}

/* ------------------------------ الجلسة والصلاحيات ------------------------------ */
await Store.init(seed);
let session = (() => { try { return JSON.parse(localStorage.getItem('tamooh.session')); } catch (e) { return null; } })();
let me = session ? Store.get('members', session.id) : null;
if (me && me.status === 'inactive') me = null;
const isSuper = () => !!me && me.level === 'super';
const isCAdmin = () => !!me && me.level === 'cadmin';
const isAdmin = () => isSuper() || isCAdmin();
const canCom = k => isSuper() || (isCAdmin() && me.committee === k);
const members = () => Store.all('members').filter(m => m.status !== 'inactive');
const byOrder = (a, b) => (a.order || 9) - (b.order || 9) || a.name.localeCompare(b.name, 'ar');
const scopeMembers = () => !me ? [] : isSuper() ? members() : isCAdmin() ? members().filter(m => m.committee === me.committee) : [me];
const mName = id => Store.get('members', id)?.name || '—';
const cName = k => C[k]?.n || 'الإدارة العليا';
function setSession(m, h) { me = m; joinTab = null; authTab = 'login'; pTab = 'tasks'; reportFor = null; hubC = null; session = m ? { id: m.id, h } : null; try { m ? localStorage.setItem('tamooh.session', JSON.stringify(session)) : localStorage.removeItem('tamooh.session'); } catch (e) {} renderWho(); }
let credMap = {};
async function loadCreds() { try { credMap = (await Store.backend.credStatus()) || {}; } catch (e) { credMap = {}; } }

/* ============== محرك حركة النص المرتبط بالتمرير (يعمل في الاتجاهين) ============== */
function splitWords(el) { if (el.dataset.sp) return; el.dataset.sp = 1; const walk = n => { [...n.childNodes].forEach(c => { if (c.nodeType === 3) { const parts = c.textContent.split(/(\s+)/); const f = document.createDocumentFragment(); parts.forEach(p => { if (!p) return; if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p)); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; f.appendChild(s); } }); c.replaceWith(f); } else if (c.nodeType === 1 && c.tagName !== 'MARK') walk(c); else if (c.nodeType === 1) c.classList.add('w'); }); }; walk(el); el._w = [...el.querySelectorAll('.w')]; }
let tracked = [];
function collect() { if (reduce) return; $$('.view:not([hidden]) [data-scrub]').forEach(splitWords); tracked = $$('.view:not([hidden]) [data-scrub],.view:not([hidden]) [data-sx],.view:not([hidden]) [data-py],.view:not([hidden]) [data-enter]'); }
function frame() {
  const vh = innerHeight;
  for (const el of tracked) {
    const r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) continue;
    const pass = clamp((vh - r.top) / (vh + r.height)); let tf = '';
    if (el.dataset.sx) tf += `translateX(${((pass - .5) * +el.dataset.sx).toFixed(1)}px) `;
    if (el.dataset.py) tf += `translateY(${((pass - .5) * +el.dataset.py).toFixed(1)}px) `;
    if (el.dataset.enter) { const v = Math.min(clamp((vh - r.top) / (vh * .38)), clamp(r.bottom / (vh * .25))); tf += `translateX(${((1 - v) * 40 * +el.dataset.enter).toFixed(1)}px)`; el.style.opacity = (.45 + .55 * v).toFixed(3); }
    if (tf) el.style.transform = tf;
    if (el._w) {
      const ws = el._w, n = ws.length, mode = el.dataset.scrub;
      if (mode === 'hero') { const out = clamp((vh * .32 - r.top) / (vh * .55)); for (let i = 0; i < n; i++) { ws[i].style.transform = `translateY(${(-out * (16 + (i % 3) * 12)).toFixed(1)}px)`; ws[i].style.opacity = (1 - .5 * out).toFixed(3); } continue; }
      const p = clamp((vh * .95 - r.top) / (vh * .53));
      for (let i = 0; i < n; i++) { const l = clamp((p - i / n * .7) / .3); if (mode === 'fill') ws[i].style.opacity = (.3 + .7 * l).toFixed(3); else { ws[i].style.opacity = (.5 + .5 * l).toFixed(3); ws[i].style.transform = `translateY(${((1 - l) * 9).toFixed(1)}px)`; } }
      el.querySelectorAll('mark.hl').forEach(m => m.style.setProperty('--hl', Math.round(clamp((p - .25) / .5) * 100) + '%'));
    }
  }
}
let ticking = false;
function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; if (!reduce) frame(); const h = document.documentElement.scrollHeight - innerHeight; $('#prog').style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; }); }
addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
let io;
function counter(el) { const to = +el.dataset.count, suf = el.dataset.suf || ''; if (reduce) { el.textContent = to + suf; return; } const t0 = performance.now(); const step = t => { const p = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function enter(e) { if (e.dataset.count != null) { if (!e._on) { e._on = 1; counter(e); } } else if (e.dataset.w != null) e.style.width = e.dataset.w + '%'; else e.classList.add('on'); }
function leave(e) { if (e.dataset.count != null) e._on = 0; else if (e.dataset.w != null) e.style.width = '0'; else e.classList.remove('on'); }
function animate(root = document) {
  collect(); const els = [...root.querySelectorAll('.rv,[data-count],.bar i[data-w]')];
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(enter); return; }
  if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) enter(e.target); else if (e.boundingClientRect.top > 0) leave(e.target); }), { threshold: .1 });
  els.forEach(e => io.observe(e)); onScroll();
}
{ const route = $('#route'); if (route) { const svg = route.ownerSVGElement, g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('color', '#e8d7b6'); g.innerHTML = '<use href="#pl" x="-11" y="-11" width="22" height="22"/>'; svg.appendChild(g); const L = route.getTotalLength();
  const place = () => { const p = clamp(scrollY / (innerHeight * .9)), l = L * (.08 + .8 * p), a = route.getPointAtLength(l), b = route.getPointAtLength(Math.min(L, l + 2)); g.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90})`); };
  place(); if (!reduce) addEventListener('scroll', () => requestAnimationFrame(place), { passive: true }); } }

/* ------------------------------ نافذة منبثقة ------------------------------ */
function openModal(h, after, wide) { const b = $('#modalBody'); b.className = 'card' + (wide ? ' wide' : ''); b.innerHTML = h; $('#modal').classList.add('open'); b.querySelectorAll('[data-close]').forEach(x => x.onclick = closeModal); after && after(b); setTimeout(() => b.querySelector('input:not([readonly]),textarea:not([readonly]),select')?.focus(), 40); }
function closeModal() { $('#modal').classList.remove('open'); }
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
const mhead = t => `<div class="mhead"><h3>${t}</h3><button class="xbtn" type="button" data-close aria-label="إغلاق">×</button></div>`;
async function guard(fn, okMsg) { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { console.error(e); toast(e.message || 'تعذّر تنفيذ العملية', true); return undefined; } }

/* ------------------------------ رأس الصفحة ------------------------------ */
function renderWho() {
  $('#who').innerHTML = me ? `<span class="av" aria-hidden="true">${initials(me.name)}</span><span class="nm"><b>${esc(me.name.split(' ').slice(0, 2).join(' '))}</b><br><span class="mute small">${esc(me.title)}</span></span><button class="btn ghost sm" id="logout">خروج</button>`
    : `<a class="btn sm" href="#portal">${ic('user', 'width:18px;height:18px')}<span class="t">تسجيل الدخول</span></a>`;
  const lo = $('#logout'); if (lo) lo.onclick = () => { setSession(null); route(); toast('تم تسجيل الخروج'); };
  $('#dbmode').textContent = Store.mode === 'supabase' ? 'متصل بقاعدة البيانات المركزية' : (isAdmin() ? 'وضع التخزين المحلي — اربط قاعدة البيانات للتشغيل من أي جهاز (راجع README)' : '');
}

/* ================================ 1. عن المبادرة ================================ */
function renderAbout() {
  $('#goals').innerHTML = GOALS.map(([i, g], k) => `<div class="card hov rv d${k % 3 + 1}"><span class="icbox">${ic(i)}</span><div><div class="n">الهدف ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'][k]}</div><p data-scrub>${g}</p></div></div>`).join('');
  const by = {}; TL.forEach(x => (by[x[0].slice(0, 4)] = by[x[0].slice(0, 4)] || []).push(x)); let k = 0;
  $('#tl').innerHTML = Object.entries(by).map(([y, its]) => `<div class="tl-y"><h3 data-py="-40">${y}</h3><div class="tl-l">${its.map(([d, t, ty]) => { const [icn, ch] = TLI[ty]; return `<div class="card tl-it hov" data-enter="${(k++) % 2 ? 1 : -1}"><span class="icbox">${ic(icn)}</span><div><div class="d">${fmt(d + '-01', { month: 'long', year: 'numeric' })} · <span class="chip ${ch}">${ty}</span></div><p data-scrub>${t}</p></div></div>`; }).join('')}</div></div>`).join('');
  const sup = members().filter(m => m.level === 'super').sort(byOrder);
  const lead = sup.find(m => m.id === 'm-lead') || sup[0], dep = sup.find(m => m.id === 'm-deputy'), asst = sup.filter(m => m !== lead && m !== dep);
  $('#idLead').textContent = lead?.name || '—';
  const pc = (m, cls = '') => m ? `<div class="pcard ${cls}"><span class="r">${esc(m.title)}</span><b>${esc(m.name)}</b></div>` : '';
  $('#org').innerHTML = `<div class="lvl rv">${pc(lead, 'lead')}</div><div class="conn"></div><div class="lvl rv">${pc(dep)}</div><div class="conn"></div>
   <div class="lvl assist rv">${asst.map(m => pc(m)).join('')}</div><div class="conn"></div>
   <div class="cgrid">${CK.map((k, i) => { const ms = members().filter(m => m.committee === k && m.level === 'cadmin').sort(byOrder); return `<div class="ccard rv d${i % 4}"><h4>${ic(C[k].i)}${C[k].n}</h4><dl>${ms.map(m => `<div><dt>${esc(m.title)}</dt><dd>${esc(m.name)}</dd></div>`).join('') || '<div><dt>القيادة</dt><dd>—</dd></div>'}</dl></div>`; }).join('')}</div>`;
}

/* ================================ 2. بوابة العضو ================================ */
let pTab = 'tasks', authTab = 'login', reportFor = null, tf = { st: 'all', pr: 'all', cm: 'all', who: 'all', q: '' };
function renderPortal() { if (!me) return renderAuth(); const el = $('#portalBox'); if (pTab === 'admin' && !isAdmin()) pTab = 'tasks';
  const tabs = [['tasks', 'إدارة المهام', 'list'], ['report', 'تقرير جودة الأداء', 'chart']]; if (isAdmin()) tabs.push(['admin', isSuper() ? 'إدارة الأعضاء والحسابات' : 'أعضاء لجنتي والحضور', 'users']);
  el.innerHTML = `${Store.error ? `<div class="banner">${ic('lock')}<span>${esc(Store.error)}</span></div>` : ''}
   <div class="rep-head"><div><div class="eyebrow">${esc(me.title)} · ${esc(cName(me.committee))}</div><h2 style="margin:0">مرحباً ${esc(me.name.split(' ')[0])}</h2><p class="mute" style="margin:4px 0 0">${esc(me.name)}${me.sid ? ' · ' + esc(me.sid) : ''} · صلاحية: ${LEVEL[me.level]}</p></div><a class="btn ghost" href="#hub">مساحة لجنتي ${ic('arrow', 'width:18px;height:18px')}</a></div>
   <div class="subnav">${tabs.map(([k, l, i]) => `<button aria-pressed="${pTab === k}" data-p="${k}">${l}</button>`).join('')}</div><div id="pBody"></div>`;
  el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { pTab = b.dataset.p; renderPortal(); });
  ({ tasks: renderTasks, report: renderReport, admin: renderAdmin })[pTab](); animate(el); }

/* ---------- الدخول والتفعيل ---------- */
async function renderAuth() { const el = $('#portalBox'); await loadCreds();
  const pending = members().filter(m => credMap[m.id] === 'pending').sort(byOrder);
  el.innerHTML = `<div class="sec-head"><div class="eyebrow">الدخول الرسمي</div><h2 data-scrub>ادخل برقمك الجامعي وهويتك الوطنية</h2><p>الصلاحيات تُحدَّد تلقائياً حسب موقعك في الهيكل التنظيمي: الإدارة العليا، قيادة اللجان، أو العضوية.</p></div>
   <div class="auth"><div class="card"><div class="seg" role="tablist"><button role="tab" aria-selected="${authTab === 'login'}" data-a="login">تسجيل الدخول</button><button role="tab" aria-selected="${authTab === 'act'}" data-a="act">تفعيل الحساب لأول مرة</button></div><div id="authBody"></div></div>
   <div class="card"><h3>كيف أحصل على حساب؟</h3><ul class="lst">
    <li>${ic('key')}<span><b style="font-weight:600">أعضاء الهيكل التنظيمي:</b> يصدر لك قائد المبادرة أو الإدارة العليا رمز تفعيل، فتفعّل حسابك مرة واحدة برقمك الجامعي وهويتك.</span></li>
    <li>${ic('users')}<span><b style="font-weight:600">أعضاء اللجان:</b> يصدر قائد لجنتك رمز التفعيل من «أعضاء لجنتي».</span></li>
    <li>${ic('inbox')}<span><b style="font-weight:600">المقبولون عبر بوابة التقديم:</b> يُنشأ حسابك تلقائياً عند القبول النهائي، وتدخل مباشرة بالرقم الجامعي والهوية التي قدّمت بها.</span></li>
    <li>${ic('lock')}<span>لا يُحفظ رقم الهوية نفسه في أي مكان؛ يُحفظ أثره المشفّر (SHA-256) فقط للتحقق عند الدخول.</span></li></ul>
    <a class="btn ghost" href="#join" style="margin-top:8px">التقديم على العضوية</a></div></div>`;
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { authTab = b.dataset.a; renderAuth(); });
  const ab = $('#authBody');
  if (authTab === 'login') {
    ab.innerHTML = `<form id="lf" novalidate>${fld('lsid', 'الرقم الجامعي', '<input class="in" id="lsid" inputmode="numeric" autocomplete="username" maxlength="9" placeholder="9 أرقام تبدأ بـ 4">')}${fld('lnid', 'رقم الهوية الوطنية', '<input class="in" id="lnid" type="password" inputmode="numeric" autocomplete="current-password" maxlength="10" placeholder="10 أرقام تبدأ بـ 1">')}<button class="btn" style="width:100%">دخول</button><div class="fmsg" id="lfM" style="text-align:center"></div></form>`;
    liveNum('lsid', V.sid, 9); liveNum('lnid', V.nid, 10);
    $('#lf').onsubmit = async e => { e.preventDefault(); const s = toEn(val('lsid')), n = toEn(val('lnid')); const a = setErr('lsid', V.sid(s)), b = setErr('lnid', V.nid(n)); if (a || b) return;
      const h = idHash(n); const id = await guard(() => Store.backend.login(s, h)); if (id === undefined) return;
      const m = id && Store.get('members', id);
      if (!m || m.status === 'inactive') { $('#lfM').textContent = 'بيانات الدخول غير صحيحة أو الحساب غير مفعّل. إن كنت عضواً جديداً فعّل حسابك أولاً.'; return; }
      setSession(m, h); toast('أهلاً ' + m.name.split(' ')[0]); route(); };
  } else {
    ab.innerHTML = pending.length ? `<form id="af" novalidate>${fld('amem', 'اسمك في المنصة', `<select class="in" id="amem"><option value="">اختر اسمك</option>${pending.map(m => `<option value="${esc(m.id)}">${esc(m.name)} — ${esc(m.title)}${m.committee ? ' · ' + esc(C[m.committee].n) : ''}</option>`).join('')}</select>`)}
      ${fld('acode', 'رمز التفعيل', '<input class="in" id="acode" dir="ltr" autocomplete="one-time-code" placeholder="XXXX-XXXX" style="text-align:center;letter-spacing:.1em">')}
      <div class="grid2">${fld('asid', 'الرقم الجامعي', '<input class="in" id="asid" inputmode="numeric" maxlength="9">')}${fld('anid', 'رقم الهوية الوطنية', '<input class="in" id="anid" type="password" inputmode="numeric" maxlength="10">')}</div>
      ${fld('anid2', 'تأكيد رقم الهوية', '<input class="in" id="anid2" type="password" inputmode="numeric" maxlength="10">')}
      <button class="btn" style="width:100%">تفعيل الحساب والدخول</button><div class="fmsg" id="afM" style="text-align:center"></div></form>`
      : `<div class="empty">${ic('key', 'width:32px;height:32px;color:var(--gold)')}<p style="margin-top:10px">لا توجد حسابات بانتظار التفعيل حالياً. اطلب رمز التفعيل من قائد لجنتك أو من الإدارة العليا.</p></div>`;
    if (!pending.length) return;
    liveNum('asid', V.sid, 9); liveNum('anid', V.nid, 10);
    $('#af').onsubmit = async e => { e.preventDefault(); const mid = val('amem'), code = val('acode'), s = toEn(val('asid')), n = toEn(val('anid')), n2 = toEn(val('anid2'));
      const errs = [setErr('amem', mid ? '' : 'اختر اسمك'), setErr('acode', code ? '' : 'أدخل رمز التفعيل'), setErr('asid', V.sid(s)), setErr('anid', V.nid(n)), setErr('anid2', n2 === n ? '' : 'رقم الهوية غير متطابق')]; if (errs.some(Boolean)) return;
      const h = idHash(n); const r = await guard(() => Store.backend.activate(mid, code, s, h)); if (r === undefined) return;
      if (r === 'bad_code') { $('#afM').textContent = 'رمز التفعيل غير صحيح أو مستخدم مسبقاً.'; return; }
      if (r === 'sid_taken') { $('#afM').textContent = 'هذا الرقم الجامعي مرتبط بحساب مفعّل آخر.'; return; }
      const m = Store.get('members', mid); m.sid = s; m.nidMask = mask(n); m.activatedAt = new Date().toISOString(); await guard(() => Store.save('members', m));
      setSession(m, h); toast('تم تفعيل حسابك بنجاح'); route(); };
  }
  animate(el);
}

/* ---------- المهام ---------- */
const stOf = t => t.status !== 'done' && t.due && pd(t.due) < today ? 'late' : t.status;
const visibleTasks = () => Store.all('tasks').filter(t => isSuper() || t.assignee === me.id || (isCAdmin() && t.committee === me.committee));
const canEditTask = t => isSuper() || (isCAdmin() && t.committee === me.committee);
function renderTasks() { const b = $('#pBody'); const all = visibleTasks(); const cnt = s => all.filter(t => stOf(t) === s).length;
  const done = all.filter(t => t.status === 'done').length, pct = all.length ? Math.round(done / all.length * 100) : 0;
  const assignable = scopeMembers();
  b.innerHTML = `<div class="kpis k5">${['new', 'doing', 'review', 'done', 'late'].map((s, i) => `<div class="card kpi rv d${i % 4}" style="--c:${['var(--mute)', 'var(--sky)', 'var(--warn)', 'var(--ok)', 'var(--bad)'][i]}"><div class="v">${cnt(s)}</div><div class="l">${TS[s][0]}</div></div>`).join('')}</div>
   <div class="card" style="margin-top:16px"><div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:10px"><span>نسبة الإنجاز ${isSuper() ? 'في جميع اللجان' : isCAdmin() ? 'في ' + esc(cName(me.committee)) : 'لمهامي'}</span><span class="num">${pct}% · ${done} من ${all.length}</span></div><div class="bar"><i data-w="${pct}"></i></div></div>
   <div class="toolbar">${fld('fq', 'بحث', `<input class="in" id="fq" placeholder="عنوان المهمة أو اسم العضو" value="${esc(tf.q)}">`, false)}
    ${fld('fst', 'الحالة', `<select class="in" id="fst"><option value="all">كل الحالات</option>${Object.entries(TS).map(([k, v]) => `<option value="${k}" ${tf.st === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`, false)}
    ${fld('fpr', 'الأولوية', `<select class="in" id="fpr"><option value="all">كل الأولويات</option>${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${tf.pr === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`, false)}
    ${isSuper() ? fld('fcm', 'اللجنة', `<select class="in" id="fcm"><option value="all">كل اللجان</option>${CK.map(k => `<option value="${k}" ${tf.cm === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`, false) : ''}
    ${isAdmin() ? fld('fwho', 'المسند إليه', `<select class="in" id="fwho"><option value="all">الجميع</option>${assignable.sort(byOrder).map(m => `<option value="${m.id}" ${tf.who === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>`, false) : ''}
    ${isAdmin() ? `<button class="btn gold" id="addT">${ic('plus', 'width:18px;height:18px')}إسناد مهمة</button>` : ''}</div>
   <div class="card tablecard"><table class="stack"><thead><tr><th>المهمة</th><th>المسند إليه / اللجنة</th><th>الأولوية</th><th>الموعد النهائي</th><th>التقدم</th><th>الحالة</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
  const draw = () => { const L = all.filter(t => (tf.st === 'all' || stOf(t) === tf.st) && (tf.pr === 'all' || t.prio === tf.pr) && (tf.cm === 'all' || t.committee === tf.cm) && (tf.who === 'all' || t.assignee === tf.who) && (!tf.q || (t.title + mName(t.assignee)).includes(tf.q))).sort((a, b) => (a.status === 'done') - (b.status === 'done') || String(a.due).localeCompare(String(b.due)));
    $('#tb').innerHTML = L.length ? L.map(t => { const s = stOf(t), dl = Math.round((pd(t.due) - today) / DAY); return `<tr class="${s === 'late' ? 'late' : ''}"><td><b style="font-weight:600">${esc(t.title)}</b>${t.desc ? `<br><span class="mini">${esc(t.desc.slice(0, 80))}${t.desc.length > 80 ? '…' : ''}</span>` : ''}</td>
     <td>${esc(mName(t.assignee))}<br><span class="mini">${esc(cName(t.committee))}</span></td><td><span class="chip ${PRIO[t.prio][1]}">${PRIO[t.prio][0]}</span></td>
     <td style="white-space:nowrap">${t.due ? fmt(t.due, { day: 'numeric', month: 'short' }) : '—'}<br><span class="mini" style="${s === 'late' ? 'color:var(--bad)' : ''}">${t.status === 'done' ? 'أُنجزت' : dl < 0 ? 'متأخرة ' + (-dl) + ' يوم' : dl === 0 ? 'اليوم' : 'بعد ' + dl + ' يوم'}</span></td>
     <td><div class="prog"><div class="bar"><i style="--p:${t.progress || 0}%"></i></div><span>${t.progress || 0}%</span></div></td><td><span class="chip ${TS[s][1]}">${TS[s][0]}</span></td><td><button class="btn ghost sm" data-open="${esc(t.id)}">التفاصيل</button></td></tr>`; }).join('')
      : `<tr><td colspan="7" class="empty">${all.length ? 'لا توجد مهام مطابقة للتصفية.' : isAdmin() ? 'لا توجد مهام بعد. ابدأ بإسناد أول مهمة.' : 'لا توجد مهام مسندة إليك حالياً.'}</td></tr>`;
    $$('#tb [data-open]').forEach(x => x.onclick = () => taskModal(Store.get('tasks', x.dataset.open))); };
  draw();
  $('#fq').oninput = e => { tf.q = e.target.value.trim(); draw(); }; $('#fst').onchange = e => { tf.st = e.target.value; draw(); }; $('#fpr').onchange = e => { tf.pr = e.target.value; draw(); };
  if ($('#fcm')) $('#fcm').onchange = e => { tf.cm = e.target.value; draw(); }; if ($('#fwho')) $('#fwho').onchange = e => { tf.who = e.target.value; draw(); };
  if ($('#addT')) $('#addT').onclick = () => taskForm();
}
function taskForm(t, presetCommittee) { const edit = !!t; t = t || { committee: presetCommittee || (isSuper() ? CK[0] : me.committee), prio: 'medium', due: iso(+today + 7 * DAY) };
  const coms = isSuper() ? CK : [me.committee];
  const opts = k => members().filter(m => m.committee === k || (isSuper() && !m.committee && k === '__')).sort(byOrder).map(m => `<option value="${m.id}" ${t.assignee === m.id ? 'selected' : ''}>${esc(m.name)} — ${esc(m.title)}</option>`).join('');
  openModal(`${mhead(edit ? 'تعديل المهمة' : 'إسناد مهمة جديدة')}<form id="tfm" novalidate>${fld('tt', 'عنوان المهمة', `<input class="in" id="tt" value="${esc(t.title || '')}">`)}${fld('tdesc', 'الوصف والمخرجات المطلوبة', `<textarea class="in" id="tdesc">${esc(t.desc || '')}</textarea>`, false)}
   <div class="grid2">${fld('tcm', 'اللجنة', `<select class="in" id="tcm">${coms.map(k => `<option value="${k}" ${t.committee === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`)}${fld('tas', 'المسند إليه', `<select class="in" id="tas"></select>`)}
   ${fld('tpr', 'الأولوية', `<select class="in" id="tpr">${Object.entries(PRIO).map(([k, v]) => `<option value="${k}" ${t.prio === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`)}${fld('tdue', 'الموعد النهائي', `<input class="in" type="date" id="tdue" value="${esc(t.due || '')}">`)}
   ${fld('tev', 'الفعالية المرتبطة', `<input class="in" id="tev" list="evl" value="${esc(t.event || '')}"><datalist id="evl">${Store.all('events').map(e => `<option value="${esc(e.t)}">`).join('')}</datalist>`, false)}</div>
   <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn">${edit ? 'حفظ التعديلات' : 'إسناد المهمة'}</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    const fill = () => { const k = val('tcm'); const supers = isSuper() ? members().filter(m => m.level === 'super').sort(byOrder).map(m => `<option value="${m.id}" ${t.assignee === m.id ? 'selected' : ''}>${esc(m.name)} — ${esc(m.title)}</option>`).join('') : ''; $('#tas').innerHTML = `<option value="">اختر العضو</option>${opts(k)}${supers ? `<optgroup label="الإدارة العليا">${supers}</optgroup>` : ''}`; };
    fill(); $('#tcm').onchange = fill;
    $('#tfm').onsubmit = async e => { e.preventDefault(); const title = val('tt'); const errs = [setErr('tt', title.length < 4 ? 'اكتب عنواناً واضحاً (4 أحرف على الأقل)' : ''), setErr('tas', val('tas') ? '' : 'اختر العضو المسند إليه'), setErr('tdue', val('tdue') ? '' : 'حدّد الموعد النهائي')]; if (errs.some(Boolean)) return;
      Object.assign(t, { title, desc: val('tdesc'), committee: val('tcm'), assignee: val('tas'), prio: val('tpr'), due: val('tdue'), event: val('tev') });
      if (!edit) Object.assign(t, { status: 'new', progress: 0, createdBy: me.id, notes: [] });
      if (await guard(() => Store.save('tasks', t), edit ? 'حُفظت التعديلات' : 'أُسندت المهمة إلى ' + mName(t.assignee)) !== undefined) { closeModal(); route(); } };
  });
}
function taskModal(t) { if (!t) return; const mine = t.assignee === me.id, adm = canEditTask(t), s = stOf(t);
  const stOpts = adm ? ['new', 'doing', 'review', 'done'] : ['new', 'doing', 'review'];
  openModal(`${mhead(esc(t.title))}<dl class="kv"><div><dt>المسند إليه</dt><dd>${esc(mName(t.assignee))}</dd></div><div><dt>اللجنة</dt><dd>${esc(cName(t.committee))}</dd></div><div><dt>أسندها</dt><dd>${esc(mName(t.createdBy))}</dd></div><div><dt>الموعد النهائي</dt><dd>${t.due ? fmt(t.due) : '—'}</dd></div><div><dt>الأولوية</dt><dd><span class="chip ${PRIO[t.prio][1]}">${PRIO[t.prio][0]}</span></dd></div><div><dt>الحالة</dt><dd><span class="chip ${TS[s][1]}">${TS[s][0]}</span></dd></div>${t.event ? `<div><dt>الفعالية</dt><dd>${esc(t.event)}</dd></div>` : ''}</dl>
   ${t.desc ? `<p style="margin:14px 0 0;white-space:pre-line">${esc(t.desc)}</p>` : ''}
   ${mine || adm ? `<div class="grid2" style="margin-top:18px">${fld('mst', 'تحديث الحالة', `<select class="in" id="mst">${stOpts.map(k => `<option value="${k}" ${t.status === k ? 'selected' : ''}>${TS[k][0]}</option>`).join('')}${!adm && t.status === 'done' ? '<option value="done" selected>مكتملة</option>' : ''}</select>`, false)}${fld('mpg', `نسبة التقدم: <b id="mpgv">${t.progress || 0}%</b>`, `<input type="range" id="mpg" min="0" max="100" step="5" value="${t.progress || 0}" style="width:100%;accent-color:var(--em2)">`, false)}</div>${!adm ? '<p class="note" style="margin-top:0">اعتماد المهمة «مكتملة» يتم من قائد اللجنة بعد المراجعة؛ حدّثها إلى «تحت المراجعة» عند التسليم.</p>' : ''}` : ''}
   <h3 style="margin-top:18px">الملاحظات والتحديثات</h3><div class="notes">${(t.notes || []).map(n => `<div class="n"><small>${esc(mName(n.by))} · ${fmt(n.at, { day: 'numeric', month: 'short', year: 'numeric' })}</small>${esc(n.text)}</div>`).join('') || '<p class="mute small">لا توجد ملاحظات بعد.</p>'}</div>
   ${mine || adm ? `<div class="field"><label for="mnote">إضافة ملاحظة أو رفع تحديث</label><textarea class="in" id="mnote" placeholder="مثال: تم إرسال المسودة الأولى للقائد"></textarea></div>` : ''}
   <div style="display:flex;gap:10px;flex-wrap:wrap">${mine || adm ? '<button class="btn" id="msave">حفظ التحديث</button>' : ''}${adm ? '<button class="btn ghost" id="medit">تعديل الإسناد</button><button class="btn ghost" id="mdel" style="color:var(--bad)">حذف المهمة</button>' : ''}<button class="btn ghost" data-close>إغلاق</button></div>`, () => {
    const pg = $('#mpg'); if (pg) pg.oninput = () => $('#mpgv').textContent = pg.value + '%';
    const sv = $('#msave'); if (sv) sv.onclick = async () => { const ns = val('mst'), note = val('mnote');
      t.status = ns; t.progress = ns === 'done' ? 100 : +$('#mpg').value; if (ns === 'done' && !t.doneAt) { t.doneAt = iso(new Date()); t.approvedBy = me.id; } if (ns !== 'done') t.doneAt = null;
      if (note) (t.notes = t.notes || []).push({ by: me.id, at: new Date().toISOString(), text: note });
      if (await guard(() => Store.save('tasks', t), 'تم حفظ التحديث') !== undefined) { closeModal(); route(); } };
    const ed = $('#medit'); if (ed) ed.onclick = () => taskForm(t);
    const dl = $('#mdel'); if (dl) dl.onclick = () => confirmBox('حذف المهمة', `سيتم حذف المهمة «${esc(t.title)}» نهائياً.`, async () => { await guard(() => Store.remove('tasks', t.id), 'حُذفت المهمة'); route(); });
  }, true);
}
function confirmBox(title, msg, onYes, yes = 'تأكيد') { openModal(`${mhead(title)}<p>${msg}</p><div style="display:flex;gap:10px"><button class="btn" id="cyes" style="background:var(--bad)">${yes}</button><button class="btn ghost" data-close>إلغاء</button></div>`, () => { $('#cyes').onclick = async () => { closeModal(); await onYes(); }; }); }

/* ---------- تقرير الجودة ---------- */
function metrics(id) {
  const tasks = Store.all('tasks').filter(t => t.assignee === id), done = tasks.filter(t => t.status === 'done');
  const punct = done.length ? Math.round(done.filter(t => !t.doneAt || pd(t.doneAt) <= pd(t.due)).length / done.length * 100) : null;
  const comp = tasks.length ? Math.round(done.length / tasks.length * 100) : null;
  const att = Store.all('attendance').filter(a => a.memberId === id), ex = att.filter(a => a.s !== 'e');
  const attn = ex.length ? Math.round(ex.filter(a => a.s === 'p').length / ex.length * 100) : null;
  const ev = Store.all('evals').filter(e => e.memberId === id).sort((a, b) => a.date.localeCompare(b.date));
  const avg = k => ev.reduce((s, e) => s + +e[k], 0) / ev.length;
  const q = ev.length ? Math.round(avg('q') / 5 * 100) : null, lead = ev.length ? Math.round((avg('q') + avg('c') + avg('tw') + avg('in')) / 20 * 100) : null;
  const hrsL = Store.all('hours').filter(h => h.memberId === id), hrs = hrsL.filter(h => h.ok).reduce((s, h) => s + +h.h, 0), pend = hrsL.filter(h => !h.ok).reduce((s, h) => s + +h.h, 0);
  const hp = hrsL.length ? Math.min(100, Math.round(hrs / HOURS_TARGET * 100)) : null;
  const parts = [[punct, 25], [attn, 20], [q, 25], [comp, 15], [hp, 15]].filter(x => x[0] != null), w = parts.reduce((s, x) => s + x[1], 0);
  const total = w ? Math.round(parts.reduce((s, x) => s + x[0] * x[1], 0) / w) : null;
  const grade = total == null ? 'لا تتوفر بيانات كافية' : total >= 90 ? 'ممتاز' : total >= 80 ? 'جيد جداً' : total >= 70 ? 'جيد' : total >= 60 ? 'مقبول' : 'يحتاج إلى تطوير';
  return { tasks, done, punct, comp, att, attn, ev, q, lead, hrsL, hrs, pend, hp, total, grade, late: tasks.filter(t => stOf(t) === 'late').length };
}
const col = v => v == null ? 'var(--mute)' : v >= 85 ? 'var(--ok)' : v >= 70 ? 'var(--warn)' : 'var(--bad)';
const pctTxt = v => v == null ? '—' : v + '%';
function evalRole() { return isSuper() ? 'تقييم الإدارة العليا' : me.committee === 'quality' ? 'تقييم لجنة الجودة والتطوير' : 'تقييم قائد اللجنة'; }
function renderReport() { const b = $('#pBody'); const scope = scopeMembers().sort(byOrder);
  if (!reportFor || !scope.some(m => m.id === reportFor)) reportFor = me.id;
  const qaCanSee = isCAdmin() && me.committee === 'quality';
  const pool = qaCanSee ? members().sort(byOrder) : scope;
  if (!pool.some(m => m.id === reportFor)) reportFor = me.id;
  const m = Store.get('members', reportFor), mt = metrics(m.id), canEval = (isAdmin() && m.id !== me.id && (isSuper() || m.committee === me.committee || qaCanSee));
  const canApprove = isSuper() || (isCAdmin() && m.committee === me.committee);
  const rows = [['الالتزام بالمواعيد', mt.punct, 'المهام المكتملة في موعدها أو قبله'], ['الحضور والمشاركة', mt.attn, 'الاجتماعات والفعاليات (عدا المعتذر عنها)'], ['جودة المخرجات', mt.q, 'متوسط تقييم جودة المخرجات'], ['إنجاز المهام', mt.comp, 'المكتملة من إجمالي المهام المسندة'], ['الساعات التطوعية', mt.hp, `${mt.hrs} من ${HOURS_TARGET} ساعة مستهدفة`]];
  const C2 = 2 * Math.PI * 62;
  b.innerHTML = `${pool.length > 1 ? `<div class="toolbar" style="margin-top:0">${fld('rfor', 'عرض تقرير', `<select class="in" id="rfor">${pool.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)} — ${esc(x.title)} · ${esc(cName(x.committee))}</option>`).join('')}</select>`, false)}</div>` : ''}
   <div class="card"><div class="score"><div class="ring"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="62" fill="none" stroke="#e9eef0" stroke-width="12"/><circle id="rg" cx="75" cy="75" r="62" fill="none" stroke="${col(mt.total)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C2}" stroke-dashoffset="${C2}" style="transition:stroke-dashoffset 1.4s ease"/></svg><b>${mt.total == null ? '—' : `<span><span data-count="${mt.total}">0</span>%</span>`}</b></div>
    <div><div class="eyebrow">تقرير جودة الأداء · الدورة ${esc(CFG.CYCLE)}</div><h3 style="font-size:26px">التقدير العام: <span style="color:${col(mt.total)}">${mt.grade}</span></h3><p class="mute" style="margin:0">${esc(m.name)}${m.sid ? ' · الرقم الجامعي ' + esc(m.sid) : ''} · ${esc(m.title)} — ${esc(cName(m.committee))}<br>حتى تاريخ ${fmt(iso(today))}</p><p class="small mute" style="margin:8px 0 0">الأوزان: المواعيد 25% · الجودة 25% · الحضور 20% · الإنجاز 15% · الساعات 15% (يُحتسب ما تتوفر بياناته فقط)</p></div></div></div>
   <div class="kpis" style="margin-top:16px">${[['ساعة تطوعية معتمدة', mt.hrs, '', 'var(--teal)'], ['ساعات بانتظار الاعتماد', mt.pend, '', 'var(--warn)'], ['تقييم القادة والجودة', mt.lead, '%', 'var(--gold)'], ['مهام متأخرة', mt.late, '', 'var(--bad)']].map(([l, v, s, c], i) => `<div class="card kpi rv d${i}" style="--c:${c}"><div class="v">${v == null ? '—' : `<span data-count="${v}" data-suf="${s}">0</span>`}</div><div class="l">${l}</div></div>`).join('')}</div>
   <div class="split2"><div class="card"><h3>مؤشرات الجودة</h3>${rows.map(([l, v, h]) => `<div class="mrow"><div><b style="font-weight:600">${l}</b><br><span class="small mute">${h}</span></div><div class="bar"><i data-w="${v ?? 0}" style="background:${col(v)}"></i></div><div class="num" style="font-weight:700;color:${col(v)}">${pctTxt(v)}</div></div>`).join('')}</div>
    <div class="card tablecard"><h3 style="padding:22px 22px 6px">سجل الحضور</h3>${mt.att.length ? `<table><thead><tr><th>التاريخ</th><th>النشاط</th><th>الحالة</th></tr></thead><tbody>${mt.att.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map(a => `<tr><td style="white-space:nowrap">${fmt(a.date, { day: 'numeric', month: 'short' })}</td><td>${esc(a.name)}</td><td><span class="chip ${a.s === 'p' ? 'ok' : a.s === 'e' ? 'warn' : 'bad'}">${a.s === 'p' ? 'حاضر' : a.s === 'e' ? 'معتذر' : 'غائب'}</span></td></tr>`).join('')}</tbody></table>` : '<p class="empty">لم يُسجَّل حضور بعد.</p>'}</div></div>
   <div class="split2"><div class="card"><h3>التقييمات والملاحظات التطويرية</h3>${mt.ev.slice().reverse().map(e => `<div class="ev"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b style="font-weight:600">${esc(e.role)}</b><span class="small mute">${esc(mName(e.by))} · ${fmt(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><div class="small" style="display:flex;gap:14px;flex-wrap:wrap;margin:6px 0">${[['الجودة', e.q], ['الالتزام', e.c], ['العمل الجماعي', e.tw], ['المبادرة', e.in]].map(([k, v]) => `<span>${k}: <b class="num">${(+v).toFixed(1)}/5</b></span>`).join('')}</div><p class="small" style="margin:0">${esc(e.note)}</p></div>`).join('') || '<p class="mute">لا توجد تقييمات بعد.</p>'}
     ${canEval ? `<button class="btn ghost sm" id="addEval">${ic('plus', 'width:16px;height:16px')}إضافة تقييم (${evalRole()})</button>` : ''}</div>
    <div class="card tablecard"><div style="display:flex;justify-content:space-between;align-items:center;padding:22px 22px 6px;gap:10px;flex-wrap:wrap"><h3 style="margin:0">الساعات التطوعية</h3>${m.id === me.id ? `<button class="btn ghost sm" id="addHrs">${ic('plus', 'width:16px;height:16px')}طلب اعتماد ساعات</button>` : ''}</div>
     ${mt.hrsL.length ? `<table><thead><tr><th>النشاط</th><th class="num">الساعات</th><th>الاعتماد</th></tr></thead><tbody>${mt.hrsL.map(h => `<tr><td>${esc(h.task)}<br><span class="mini">${h.date ? fmt(h.date, { day: 'numeric', month: 'short' }) : ''}</span></td><td class="num">${+h.h}</td><td>${h.ok ? '<span class="chip ok">معتمدة</span>' : canApprove ? `<button class="btn sm" data-ok="${esc(h.id)}">اعتماد</button> <button class="btn ghost sm" data-rej="${esc(h.id)}">رفض</button>` : '<span class="chip warn">بانتظار الاعتماد</span>'}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">لا توجد ساعات مسجلة.</p>'}</div></div>
   <div class="toolbar"><button class="btn" id="cert">${ic('printer', 'width:18px;height:18px')}طباعة شهادة الأداء الرسمية</button><button class="btn ghost" id="rcsv">${ic('download', 'width:18px;height:18px')}تصدير CSV</button>${isAdmin() && pool.length > 1 ? `<button class="btn ghost" id="rcsvAll">${ic('download', 'width:18px;height:18px')}تصدير تقرير كل الأعضاء</button>` : ''}</div>`;
  setTimeout(() => { const r = $('#rg'); if (r && mt.total != null) r.style.strokeDashoffset = C2 * (1 - mt.total / 100); }, 250);
  if ($('#rfor')) $('#rfor').onchange = e => { reportFor = e.target.value; renderPortal(); };
  if ($('#addEval')) $('#addEval').onclick = () => openModal(`${mhead('إضافة تقييم — ' + esc(m.name))}<form id="ef" novalidate><div class="grid2">${[['q', 'جودة المخرجات'], ['c', 'الالتزام'], ['tw', 'العمل الجماعي'], ['in', 'المبادرة']].map(([k, l]) => fld('e_' + k, l + ' (1–5)', `<input class="in" type="number" min="1" max="5" step="0.5" value="4" id="e_${k}">`)).join('')}</div>${fld('enote', 'الملاحظة التطويرية', '<textarea class="in" id="enote"></textarea>')}<div style="display:flex;gap:10px"><button class="btn">اعتماد التقييم</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#ef').onsubmit = async e => { e.preventDefault(); if (setErr('enote', val('enote').length < 10 ? 'اكتب ملاحظة تطويرية واضحة (10 أحرف على الأقل)' : '')) return; const g = k => Math.max(1, Math.min(5, +val('e_' + k) || 3));
      if (await guard(() => Store.save('evals', { memberId: m.id, by: me.id, role: evalRole(), date: iso(new Date()), q: g('q'), c: g('c'), tw: g('tw'), in: g('in'), note: val('enote') }), 'اعتُمد التقييم') !== undefined) { closeModal(); renderPortal(); } }; });
  if ($('#addHrs')) $('#addHrs').onclick = () => openModal(`${mhead('طلب اعتماد ساعات تطوعية')}<form id="hf" novalidate>${fld('htask', 'النشاط', '<input class="in" id="htask" placeholder="مثال: تنظيم ورشة الإرشاد السياحي">')}<div class="grid2">${fld('hh', 'عدد الساعات', '<input class="in" type="number" id="hh" min="1" max="24" value="2">')}${fld('hd', 'التاريخ', `<input class="in" type="date" id="hd" value="${iso(today)}" max="${iso(today)}">`)}</div><div style="display:flex;gap:10px"><button class="btn">إرسال للاعتماد</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#hf').onsubmit = async e => { e.preventDefault(); const hh = +val('hh'); const errs = [setErr('htask', val('htask').length < 4 ? 'اكتب اسم النشاط' : ''), setErr('hh', hh >= 1 && hh <= 24 ? '' : 'من 1 إلى 24 ساعة')]; if (errs.some(Boolean)) return;
      if (await guard(() => Store.save('hours', { memberId: me.id, task: val('htask'), h: hh, date: val('hd'), ok: false }), 'أُرسل الطلب إلى قائد اللجنة') !== undefined) { closeModal(); renderPortal(); } }; });
  $$('#pBody [data-ok]').forEach(x => x.onclick = async () => { const h = Store.get('hours', x.dataset.ok); h.ok = true; h.approvedBy = me.id; await guard(() => Store.save('hours', h), 'اعتُمدت الساعات'); renderPortal(); });
  $$('#pBody [data-rej]').forEach(x => x.onclick = async () => { await guard(() => Store.remove('hours', x.dataset.rej), 'رُفض الطلب'); renderPortal(); });
  const repRow = (x, t) => [x.name, x.sid || '', x.title, cName(x.committee), t.total ?? '', t.grade, t.punct ?? '', t.attn ?? '', t.q ?? '', t.comp ?? '', t.hrs].map(csvCell).join(',');
  const head = ['الاسم', 'الرقم الجامعي', 'الصفة', 'اللجنة', 'التقدير العام %', 'التقدير', 'الالتزام بالمواعيد %', 'الحضور %', 'جودة المخرجات %', 'إنجاز المهام %', 'الساعات المعتمدة'].map(csvCell).join(',');
  $('#rcsv').onclick = () => download(`تقرير-جودة-${m.name.split(' ')[0]}.csv`, head + '\n' + repRow(m, mt));
  if ($('#rcsvAll')) $('#rcsvAll').onclick = () => download('تقارير-الجودة.csv', head + '\n' + pool.map(x => repRow(x, metrics(x.id))).join('\n'));
  $('#cert').onclick = () => printCert(m, mt, rows);
}
function printCert(m, mt, rows) {
  const leader = m.committee ? members().find(x => x.committee === m.committee && x.order === 1) : null, head = Store.get('members', 'm-lead');
  $('#cert').innerHTML = `<div class="frame"><div class="logos"><img src="assets/logo-ksu.png" alt=""><img src="assets/logo-tamooh.png" alt=""><img src="assets/logo-sts.png" alt=""></div>
   <h1>شهادة تقييم الأداء</h1><div class="sub">مبادرة طموح — الجمعية السعودية للسياحة · جامعة الملك سعود · الدورة ${esc(CFG.CYCLE)}</div>
   <p>تشهد مبادرة طموح بأن <b>${esc(m.name)}</b>${m.sid ? ` (الرقم الجامعي ${esc(m.sid)})` : ''}، ${esc(m.title)} في ${esc(cName(m.committee))}، قد حصل/ت على تقدير <b>${esc(mt.grade)}</b>${mt.total != null ? ` بنسبة <b>${mt.total}%</b>` : ''} في تقييم الأداء حتى تاريخ ${fmt(iso(today))}، وفق المؤشرات التالية:</p>
   <table><thead><tr><th>المؤشر</th><th>النتيجة</th><th>الأساس</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${pctTxt(r[1])}</td><td>${r[2]}</td></tr>`).join('')}<tr><td>الساعات التطوعية المعتمدة</td><td>${mt.hrs} ساعة</td><td>المستهدف ${HOURS_TARGET} ساعة</td></tr></tbody></table>
   ${mt.ev.length ? `<p style="margin-top:14px"><b>آخر ملاحظة تطويرية:</b> ${esc(mt.ev[mt.ev.length - 1].note)}</p>` : ''}
   <div class="sig"><div>${leader ? esc(leader.title) + '<br><b>' + esc(leader.name) + '</b>' : 'قائد اللجنة'}</div><div>قائد المبادرة<br><b>${esc(head?.name || '')}</b></div></div></div>`;
  document.body.classList.add('print-cert'); const done = () => { document.body.classList.remove('print-cert'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done); try { window.print(); } catch (e) {} setTimeout(() => { if (document.body.classList.contains('print-cert')) { done(); toast('إذا لم تظهر نافذة الطباعة افتح المنصة من رابطها المستقل ثم أعد المحاولة'); } }, 1500);
}

/* ---------- إدارة الأعضاء والحسابات والحضور ---------- */
async function renderAdmin() { const b = $('#pBody'); await loadCreds();
  const list = scopeMembers().sort((a, x) => (a.committee || '').localeCompare(x.committee || '') || byOrder(a, x));
  const st = id => credMap[id] === 'active' ? '<span class="chip ok">مفعّل</span>' : credMap[id] === 'pending' ? '<span class="chip warn">بانتظار التفعيل</span>' : '<span class="chip">لا يوجد حساب</span>';
  b.innerHTML = `${Store.mode === 'local' && isSuper() ? `<div class="banner">${ic('lock')}<span>المنصة تعمل حالياً بالتخزين المحلي على هذا الجهاز. ليتمكن القادة والأعضاء من الدخول من أجهزتهم، اربط قاعدة بيانات Supabase باتباع الخطوات الثلاث في ملف README.</span></div>` : ''}
   <div class="rep-head"><div><h3 style="margin:0">${isSuper() ? 'جميع أعضاء المبادرة' : 'أعضاء ' + esc(cName(me.committee))} <span class="mute small">(${list.length})</span></h3></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn ghost" id="attBtn">${ic('check', 'width:18px;height:18px')}تسجيل حضور</button><button class="btn gold" id="addM">${ic('plus', 'width:18px;height:18px')}إضافة عضو</button><button class="btn ghost" id="mcsv">${ic('download', 'width:18px;height:18px')}تصدير</button></div></div>
   <div class="card tablecard" style="margin-top:16px"><table class="stack"><thead><tr><th>الاسم</th><th>الصفة</th><th>اللجنة</th><th>الرقم الجامعي</th><th>الحساب</th><th>إجراءات</th></tr></thead><tbody>${list.map(m => { const own = m.id === me.id, can = isSuper() || (m.level === 'member'); return `<tr><td><b style="font-weight:600">${esc(m.name)}</b></td><td>${esc(m.title)}<br><span class="mini">${LEVEL[m.level]}</span></td><td>${esc(cName(m.committee))}</td><td class="num">${esc(m.sid || '—')}</td><td>${st(m.id)}</td>
     <td style="white-space:nowrap">${!own && can && credMap[m.id] !== 'active' ? `<button class="btn sm" data-code="${m.id}">${ic('key', 'width:16px;height:16px')}رمز تفعيل</button> ` : ''}${!own && can ? `<button class="btn ghost sm" data-edit="${m.id}">تعديل</button>` : ''}${own ? '<span class="mini">حسابك</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>
   <p class="note">رمز التفعيل يُستخدم مرة واحدة؛ أرسله للعضو ليفعّل حسابه من «تفعيل الحساب لأول مرة». إصدار رمز جديد يُلغي أي رمز سابق.</p>`;
  $$('#pBody [data-code]').forEach(x => x.onclick = () => issueCode(Store.get('members', x.dataset.code)));
  $$('#pBody [data-edit]').forEach(x => x.onclick = () => memberForm(Store.get('members', x.dataset.edit)));
  $('#addM').onclick = () => memberForm(); $('#attBtn').onclick = attendanceForm;
  animate(b);
  $('#mcsv').onclick = () => download('أعضاء-طموح.csv', ['الاسم', 'الصفة', 'الصلاحية', 'اللجنة', 'الرقم الجامعي', 'حالة الحساب'].map(csvCell).join(',') + '\n' + list.map(m => [m.name, m.title, LEVEL[m.level], cName(m.committee), m.sid || '', credMap[m.id] === 'active' ? 'مفعّل' : credMap[m.id] === 'pending' ? 'بانتظار التفعيل' : 'لا يوجد'].map(csvCell).join(',')).join('\n'));
}
async function issueCode(m) { if (credMap[m.id] === 'pending') { const ok = await new Promise(r => confirmBox('إصدار رمز جديد', `يوجد رمز سابق لم يُستخدم لـ ${esc(m.name)}. إصدار رمز جديد يُلغي السابق.`, () => r(true), 'إصدار رمز جديد')); if (!ok) return; }
  const code = await guard(() => Store.backend.issueCode(me.id, session.h, m.id, m.level, m.committee)); if (!code) return;
  openModal(`${mhead('رمز تفعيل الحساب')}<p>أرسل الرمز التالي إلى <b>${esc(m.name)}</b> (${esc(m.title)}) بشكل خاص. يُستخدم مرة واحدة من «بوابة العضو ← تفعيل الحساب لأول مرة».</p><div class="code">${esc(code)}</div><div style="display:flex;gap:10px"><button class="btn" id="cpc">نسخ الرمز</button><button class="btn ghost" data-close>تم</button></div>`, () => { $('#cpc').onclick = () => copyText(`رمز تفعيل حسابك في منصة طموح: ${code}\nادخل إلى بوابة العضو ← تفعيل الحساب لأول مرة، واختر اسمك: ${m.name}`); });
  renderPortal(); }
function memberForm(m) { const edit = !!m; m = m || { level: 'member', committee: isSuper() ? CK[0] : me.committee, status: 'active', source: 'manual' };
  const titles = { super: ['قائد المبادرة', 'نائب المبادرة', 'مساعد إداري'], cadmin: ['قائد اللجنة', 'قائدة اللجنة', 'نائب القائد', 'نائبة القائدة', 'نائبة القائد'], member: ['عضو', 'عضوة'] };
  openModal(`${mhead(edit ? 'تعديل بيانات العضو' : 'إضافة عضو')}<form id="mf" novalidate>${fld('mfn', 'الاسم الكامل', `<input class="in" id="mfn" value="${esc(m.name || '')}">`)}<div class="grid2">
   ${isSuper() ? fld('mfl', 'الصلاحية', `<select class="in" id="mfl">${Object.entries(LEVEL).map(([k, v]) => `<option value="${k}" ${m.level === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`) : ''}
   ${fld('mfc', 'اللجنة', `<select class="in" id="mfc" ${isSuper() ? '' : 'disabled'}>${isSuper() ? '<option value="">— (الإدارة العليا)</option>' : ''}${CK.map(k => `<option value="${k}" ${m.committee === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`)}
   ${fld('mft', 'الصفة', `<input class="in" id="mft" list="tl1" value="${esc(m.title || 'عضو')}"><datalist id="tl1">${Object.values(titles).flat().map(t => `<option value="${t}">`).join('')}</datalist>`)}</div>
   ${edit ? `<label class="check"><input type="checkbox" id="mfx" ${m.status === 'inactive' ? 'checked' : ''}> إيقاف العضوية (يُلغى الحساب ولا يستطيع الدخول)</label>` : ''}
   <div style="display:flex;gap:10px;margin-top:14px"><button class="btn">${edit ? 'حفظ' : 'إضافة'}</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#mf').onsubmit = async e => { e.preventDefault(); const name = val('mfn'); if (setErr('mfn', V.name(name))) return;
      const level = isSuper() ? val('mfl') : 'member', committee = isSuper() ? (val('mfc') || null) : me.committee;
      if (level !== 'super' && !committee) return setErr('mfc', 'اختر اللجنة');
      const prevLevel = m.level, prevCom = m.committee, wasActive = m.status !== 'inactive';
      Object.assign(m, { name: name.replace(/\s+/g, ' '), level, committee: level === 'super' ? null : committee, title: val('mft') || 'عضو', order: m.order || (/قائد/.test(val('mft')) && !/نائب/.test(val('mft')) ? 1 : /نائب/.test(val('mft')) ? 2 : 5) });
      const stop = $('#mfx')?.checked; m.status = stop ? 'inactive' : 'active';
      if (await guard(() => Store.save('members', m)) === undefined) return;
      if (edit && stop && wasActive) await guard(() => Store.backend.revoke(me.id, session.h, m.id));
      else if (edit && credMap[m.id] && (prevLevel !== m.level || prevCom !== m.committee)) await guard(() => Store.backend.setLevel(me.id, session.h, m.id, m.level, m.committee));
      closeModal(); toast(edit ? 'حُفظت البيانات' : 'أُضيف العضو — أصدر له رمز تفعيل'); renderPortal(); };
  });
}
function attendanceForm() { const list = scopeMembers().filter(m => m.id !== me.id || isCAdmin()).sort(byOrder);
  openModal(`${mhead('تسجيل حضور')}<form id="atf" novalidate><div class="grid2">${fld('atn', 'النشاط', `<input class="in" id="atn" list="atl" placeholder="مثال: اجتماع اللجنة الأسبوعي"><datalist id="atl"><option value="اجتماع اللجنة الأسبوعي"><option value="لمة طموح الشهرية">${Store.all('events').map(e => `<option value="${esc(e.t)}">`).join('')}</datalist>`)}${fld('atd', 'التاريخ', `<input class="in" type="date" id="atd" value="${iso(today)}" max="${iso(today)}">`)}</div>
   <label>الأعضاء</label><div class="checks">${list.map(m => `<label><span>${esc(m.name)}<br><span class="mini">${esc(cName(m.committee))}</span></span><select class="in" data-m="${m.id}"><option value="p">حاضر</option><option value="a">غائب</option><option value="e">معتذر</option><option value="">—</option></select></label>`).join('')}</div>
   <div style="display:flex;gap:10px;margin-top:14px"><button class="btn">حفظ الحضور</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#atf').onsubmit = async e => { e.preventDefault(); if (setErr('atn', val('atn').length < 3 ? 'اكتب اسم النشاط' : '')) return; let n = 0;
      for (const s of $$('#atf [data-m]')) if (s.value) { await guard(() => Store.save('attendance', { memberId: s.dataset.m, name: val('atn'), date: val('atd'), s: s.value, by: me.id })); n++; }
      closeModal(); toast(`سُجّل حضور ${n} عضو`); renderPortal(); }; }, true);
}

/* ================================ 3. الفعاليات ================================ */
let evF = 'all';
const going = id => Store.all('rsvps').filter(r => r.eventId === id);
const canEv = e => isSuper() || (isCAdmin() && e.cm === me.committee);
function renderEvents() { const up = Store.all('events').filter(e => pd(e.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
  $('#evAdmin').innerHTML = isAdmin() ? `<button class="btn gold" id="addEv">${ic('plus', 'width:18px;height:18px')}إضافة فعالية</button>` : '';
  const feat = up.filter(e => e.f).slice(0, 4);
  const tk = (e, i) => { const g = going(e.id), mine = me && g.some(r => r.memberId === me.id), full = e.cap && g.length >= e.cap; return `<article class="card ticket hov rv d${i % 2}"><div class="stub" style="--cc:${C[e.cm]?.c || 'var(--teal)'}"><span class="wd">${fmt(e.date, { weekday: 'long' })}</span><span class="dd">${pd(e.date).getDate()}</span><span class="mm">${fmt(e.date, { month: 'long' })}</span></div>
    <div class="body"><span class="chip ${TCH[e.type]}">${TYPES[e.type]}</span><h3 style="margin-top:10px">${esc(e.t)}</h3><p class="small mute" style="margin:0">${esc(e.desc || '')}</p>
    <ul class="meta"><li>${ic('cal')}<span>${fmt(e.date)} · <span class="mute">${hij(e.date)}</span></span></li><li>${ic('clock')}<span style="white-space:nowrap">${esc(e.time)}</span></li><li>${ic('pin')}<span>${esc(e.loc)}</span></li><li>${ic('bank')}<span>${esc(e.host)}</span></li><li>${ic(C[e.cm]?.i || 'users')}<span>${esc(cName(e.cm))}</span></li></ul>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn sm ${mine ? 'ghost' : ''}" data-rsvp="${esc(e.id)}" ${full && !mine ? 'disabled' : ''}>${mine ? '✓ حضورك مؤكد — إلغاء' : full ? 'اكتمل العدد' : 'تأكيد الحضور'}</button><span class="small mute">${g.length} مؤكد${e.cap ? ' من ' + e.cap : ''}</span>${me && canEv(e) ? `<button class="btn ghost sm" data-eved="${esc(e.id)}">إدارة</button>` : ''}</div></div></article>`; };
  $('#featured').innerHTML = feat.length ? feat.map(tk).join('') : '<p class="empty">لا توجد فعاليات رئيسية قادمة حالياً.</p>';
  $('#evFilter').innerHTML = [['all', 'الكل'], ...Object.entries(TYPES)].map(([k, v]) => `<button aria-pressed="${evF === k}" data-f="${k}">${v} (${k === 'all' ? up.length : up.filter(e => e.type === k).length})</button>`).join('');
  const L = up.filter(e => evF === 'all' || e.type === evF), groups = {}; L.forEach(e => (groups[e.date] = groups[e.date] || []).push(e));
  $('#agenda').innerHTML = Object.keys(groups).length ? Object.entries(groups).map(([dt, es], gi) => { const dd = Math.round((pd(dt) - today) / DAY); return `<div class="day"><div class="when" data-py="-20">${fmt(dt, { day: 'numeric', month: 'short' })}<small>${fmt(dt, { weekday: 'long' })} · ${dd === 0 ? 'اليوم' : dd === 1 ? 'غداً' : 'بعد ' + dd + ' يوماً'}</small></div><div data-enter="${gi % 2 ? 1 : -1}">${es.map(e => { const mine = me && going(e.id).some(r => r.memberId === me.id); return `<div class="it"><div><b style="font-weight:600">${esc(e.t)}</b> <span class="chip ${TCH[e.type]}">${TYPES[e.type]}</span><br><span class="small mute">${esc(e.time)} · ${esc(e.loc)} · ${esc(cName(e.cm))}</span></div><div style="display:flex;gap:8px"><button class="btn sm ${mine ? 'ghost' : ''}" data-rsvp="${esc(e.id)}">${mine ? '✓ مؤكد' : 'تأكيد الحضور'}</button>${me && canEv(e) ? `<button class="btn ghost sm" data-eved="${esc(e.id)}">إدارة</button>` : ''}</div></div>`; }).join('')}</div></div>`; }).join('') : '<p class="empty">لا توجد أنشطة من هذا النوع في الأيام القادمة.</p>';
  $$('#evFilter [data-f]').forEach(b => b.onclick = () => { evF = b.dataset.f; renderEvents(); });
  $$('#v-events [data-rsvp]').forEach(b => b.onclick = async () => { if (!me) { toast('سجّل دخولك أولاً لتأكيد الحضور'); location.hash = 'portal'; return; }
    const id = b.dataset.rsvp, ex = going(id).find(r => r.memberId === me.id);
    if (ex) await guard(() => Store.remove('rsvps', ex.id), 'أُلغي تأكيد الحضور'); else await guard(() => Store.save('rsvps', { id: id + '__' + me.id, eventId: id, memberId: me.id }), 'تم تأكيد حضورك');
    renderEvents(); });
  $$('#v-events [data-eved]').forEach(b => b.onclick = () => eventAdmin(Store.get('events', b.dataset.eved)));
  if ($('#addEv')) $('#addEv').onclick = () => eventForm();
  animate($('#v-events'));
}
function eventAdmin(e) { const g = going(e.id);
  openModal(`${mhead(esc(e.t))}<p class="mute">${fmt(e.date)} · ${esc(e.time)} · ${esc(e.loc)}</p><h3>المؤكدون (${g.length})</h3>${g.length ? `<ul class="lst">${g.map(r => { const m = Store.get('members', r.memberId); return `<li>${ic('user')}<span>${esc(m?.name || '—')}<br><span class="mini">${esc(cName(m?.committee))}</span></span></li>`; }).join('')}</ul>` : '<p class="mute">لا يوجد مؤكدون بعد.</p>'}
   <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn" id="eve">تعديل الفعالية</button><button class="btn ghost" id="evcsv">تصدير المؤكدين</button><button class="btn ghost" id="evd" style="color:var(--bad)">حذف الفعالية</button><button class="btn ghost" data-close>إغلاق</button></div>`, () => {
    $('#eve').onclick = () => eventForm(e);
    $('#evcsv').onclick = () => download(`حضور-${e.date}.csv`, ['الاسم', 'اللجنة', 'الرقم الجامعي'].map(csvCell).join(',') + '\n' + g.map(r => { const m = Store.get('members', r.memberId) || {}; return [m.name, cName(m.committee), m.sid || ''].map(csvCell).join(','); }).join('\n'));
    $('#evd').onclick = () => confirmBox('حذف الفعالية', `سيتم حذف «${esc(e.t)}» وتأكيدات حضورها.`, async () => { for (const r of g) await Store.remove('rsvps', r.id); await guard(() => Store.remove('events', e.id), 'حُذفت الفعالية'); renderEvents(); });
  }, true); }
function eventForm(e) { const edit = !!e; e = e || { type: 'meet', date: iso(+today + 7 * DAY), time: '8:00 م', cm: isSuper() ? 'projects' : me.committee, f: false };
  const coms = isSuper() ? CK : [me.committee];
  openModal(`${mhead(edit ? 'تعديل الفعالية' : 'إضافة فعالية أو لمّة')}<form id="evf" novalidate>${fld('et', 'العنوان', `<input class="in" id="et" value="${esc(e.t || '')}">`)}${fld('edesc', 'نبذة', `<textarea class="in" id="edesc">${esc(e.desc || '')}</textarea>`, false)}
   <div class="grid2">${fld('ety', 'النوع', `<select class="in" id="ety">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${e.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`)}${fld('ecm', 'اللجنة المسؤولة', `<select class="in" id="ecm">${coms.map(k => `<option value="${k}" ${e.cm === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`)}
   ${fld('ed', 'التاريخ', `<input class="in" type="date" id="ed" value="${esc(e.date)}" min="${iso(today)}">`)}${fld('etm', 'الوقت', `<input class="in" id="etm" value="${esc(e.time)}">`)}
   ${fld('el', 'الموقع', `<input class="in" id="el" value="${esc(e.loc || '')}" placeholder="داخل الجامعة أو خارجها">`)}${fld('eh', 'الجهة المستضيفة / الشريكة', `<input class="in" id="eh" value="${esc(e.host || 'مبادرة طموح')}">`)}
   ${fld('ecap', 'الحد الأقصى للحضور', `<input class="in" type="number" min="0" id="ecap" value="${e.cap || ''}" placeholder="بدون حد">`, false)}</div>
   <label class="check"><input type="checkbox" id="ef1" ${e.f ? 'checked' : ''}> عرضها ضمن أبرز الفعاليات القادمة</label>
   <div style="display:flex;gap:10px;margin-top:14px"><button class="btn">${edit ? 'حفظ' : 'إضافة إلى الجدول'}</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#evf').onsubmit = async ev => { ev.preventDefault(); const errs = [setErr('et', val('et').length < 4 ? 'اكتب عنواناً واضحاً' : ''), setErr('ed', val('ed') && pd(val('ed')) >= today ? '' : 'اختر تاريخاً قادماً'), setErr('el', V.req(val('el'), 'الموقع'))]; if (errs.some(Boolean)) return;
      Object.assign(e, { t: val('et'), desc: val('edesc'), type: val('ety'), cm: val('ecm'), date: val('ed'), time: val('etm') || '—', loc: val('el'), host: val('eh') || 'مبادرة طموح', cap: +val('ecap') || null, f: $('#ef1').checked }); if (!edit) e.createdBy = me.id;
      if (await guard(() => Store.save('events', e), edit ? 'حُفظت الفعالية' : 'أُضيفت الفعالية') !== undefined) { closeModal(); renderEvents(); } }; }, true);
}

/* ================================ 4. صفحتي ولجنتي ================================ */
let hubC = null;
function renderHub() { const el = $('#hubBox'); const k = hubC || (me && me.committee) || CK[0], cm = C[k];
  const ms = members().filter(m => m.committee === k), leads = ms.filter(m => m.level === 'cadmin').sort(byOrder), mems = ms.filter(m => m.level === 'member').sort(byOrder);
  const ct = Store.all('tasks').filter(t => t.committee === k), open = ct.filter(t => t.status !== 'done');
  let head = '';
  if (me) { const mt = metrics(me.id); head = `<div class="pass rv"><div class="main"><div class="eyebrow">بطاقة العضوية · ${LEVEL[me.level]}</div><h2 style="font-size:clamp(26px,3.4vw,38px);margin-bottom:4px">أهلاً ${esc(me.name.split(' ')[0])}، <mark class="hl" style="--hl:100%">خلك طموح</mark></h2><p class="mute" style="margin:0">${esc(me.name)}</p>
    <dl><div><dt>الرقم الجامعي</dt><dd>${esc(me.sid || '—')}</dd></div><div><dt>الصفة</dt><dd>${esc(me.title)}</dd></div><div><dt>الجهة</dt><dd>${esc(cName(me.committee))}</dd></div><div><dt>الهوية</dt><dd dir="ltr" style="text-align:end">${esc(me.nidMask || '—')}</dd></div></dl></div>
    <div class="side"><div><span class="small" style="color:#b9d4cf">التقدير الحالي</span><div style="font-family:var(--hf);font-size:44px;font-weight:800;line-height:1.1">${mt.total == null ? '—' : `<span data-count="${mt.total}">0</span>%`}</div><span class="small" style="color:#e8d7b6">${mt.grade}</span></div><div class="small" style="color:#d4e6e2">${mt.tasks.filter(t => t.status !== 'done').length} مهام مفتوحة · ${mt.late} متأخرة<br>${mt.hrs} ساعة تطوعية معتمدة</div></div></div>`; }
  else head = `<div class="card" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><div><h3 style="margin:0">سجّل دخولك لعرض مساحة عملك</h3><p class="mute" style="margin:0">يمكنك استعراض اللجان السبع وقياداتها الآن.</p></div><a class="btn" href="#portal">تسجيل الدخول</a></div>`;
  const overview = isSuper() ? `<div class="card tablecard rv" style="margin-top:20px"><h3 style="padding:22px 22px 6px">لوحة الإدارة العليا — نظرة على اللجان</h3><div class="scroll"><table class="sumtable"><thead><tr><th>اللجنة</th><th>الأعضاء</th><th>مهام مفتوحة</th><th>متأخرة</th><th>مكتملة</th><th>طلبات جديدة</th></tr></thead><tbody>${CK.map(x => { const t = Store.all('tasks').filter(t => t.committee === x); return `<tr class="click" data-c="${x}"><td><b style="font-weight:600">${C[x].n}</b></td><td>${members().filter(m => m.committee === x).length}</td><td>${t.filter(t => t.status !== 'done').length}</td><td style="color:${t.filter(t => stOf(t) === 'late').length ? 'var(--bad)' : ''}">${t.filter(t => stOf(t) === 'late').length}</td><td>${t.filter(t => t.status === 'done').length}</td><td>${Store.all('applicants').filter(a => a.status === 'review' && (a.choice1 === x || a.assigned === x)).length}</td></tr>`; }).join('')}</tbody></table></div></div>` : '';
  const adm = me && canCom(k);
  el.innerHTML = `${head}${overview}<div class="cmts" role="group" aria-label="اختر اللجنة">${CK.map(x => `<button aria-pressed="${x === k}" data-c="${x}" style="--c:${C[x].c}">${ic(C[x].i)}${C[x].n}${me && me.committee === x ? '<span class="small" style="color:var(--gold)">لجنتك</span>' : ''}</button>`).join('')}</div>
   <div class="card" style="border-top:3px solid ${cm.c}"><div class="chead"><span class="icbox" style="color:${cm.c}">${ic(cm.i)}</span><div><h2 data-scrub style="font-size:clamp(26px,3.2vw,36px)">${cm.n}</h2><p data-scrub style="font-size:17px;max-width:62em;margin:0;color:var(--ink2)">${cm.d}</p></div></div></div>
   <div class="people" style="margin-top:20px">${leads.map(m => `<div class="person rv"><span class="av" style="background:${cm.c}">${initials(m.name)}</span><div><span class="mini">${esc(m.title)}</span><b>${esc(m.name)}</b></div></div>`).join('') || '<p class="mute">لم تُحدَّد قيادة اللجنة بعد.</p>'}</div>
   ${adm ? `<div class="links"><a href="#portal" data-go="assign" class="rv"><span class="icbox">${ic('plus')}</span><div>إسناد مهمة<span>لأعضاء ${esc(cm.n)}</span></div></a><a href="#join" data-go="ats" class="rv d1"><span class="icbox">${ic('inbox')}</span><div>طلبات المتقدمين<span>${Store.all('applicants').filter(a => a.status === 'review' && (a.choice1 === k || a.choice2 === k || a.assigned === k)).length} طلب قيد المراجعة</span></div></a><a href="#portal" data-go="admin" class="rv d2"><span class="icbox">${ic('users')}</span><div>الأعضاء والحضور<span>رموز التفعيل وتسجيل الحضور</span></div></a></div>`
     : me ? `<div class="links"><a href="#portal" data-go="tasks" class="rv"><span class="icbox">${ic('list')}</span><div>مهامي<span>حدّث حالة مهامك</span></div></a><a href="#portal" data-go="report" class="rv d1"><span class="icbox">${ic('chart')}</span><div>تقرير جودة الأداء<span>مؤشراتك وتقييماتك</span></div></a><a href="#events" class="rv d2"><span class="icbox">${ic('cal')}</span><div>الفعاليات القادمة<span>أكّد حضورك</span></div></a></div>` : ''}
   <div class="hubg"><div class="col">
    <div class="card rv"><h3>خطة عمل اللجنة</h3><ul class="lst">${cm.p.map(p => `<li>${ic('flag')}<span>${p}</span></li>`).join('')}</ul><h3 style="margin-top:18px">المخرجات المعتمدة</h3><ul class="lst">${cm.o.map(p => `<li>${ic('check')}<span>${p}</span></li>`).join('')}</ul></div>
    ${me ? `<div class="card rv"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="margin:0">المهام الجارية</h3><span class="mini">${open.length} مفتوحة · ${ct.length - open.length} مكتملة</span></div>${(adm ? open : open.filter(t => t.assignee === me.id)).length ? `<ul class="lst">${(adm ? open : open.filter(t => t.assignee === me.id)).sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 8).map(t => `<li><span class="chip ${TS[stOf(t)][1]}">${TS[stOf(t)][0]}</span><span><b style="font-weight:600">${esc(t.title)}</b><br><span class="mini">${esc(mName(t.assignee))} · ${t.due ? fmt(t.due, { day: 'numeric', month: 'short' }) : ''}</span></span></li>`).join('')}</ul>` : `<p class="mute" style="margin-top:10px">${adm ? 'لا توجد مهام مفتوحة في اللجنة.' : 'لا توجد مهام مفتوحة لك في هذه اللجنة.'}</p>`}</div>` : ''}
   </div><div class="col">
    <div class="card rv"><h3>أعضاء اللجنة <span class="mute small">(${mems.length})</span></h3>${mems.length ? `<ul class="lst">${mems.map(m => `<li class="mem"><span class="av" style="background:${cm.c}">${initials(m.name)}</span><span><b style="font-weight:600">${esc(m.name)}</b>${me && m.id === me.id ? ' <span class="chip">أنت</span>' : ''}<br><span class="mini">${esc(m.title)}</span></span></li>`).join('')}</ul>` : '<p class="mute">لم يُضَف أعضاء بعد. يُضاف الأعضاء عبر القبول من بوابة التقديم أو من إدارة الأعضاء.</p>'}</div>
    <div class="card rv"><h3>القادم للجنة</h3>${(() => { const n = Store.all('events').filter(e => e.cm === k && pd(e.date) >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3); return n.length ? `<ul class="lst">${n.map(e => `<li>${ic('cal')}<span><b style="font-weight:600">${esc(e.t)}</b><br><span class="mini">${fmt(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(e.time)}</span></span></li>`).join('')}</ul>` : '<p class="mute">لا فعاليات مسندة للجنة حالياً.</p>'; })()}</div>
   </div></div>`;
  el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { hubC = b.dataset.c; renderHub(); });
  el.querySelectorAll('[data-go]').forEach(a => a.onclick = ev => { const g = a.dataset.go; if (g === 'assign') { ev.preventDefault(); taskForm(null, k); return; } if (g === 'ats') { af.cm = k; joinTab = 'ats'; return; } pTab = g; });
  animate(el);
}

/* ================================ 5. التقديم والقبول ================================ */
let af = { q: '', st: 'all', cm: 'all', lv: 'all', mj: '' }, joinTab = null;
const settings = () => Store.get('settings', 'recruitment') || { id: 'recruitment', open: false, cycle: CFG.CYCLE, seq: 0 };
const appScope = () => Store.all('applicants').filter(a => isSuper() || (isCAdmin() && [a.choice1, a.choice2, a.assigned].includes(me.committee)));
function renderJoin() { const el = $('#joinBox'), s = settings();
  if (!joinTab) joinTab = isAdmin() ? 'ats' : 'apply'; if (!isAdmin()) joinTab = 'apply';
  el.innerHTML = `<div class="card rv" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center"><div><div class="eyebrow" style="margin-bottom:6px">دورة الاستقطاب ${esc(s.cycle || CFG.CYCLE)}</div><span class="status-open ${s.open ? '' : 'status-closed'}">${s.open ? 'التقديم مفتوح الآن' : 'التقديم مغلق حالياً'}</span></div>
    ${isAdmin() ? `<label class="switch"><span>${s.open ? 'إغلاق التقديم' : 'فتح التقديم'}</span><input type="checkbox" id="openSw" ${s.open ? 'checked' : ''} ${isSuper() || isCAdmin() ? '' : 'disabled'}><span class="tr"></span></label>` : ''}</div>
   ${isAdmin() ? `<div class="subnav" style="margin-top:20px"><button aria-pressed="${joinTab === 'ats'}" data-j="ats">نظام الفرز والقبول (${appScope().length})</button><button aria-pressed="${joinTab === 'apply'}" data-j="apply">نموذج التقديم</button></div>` : '<div style="height:24px"></div>'}<div id="jBody"></div>`;
  el.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { joinTab = b.dataset.j; renderJoin(); });
  const sw = $('#openSw'); if (sw) sw.onchange = async () => { s.open = sw.checked; s.changedBy = me.id; await guard(() => Store.save('settings', s), s.open ? 'تم فتح التقديم' : 'تم إغلاق التقديم'); renderJoin(); };
  joinTab === 'ats' ? renderATS() : renderApply(); animate(el);
}
function renderApply() { const b = $('#jBody'), s = settings();
  if (!s.open) { b.innerHTML = `<div class="card" style="text-align:center;padding:48px 24px">${ic('lock', 'width:40px;height:40px;color:var(--gold)')}<h2 style="margin-top:14px">التقديم مغلق حالياً</h2><p class="mute" style="max-width:520px;margin:0 auto">تُعلن مواعيد فتح التقديم على عضوية مبادرة طموح عبر الحسابات الرسمية للمبادرة. تابعنا على #خلك_طموح</p></div>`; return; }
  const comOpts = (id, ph) => `<select class="in" id="${id}"><option value="">${ph}</option>${CK.map(k => `<option value="${k}">${C[k].n}</option>`).join('')}</select>`;
  b.innerHTML = `<div class="hubg apply"><form class="card" id="apf" novalidate>
    <fieldset><legend>البيانات الشخصية</legend><div class="fgrid">${fld('ap_name', 'الاسم الرباعي', '<input class="in" id="ap_name" autocomplete="name" placeholder="الاسم الأول واسم الأب والجد والعائلة">', true, 'full')}${fld('ap_sid', 'الرقم الجامعي', '<input class="in" id="ap_sid" inputmode="numeric" maxlength="9">')}${fld('ap_nid', 'رقم الهوية الوطنية', '<input class="in" id="ap_nid" inputmode="numeric" maxlength="10" type="password">')}${fld('ap_phone', 'رقم الجوال', '<input class="in" id="ap_phone" inputmode="tel" maxlength="10" placeholder="05XXXXXXXX" dir="ltr" style="text-align:end">')}${fld('ap_email', 'البريد الجامعي', `<input class="in" id="ap_email" type="email" dir="ltr" style="text-align:end" placeholder="xxxx@${CFG.EMAIL_DOMAINS[0]}">`)}</div></fieldset>
    <fieldset><legend>البيانات الأكاديمية</legend><div class="fgrid">${fld('ap_col', 'الكلية', `<input class="in" id="ap_col" list="cols"><datalist id="cols">${COLLEGES.map(c => `<option value="${c}">`).join('')}</datalist>`)}${fld('ap_maj', 'التخصص', '<input class="in" id="ap_maj">')}${fld('ap_lv', 'المستوى الدراسي', `<select class="in" id="ap_lv"><option value="">اختر المستوى</option>${LEVELS_STUDY.map(l => `<option>${l}</option>`).join('')}</select>`)}</div></fieldset>
    <fieldset><legend>الرغبات</legend><div class="fgrid">${fld('ap_c1', 'الرغبة الأولى', comOpts('ap_c1', 'اختر اللجنة'))}${fld('ap_c2', 'الرغبة الثانية', comOpts('ap_c2', 'اختر اللجنة'))}</div></fieldset>
    <fieldset><legend>الخبرات والمهارات</legend>${fld('ap_exp', 'الخبرات السابقة (تطوع، تنظيم فعاليات، أعمال طلابية)', '<textarea class="in" id="ap_exp"></textarea>')}${fld('ap_sk', 'المهارات', '<textarea class="in" id="ap_sk" placeholder="مثال: التصميم بـ Canva، كتابة المحتوى، التنسيق والتواصل"></textarea>')}${fld('ap_pf', 'رابط البورتفوليو أو الأعمال', '<input class="in" id="ap_pf" dir="ltr" style="text-align:end" placeholder="https://">', false)}</fieldset>
    <label class="check"><input type="checkbox" id="ap_ok"> أقرّ بصحة البيانات المدخلة، وأوافق على استخدامها لأغراض الفرز والقبول في مبادرة طموح.</label><div class="fmsg" id="ap_okM"></div>
    <button class="btn" style="width:100%;margin-top:10px">إرسال طلب الانضمام</button><div class="fmsg" id="apfM" style="text-align:center"></div></form>
   <div class="col"><div class="card"><h3>مراحل القبول</h3><ul class="lst">${[['inbox', 'استلام الطلب ومراجعته من قيادة اللجنة'], ['mic', 'الترشيح للمقابلة الشخصية'], ['check', 'القبول المبدئي ثم النهائي'], ['key', 'إنشاء حسابك تلقائياً والدخول بالرقم الجامعي والهوية']].map(([i, t]) => `<li>${ic(i)}<span>${t}</span></li>`).join('')}</ul></div>
    <div class="card"><h3>حماية بياناتك</h3><p class="small" style="margin:0;color:var(--ink2)">لا يُحفظ رقم الهوية في النظام؛ يُحفظ أثره المشفّر فقط لإنشاء حسابك عند القبول، ويظهر للقادة مقنّعاً. بياناتك يطّلع عليها قادة اللجان التي اخترتها والإدارة العليا فقط.</p></div></div></div>`;
  liveNum('ap_sid', V.sid, 9); liveNum('ap_nid', V.nid, 10); liveNum('ap_phone', V.phone, 10);
  $('#apf').onsubmit = async e => { e.preventDefault();
    const d = { name: val('ap_name').replace(/\s+/g, ' '), sid: toEn(val('ap_sid')), nid: toEn(val('ap_nid')), phone: toEn(val('ap_phone')), email: val('ap_email').toLowerCase(), college: val('ap_col'), major: val('ap_maj'), level: val('ap_lv'), choice1: val('ap_c1'), choice2: val('ap_c2'), experience: val('ap_exp'), skills: val('ap_sk'), portfolio: val('ap_pf') };
    const errs = [setErr('ap_name', V.name(d.name, 4)), setErr('ap_sid', V.sid(d.sid)), setErr('ap_nid', V.nid(d.nid)), setErr('ap_phone', V.phone(d.phone)), setErr('ap_email', V.email(d.email)), setErr('ap_col', V.req(d.college, 'الكلية')), setErr('ap_maj', V.req(d.major, 'التخصص')), setErr('ap_lv', V.req(d.level, 'المستوى')), setErr('ap_c1', V.req(d.choice1, 'الرغبة الأولى')), setErr('ap_c2', !d.choice2 ? 'الرغبة الثانية مطلوبة' : d.choice2 === d.choice1 ? 'اختر لجنة مختلفة عن الرغبة الأولى' : ''), setErr('ap_exp', d.experience.length < 10 ? 'اكتب نبذة عن خبراتك (10 أحرف على الأقل)' : ''), setErr('ap_sk', V.req(d.skills, 'المهارات')), setErr('ap_pf', V.url(d.portfolio)), setErr('ap_ok', $('#ap_ok').checked ? '' : 'يلزم الإقرار للمتابعة')];
    const first = errs.findIndex(Boolean); if (first >= 0) { $$('#apf .in.err')[0]?.focus(); return; }
    await Store.refresh().catch(() => {});
    if (Store.all('applicants').some(a => a.sid === d.sid && a.cycle === (settings().cycle || CFG.CYCLE))) { $('#apfM').textContent = 'يوجد طلب مسجّل بهذا الرقم الجامعي في الدورة الحالية.'; return; }
    if (await Store.backend.sidExists(d.sid).catch(() => false)) { $('#apfM').textContent = 'لديك عضوية مفعّلة في المبادرة بالفعل — ادخل من بوابة العضو.'; return; }
    const st = settings(); st.seq = (st.seq || 0) + 1; const ref = `TM${String(st.cycle || CFG.CYCLE).replace(/\D/g, '')}-${String(st.seq).padStart(4, '0')}`;
    const app = { ref, name: d.name, sid: d.sid, nidMask: mask(d.nid), phone: d.phone, email: d.email, college: d.college, major: d.major, level: d.level, choice1: d.choice1, choice2: d.choice2, assigned: d.choice1, experience: d.experience, skills: d.skills, portfolio: d.portfolio, status: 'review', notes: [], cycle: st.cycle || CFG.CYCLE, submittedAt: new Date().toISOString() };
    const saved = await guard(async () => { const a = await Store.save('applicants', app); await Store.backend.applySecret(a.id, d.sid, idHash(d.nid)); await Store.save('settings', st); return a; }); if (!saved) return;
    $('#jBody').innerHTML = `<div class="card" style="text-align:center;padding:48px 24px">${ic('check', 'width:44px;height:44px;color:var(--ok)')}<h2 style="margin-top:14px">تم استلام طلبك بنجاح</h2><p>رقم الطلب: <b dir="ltr">${esc(ref)}</b></p><p class="mute" style="max-width:560px;margin:0 auto">سيراجع قادة اللجنة طلبك ويتواصلون معك عبر الجوال أو البريد الجامعي. عند القبول النهائي يُنشأ حسابك تلقائياً وتدخل من «بوابة العضو» برقمك الجامعي وهويتك.</p></div>`; scrollTo({ top: $('#joinBox').offsetTop - 80, behavior: 'smooth' }); };
}
function renderATS() { const b = $('#jBody'), all = appScope();
  const majors = [...new Set(all.map(a => a.major).filter(Boolean))];
  b.innerHTML = `<div class="statline">${[['الإجمالي', all.length, 'var(--em)'], ...Object.entries(AS).map(([k, v]) => [v[0], all.filter(a => a.status === k).length, v[2]])].map(([l, n, c]) => `<div class="card" style="--c:${c}"><b>${n}</b><span>${l}</span></div>`).join('')}</div>
   <div class="toolbar" style="margin-top:0">${fld('aq', 'بحث', `<input class="in" id="aq" placeholder="الاسم أو الرقم الجامعي أو رقم الطلب" value="${esc(af.q)}">`, false)}
    ${fld('acm', 'اللجنة المطلوبة', `<select class="in" id="acm"><option value="all">كل اللجان</option>${(isSuper() ? CK : [me.committee]).map(k => `<option value="${k}" ${af.cm === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`, false)}
    ${fld('ast', 'حالة الطلب', `<select class="in" id="ast"><option value="all">كل الحالات</option>${Object.entries(AS).map(([k, v]) => `<option value="${k}" ${af.st === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`, false)}
    ${fld('alv', 'المستوى', `<select class="in" id="alv"><option value="all">كل المستويات</option>${LEVELS_STUDY.map(l => `<option ${af.lv === l ? 'selected' : ''}>${l}</option>`).join('')}</select>`, false)}
    ${fld('amj', 'التخصص', `<input class="in" id="amj" list="mjl" value="${esc(af.mj)}"><datalist id="mjl">${majors.map(m => `<option value="${esc(m)}">`).join('')}</datalist>`, false)}
    <button class="btn ghost" id="acsv">${ic('download', 'width:18px;height:18px')}تصدير Excel (CSV)</button></div>
   <div class="card tablecard"><table class="stack"><thead><tr><th>رقم الطلب</th><th>المتقدم</th><th>الكلية / المستوى</th><th>الرغبات</th><th>اللجنة المرشح لها</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody id="atb"></tbody></table></div>`;
  const filtered = () => all.filter(a => (af.st === 'all' || a.status === af.st) && (af.cm === 'all' || [a.choice1, a.choice2, a.assigned].includes(af.cm)) && (af.lv === 'all' || a.level === af.lv) && (!af.mj || (a.major || '').includes(af.mj)) && (!af.q || (a.name + a.sid + a.ref).includes(af.q))).sort((a, x) => x.submittedAt.localeCompare(a.submittedAt));
  const draw = () => { const L = filtered(); $('#atb').innerHTML = L.length ? L.map(a => `<tr class="click" data-app="${esc(a.id)}"><td class="num" dir="ltr" style="text-align:start">${esc(a.ref)}</td><td><b style="font-weight:600">${esc(a.name)}</b><br><span class="mini">${esc(a.sid)}</span></td><td>${esc(a.college)}<br><span class="mini">${esc(a.major)} · ${esc(a.level)}</span></td><td><span class="small">1. ${esc(cName(a.choice1))}<br>2. ${esc(cName(a.choice2))}</span></td><td>${esc(cName(a.assigned))}</td><td><span class="chip ${AS[a.status][1]}">${AS[a.status][0]}</span></td><td style="white-space:nowrap">${fmt(a.submittedAt, { day: 'numeric', month: 'short' })}</td></tr>`).join('')
    : `<tr><td colspan="7" class="empty">${all.length ? 'لا توجد طلبات مطابقة للتصفية.' : 'لا توجد طلبات بعد. افتح التقديم من الزر أعلاه ليظهر النموذج للطلاب.'}</td></tr>`;
    $$('#atb [data-app]').forEach(r => r.onclick = () => applicantModal(Store.get('applicants', r.dataset.app))); };
  draw();
  $('#aq').oninput = e => { af.q = e.target.value.trim(); draw(); }; $('#amj').oninput = e => { af.mj = e.target.value.trim(); draw(); };
  [['acm', 'cm'], ['ast', 'st'], ['alv', 'lv']].forEach(([i, k]) => $('#' + i).onchange = e => { af[k] = e.target.value; draw(); });
  $('#acsv').onclick = () => { const L = filtered(); download(`المتقدمون-${String(settings().cycle || CFG.CYCLE).replace(/\D/g, '')}.csv`, ['رقم الطلب', 'الاسم الرباعي', 'الرقم الجامعي', 'الهوية (مقنّعة)', 'الجوال', 'البريد الجامعي', 'الكلية', 'التخصص', 'المستوى', 'الرغبة الأولى', 'الرغبة الثانية', 'اللجنة المرشح لها', 'الحالة', 'الخبرات', 'المهارات', 'البورتفوليو', 'تاريخ التقديم', 'ملاحظات المقابلة'].map(csvCell).join(',') + '\n' + L.map(a => [a.ref, a.name, a.sid, a.nidMask, a.phone, a.email, a.college, a.major, a.level, cName(a.choice1), cName(a.choice2), cName(a.assigned), AS[a.status][0], a.experience, a.skills, a.portfolio, fmt(a.submittedAt), (a.notes || []).map(n => mName(n.by) + ': ' + n.text).join(' | ')].map(csvCell).join(',')).join('\n')); };
}
function applicantModal(a) { if (!a) return; const coms = isSuper() ? CK : CK.filter(k => k === me.committee || [a.choice1, a.choice2].includes(k));
  openModal(`${mhead(esc(a.name) + ` <span class="mini" dir="ltr">${esc(a.ref)}</span>`)}<dl class="kv"><div><dt>الرقم الجامعي</dt><dd>${esc(a.sid)}</dd></div><div><dt>الهوية</dt><dd dir="ltr" style="text-align:end">${esc(a.nidMask)}</dd></div><div><dt>الجوال</dt><dd dir="ltr" style="text-align:end">${esc(a.phone)}</dd></div><div><dt>البريد</dt><dd dir="ltr" style="text-align:end">${esc(a.email)}</dd></div><div><dt>الكلية</dt><dd>${esc(a.college)}</dd></div><div><dt>التخصص</dt><dd>${esc(a.major)}</dd></div><div><dt>المستوى</dt><dd>${esc(a.level)}</dd></div><div><dt>تاريخ التقديم</dt><dd>${fmt(a.submittedAt)}</dd></div><div><dt>الرغبة الأولى</dt><dd>${esc(cName(a.choice1))}</dd></div><div><dt>الرغبة الثانية</dt><dd>${esc(cName(a.choice2))}</dd></div></dl>
   <div class="grid2" style="margin-top:16px"><div><h3>الخبرات</h3><p class="small" style="white-space:pre-line">${esc(a.experience)}</p></div><div><h3>المهارات</h3><p class="small" style="white-space:pre-line">${esc(a.skills)}</p>${a.portfolio ? `<p class="small">البورتفوليو: <a href="${esc(a.portfolio)}" target="_blank" rel="noopener" dir="ltr">${esc(a.portfolio)}</a></p>` : ''}</div></div>
   ${a.memberId ? `<div class="banner info">${ic('check')}<span>تم اعتماد المتقدم عضواً في ${esc(cName(a.assigned))}، ويمكنه الدخول برقمه الجامعي وهويته.</span></div>` : ''}
   <div class="grid2">${fld('xst', 'حالة الطلب', `<select class="in" id="xst" ${a.memberId ? 'disabled' : ''}>${Object.entries(AS).map(([k, v]) => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>`, false)}${fld('xcm', 'اللجنة المرشح لها', `<select class="in" id="xcm" ${a.memberId ? 'disabled' : ''}>${coms.map(k => `<option value="${k}" ${a.assigned === k ? 'selected' : ''}>${C[k].n}</option>`).join('')}</select>`, false)}</div>
   <h3>ملاحظات المقابلة الشخصية</h3><div class="notes">${(a.notes || []).map(n => `<div class="n"><small>${esc(mName(n.by))} · ${fmt(n.at, { day: 'numeric', month: 'short' })}</small>${esc(n.text)}</div>`).join('') || '<p class="mute small">لا توجد ملاحظات بعد.</p>'}</div>
   <div class="field"><label for="xnote">إضافة ملاحظة</label><textarea class="in" id="xnote" placeholder="انطباع المقابلة، نقاط القوة، التوصية"></textarea></div>
   <div style="display:flex;gap:10px;flex-wrap:wrap">${a.memberId ? '' : '<button class="btn" id="xsave">حفظ</button><button class="btn gold" id="xacc">' + ic('check', 'width:18px;height:18px') + 'اعتماد وقبول كعضو في المبادرة</button>'}<button class="btn ghost" id="xedit">تعديل بيانات المتقدم</button>${a.memberId ? '<button class="btn" id="xsave">حفظ الملاحظة</button>' : ''}<button class="btn ghost" data-close>إغلاق</button></div>`, () => {
    const collect = () => { if (!a.memberId) { a.status = val('xst'); a.assigned = val('xcm'); } const n = val('xnote'); if (n) (a.notes = a.notes || []).push({ by: me.id, at: new Date().toISOString(), text: n }); a.reviewedBy = me.id; };
    $('#xsave').onclick = async () => { collect(); if (await guard(() => Store.save('applicants', a), 'حُفظ الطلب') !== undefined) { closeModal(); renderJoin(); } };
    $('#xedit').onclick = () => applicantEdit(a);
    const acc = $('#xacc'); if (acc) acc.onclick = () => { const com = val('xcm');
      confirmBox('اعتماد العضوية', `سيُنشأ حساب عضوية لـ <b>${esc(a.name)}</b> في <b>${esc(cName(com))}</b>، ويستطيع الدخول فوراً برقمه الجامعي وهويته.`, async () => {
        collect(); a.assigned = com;
        const m = { id: uid('mem'), name: a.name, title: 'عضو', level: 'member', committee: com, sid: a.sid, nidMask: a.nidMask, phone: a.phone, email: a.email, status: 'active', source: 'applicant', appId: a.id, order: 5, joinedAt: iso(new Date()) };
        const okM = await guard(() => Store.save('members', m)); if (okM === undefined) return;
        const r = await guard(() => Store.backend.accept(me.id, session.h, a.id, m.id, com)); if (r === undefined) { await Store.remove('members', m.id); return; }
        a.status = 'accepted'; a.memberId = m.id; a.acceptedBy = me.id; a.acceptedAt = new Date().toISOString(); await guard(() => Store.save('applicants', a));
        toast(`تم قبول ${a.name.split(' ')[0]} وإنشاء حسابه في ${cName(com)}`); renderJoin(); }, 'اعتماد وإنشاء الحساب'); };
  }, true); }
function applicantEdit(a) { openModal(`${mhead('تعديل بيانات المتقدم')}<form id="xef" novalidate><div class="fgrid">${fld('e_name', 'الاسم الرباعي', `<input class="in" id="e_name" value="${esc(a.name)}">`, true, 'full')}${fld('e_phone', 'الجوال', `<input class="in" id="e_phone" value="${esc(a.phone)}" dir="ltr" style="text-align:end">`)}${fld('e_email', 'البريد الجامعي', `<input class="in" id="e_email" value="${esc(a.email)}" dir="ltr" style="text-align:end">`)}${fld('e_col', 'الكلية', `<input class="in" id="e_col" value="${esc(a.college)}">`)}${fld('e_maj', 'التخصص', `<input class="in" id="e_maj" value="${esc(a.major)}">`)}${fld('e_lv', 'المستوى', `<select class="in" id="e_lv">${LEVELS_STUDY.map(l => `<option ${a.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
   <p class="note">الرقم الجامعي والهوية لا يُعدَّلان لأنهما مرتبطان ببيانات الدخول؛ عند الخطأ يقدّم الطالب طلباً جديداً.</p><div style="display:flex;gap:10px"><button class="btn">حفظ</button><button type="button" class="btn ghost" data-close>إلغاء</button></div></form>`, () => {
    $('#xef').onsubmit = async e => { e.preventDefault(); const errs = [setErr('e_name', V.name(val('e_name'), 4)), setErr('e_phone', V.phone(toEn(val('e_phone')))), setErr('e_email', V.email(val('e_email')))]; if (errs.some(Boolean)) return;
      Object.assign(a, { name: val('e_name').replace(/\s+/g, ' '), phone: toEn(val('e_phone')), email: val('e_email').toLowerCase(), college: val('e_col'), major: val('e_maj'), level: val('e_lv') });
      if (await guard(() => Store.save('applicants', a), 'حُفظت البيانات') !== undefined) applicantModal(a); }; }, true); }

/* ================================ التنقل ================================ */
const VIEWS = ['about', 'portal', 'events', 'hub', 'join']; let cur = '';
async function route() { const h = location.hash.slice(1), v = VIEWS.includes(h) ? h : 'about', changed = v !== cur; cur = v;
  if (Store.mode === 'supabase' && changed) await Store.refresh().catch(() => {});
  if (me) me = Store.get('members', me.id) || null;
  VIEWS.forEach(x => { $('#v-' + x).hidden = x !== v; }); $$('.tabs a').forEach(a => a.dataset.v === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  ({ about: renderAbout, portal: renderPortal, events: renderEvents, hub: renderHub, join: renderJoin })[v]();
  if (changed) scrollTo({ top: 0, behavior: 'instant' }); animate($('#v-' + v));
}
addEventListener('hashchange', route);
renderWho(); route();
})();
