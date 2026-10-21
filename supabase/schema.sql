-- PawConnect baseline schema (Handbook V3.2 + final Jira stories, 22 Oct 2026)
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run: drops and recreates all PawConnect objects (ALL DATA IS RESET).
-- Later changes go in supabase/migrations/NNN_description.sql, never by editing this file.

drop function if exists public.submit_application(text, text, text, text);
drop function if exists public.track_application(text);
drop table if exists public.applications;
drop table if exists public.pets;
drop table if exists public.shelters;
drop sequence if exists public.application_seq;

-- ---------- Tables ----------
create table public.shelters (
  shelter_id   text primary key,
  shelter_name text not null,
  area         text,
  description  text
);

create table public.pets (
  pet_id                text primary key,
  shelter_id            text not null references public.shelters(shelter_id),
  name                  text not null check (length(trim(name)) > 0),
  animal_type           text not null check (animal_type in ('Dog','Cat','Rabbit','Other')),
  breed                 text,
  age                   int  not null check (age >= 0 and age <= 30),          -- years
  age_group             text generated always as (                              -- used by C05
                          case when age <= 2 then 'Young (0-2)'
                               when age <= 7 then 'Adult (3-7)'
                               else 'Senior (8+)' end) stored,
  photo                 text,                                                   -- image URL
  description           text,
  temperament           text,                                                   -- C03
  adoption_requirements text,                                                   -- C03
  availability          text not null default 'Available'
                        check (availability in ('Available','Unavailable'))
);

create sequence public.application_seq start 1001;

create table public.applications (
  application_id      text primary key default ('APP-' || nextval('public.application_seq')),
  pet_id              text not null references public.pets(pet_id),
  applicant_demo_name text not null check (length(trim(applicant_demo_name)) > 0),
  demo_contact        text not null check (length(trim(demo_contact)) > 0),
  reason              text not null check (length(trim(reason)) > 0),
  application_status  text not null default 'Pending'
                      check (application_status in ('Pending','Under Review','Approved','Rejected')),
  submitted_at        timestamptz not null default now()
);

-- ---------- Table privileges (newer Supabase projects grant nothing by default) ----------
grant usage on schema public to anon, authenticated;
grant select on public.shelters, public.pets to anon, authenticated;
grant insert, update on public.pets to authenticated;
grant select, update on public.applications to authenticated;

-- ---------- Row Level Security ----------
alter table public.shelters     enable row level security;
alter table public.pets         enable row level security;
alter table public.applications enable row level security;

create policy "public read shelters" on public.shelters
  for select to anon, authenticated using (true);

create policy "public read pets" on public.pets
  for select to anon, authenticated using (true);
create policy "staff insert pets" on public.pets               -- E01
  for insert to authenticated with check (true);
create policy "staff update pets" on public.pets               -- E02
  for update to authenticated using (true) with check (true);

-- Applications: no anon policy, so the public can never list or edit applications directly.
create policy "staff read applications" on public.applications       -- E03, E04
  for select to authenticated using (true);
create policy "staff update applications" on public.applications     -- E05
  for update to authenticated using (true) with check (true);

-- ---------- Public functions: the only way visitors touch applications ----------
-- D04: saves a valid application for an Available pet; status defaults to Pending.
create function public.submit_application(
  p_pet_id text, p_name text, p_contact text, p_reason text
) returns text
language plpgsql security definer set search_path = public
as $$
declare
  new_id text;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_contact), '') = ''
     or coalesce(trim(p_reason), '') = '' then
    raise exception 'Missing required fields';
  end if;
  if not exists (select 1 from pets where pet_id = p_pet_id and availability = 'Available') then
    raise exception 'Pet is not available for adoption';
  end if;
  insert into applications (pet_id, applicant_demo_name, demo_contact, reason)
  values (p_pet_id, trim(p_name), trim(p_contact), trim(p_reason))
  returning application_id into new_id;
  return new_id;
end;
$$;

-- B01, B02, B04: look up ONE application by reference. Returns no personal details.
create function public.track_application(p_application_id text)
returns table (application_id text, pet_id text, pet_name text,
               application_status text, submitted_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select a.application_id, p.pet_id, p.name, a.application_status, a.submitted_at
  from applications a
  join pets p on p.pet_id = a.pet_id
  where a.application_id = upper(trim(p_application_id));
$$;

revoke all on function public.submit_application(text, text, text, text) from public;
revoke all on function public.track_application(text) from public;
grant execute on function public.submit_application(text, text, text, text) to anon, authenticated;
grant execute on function public.track_application(text) to anon, authenticated;

-- ---------- Fictional seed data (no real people, phone numbers or emails) ----------
insert into public.shelters (shelter_id, shelter_name, area, description) values
 ('SH01','Harbourside Animal Rescue (Demo)','Inner West, Sydney','Fictional shelter for the PawConnect prototype. Mainly dogs and cats.'),
 ('SH02','Westgate Pet Haven (Demo)','Parramatta, Sydney','Fictional shelter for the PawConnect prototype. Small animals and senior pets.');

insert into public.pets
 (pet_id, shelter_id, name, animal_type, breed, age, photo, description, temperament, adoption_requirements, availability) values
 ('P001','SH01','Biscuit','Dog','Labrador Mix',3,'https://placehold.co/600x400?text=Biscuit',
  'Friendly and energetic dog who loves fetch.','Playful, high energy, good with children.','Needs a fenced yard and daily walks.','Available'),
 ('P002','SH01','Luna','Cat','Domestic Shorthair',2,'https://placehold.co/600x400?text=Luna',
  'Calm indoor cat who enjoys sunny windows.','Quiet, independent, a little shy at first.','Indoor-only home; no other cats preferred.','Available'),
 ('P003','SH02','Milo','Dog','Beagle',5,'https://placehold.co/600x400?text=Milo',
  'Curious beagle with a great nose.','Sociable, food-motivated, can be vocal.','Experienced owner; secure garden required.','Available'),
 ('P004','SH02','Pepper','Rabbit','Mini Lop',1,'https://placehold.co/600x400?text=Pepper',
  'Gentle young rabbit used to being handled.','Gentle, calm, enjoys company.','Indoor enclosure and daily exercise space.','Available'),
 ('P005','SH02','Oscar','Cat','Ragdoll Mix',9,'https://placehold.co/600x400?text=Oscar',
  'Senior cat looking for a relaxed home.','Affectionate, low energy.','Quiet home; regular vet check-ups.','Available'),
 ('P006','SH01','Daisy','Dog','Kelpie Cross',4,'https://placehold.co/600x400?text=Daisy',
  'Smart working-breed dog.','Intelligent, very active, needs mental stimulation.','Active household; no small pets.','Available'),
 ('P007','SH01','Coco','Dog','Cavoodle',10,'https://placehold.co/600x400?text=Coco',
  'Older small dog who loves cuddles.','Gentle, relaxed, good with older children.','Mostly indoor home; someone home during the day.','Available'),
 ('P008','SH02','Hazel','Rabbit','Netherland Dwarf',2,'https://placehold.co/600x400?text=Hazel',
  'Small, alert rabbit.','Curious, slightly nervous with loud noises.','Calm home; no young children.','Available'),
 ('P009','SH01','Shadow','Cat','Domestic Longhair',6,'https://placehold.co/600x400?text=Shadow',
  'Already matched with a family; kept for testing.','Laid-back.','Not currently available.','Unavailable'),
 ('P010','SH02','Ziggy','Other','Guinea Pig',1,'https://placehold.co/600x400?text=Ziggy',
  'Young guinea pig; kept for availability testing.','Social, likes company.','Must be adopted with a companion.','Unavailable');

-- Three demo applications with different statuses (APP-1001 to APP-1003) for S2 testing.
insert into public.applications (pet_id, applicant_demo_name, demo_contact, reason, application_status, submitted_at) values
 ('P001','Test Applicant One','applicant1@example.com','Demo record for tracking tests.','Pending','2026-10-21 10:00+11'),
 ('P003','Test Applicant Two','applicant2@example.com','Demo record for tracking tests.','Under Review','2026-10-21 10:05+11'),
 ('P005','Test Applicant Three','applicant3@example.com','Demo record for tracking tests.','Approved','2026-10-21 10:10+11');
