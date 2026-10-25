// Plain data with no imports, so the e2e specs can import it too.

export interface IHowToPlaySlide {
    title: string;
    description: string;
    media: { kind: "video" | "image"; src: string };
}

const CLIP_DIR = "assets/how-to-play";

const clip = (file: string) => ({ kind: "video" as const, src: `${CLIP_DIR}/${file}` });

export const HOW_TO_PLAY_SLIDES: IHowToPlaySlide[] = [
    {
        title: "The Rules",
        description:
            "Two fleets, one 7×5 sea. Each round both players give their orders in secret, then the orders play out together. Sink the enemy flagship to win, and keep yours afloat.",
        media: { kind: "image", src: `${CLIP_DIR}/00-rules.png` },
    },
    {
        title: "Create or Join a Game",
        description:
            "Enter your name and press Create Game to get a 4-letter game code, then share it. Your opponent enters their name and the code, then presses Join Game.",
        media: clip("01-create-join.mp4"),
    },
    {
        title: "Wait for Your Opponent",
        description:
            "If you created the game, wait for your opponent to join, then press Refresh to load the board. If you joined, the board is ready straight away.",
        media: clip("02-wait-refresh.mp4"),
    },
    {
        title: "Deploy Your Flagship",
        description:
            "Your flagship always goes out first. Its card is already selected: click one of the highlighted tiles on your home row to place it.",
        media: clip("03-deploy-flagship.mp4"),
    },
    {
        title: "Command Points",
        description:
            "Orders cost command points: deploying a ship, moving, attacking and most support cards. You refill up to your maximum (default: 2) each round, and deploying your flagship is free.",
        media: clip("04-command-points.mp4"),
    },
    {
        title: "Your Hand",
        description:
            "Your hand holds up to 4 cards: ships to deploy and supports to play. Cards you play are replaced from your deck when the round ends. There are limited number of each card in your faction's deck.",
        media: clip("05-hand.mp4"),
    },
    {
        title: "Card Details",
        description:
            "Press the info button at the end of a card to see what it does, its cost and its stats, without playing it.",
        media: clip("06-details.mp4"),
    },
    {
        title: "Playing Cards",
        description:
            "Click a ship card, then a highlighted tile, to deploy that ship. Click a support card such as Flare, then pick a target tile to create its effect.",
        media: clip("07-play-cards.mp4"),
    },
    {
        title: "Move",
        description:
            "Select one of your ships and choose Move. Click a highlighted tile, check the route, then confirm. Islands and other ships block the way.",
        media: clip("08-move.mp4"),
    },
    {
        title: "Attack",
        description:
            "Select a ship and choose Attack, then click a highlighted tile within its range. Each ship can attack once per round.",
        media: clip("09-attack.mp4"),
    },
    {
        title: "Submit Your Orders",
        description:
            "When your orders are in, press Submit Move. Once both players have submitted, the round resolves in initiative order, and initiative passes to the other player each round.",
        media: clip("10-submit.mp4"),
    },
    {
        title: "Fog of War",
        description:
            "You only see enemy ships close to your own. Effects from Cards like the Flare Support Card lights up an area for a couple of rounds and reveals anything inside it.",
        media: clip("11-fog-of-war.mp4"),
    },
    {
        title: "Playback",
        description:
            "After a round resolves, it plays back so you can see every move and shot. Click anywhere to skip it, or press the playback button to watch it again.",
        media: clip("12-playback.mp4"),
    },
    {
        title: "Game End",
        description:
            "A ship sinks when all of its hulls are destroyed. Sink the enemy flagship to win. If both flagships go down in the same round, it's a draw.",
        media: clip("13-game-end.mp4"),
    },
];
