create table games (
    id char(48) primary key,
    data jsonb
);

create index idx_get_open_games on games((data->>'active'), (data->>'ended_at'), (data->>'created_at'));
