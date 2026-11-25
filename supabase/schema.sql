-- =====================================================================
--  منصة طموح — مخطط قاعدة البيانات (Supabase / PostgreSQL)
--  نفّذ الملف كاملاً مرة واحدة من: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

-- 1) البيانات التشغيلية (أعضاء، مهام، تقييمات، حضور، ساعات، فعاليات، متقدمون، إعدادات)
create table if not exists public.records (
  collection text not null,
  id         text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.records enable row level security;
drop policy if exists records_rw on public.records;
create policy records_rw on public.records for all to anon, authenticated using (true) with check (true);

-- 2) أسرار الهوية — لا يمكن قراءتها من المتصفح إطلاقاً (RLS مفعّل بدون أي سياسة)
create table if not exists public.credentials (
  member_id  text primary key,
  sid        text unique,
  nid_hash   text,
  level      text not null check (level in ('super','cadmin','member')),
  committee  text,
  code       text,
  activated  boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.credentials enable row level security;

create table if not exists public.applicant_secrets (
  app_id     text primary key,
  sid        text not null,
  nid_hash   text not null,
  created_at timestamptz not null default now()
);
alter table public.applicant_secrets enable row level security;

-- 3) رمز التفعيل الأول لقائد المبادرة — غيّر CHANGE-ME قبل التنفيذ
insert into public.credentials (member_id, level, committee, code, activated)
values ('m-lead', 'super', null, 'CHANGE-ME', false)
on conflict (member_id) do nothing;

-- 4) دوال الخادم (security definer): الطريق الوحيد للتعامل مع الهوية
create or replace function public._tamooh_admin(p_admin text, p_hash text)
returns public.credentials language sql security definer set search_path = public as $$
  select * from credentials where member_id = p_admin and nid_hash = p_hash and activated and level in ('super','cadmin');
$$;

create or replace function public.tamooh_login(p_sid text, p_hash text)
returns text language sql security definer set search_path = public as $$
  select member_id from credentials where sid = p_sid and nid_hash = p_hash and activated limit 1;
$$;

create or replace function public.tamooh_sid_exists(p_sid text)
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from credentials where sid = p_sid and activated);
$$;

create or replace function public.tamooh_activate(p_member text, p_code text, p_sid text, p_hash text)
returns text language plpgsql security definer set search_path = public as $$
declare c credentials;
begin
  select * into c from credentials where member_id = p_member;
  if c is null or c.activated or c.code is null or c.code <> p_code then return 'bad_code'; end if;
  if exists(select 1 from credentials where sid = p_sid and activated) then return 'sid_taken'; end if;
  update credentials set sid = p_sid, nid_hash = p_hash, activated = true, code = null, updated_at = now() where member_id = p_member;
  return 'ok';
end $$;

create or replace function public.tamooh_issue_code(p_admin text, p_admin_hash text, p_target text, p_level text, p_committee text)
returns text language plpgsql security definer set search_path = public as $$
declare a credentials; v_code text;
begin
  a := _tamooh_admin(p_admin, p_admin_hash);
  if a.member_id is null then raise exception 'صلاحية غير كافية'; end if;
  if a.level <> 'super' and (p_level <> 'member' or p_committee is distinct from a.committee) then
    raise exception 'يمكن لقائد اللجنة إصدار رموز لأعضاء لجنته فقط'; end if;
  v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4) || '-' || substr(md5(random()::text), 1, 4));
  insert into credentials (member_id, level, committee, code, activated)
  values (p_target, p_level, p_committee, v_code, false)
  on conflict (member_id) do update set level = excluded.level, committee = excluded.committee, code = excluded.code,
    activated = false, sid = null, nid_hash = null, updated_at = now();
  return v_code;
end $$;

create or replace function public.tamooh_set_level(p_admin text, p_admin_hash text, p_target text, p_level text, p_committee text)
returns void language plpgsql security definer set search_path = public as $$
declare a credentials;
begin
  a := _tamooh_admin(p_admin, p_admin_hash);
  if a.member_id is null or a.level <> 'super' then raise exception 'هذه العملية للإدارة العليا'; end if;
  update credentials set level = p_level, committee = p_committee, updated_at = now() where member_id = p_target;
end $$;

create or replace function public.tamooh_revoke(p_admin text, p_admin_hash text, p_target text)
returns void language plpgsql security definer set search_path = public as $$
declare a credentials; t credentials;
begin
  a := _tamooh_admin(p_admin, p_admin_hash);
  if a.member_id is null then raise exception 'صلاحية غير كافية'; end if;
  select * into t from credentials where member_id = p_target;
  if a.level <> 'super' and t.committee is distinct from a.committee then raise exception 'خارج نطاق لجنتك'; end if;
  delete from credentials where member_id = p_target;
end $$;

create or replace function public.tamooh_cred_status()
returns jsonb language sql security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(member_id, case when activated then 'active' else 'pending' end), '{}'::jsonb) from credentials;
$$;

create or replace function public.tamooh_apply(p_app text, p_sid text, p_hash text)
returns void language sql security definer set search_path = public as $$
  insert into applicant_secrets (app_id, sid, nid_hash) values (p_app, p_sid, p_hash)
  on conflict (app_id) do update set sid = excluded.sid, nid_hash = excluded.nid_hash;
$$;

create or replace function public.tamooh_accept(p_admin text, p_admin_hash text, p_app text, p_member text, p_committee text)
returns text language plpgsql security definer set search_path = public as $$
declare a credentials; s applicant_secrets;
begin
  a := _tamooh_admin(p_admin, p_admin_hash);
  if a.member_id is null then raise exception 'صلاحية غير كافية'; end if;
  if a.level <> 'super' and p_committee is distinct from a.committee then raise exception 'يمكنك قبول المتقدمين في لجنتك فقط'; end if;
  select * into s from applicant_secrets where app_id = p_app;
  if s is null then raise exception 'لا توجد بيانات هوية محفوظة لهذا الطلب'; end if;
  if exists(select 1 from credentials where sid = s.sid and activated) then raise exception 'يوجد حساب مفعّل بنفس الرقم الجامعي'; end if;
  insert into credentials (member_id, sid, nid_hash, level, committee, activated) values (p_member, s.sid, s.nid_hash, 'member', p_committee, true);
  return 'ok';
end $$;

-- السماح للمتصفح باستدعاء الدوال فقط (وليس قراءة الجداول السرية)
grant execute on function public.tamooh_login, public.tamooh_sid_exists, public.tamooh_activate, public.tamooh_issue_code,
  public.tamooh_set_level, public.tamooh_revoke, public.tamooh_cred_status, public.tamooh_apply, public.tamooh_accept to anon, authenticated;
revoke execute on function public._tamooh_admin from public, anon, authenticated;
