/**
 * @fileoverview Helper utilities for bootstrapping and initial data seeding.
 */

import type { IStoragePort } from "./db/storagePort.js";
import type { StumbleAsset } from "./models/asset.js";
import type { User } from "./models/user.js";
import bcrypt from "bcrypt";
import { settings } from "./config/settings.js";

export type SeedAsset = Omit<StumbleAsset, "created_at" | "last_visited_at">;

// The **curated content library** (#173) — the moat. Hand-picked, render-friendly,
// channel-organized content modeled on Cloudhiker. Two hard rules from the eval
// sessions: (1) **no single source appears more than twice** (a 55%-Wikipedia pool
// tanked session 3); (2) **format-diverse** — most entries are non-article so the
// stream isn't a reading list. Interactive/image entries can be site *homepages*
// here because they render as preview cards (#172), not blank iframes. Articles must
// still be deep, reader-extractable links. The recommender reorders this pool; it
// grows over time via live sources and (later) promoted community submissions.
export const DEFAULT_SEED_ASSETS: SeedAsset[] = [
  // === Deep Dives (article → reader) ===
  {
    id: "d1",
    url: "https://blog.codinghorror.com/the-best-code-is-no-code-at-all/",
    title: "The Best Code is No Code At All",
    description: "A classic essay on why less code is better code.",
    source: "Coding Horror",
    category: "tech",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  {
    id: "d2",
    url: "https://paulgraham.com/greatwork.html",
    title: "How to Do Great Work",
    description: "Paul Graham on doing work that matters.",
    source: "Paul Graham",
    category: "tech",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  {
    id: "d3",
    url: "https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/",
    title: "Things You Should Never Do, Part I",
    description: "Joel Spolsky on why you should never rewrite from scratch.",
    source: "Joel on Software",
    category: "tech",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  {
    id: "d4",
    url: "https://waitbutwhy.com/2014/05/fermi-paradox.html",
    title: "The Fermi Paradox",
    description: "Where is everybody? Tim Urban on the deafening cosmic silence.",
    source: "Wait But Why",
    category: "science",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  {
    id: "d5",
    url: "https://en.wikipedia.org/wiki/Tardigrade",
    title: "Tardigrade",
    description: "The near-indestructible micro-animal that survives space.",
    source: "Wikipedia",
    category: "science",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  {
    id: "d6",
    url: "https://en.wikipedia.org/wiki/Voynich_manuscript",
    title: "The Voynich Manuscript",
    description: "A 600-year-old book no one has ever been able to read.",
    source: "Wikipedia",
    category: "random",
    rating: 0,
    type: "article",
    channel: "Deep Dives",
  },
  // === Fun & Interactive (preview card) ===
  {
    id: "f1",
    url: "https://neal.fun/",
    title: "Neal.fun",
    description: "A playground of weird, wonderful interactive experiments.",
    source: "neal.fun",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Fun & Interactive",
  },
  {
    id: "f2",
    url: "https://pointerpointer.com/",
    title: "Pointer Pointer",
    description: "A delightfully useless interactive toy. Move your mouse.",
    source: "Pointer Pointer",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Fun & Interactive",
  },
  {
    id: "f3",
    url: "https://theuselessweb.com/",
    title: "The Useless Web",
    description: "One button, one random and gloriously pointless corner of the web.",
    source: "The Useless Web",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Fun & Interactive",
  },
  {
    id: "f4",
    url: "https://www.windows93.net/",
    title: "Windows 93",
    description: "A surreal parody operating system you can actually play with.",
    source: "Windows93",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Fun & Interactive",
  },
  // === Games (preview card) ===
  {
    id: "g1",
    url: "https://play2048.co/",
    title: "2048",
    description: "The addictive sliding-tile puzzle. Just one more go.",
    source: "2048",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Games",
  },
  {
    id: "g2",
    url: "https://slither.io/",
    title: "Slither.io",
    description: "A massively-multiplayer take on the classic snake game.",
    source: "Slither.io",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Games",
  },
  // === Gadgets & Tools (preview card) ===
  {
    id: "gt1",
    url: "https://excalidraw.com/",
    title: "Excalidraw",
    description: "A virtual whiteboard with a hand-drawn feel.",
    source: "Excalidraw",
    category: "tech",
    rating: 0,
    type: "interactive",
    channel: "Gadgets & Tools",
  },
  {
    id: "gt2",
    url: "https://www.photopea.com/",
    title: "Photopea",
    description: "A full-featured Photoshop-like image editor in the browser.",
    source: "Photopea",
    category: "tech",
    rating: 0,
    type: "interactive",
    channel: "Gadgets & Tools",
  },
  {
    id: "gt3",
    url: "https://www.wolframalpha.com/",
    title: "Wolfram Alpha",
    description: "A computational knowledge engine that answers, not just searches.",
    source: "WolframAlpha",
    category: "tech",
    rating: 0,
    type: "interactive",
    channel: "Gadgets & Tools",
  },
  // === Funny (preview card) ===
  {
    id: "fn1",
    url: "https://xkcd.com/1133/",
    title: "xkcd: Up Goer Five",
    description: "The Saturn V explained using only the 1,000 most common words.",
    source: "xkcd",
    category: "art",
    rating: 0,
    type: "image",
    channel: "Funny",
  },
  {
    id: "fn2",
    url: "https://xkcd.com/327/",
    title: "xkcd: Exploits of a Mom",
    description: "Little Bobby Tables — the most famous SQL-injection joke ever.",
    source: "xkcd",
    category: "tech",
    rating: 0,
    type: "image",
    channel: "Funny",
  },
  // === Art (preview card) ===
  {
    id: "a1",
    url: "https://www.thisiscolossal.com/",
    title: "Colossal",
    description: "A daily stream of art, design and visual wonder.",
    source: "Colossal",
    category: "art",
    rating: 0,
    type: "image",
    channel: "Art",
  },
  {
    id: "a2",
    url: "https://apod.nasa.gov/apod/ap991227.html",
    title: "NASA Astronomy Picture of the Day",
    description: "A daily dose of the cosmos — astronomy imagery from NASA.",
    source: "NASA APOD",
    category: "science",
    rating: 0,
    type: "article",
    channel: "Art",
  },
  {
    id: "a3",
    url: "https://unsplash.com/",
    title: "Unsplash",
    description: "A bottomless gallery of beautiful, free photography.",
    source: "Unsplash",
    category: "art",
    rating: 0,
    type: "image",
    channel: "Art",
  },
  // === Videos (player) ===
  {
    id: "v1",
    url: "https://www.youtube.com/embed/h6fcK_fRYaI",
    title: "The Egg — A Short Story",
    description: "Kurzgesagt's animated take on an Andy Weir short story.",
    source: "YouTube",
    category: "science",
    rating: 0,
    type: "video",
    channel: "Videos",
  },
  {
    id: "v2",
    url: "https://www.youtube.com/embed/jNQXAC9IVRw",
    title: "Me at the Zoo",
    description: "The very first video ever uploaded to YouTube.",
    source: "YouTube",
    category: "random",
    rating: 0,
    type: "video",
    channel: "Videos",
  },
  {
    id: "v3",
    url: "https://player.vimeo.com/video/148751763",
    title: "Sintel",
    description: "A visually stunning short fantasy film.",
    source: "Vimeo",
    category: "art",
    rating: 0,
    type: "video",
    channel: "Videos",
  },
  {
    id: "v4",
    url: "https://player.vimeo.com/video/56942699",
    title: "The Present",
    description: "A touching short animation about a boy and a gift.",
    source: "Vimeo",
    category: "art",
    rating: 0,
    type: "video",
    channel: "Videos",
  },
  // === Indie & Classic Web (preview card) ===
  {
    id: "ic1",
    url: "https://wiby.me/",
    title: "Wiby",
    description: "A search engine for the lightweight, personal, classic web.",
    source: "Wiby",
    category: "random",
    rating: 0,
    type: "interactive",
    channel: "Indie & Classic Web",
  },
  {
    id: "ic2",
    url: "https://publicdomainreview.org/",
    title: "The Public Domain Review",
    description: "Curated essays and images from the forgotten public domain.",
    source: "Public Domain Review",
    category: "art",
    rating: 0,
    type: "image",
    channel: "Indie & Classic Web",
  },

  // ===== Corpus expansion (#204): +80 curated, source-capped (<=2), rotating =====

  // --- Deep Dives (article) ---
  { id: "d7", url: "https://paulgraham.com/hp.html", title: "Hackers and Painters", description: "Paul Graham on what makers and painters have in common.", source: "Paul Graham", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d8", url: "https://waitbutwhy.com/2015/12/the-tail-end.html", title: "The Tail End", description: "A sobering, motivating look at how little time we have left with people.", source: "Wait But Why", category: "random", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d9", url: "https://kk.org/thetechnium/68-bits-of-unsolicited-advice/", title: "68 Bits of Unsolicited Advice", description: "Kevin Kelly's hard-won, quotable life advice.", source: "Kevin Kelly", category: "random", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d10", url: "https://solar.lowtechmagazine.com/2015/10/how-to-build-a-low-tech-internet/", title: "How to Build a Low-Tech Internet", description: "Solar-powered, off-grid networks that already work.", source: "Low-Tech Magazine", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d11", url: "https://www.multivax.com/last_question.html", title: "The Last Question", description: "Asimov's favorite of his own stories — can entropy be reversed?", source: "Multivax", category: "science", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d12", url: "https://fs.blog/david-foster-wallace-this-is-water/", title: "This Is Water", description: "DFW's commencement speech on attention and choice.", source: "Farnam Street", category: "random", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d13", url: "https://sive.rs/hyn", title: "Hell Yeah or No", description: "Derek Sivers' filter for what to say yes to.", source: "Derek Sivers", category: "random", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d14", url: "https://grugbrain.dev/", title: "The Grug Brained Developer", description: "A caveman's guide to taming software complexity.", source: "Grug Brain", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d15", url: "https://www.kalzumeus.com/2010/06/17/falsehoods-programmers-believe-about-names/", title: "Falsehoods Programmers Believe About Names", description: "Why your name field is almost certainly wrong.", source: "Kalzumeus", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d16", url: "https://danluu.com/deconstruct-files/", title: "Files Are Hard", description: "All the ways writing a file to disk can betray you.", source: "Dan Luu", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d17", url: "https://www.cs.virginia.edu/~robins/YouAndYourResearch.html", title: "You and Your Research", description: "Richard Hamming on how to do work that matters.", source: "Richard Hamming", category: "science", rating: 0, type: "article", channel: "Deep Dives" },
  { id: "d18", url: "https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/", title: "What Color Is Your Function?", description: "The hidden tax of async code, explained.", source: "Bob Nystrom", category: "tech", rating: 0, type: "article", channel: "Deep Dives" },

  // --- Fun & Interactive (interactive) ---
  { id: "f5", url: "https://pudding.cool/", title: "The Pudding", description: "Visual essays that explain ideas debated in culture.", source: "The Pudding", category: "random", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f6", url: "https://radio.garden/", title: "Radio Garden", description: "Spin the globe and tune into live radio anywhere.", source: "Radio Garden", category: "random", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f7", url: "https://www.window-swap.com/", title: "WindowSwap", description: "Look out of someone else's window, somewhere in the world.", source: "WindowSwap", category: "random", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f8", url: "https://asoftmurmur.com/", title: "A Soft Murmur", description: "Mix your own ambient soundscape of rain, waves and wind.", source: "A Soft Murmur", category: "random", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f9", url: "https://stellarium-web.org/", title: "Stellarium Web", description: "A live planetarium for the sky above you, right now.", source: "Stellarium", category: "science", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f10", url: "https://www.htwins.net/scale2/", title: "The Scale of the Universe", description: "Zoom from quantum foam to the cosmic web.", source: "Scale of the Universe", category: "science", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f11", url: "https://ncase.me/trust/", title: "The Evolution of Trust", description: "A playable game-theory explainer on cooperation.", source: "Nicky Case", category: "science", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f12", url: "https://ciechanow.ski/", title: "Bartosz Ciechanowski", description: "Jaw-dropping interactive explainers of how things work.", source: "Ciechanowski", category: "science", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f13", url: "https://www.patatap.com/", title: "Patatap", description: "A portable animation and sound kit — just start typing.", source: "Patatap", category: "art", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f14", url: "https://thisissand.com/", title: "This Is Sand", description: "Pour and paint with falling grains of sand.", source: "This Is Sand", category: "art", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f15", url: "http://weavesilk.com/", title: "Silk", description: "Draw shimmering, symmetrical generative art.", source: "Silk", category: "art", rating: 0, type: "interactive", channel: "Fun & Interactive" },
  { id: "f16", url: "https://quickdraw.withgoogle.com/", title: "Quick, Draw!", description: "Can a neural net guess your doodle in 20 seconds?", source: "Google AI", category: "random", rating: 0, type: "interactive", channel: "Fun & Interactive" },

  // --- Games (interactive) ---
  { id: "g3", url: "https://www.nytimes.com/games/wordle/index.html", title: "Wordle", description: "Six guesses, one five-letter word, once a day.", source: "NYT Games", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g4", url: "https://lichess.org/", title: "Lichess", description: "Free, no-ads online chess against the world.", source: "Lichess", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g5", url: "https://www.geoguessr.com/", title: "GeoGuessr", description: "Dropped on a random street — guess where on Earth you are.", source: "GeoGuessr", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g6", url: "https://agar.io/", title: "Agar.io", description: "Eat cells, grow bigger, avoid being eaten.", source: "Agar.io", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g7", url: "https://hextris.io/", title: "Hextris", description: "A fast, hexagonal twist on falling-block puzzles.", source: "Hextris", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g8", url: "https://orteil.dashnet.org/cookieclicker/", title: "Cookie Clicker", description: "The original idle game — bake an absurd number of cookies.", source: "Cookie Clicker", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g9", url: "https://adarkroom.doublespeakgames.com/", title: "A Dark Room", description: "A minimalist text game that quietly becomes an epic.", source: "A Dark Room", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g10", url: "https://sandspiel.club/", title: "Sandspiel", description: "A falling-sand world of fire, water, plants and wind.", source: "Sandspiel", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g11", url: "https://www.linerider.com/", title: "Line Rider", description: "Draw a track and watch a sledder ride your lines.", source: "Line Rider", category: "art", rating: 0, type: "interactive", channel: "Games" },
  { id: "g12", url: "https://flappybird.io/", title: "Flappy Bird", description: "Tap to flap. Rage to follow.", source: "Flappy Bird", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g13", url: "https://ztype.com/", title: "ZType", description: "Shoot down words by typing them — a space typing game.", source: "ZType", category: "random", rating: 0, type: "interactive", channel: "Games" },
  { id: "g14", url: "https://www.crazygames.com/", title: "CrazyGames", description: "A huge library of instant browser games.", source: "CrazyGames", category: "random", rating: 0, type: "interactive", channel: "Games" },

  // --- Funny (image / interactive) ---
  { id: "fn3", url: "https://www.smbc-comics.com/", title: "Saturday Morning Breakfast Cereal", description: "Smart, dark, science-flavored comics.", source: "SMBC", category: "random", rating: 0, type: "image", channel: "Funny" },
  { id: "fn4", url: "https://theoatmeal.com/", title: "The Oatmeal", description: "Long-form comics about life, cats, and grammar.", source: "The Oatmeal", category: "random", rating: 0, type: "image", channel: "Funny" },
  { id: "fn5", url: "https://explosm.net/", title: "Cyanide & Happiness", description: "Stick-figure comics with a mean streak.", source: "Cyanide & Happiness", category: "random", rating: 0, type: "image", channel: "Funny" },
  { id: "fn6", url: "https://poorlydrawnlines.com/", title: "Poorly Drawn Lines", description: "Gentle, absurd, surprisingly wise comics.", source: "Poorly Drawn Lines", category: "random", rating: 0, type: "image", channel: "Funny" },
  { id: "fn7", url: "https://www.theonion.com/", title: "The Onion", description: "America's finest (fake) news source.", source: "The Onion", category: "random", rating: 0, type: "image", channel: "Funny" },
  { id: "fn8", url: "https://hackertyper.net/", title: "Hacker Typer", description: "Mash the keyboard and feel like a movie hacker.", source: "Hacker Typer", category: "random", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn9", url: "https://fallingfalling.com/", title: "Falling Falling", description: "An endless, hypnotic fall through colored bands.", source: "Falling Falling", category: "art", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn10", url: "https://cat-bounce.com/", title: "Cat Bounce", description: "Bouncing cats. That's it. That's the site.", source: "Cat Bounce", category: "random", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn11", url: "https://endless.horse/", title: "Endless Horse", description: "A horse with impossibly long legs. Keep scrolling.", source: "Endless Horse", category: "random", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn12", url: "https://koalastothemax.com/", title: "Koalas to the Max", description: "Click to reveal a hidden picture, dot by dot.", source: "Koalas to the Max", category: "random", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn13", url: "https://zoomquilt.org/", title: "The Zoomquilt", description: "An infinitely zooming collaborative painting.", source: "Zoomquilt", category: "art", rating: 0, type: "interactive", channel: "Funny" },
  { id: "fn14", url: "https://staggeringbeauty.com/", title: "Staggering Beauty", description: "Wiggle your mouse. Maybe don't do it too hard.", source: "Staggering Beauty", category: "random", rating: 0, type: "interactive", channel: "Funny" },

  // --- Gadgets & Tools (interactive) ---
  { id: "gt4", url: "https://squoosh.app/", title: "Squoosh", description: "Compress and compare images right in the browser.", source: "Squoosh", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt5", url: "https://www.remove.bg/", title: "remove.bg", description: "Erase any photo's background in one click.", source: "remove.bg", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt6", url: "https://www.tldraw.com/", title: "tldraw", description: "A delightful infinite collaborative whiteboard.", source: "tldraw", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt7", url: "https://regex101.com/", title: "regex101", description: "Build and debug regular expressions live.", source: "regex101", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt8", url: "https://jsoncrack.com/editor", title: "JSON Crack", description: "Turn any JSON into an explorable node graph.", source: "JSON Crack", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt9", url: "https://carbon.now.sh/", title: "Carbon", description: "Make beautiful images of your source code.", source: "Carbon", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt10", url: "https://godbolt.org/", title: "Compiler Explorer", description: "See the assembly your code compiles to, instantly.", source: "Compiler Explorer", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt11", url: "https://oeis.org/", title: "OEIS", description: "The encyclopedia of integer sequences.", source: "OEIS", category: "science", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt12", url: "https://www.desmos.com/calculator", title: "Desmos Graphing Calculator", description: "Plot functions and play with math, beautifully.", source: "Desmos", category: "science", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt13", url: "https://codepen.io/", title: "CodePen", description: "A playground for front-end code experiments.", source: "CodePen", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt14", url: "https://tinypng.com/", title: "TinyPNG", description: "Smart lossy compression for PNG and JPEG.", source: "TinyPNG", category: "tech", rating: 0, type: "interactive", channel: "Gadgets & Tools" },
  { id: "gt15", url: "https://coolors.co/", title: "Coolors", description: "Generate and lock in beautiful color palettes fast.", source: "Coolors", category: "art", rating: 0, type: "interactive", channel: "Gadgets & Tools" },

  // --- Art (image) ---
  { id: "a4", url: "https://www.wikiart.org/", title: "WikiArt", description: "A vast visual encyclopedia of fine art.", source: "WikiArt", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a5", url: "https://artsandculture.google.com/", title: "Google Arts & Culture", description: "Explore the world's museums from your couch.", source: "Google Arts & Culture", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a6", url: "https://www.metmuseum.org/art/collection", title: "The Met Collection", description: "Half a million open-access artworks.", source: "The Met", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a7", url: "https://www.rijksmuseum.nl/en/rijksstudio", title: "Rijksstudio", description: "Dutch masters in stunning open-access detail.", source: "Rijksmuseum", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a8", url: "https://thispersondoesnotexist.com/", title: "This Person Does Not Exist", description: "A new AI-generated face every time you reload.", source: "TPDNE", category: "tech", rating: 0, type: "image", channel: "Art" },
  { id: "a9", url: "https://archillect.com/", title: "Archillect", description: "An AI that discovers and curates striking images.", source: "Archillect", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a10", url: "https://www.behance.net/", title: "Behance", description: "Showcase galleries from working creatives.", source: "Behance", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a11", url: "https://dribbble.com/shots", title: "Dribbble", description: "A firehose of polished design shots.", source: "Dribbble", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a12", url: "https://images.nasa.gov/", title: "NASA Image Library", description: "Decades of space imagery, free to explore.", source: "NASA", category: "science", rating: 0, type: "image", channel: "Art" },
  { id: "a13", url: "https://esahubble.org/images/", title: "Hubble Image Gallery", description: "The universe in breathtaking high resolution.", source: "ESA/Hubble", category: "science", rating: 0, type: "image", channel: "Art" },
  { id: "a14", url: "https://www.oldbookillustrations.com/", title: "Old Book Illustrations", description: "Scanned art from the golden age of book printing.", source: "Old Book Illustrations", category: "art", rating: 0, type: "image", channel: "Art" },
  { id: "a15", url: "https://www.europeana.eu/en", title: "Europeana", description: "Millions of artworks and artifacts from Europe's collections.", source: "Europeana", category: "art", rating: 0, type: "image", channel: "Art" },

  // --- Indie & Classic Web (interactive / image) ---
  { id: "ic3", url: "https://news.ycombinator.com/", title: "Hacker News", description: "The tech world's front page of links and debate.", source: "Hacker News", category: "tech", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic4", url: "https://search.marginalia.nu/", title: "Marginalia Search", description: "A search engine that favors the small, text-first web.", source: "Marginalia", category: "tech", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic5", url: "https://neocities.org/browse", title: "Neocities", description: "The revival of creative, hand-made personal sites.", source: "Neocities", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic6", url: "https://gossipsweb.net/", title: "Gossip's Web", description: "A hand-curated directory of the indie web.", source: "Gossip's Web", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic7", url: "https://bearblog.dev/discover/", title: "Bear Blog Discovery", description: "Fresh posts from a fast, minimal blogging community.", source: "Bear Blog", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic8", url: "https://www.cameronsworld.net/", title: "Cameron's World", description: "A love letter collage of the old GeoCities web.", source: "Cameron's World", category: "art", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic9", url: "https://100r.co/", title: "Hundred Rabbits", description: "Two artists living and building software off-grid on a boat.", source: "Hundred Rabbits", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic10", url: "https://yesterweb.org/", title: "The Yesterweb", description: "A community reclaiming a more human internet.", source: "Yesterweb", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic11", url: "https://libraryofbabel.info/", title: "The Library of Babel", description: "Every possible page of text that ever could be written.", source: "Library of Babel", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic12", url: "https://neal.fun/internet-artifacts/", title: "Internet Artifacts", description: "A playable museum of the web, from 1977 to today.", source: "neal.fun", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },

  // === Curated expansion (#268) — append-only; all URLs verified to resolve/embed 2026-06-13 ===
  // Videos (type:video, direct /embed/ URLs)
  { id: "v5", url: "https://www.youtube.com/embed/s86-Z-CbaHA", title: "The Banach–Tarski Paradox", description: "Vsauce on cutting a ball into pieces and reassembling two identical balls.", source: "Vsauce", category: "science", rating: 0, type: "video", channel: "Videos" },
  { id: "v6", url: "https://www.youtube.com/embed/aircAruvnKk", title: "But what is a neural network?", description: "3Blue1Brown's beautifully visual introduction to deep learning.", source: "3Blue1Brown", category: "tech", rating: 0, type: "video", channel: "Videos" },
  { id: "v7", url: "https://www.youtube.com/embed/TRL7o2kPqw0", title: "The Most Radioactive Places on Earth", description: "Veritasium travels the globe with a Geiger counter.", source: "Veritasium", category: "science", rating: 0, type: "video", channel: "Videos" },
  { id: "v8", url: "https://www.youtube.com/embed/GO5FwsblpT8", title: "Pale Blue Dot", description: "Carl Sagan's reflection on the one home we've ever known.", source: "Carl Sagan", category: "science", rating: 0, type: "video", channel: "Videos" },
  // Indie & Classic Web (homepages render as preview cards, #172)
  { id: "ic13", url: "https://jspaint.app/", title: "JS Paint", description: "A pixel-perfect remake of MS Paint, right in the browser.", source: "JS Paint", category: "tech", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic14", url: "https://www.spacejam.com/1996/", title: "Space Jam (1996)", description: "The original Space Jam website, preserved exactly as it was.", source: "Space Jam", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  { id: "ic15", url: "https://zombo.com/", title: "Zombo.com", description: "The only limit is yourself. A monument to the early web.", source: "Zombo", category: "random", rating: 0, type: "interactive", channel: "Indie & Classic Web" },
  // Science & Space (article = deep reader-extractable permalink; image/interactive render as cards)
  { id: "sci1", url: "https://hubblesite.org/", title: "HubbleSite", description: "The official gallery of Hubble Space Telescope imagery.", source: "HubbleSite", category: "science", rating: 0, type: "image", channel: "Science & Space" },
  { id: "sci2", url: "https://www.quantamagazine.org/how-the-physics-of-nothing-underlies-everything-20220809/", title: "How the Physics of Nothing Underlies Everything", description: "A deep, readable feature on the quantum vacuum.", source: "Quanta Magazine", category: "science", rating: 0, type: "article", channel: "Science & Space" },
  { id: "sci3", url: "https://www.solarsystemscope.com/", title: "Solar System Scope", description: "An interactive 3D model of the solar system and night sky.", source: "Solar System Scope", category: "science", rating: 0, type: "interactive", channel: "Science & Space" },
];

export async function ensureDevUser(storage: IStoragePort): Promise<void> {
  const devUserId = settings.devUserId;
  const existingUser = await storage.getUserById(devUserId);
  if (!existingUser) {
    const devUser: User = {
      id: devUserId,
      email: "dev@stumble.local",
      password_hash: await bcrypt.hash("devpass", 10),
      display_name: "Dev User",
      provider: "local",
      created_at: new Date(),
    };
    await storage.saveUser(devUser);
    // User created successfully
  }
}

export async function seedDefaultAssets(storage: IStoragePort): Promise<void> {
  for (const asset of DEFAULT_SEED_ASSETS) {
    await storage.saveAsset({
      ...asset,
      created_at: new Date(),
    });
  }
  await ensureDevUser(storage);
}
