create function cast_iso_datetime_string_to_timestamp(text)
returns timestamptz as
    $$select to_timestamp($1, 'YYYY-MM-DD HH24:MI:SS.MS')$$
language sql immutable;

create table games (
    id char(48) primary key,
    data jsonb
);

create index idx_games_created_at on games(
    cast_iso_datetime_string_to_timestamp(data->>'created_at')
);

create index idx_games_started_at on games(
    cast_iso_datetime_string_to_timestamp(data->>'started_at')
);

create index idx_games_ended_at on games(
    cast_iso_datetime_string_to_timestamp(data->>'ended_at')
);

create index idx_games_active_ended_at_created_at on games(
    (data->>'active'),
    (data->>'ended_at'),
    cast_iso_datetime_string_to_timestamp(data->>'created_at')
);
