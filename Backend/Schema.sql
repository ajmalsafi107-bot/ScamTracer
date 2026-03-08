create table public.fraud_reports (
  id serial not null,
  phone_id integer not null,
  fraud_type character varying(100) not null,
  description text not null,
  reported_at timestamp without time zone null default now(),
  constraint fraud_reports_pkey primary key (id),
  constraint fk_phone foreign KEY (phone_id) references phone_numbers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_fraud_reports_phone_id on public.fraud_reports using btree (phone_id) TABLESPACE pg_default;

create index IF not exists idx_fraud_reports_reported_at on public.fraud_reports using btree (reported_at) TABLESPACE pg_default;


create table public.phone_numbers (
  id serial not null,
  phone_number character varying(20) not null,
  created_at timestamp without time zone null default now(),
  constraint phone_numbers_pkey primary key (id),
  constraint phone_numbers_phone_number_key unique (phone_number)
) TABLESPACE pg_default;

create trigger normalize_phone BEFORE INSERT
or
update on phone_numbers for EACH row
execute FUNCTION normalize_phone_trigger ();

create table public.phone_searches (
  id serial not null,
  phone_id integer not null,
  searched_at timestamp without time zone null default now(),
  constraint phone_searches_pkey primary key (id),
  constraint phone_searches_phone_id_fkey foreign KEY (phone_id) references phone_numbers (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_phone_searches_phone_id on public.phone_searches using btree (phone_id) TABLESPACE pg_default;