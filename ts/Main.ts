import * as express from 'express';
import * as cors from 'cors';
import { MAX_PLAYER_NAME_LENGTH, create_new_game, get_state, leave_game, admin_start_game, join_game, get_open_games, play_card, player_draw_card } from './Runo';
import { databaseService } from './Services/DatabaseService';
import { BadRequestError } from './Errors/Errors';

const PORT = Number(process.env.PORT) || 8080;
const app = express();

app.set('view engine', 'ejs');
app.use('/static', express.static('static'));

// Parse CORS_ALLOWED_ORIGINS environment variable, which may contain
// zero or more origin URLs separated by semicolons.
const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '').split(';')
    .map((origin) => origin.trim())
    .filter((trimmedOrigin) => trimmedOrigin !== '');

// If one or more allowed origins are defined, use them.
// Otherwise, CORS policy will block requests from all origins.
if (corsAllowedOrigins.length > 0) {
    app.use(cors({ origin: corsAllowedOrigins }));
}

app.get('/', async (req, res) => {
    const open_games = await get_open_games();
    res.render('index', {
        open_games,
        max_player_name_length: MAX_PLAYER_NAME_LENGTH,
    });
});

app.get('/play/:game_id/:player_id', (req, res) => {
    const game_id = req.params.game_id;
    const player_id = req.params.player_id;
    res.render('play', {
        game_id,
        player_id,
    });
});

app.get('/newgame', async (req, res) => {
    const player_name = (req.query.player_name as string).slice(0, MAX_PLAYER_NAME_LENGTH);
    const game_data = await create_new_game(null, player_name);
    if (game_data) {
        const game_id = game_data.id;
        const player_id = game_data.players[0].id;
        res.redirect(`/play/${game_id}/${player_id}`);
    } else {
        res.send('Unable to create a new game at this time. Please try again later.');
    }
});

app.get('/join', async (req, res) => {
    const game_id = req.query.game_id;
    if (typeof game_id !== 'string') {
        throw new BadRequestError();
    }
    const name = (req.query.name as string).slice(0, MAX_PLAYER_NAME_LENGTH);
    const player = await join_game(game_id, name);
    if (player) {
        const player_id = player.id;
        res.redirect(`/play/${game_id}/${player_id}`);
    } else {
        res.send('This game is no longer accepting new players.');
    }
});

app.get('/start', async (req, res) => {
    const game_id = req.query.game_id;
    if (typeof game_id !== 'string') {
        throw new BadRequestError();
    }
    const player_id = req.query.player_id;
    if (typeof player_id !== 'string') {
        throw new BadRequestError();
    }
    const result = await admin_start_game(game_id, player_id);
    res.send({ result });
});

app.get('/getstate', async (req, res) => {
    const game_id = req.query.game_id;
    if (typeof game_id !== 'string') {
        throw new BadRequestError();
    }
    const player_id = req.query.player_id;
    if (typeof player_id !== 'string') {
        throw new BadRequestError();
    }
    const game_state = await get_state(game_id, player_id);
    res.send(game_state);
});

app.get('/playcard', async (req, res) => {
    const game_id = req.query.game_id;
    if (typeof game_id !== 'string') {
        throw new BadRequestError();
    }
    const player_id = req.query.player_id;
    if (typeof player_id !== 'string') {
        throw new BadRequestError();
    }
    const card_id = req.query.card_id;
    if (typeof card_id !== 'string') {
        throw new BadRequestError();
    }
    const selected_color = req.query.selected_color;
    if (typeof selected_color !== 'string') {
        throw new BadRequestError();
    }
    const result = await play_card(game_id, player_id, card_id, selected_color);
    res.send({ result });
});

app.get('/draw', async (req, res) => {
    const game_id = req.query.game_id;
    if (typeof game_id !== 'string') {
        throw new BadRequestError();
    }
    const player_id = req.query.player_id;
    if (typeof player_id !== 'string') {
        throw new BadRequestError();
    }
    const result = await player_draw_card(game_id, player_id);
    res.send({ result });
});

app.get('/quit/:game_id/:player_id', async (req, res) => {
    const game_id = req.params.game_id;
    const player_id = req.params.player_id;
    await leave_game(game_id, player_id);
    res.redirect('/');
});

app.get('/stats', async (req, res) => {
    const rows = await databaseService.query(`
        select
            (select count(*) from games where cast_iso_datetime_string_to_timestamp(data->>'created_at') > current_timestamp - interval '24 hours') as created,
            (select count(*) from games where cast_iso_datetime_string_to_timestamp(data->>'started_at') > current_timestamp - interval '24 hours') as started,
            (select count(*) from games where cast_iso_datetime_string_to_timestamp(data->>'ended_at') > current_timestamp - interval '24 hours') as ended`
    );
    res.send(rows[0]);
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
