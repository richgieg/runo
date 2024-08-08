import { databaseService, IDatabaseRow } from "./Services/DatabaseService";

export const MAX_PLAYER_NAME_LENGTH = 16;
const GAME_ID_LENGTH = 48;
const PLAYER_ID_LENGTH = 48;
const PLAYER_UX_ID_LENGTH = 8;
const CARD_ID_LENGTH = 6;
const SPECIAL_CARDS = ['WILD', 'WILD_DRAW_FOUR'];
const SPECIAL_COLOR_CARDS = ['DRAW_TWO', 'SKIP', 'REVERSE'];
const ALL_SPECIAL_CARDS = SPECIAL_CARDS.concat(SPECIAL_COLOR_CARDS);
const CARD_COLORS = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
const CARD_VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 10;
const POINTS_TO_WIN = 250;
/**
 * Maximum number of games that can be created in a 24-hour period.
 */
const MAX_GAMES_PER_DAY = 1000;
const DEFAULT_GAME_NAME = 'Game';
const DEFAULT_PLAYER_NAME = 'Player';

interface IGameData {
    id: string;
    name: string;
    deck: ICard[];
    stack: ICard[];
    created_at: string;
    started_at: string | null;
    ended_at: string | null;
    active: boolean;
    reverse: boolean;
    min_players: number;
    max_players: number;
    players: IPlayer[];
    points_to_win: number;
}

interface ICard {
    id: string;
    value: string;
    color: string | null;
}

interface IPlayer {
    id: string;
    ux_id: string;
    name: string;
    admin: boolean;
    active: boolean;
    hand: ICard[];
    points: number;
    rounds_won: number;
    game_winner: boolean;
    messages: IMessage[];
}

interface IMessage {
    type: string;
    data: string;
}

function serialize_datetime(datetime: Date): string {
    return datetime.toISOString();
}

async function load_state(game_id: string): Promise<IGameData | null> {
    let rows: IDatabaseRow[];
    const query = `
        select data from games where id = $1 and
            (data->>'created_at')::timestamp > current_timestamp - interval '1 day'`;
    try {
        rows = await databaseService.query(query, [game_id]);
    } catch(error) {
        return null;
    }
    if (rows && rows[0]) {
        return rows[0].data;
    } else {
        return null;
    }
}

async function save_state(game_data: IGameData): Promise<boolean> {
    const query = `
        insert into games (id, data) values ($1, $2)
        on conflict (id) do update set data = excluded.data`;
    try {
        await databaseService.query(query, [game_data.id, game_data]);
    } catch(error) {
        return false;
    }
    return true;
}

export async function get_open_games(): Promise<IGameData[]> {
    const games: IGameData[] = [];
    const query = `
    select data from games
    where (
        (data->>'active')::boolean = false and
        (data->>'ended_at') is null and
        cast_iso_datetime_string_to_timestamp(data->>'created_at') > current_timestamp - interval '30 minutes'
    )
    order by cast_iso_datetime_string_to_timestamp(data->>'created_at') desc`;
    const rows = await databaseService.query(query);
    for (const row of rows) {
        const game_data: IGameData = row.data;
        if (!game_data.active && !game_data.ended_at) {
            games.push(game_data);
        }
    }
    return games;
}

async function can_create_new_game(): Promise<boolean> {
    const query = `
        select count(*) from games
        where cast_iso_datetime_string_to_timestamp(data->>'created_at') > current_timestamp - interval '1 day'`;
    const rows = await databaseService.query(query);
    const num_games = Number(rows[0].count);
    return num_games < MAX_GAMES_PER_DAY;
}

function generate_id(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function generate_digits(length: number): string {
    const chars = '0123456789';
    let digits = '';
    for (let i = 0; i < length; i++) {
        digits += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return digits;
}

function generate_game_name(): string {
    return DEFAULT_GAME_NAME + generate_digits(5);
}

function generate_player_name(): string {
    return DEFAULT_PLAYER_NAME + generate_digits(5);
}

function create_card(value: string, color: string | null = null): ICard {
    return {
        id: generate_id(CARD_ID_LENGTH),
        value,
        color,
    };
}

function create_deck(): ICard[] {
    const cards = [];
    for (const color of CARD_COLORS) {
        cards.push(create_card(CARD_VALUES[0], color));
        for (const value of CARD_VALUES.slice(1)) {
            for (let i = 0; i < 2; i++) {
                cards.push(create_card(value, color));
            }
        }
        for (const special of SPECIAL_COLOR_CARDS) {
            for (let i = 0; i < 2; i++) {
                cards.push(create_card(special, color));
            }
        }
    }
    for (const special of SPECIAL_CARDS) {
        for (let i = 0; i < 4; i++) {
            cards.push(create_card(special));
        }
    }
    shuffle_array(cards);
    return cards;
}

function shuffle_array(array: any[]) {
    let counter = array.length;
    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
}

function add_player_to_game(game_data: IGameData, player_name: string, admin = false): IPlayer | null {
    if (game_data.max_players === game_data.players.length) {
        return null;
    }
    const player = {
        id: generate_id(PLAYER_ID_LENGTH),
        ux_id: generate_id(PLAYER_UX_ID_LENGTH),
        name: player_name,
        admin,
        active: false,
        hand: [],
        points: 0,
        rounds_won: 0,
        game_winner: false,
        messages: [],
    };
    game_data.players.push(player);
    return player;
}

function reclaim_stack(game_data: IGameData, is_deal = false) {
    // Take the stack and make it the deck. If this is not happening during
    // a deal, remove the top card and put it back in the empty stack so the
    // game can continue. Otherwise, leave the stack empty. In either case,
    // shuffle the deck.
    game_data.deck = game_data.stack;
    if (is_deal) {
        game_data.stack = [];
    } else {
        game_data.stack = [game_data.deck.pop() as ICard];
    }
    shuffle_array(game_data.deck);
    // Scrub the color from all WILD and WILD_DRAW_FOUR cards.
    for (const card of game_data.deck) {
        if (SPECIAL_CARDS.indexOf(card.value) !== -1) {
            card.color = null;
        }
    }
}

function reclaim_player_cards(game_data: IGameData, player: IPlayer) {
    // Collects player's cards and inserts them into the bottom of the stack.
    game_data.stack = player.hand.concat(game_data.stack);
    player.hand = [];
}

function reclaim_cards(game_data: IGameData) {
    // Collects cards from all players.
    for (const player of game_data.players) {
        reclaim_player_cards(game_data, player);
    }
}

function draw_card(game_data: IGameData, player: IPlayer, is_deal = false) {
    const deck = game_data.deck;
    player.hand.push(deck.pop() as ICard);
    if (deck.length === 0) {
        reclaim_stack(game_data, is_deal);
    }
}

function draw_two(game_data: IGameData, player: IPlayer) {
    draw_card(game_data, player);
    draw_card(game_data, player);
}

function draw_four(game_data: IGameData, player: IPlayer) {
    draw_two(game_data, player);
    draw_two(game_data, player);
}

function deal_cards(game_data: IGameData) {
    for (const player of game_data.players) {
        for (let i = 0; i < 7; i++) {
            draw_card(game_data, player, true);
        }
    }
    // Look for a non-special card in the deck. Once found, move it
    // from the deck to the discard pile (stack).
    let chosen_card: ICard | undefined;
    const deck_without_chosen_card = [];
    for (const card of game_data.deck.slice().reverse()) {
        if (chosen_card === undefined && !ALL_SPECIAL_CARDS.includes(card.value)) {
            chosen_card = card;
        } else {
            deck_without_chosen_card.push(card);
        }
    }
    if (chosen_card === undefined) {
        throw new Error('chosen_card is undefined');
    }
    game_data.stack.push(chosen_card);
    game_data.deck = deck_without_chosen_card.reverse();
}

function start_game(game_data: IGameData) {
    deal_cards(game_data);
    const admin_player = game_data.players.filter((player) => player.admin)[0];
    admin_player.active = true;
    game_data.active = true;
    game_data.started_at = serialize_datetime(new Date());
}

function can_play_card(game_data: IGameData, card: ICard): boolean {
    if (SPECIAL_CARDS.indexOf(card.value) !== -1) {
        return true;
    }
    const card_to_match = game_data.stack[game_data.stack.length - 1];
    if (card.color === card_to_match.color) {
        return true;
    }
    if (card.value === card_to_match.value) {
        return true;
    }
    return false;
}

function player_has_matching_color_card(game_data: IGameData, player: IPlayer): boolean {
    // Get the color of the previously played card.
    const color_to_match = game_data.stack[game_data.stack.length - 1].color;
    for (const card of player.hand) {
        if (card.color === color_to_match) {
            return true;
        }
    }
    return false;
}

function get_active_player(game_data: IGameData): IPlayer | null {
    for (const player of game_data.players) {
        if (player.active) {
            return player;
        }
    }
    return null;
}

function activate_next_player(game_data: IGameData, card_drawn: boolean, player_quit: boolean) {
    const active_player = get_active_player(game_data);
    if (!active_player) {
        throw new Error('No active player');
    }
    active_player.active = false;
    const player_iter = new PlayerIterator(game_data.players, active_player, game_data.reverse);
    // If the last player was able to play a card, execute additional logic
    // to determine any consequences of the card played.
    let next_player: IPlayer;
    if (!card_drawn || player_quit) {
        const num_players = game_data.players.length;
        const last_card = game_data.stack[game_data.stack.length - 1];
        next_player = player_iter.next();
        let msg_data: string;
        let msg: IMessage;
        if (num_players === 2 && last_card.value === 'REVERSE') {
            msg_data = `${active_player.name} just skipped you via REVERSE!`;
            msg = make_warning_message(msg_data);
            flash_player(game_data, next_player, msg, null);
            msg_data = `${active_player.name} just skipped ${next_player.name} via REVERSE!`;
            msg = make_info_message(msg_data);
            flash_exclude(game_data, [active_player, next_player], msg);
            next_player = player_iter.next();
        } else if (last_card.value === 'SKIP') {
            msg_data = `${active_player.name} just skipped you!`;
            msg = make_warning_message(msg_data);
            flash_player(game_data, next_player, msg, null);
            msg_data = `${active_player.name} just skipped ${next_player.name}!`;
            msg = make_info_message(msg_data);
            flash_exclude(game_data, [active_player, next_player], msg);
            next_player = player_iter.next();
        } else if (last_card.value === 'DRAW_TWO') {
            draw_two(game_data, next_player);
            msg_data = `${active_player.name} made you draw two cards!`;
            msg = make_warning_message(msg_data);
            flash_player(game_data, next_player, msg, null);
            msg_data = `${active_player.name} made ${next_player.name} draw two cards!`;
            msg = make_info_message(msg_data);
            flash_exclude(game_data, [active_player, next_player], msg);
            next_player = player_iter.next();
        } else if (last_card.value === 'WILD_DRAW_FOUR') {
            draw_four(game_data, next_player);
            msg_data = `${active_player.name} made you draw four cards!`;
            msg = make_warning_message(msg_data);
            flash_player(game_data, next_player, msg, null);
            msg_data = `${active_player.name} made ${next_player.name} draw four cards!`;
            msg = make_info_message(msg_data);
            flash_exclude(game_data, [active_player, next_player], msg);
            next_player = player_iter.next();
        }
    // If the last play was just drawing a card, the only logic necessary to
    // run here is advancing to the next player.
    } else {
        next_player = player_iter.next();
    }
    next_player.active = true;
}

function count_points_for_player(player: IPlayer): number {
    let points = 0;
    for (const card of player.hand) {
        if (SPECIAL_CARDS.indexOf(card.value) !== -1) {
            points += 50;
        } else if (SPECIAL_COLOR_CARDS.indexOf(card.value) !== -1) {
            points += 20;
        } else {
            points += Number(card.value);
        }
    }
    return points;
}

function count_points(game_data: IGameData, winning_player: IPlayer): number {
    let points = 0;
    for (const player of game_data.players) {
        if (player === winning_player) {
            continue;
        }
        points += count_points_for_player(player);
    }
    return points;
}

function set_round_winner(game_data: IGameData, player: IPlayer) {
    player.points += count_points(game_data, player);
    player.rounds_won += 1;
    if (player.points >= game_data.points_to_win) {
        set_game_winner(game_data, player);
    } else {
        reclaim_cards(game_data);
        deal_cards(game_data);
        activate_next_player(game_data, false, false);
        const msg = make_success_message('You won the round!');
        const alt_msg = make_info_message(`${player.name} won the round!`);
        flash_player(game_data, player, msg, alt_msg);
    }
}

function set_game_winner(game_data: IGameData, player: IPlayer) {
    game_data.active = false;
    player.active = false;
    game_data.ended_at = serialize_datetime(new Date());
    player.game_winner = true;
    const msg = make_success_message('You won the game!');
    const alt_msg = make_info_message(`${player.name} won the game!`);
    flash_player(game_data, player, msg, alt_msg);
}

function make_success_message(message: string): IMessage {
    return { data: message, type: 'success' };
}

function make_info_message(message: string): IMessage {
    return { data: message, type: 'info' };
}

function make_warning_message(message: string): IMessage {
    return { data: message, type: 'warning' };
}

function make_danger_message(message: string): IMessage {
    return { data: message, type: 'danger' };
}

function flash_broadcast(game_data: IGameData, message: IMessage) {
    for (const player of game_data.players) {
        player.messages.push(message);
    }
}

function flash_player(game_data: IGameData, player: IPlayer, message: IMessage | null, alt_message: IMessage | null) {
    if (message) {
        player.messages.push(message);
    }
    if (alt_message) {
        const other_players = game_data.players.filter((p) => p !== player);
        for (const other_player of other_players) {
            other_player.messages.push(alt_message);
        }
    }
}

function flash_exclude(game_data: IGameData, players: IPlayer[], message: IMessage) {
    for (const player of game_data.players) {
        let exclude = false;
        for (const excludedPlayer of players) {
            if (player === excludedPlayer) {
                exclude = true;
                break;
            }
        }
        if (!exclude) {
            player.messages.push(message);
        }
    }
}

/**
 * Creates a new game and returns the game data object.
 */
export async function create_new_game(
    game_name: string | null,
    player_name: string,
    points_to_win = POINTS_TO_WIN,
    min_players = MIN_PLAYERS,
    max_players = MAX_PLAYERS,
): Promise<IGameData | null> {
    const can_create = await can_create_new_game();
    if (!can_create) {
        return null;
    }
    if (min_players < 2) {
        min_players = 2;
    }
    if (max_players > 10) {
        max_players = 10;
    }
    const game_data: IGameData = {
        id: generate_id(GAME_ID_LENGTH),
        name: game_name || generate_game_name(),
        deck: create_deck(),
        stack: [],
        created_at: serialize_datetime(new Date()),
        started_at: null,
        ended_at: null,
        active: false,
        reverse: false,
        min_players,
        max_players,
        players: [],
        points_to_win,
    };
    add_player_to_game(game_data, player_name, true);
    const msg = make_info_message('Click "Start" after all player(s) have joined');
    flash_broadcast(game_data, msg);
    const save_result = await save_state(game_data);
    if (save_result) {
        return game_data;
    } else {
        return null;
    }
}

/**
 * Attempts to play a card.
 * Returns true if successful.
 */
export async function play_card(game_id: string, player_id: string, card_id: string, selected_color: string | null = null): Promise<boolean> {
    const game_data = await load_state(game_id);
    if (!game_data) {
        return false;
    }
    const player = game_data.players.filter((p) => p.id === player_id)[0];
    if (!player) {
        return false;
    }
    if (!player.active) {
        return false;
    }
    const card = player.hand.filter((c) => c.id === card_id)[0];
    if (!card) {
        return false;
    }
    if (!game_data.active) {
        return false;
    }
    const msg = make_danger_message(`You can't play that card!`);
    if (!can_play_card(game_data, card)) {
        flash_player(game_data, player, msg, null);
        return false;
    }
    if (card.value === 'WILD_DRAW_FOUR' && player_has_matching_color_card(game_data, player)) {
        flash_player(game_data, player, msg, null);
        return false;
    }
    if (SPECIAL_CARDS.indexOf(card.value) !== -1) {
        if (CARD_COLORS.indexOf(selected_color as string) === -1) {
            flash_player(game_data, player, msg, null);
        }
        card.color = selected_color;
    }
    player.hand = player.hand.filter((c) => c !== card);
    if (player.hand.length === 1) {
        const low_cards_msg = make_info_message('Only one card to go!');
        const alt_low_cards_msg = make_warning_message(`${player.name} only has one card left!`);
        flash_player(game_data, player, low_cards_msg, alt_low_cards_msg);
    }
    game_data.stack.push(card);
    if (card.value === 'REVERSE') {
        game_data.reverse = !game_data.reverse;
        if (game_data.players.length !== 2) {
            let reverse_msg: IMessage;
            if (game_data.reverse) {
                reverse_msg = make_info_message('Game order has been reversed');
            } else {
                reverse_msg = make_info_message('Game order is back to normal');
            }
            flash_broadcast(game_data, reverse_msg);
        }
    }
    if (player.hand.length === 0) {
        set_round_winner(game_data, player);
    } else {
        activate_next_player(game_data, false, false);
    }
    const save_result = await save_state(game_data);
    return save_result;
}

/**
 * Attemps to draw a card for the player.
 * Returns true if successful.
 */
export async function player_draw_card(game_id: string, player_id: string): Promise<boolean> {
    const game_data = await load_state(game_id);
    if (!game_data) {
        return false;
    }
    const player = game_data.players.filter((p) => p.id === player_id)[0];
    if (!player) {
        return false;
    }
    if (!player.active) {
        return false;
    }
    if (!game_data.active) {
        return false;
    }
    draw_card(game_data, player);
    const new_card = player.hand[player.hand.length - 1];
    let msg: IMessage | null = null;
    if (!can_play_card(game_data, new_card)) {
        activate_next_player(game_data, true, false);
        msg = make_info_message(`${player.name} drew a card but couldn't play it`);
    } else {
        msg = make_info_message(`${player.name} drew a card`);
    }
    flash_player(game_data, player, null, msg);
    const save_result = await save_state(game_data);
    return save_result;
}

/**
 * Attempts to join a new player to the game.
 * Returns player if successful, otherwise null.
 */
export async function join_game(game_id: string, name: string): Promise<IPlayer | null> {
    name = name || generate_player_name();
    const game_data = await load_state(game_id);
    if (game_data === null) {
        return null;
    }
    if (game_data.active) {
        return null;
    }
    if (game_data.ended_at) {
        return null;
    }
    const player = add_player_to_game(game_data, name);
    if (player !== null) {
        const msg = make_info_message('You have joined the game');
        const alt_msg = make_info_message(`${player.name} has joined the game`);
        flash_player(game_data, player, msg, alt_msg);
        save_state(game_data);
    }
    return player;
}

/**
 * Attempts to remove a player from a game.
 * Returns true if successful.
 */
export async function leave_game(game_id: string, player_id: string): Promise<boolean> {
    const game_data = await load_state(game_id);
    if (game_data === null) {
        return false;
    }
    let quitter = game_data.players.filter((p) => p.id === player_id)[0];
    if (!quitter) {
        return false;
    }
    if (game_data.ended_at) {
        return false;
    }
    const msg = make_info_message('You have left the game');
    const alt_msg = make_info_message(`${quitter.name} has left the game`);
    flash_player(game_data, quitter, msg, alt_msg);
    if (quitter.active) {
        activate_next_player(game_data, false, true);
    }
    game_data.players = game_data.players.filter((p) => p.id !== player_id);
    // If the quitter was the admin and there is at least one player
    // remaining, reassign the admin role to the first position.
    let new_admin: IPlayer | null = null;
    if (quitter.admin && game_data.players.length > 0) {
        new_admin = game_data.players[0];
        new_admin.admin = true;
    }
    // If one player remaining in an active game, end the game now.
    if (game_data.active && game_data.players.length === 1) {
        game_data.active = false;
        game_data.players[0].active = false;
        game_data.ended_at = serialize_datetime(new Date());
        const end_msg = make_info_message('The game has ended');
        flash_broadcast(game_data, end_msg);
    }
    if (new_admin && !(game_data.started_at || game_data.ended_at)) {
        const admin_msg = make_info_message('You are now the game administrator');
        flash_player(game_data, new_admin, admin_msg, null);
    }
    // If no players remaining, end the game now.
    if (game_data.players.length === 0) {
        game_data.ended_at = serialize_datetime(new Date());
    }
    // If game is still active at this point, reclaim the quitter's cards.
    if (game_data.active) {
        reclaim_player_cards(game_data, quitter);
    }
    const save_result = await save_state(game_data);
    return save_result;
}

/**
 * Attempts to start the game, as long as the player is admin.
 * Returns True if successful.
 */
export async function admin_start_game(game_id: string, player_id: string): Promise<boolean> {
    const game_data = await load_state(game_id);
    if (!game_data) {
        return false;
    }
    if (game_data.active) {
        return false;
    }
    if (game_data.ended_at) {
        return false;
    }
    if (game_data.players.length < game_data.min_players) {
        return false;
    }
    const player = game_data.players.filter((p) => p.id === player_id)[0];
    if (!player) {
        return false;
    }
    if (!player.admin) {
        return false;
    }
    start_game(game_data);
    const msg = make_info_message('The game has started');
    const alt_msg = make_info_message(`${player.name} started the game`);
    await flash_player(game_data, player, msg, alt_msg);
    const other_msg = make_info_message(`The first player to reach ${game_data.points_to_win} points wins!`);
    flash_broadcast(game_data, other_msg);
    const save_result = await save_state(game_data);
    return save_result;
}

export async function get_state(game_id: string, player_id: string): Promise<IGameData | null> {
    const game_data = await load_state(game_id);
    if (!game_data) {
        return null;
    }
    const player = game_data.players.filter((p) => p.id === player_id)[0];
    if (!player) {
        return null;
    }
    const messages = player.messages;
    if (messages.length > 0) {
        player.messages = [];
        await save_state(game_data);
    }
    (game_data as any).messages = messages;
    (game_data as any).draw_pile_size = game_data.deck.length;
    delete (game_data as any).deck;
    let last_discard = null;
    if (game_data.stack.length > 0) {
        last_discard = game_data.stack[game_data.stack.length - 1];
    }
    (game_data as any).last_discard = last_discard;
    (game_data as any).discard_pile_size = game_data.stack.length;
    for (const p of game_data.players) {
        delete (p as any).messages;
        (p as any).hand_size = p.hand.length;
        if (p === player && p.active) {
            (p as any).draw_required = true;
            for (const card of p.hand) {
                if (can_play_card(game_data, card)) {
                    (p as any).draw_required = false;
                    break;
                }
            }
        } else if (p !== player) {
            (p as any).id = null;
            delete (p as any).hand;
        }
    }
    delete (game_data as any).stack;
    return game_data;
}

class PlayerIterator {

    private readonly players: IPlayer[];
    private readonly step: number;
    private index: number;

    constructor(players: IPlayer[], activePlayer: IPlayer, reversed = false) {
        this.players = players;
        this.step = (reversed) ? -1 : 1;
        this.index = players.indexOf(activePlayer);
    }

    public next(): IPlayer {
        this.index += this.step;
        if (this.index < 0) {
            this.index = this.players.length - 1;
        } else if (this.index === this.players.length) {
            this.index = 0;
        }
        return this.players[this.index];
    }

}
