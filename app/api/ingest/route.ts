import { NextResponse } from "next/server";
import { MeiliSearch } from "meilisearch";
import crypto from "node:crypto";

/* ----------------------- 1) CONFIG ----------------------- */
const INDEX_NAME = "bodybuilding";
const MAX_PER_FEED = 40;

const FEEDS: string[] = [

  /* ──────────────────────────── BODYBUILDING NEWS & MEDIA ──────────────────────────── */
  "https://generationiron.com/feed/",
  "https://barbend.com/feed/",
  "https://www.muscleandfitness.com/feed/",
  "https://www.bodybuilding.com/rss/articles.xml",
  "https://www.rxmuscle.com/component/k2?format=feed",
  "https://www.evolutionofbodybuilding.net/feed/",
  "https://fitnessvolt.com/feed/",
  "https://www.ironmanmagazine.com/feed/",
  "https://www.musculardevelopment.com/feed/",
  "https://www.criticalbench.com/feed/",
  "https://www.tigerfitness.com/blogs/news.atom",
  "https://www.fbsupplementsreview.com/feed/",
  "https://www.strongerbyscience.com/feed/",
  "https://startingstrength.com/feed/",
  "https://www.stack3d.com/feed",
  "https://www.fitnessexpost.com/feed/",
  "https://www.bodybuildingmealplan.com/feed/",
  "https://www.elitefitness.com/articles/feed/",
  "https://www.bodybuildingreview.net/feed/",
  "https://www.powerliftingtechnique.com/feed/",
  "https://girlswhopowerlift.com/feed/",

  /* Reddit */
  "https://www.reddit.com/r/bodybuilding/.rss",
  "https://www.reddit.com/r/naturalbodybuilding/.rss",
  "https://www.reddit.com/r/fitness/.rss",

  /* ──────────────────────────── FITNESS & TRAINING ──────────────────────────── */
  "https://breakingmuscle.com/feed/",
  "https://www.t-nation.com/feed/",
  "https://www.strengthlog.com/feed/",
  "https://athleanx.com/feed",
  "https://jocthetrainer.com/feed/",
  "https://physiqonomics.com/feed/",
  "https://www.strongfirst.com/feed/",
  "https://www.powerlifting.sport/feed/",
  "https://www.bodyweighttrainingarena.com/feed/",
  "https://www.liftvault.com/feed/",
  "https://www.simplyshredded.com/feed/",

  /* ──────────────────────────── NUTRITION, SUPPLEMENTS & HEALTH ──────────────────────────── */
  "https://examine.com/feed/",
  "https://supplementclarity.com/feed/",
  "https://www.healthline.com/rss",
  "https://www.precisionnutrition.com/feed",
  "https://www.nutritionadvance.com/feed/",
  "https://legionathletics.com/blog/feed/",
  "https://renaissanceperiodization.com/feed",
  "https://supplementreviews.com/feed/",
  "https://www.anabolicmen.com/feed/",
  "https://www.healthspanmd.com/feed/",

  /* ──────────────────────────── YOUTUBE BODYBUILDING CHANNELS ──────────────────────────── */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A", // Jay Cutler TV
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH_eAE8XV9cKkZDxm0M1g", // Samson Dauda
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCf0I2aWlY8qlLAm5XB9mV0Q", // Milos Sarcev
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCp6vF7tHVq2OA4RKu0Iomqg", // Chris Bumstead
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCGxvVQkA-ZEYo2S_moWWJ0A", // Urs Kalecinski
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZZkqJd3uJWFVYzWxZmf0Ug", // Derek Lunsford
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCtiJ_75gkbxSdjUjv05zF7Q", // Hadi Choopan
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCYWdz9dZYkTfGZNVVRhkE0Q", // Hunter Labrada
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCSzUxI4VqWj5gI29s-8Zv-g", // Flex Lewis
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-fR6qQ0mVqS4YPjR6B_0dg", // Kai Greene
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQL-1aQ3e8Qor2yZzS5HcyQ", // Nick Walker
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdK0yQ8r4ps2Q9VHtV6nQZA", // Regan Grimes
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCcJtTghV_csFJpQk6WvVlyg", // Big Ramy
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi7iZYxzQxYv3grnHVY0bNQ", // Bodybuilding University
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCsi4f95q-wK0Hn3o9gBWTKg", // Old School Labs
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-2JUs_G21BrJ0EFqFFLrFQ", // Larry Wheels
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC8tTGHpgK5YV9g5z0q7Z0bw", // Noel Deyzel
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCqkxvB4vOB6x97_GMPQwzJw", // Ben Pakulski
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCk7XH-Sdd90b4p9vWlC8bZw", // Antoine Vaillant
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCJmr4O7zUFLx4lIZdKT7qag", // Shawn Ray
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLZ0FODa0kC4qO7I5LbhZ3w", // Seth Feroce
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCc0Y3i8S3Pq83ezBz7GSeGQ", // Blessing Awodibu
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdh3GK6W7wopgB8o6EqYTJw", // Akim Williams
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi_1eG9ZjZC1HQD0t8JvjQA", // Patrick Moore
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCy1P5LjWwzOZcRHdSPVUbFQ", // Bishop Sycamore Shawn Rhoden Legacy
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC_xnFIcErX7qwCqvaHP3Wyg", // Brandon Curry
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC5Yzv0wL2pEPc9DXU-FN74A", // Big Boy (Strength Cartel)
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCe7YZC4QG8WJswE0YvFf7Wg", // Coach Greg Doucette
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Beyond the Stage TV (you wanted)
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCW0y3z4dH2Q4GMW4j-WlS1Q", // MattDoesFitness (big fitness)
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCJXhxrVPJcQpGdjK70M9Jxg", // Alex Eubank (fitness influence)
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2zX7f7P6B4ezgm5S4tbk-A", // Michael Daboul
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2LVNpjYrXEKQqxh0aOR_1A", // Terrence Ruffin
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCWCA9s_0L5WzJwgVdsH9zSw", // Hassan Mostafa
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCP7ru6JEjJdfL7ZqTEfFwbw", // Nathan De Asha
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1n6m34V0tmC8YpWQK0YvBw", // Nick Strength & Power — News
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwR8tn9qxO0bH1lBFzYfcwA", // More Plates More Dates — Fitness/Enhancement
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC2O3WUlARlJ97H2p8S3e8Jw", // Fouad Abiad — Bodybuilding News/Podcasts
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCs2y1cJGOxN0Hf1hY8jA23Q", // Bodybuilding.com — General Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCRB8C7v4VfJd_LGZr4IFk6A", // Jay Cutler TV — Pro Bodybuilding Lifestyle
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH_eAE8XV9cKkZDxm0M1g", // Samson Dauda — IFBB Pro Content
  "https://www.youtube.youtube.com/feeds/videos.xml?channel_id=UCf0I2aWlY8qlLAm5XB9mV0Q", // Milos Sarcev — Coaching / Training
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCp6vF7tHVq2OA4RKu0Iomqg", // Chris Bumstead — Classic Physique
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCGxvVQkA-ZEYo2S_moWWJ0A", // Urs Kalecinski — Classic Physique
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZZkqJd3uJWFVYzWxZmf0Ug", // Derek Lunsford — IFBB Pro Olympia
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCtiJ_75gkbxSdjUjv05zF7Q", // Hadi Choopan — Men’s Open
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCYWdz9dZYkTfGZNVVRhkE0Q", // Hunter Labrada — IFBB Pro
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCSzUxI4VqWj5gI29s-8Zv-g", // Flex Lewis — 212 Legend
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC-fR6qQ0mVqS4YPjR6B_0dg", // Kai Greene — IFBB Superstar

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQL-1aQ3e8Qor2yZzS5HcyQ", // Nick Walker — IFBB Pro Open
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdK0yQ8r4ps2Q9VHtV6nQZA", // Regan Grimes — IFBB Pro Open
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCcJtTghV_csFJpQk6WvVlyg", // Big Ramy — IFBB Pro Open
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi7iZYxzQxYv3grnHVY0bNQ", // Bodybuilding University — Bodybuilding Education
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Beyond The Stage TV — Contest Coverage
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCpWGHXGhYdP_vJdYoux0WYg", // Voice of Bodybuilding (Bob Chick) — Expert Commentary
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxFjK5JGgX7h1C9m1nFJnHw", // Desktop Bodybuilding — Contest News
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZWvZK0oHIYxXOMqvV5hNKA", // Pro Talk — Bodybuilder Interviews

  "https://www.youtube.com/feeds/videos.xml?channel_id=UC97k3hlbE-1rVN8y56zyEEA", // Bodybuilding.com Podcast — Interviews/Education
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC68TLK0mAEzUyHx5k-SmMZw", // Jeff Nippard — Science/Training
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH-U2TXzj1h7lyYQZLNQQ", // Greg Doucette — Coaching/Science
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCg_tz2iw7p8-SmMZw", // Kali Muscle — Entertainment/Fitness
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCMj0iPlfMyag2UEG0XDuHOA", // Scott Herman Fitness — Training
  "https://www.youtube.com/feeds/videos.xml?channel_id=UChXRi2xTPa8-SmMZw", // Rohit Khatri Fitness — Bodybuilding Content

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLYcZCCpG07QPsZoq0eGGkQ", // Jordan Peters (JP) — Hardcore Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCflH9hOeHfQCLOtiD7jU0Sw", // John Meadows (Mountain Dog) — Coaching/Training
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCE2Pz_xN_35w0LmVeB8lX7w", // Ben Pakulski (MI40) — Hypertrophy Science
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCChxP6K4WlZ8P-lL5hzhGKg", // GoobU — Industry Scandals/Investigations
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCb8P0HY3cq0C4P8cTid_4Kw", // Austin Stout — Coaching/Nutrition
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCydx2L9Z1313FzCV1pblB8w", // Phil Visicaro — IFBB Coach
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCx1B1cXrZeRIFJxZJ4m16-Q", // Mark Lobliner — Supplements/Training

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCqYPhGiB9tkShZorfgcL2lA", // Dr. Eric Helms — Evidence-Based Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCnGpu0DqZmluL8HnGzAx5yg", // Renaissance Periodization — Science-Based Training
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCpTveP_PwP7paqPzjJrwE-g", // Layne Norton — Nutrition Science
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCMgK2E4y0aZlhanCwQ_NaOg", // Sigma Nutrition — Nutrition Research
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwT08km6i61PZx35AgO4mJw", // Will Tennyson — Fitness Lifestyle

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCe3hZq2a6ER_53p2-vclx6g", // RX Muscle — Bodybuilding News
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC9vQL0qHvU42Bs2C2Na2Ynw", // Muscular Development — Bodybuilding Coverage
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCVHY7KF9wGZBwTQ-2iPSwFQ", // Pro Bodybuilding Worldwide — Radio & Analysis

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCwmP7lQ-EAoO2yUfd1brW2g", // Larry Wheels — Strength/Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC1iQHSDyosz0Jdi-csOvIhA", // Jesse James West — Fitness Lifestyle
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCOWaiE4r23y9n09GjjltP2g", // Noel Deyzel — Bodybuilding Motivation
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCU1NlzD4qG9Z4fKgHYgBp7Q", // Bradley Martyn — Gym Culture
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxJNsEk78d3Z2N7K6Qd3YpA", // Mike Thurston — Physique/Aesthetics
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCvyzKyn5pKyj_tkChrVvkqw", // Sam Sulek — Raw Gym Videos
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCjzT1jMOA2vQCxZtq8npXqA", // Joe Fazer — Gym Lifestyle

  "https://www.youtube.com/feeds/videos.xml?channel_id=UCyVfO0ntJGDZbW1qxuQZ-jw", // Golden Era Bookworm — Classic Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCXqsQne0YfZ7x2GRB2wSAlA", // Vintage Muscle — Classic Era
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCzV8pwjTXe4jQ_coWqLf1Sg", // Old School Labs — Classic Culture
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC6LDI6qbhOePPrK0xJd-VcQ", // Bodybuilding Legends Show — History Interviews

  /* ──────────────────────────── News ──────────────────────────── */
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC97k3hlbE-1rVN8y56zyEEA", // Bodybuilding.com Podcast
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC68TLK0mAEzUyHx5k-SmMZw", // Jeff Nippard
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCQL-1aQ3e8Qor2yZzS5HcyQ", // Nick Walker
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCdK0yQ8r4ps2Q9VHtV6nQZA", // Regan Grimes
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCi7iZYxzQxYv3grnHVY0bNQ", // Bodybuilding University
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCf0I2aWlY8qlLAm5XB9mV0Q", // Milos Sarcev
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Muscle Discord
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxFjK5JGgX7h1C9m1nFJnHw", // Desktop Bodybuilding
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCLqH-U2TXzj1h7lyYQZLNQQ", // Greg Doucette
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCg_tz2iw7p8-SmMZw", // Kali Muscle
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCMj0iPlfMyag2UEG0XDuHOA", // Scott Herman Fitness
  "https://www.youtube.com/feeds/videos.xml?channel_id=UChXRi2xTPa8-SmMZw", // Rohit Khatri Fitness
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCKpYY0xYeGNN-uOHmQIE7Pg", // Furious Pete
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCsi4f95q-wK0Hn3o9gBWTKg", // Bodybuilding Lifestyle Channel
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Beyond The Stage TV
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCZWvZK0oHIYxXOMqvV5hNKA", // Additional Verified Channel
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCL_-YcVNmU46ZfDjYPkhQw", // Additional Verified Channel
  "https://www.youtube.com/feeds/videos.xml?channel_id=UC7XQkZZgwyUr_FvbzUKGwIQ", // MuscleDiscord
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Beyond The Stage TV
  "https://www.youtube.com/feeds/videos.xml?channel_id=UCxNeUwuud7sustA35dxmOkg", // Voice Of Bodybuilding 
  
  /* ──────────────────────────── INSTAGRAM via RSSHub ──────────────────────────── */
  "https://rsshub.app/instagram/user/samson_dauda",
  "https://rsshub.app/instagram/user/cbum",
  "https://rsshub.app/instagram/user/hadi_choopan",
  "https://rsshub.app/instagram/user/urskalecinski",
  "https://rsshub.app/instagram/user/big_ramy",
  "https://rsshub.app/instagram/user/andrewjacked",
  "https://rsshub.app/instagram/user/william_bonac",
  "https://rsshub.app/instagram/user/nick_walker39",
  "https://rsshub.app/instagram/user/regangrimes",
  "https://rsshub.app/instagram/user/jojodadbully",
  "https://rsshub.app/instagram/user/ramondino_pro",
  "https://rsshub.app/instagram/user/keone_prodigy",
  "https://rsshub.app/instagram/user/charlesgriffin_ifbbpro",
  "https://rsshub.app/instagram/user/justinrodriguezpro",
  "https://rsshub.app/instagram/user/akim_williams_ifbb",
  "https://rsshub.app/instagram/user/joey_swole",
  "https://rsshub.app/instagram/user/brett_wilkin",
  "https://rsshub.app/instagram/user/clarett_ifbbpro",
  "https://rsshub.app/instagram/user/martynfordofficial",
  "https://rsshub.app/instagram/user/michy_ifbbpro",
  "https://rsshub.app/instagram/user/jaycolorado_ifbbpro",
  "https://rsshub.app/instagram/user/jon_delarosa",
  "https://rsshub.app/instagram/user/benpak",
  "https://rsshub.app/instagram/user/sadikhadzovic",
  "https://rsshub.app/instagram/user/antigramaglia_ifbbpro",
  "https://rsshub.app/instagram/user/roellywinklaar",
  "https://rsshub.app/instagram/user/shawn_rhoden",  // Legacy account
  "https://rsshub.app/instagram/user/jacksonpeck_ifbb",
  "https://rsshub.app/instagram/user/patrickmoore_ifbbpro",
  "https://rsshub.app/instagram/user/joeyswoll",
  "https://rsshub.app/instagram/user/joelinibro_ifbb",
  "https://rsshub.app/instagram/user/valentinpetrovpro",
  "https://rsshub.app/instagram/user/martynfordofficial"
  
  /* ──────────────────────────── TIKTOK via RSSHub ──────────────────────────── */
  "https://rsshub.app/tiktok/user/@samsondauda",
  "https://rsshub.app/tiktok/user/@officialcbum",
  "https://rsshub.app/tiktok/user/@andrejdeiu",
  "https://rsshub.app/tiktok/user/@big_ramy",
  "https://rsshub.app/tiktok/user/@ramondino_pro",
  "https://rsshub.app/tiktok/user/@keoneprodigy",
  "https://rsshub.app/tiktok/user/@charlesgriffinifbb",
  "https://rsshub.app/tiktok/user/@brett_wilkin",
  "https://rsshub.app/tiktok/user/@joeyswole",
  "https://rsshub.app/tiktok/user/@michy_ifbbpro",
  "https://rsshub.app/tiktok/user/@patrickmooreifbb",
  "https://rsshub.app/tiktok/user/@roellywinklaar",
  "https://rsshub.app/tiktok/user/@martynfordofficial",
  "https://rsshub.app/tiktok/user/@sadikhadzovic"
  "https://rsshub.app/tiktok/user/@nick_walker39",
  "https://rsshub.app/tiktok/user/@regangrimes",

  /* ──────────────────────────── FEDERATIONS ──────────────────────────── */
  "https://ifbb.com/feed/",
  "https://ifbbpro.com/feed/",
  "https://npcnewsonline.com/feed/",
  "https://www.theproleague.com/feed/",
  "https://www.wabba-international.com/feed/",
  "https://www.ukdfba.co.uk/feed/",
  "https://www.imba-natural.com/feed/",
  "https://www.inbf.net/feed/",
  "https://www.wnbf.net/feed/",
  "https://www.pnbaelite.com/feed/",
  "https://www.abpu.co.uk/feed/",
  "https://www.nabba.co.uk/feed/",
  "https://www.naturalbodybuilding.com/feed/",
  "https://www.gbo-online.com/feed/",
  "https://www.musclemania.com/feed/",

  /* New federations */
  "https://www.npcworldwide.com/feed/",
  "https://www.icnworldwide.com/feed/",
  "https://www.unkbff.com/feed/",

];

/* ----------------------- 2) MEILISEARCH CLIENT ----------------------- */
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || "",
  apiKey: process.env.MEILI_API_KEY || process.env.MEILI_PUBLIC_KEY || "",
});

/* ----------------------- 3) TYPES & HELPERS ----------------------- */
type Doc = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  summary?: string;
};

function textBetween(xml: string, tag: string) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1].trim() : "";
}

function strip(html: string) {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function hashId(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

/* ----------------------- 4) LIGHT RSS/ATOM PARSER ----------------------- */
function parseRSS(xml: string, source: string): Doc[] {
  // RSS
  let items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const link = strip(textBetween(raw, "link"));
        const desc =
          textBetween(raw, "description") || textBetween(raw, "content:encoded");
        const pub = strip(textBetween(raw, "pubDate"));
        const url = link || "";
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(desc || ""),
        };
      })
      .filter((d) => d.url);
  }

  // Atom
  items = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  if (items.length) {
    return items
      .slice(0, MAX_PER_FEED)
      .map((raw) => {
        const title = strip(textBetween(raw, "title"));
        const linkTag = raw.match(/<link[^>]+href="([^"]+)"/i);
        const url = linkTag ? linkTag[1] : strip(textBetween(raw, "id"));
        const summ =
          textBetween(raw, "summary") || textBetween(raw, "content");
        const pub =
          strip(textBetween(raw, "updated")) ||
          strip(textBetween(raw, "published"));
        return {
          id: hashId(url || title),
          title: title || url || "(untitled)",
          url,
          source,
          publishedAt: pub || undefined,
          summary: strip(summ || ""),
        };
      })
      .filter((d) => d.url);
  }

  return [];
}

/* ----------------------- 5) FETCH + INDEX HELPERS ----------------------- */
async function fetchFeed(url: string): Promise<Doc[]> {
  const res = await fetch(url, {
    headers: { "user-agent": "WBN-Ingest/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  const xml = await res.text();
  return parseRSS(xml, new URL(url).hostname);
}

/* ----------------------- 6) ROUTE ----------------------- */
/** GET /api/ingest?token=INGEST_SECRET */
export async function GET(req: Request) {
  // env guards
  if (!process.env.MEILI_HOST)
    return NextResponse.json(
      { error: "MEILI_HOST missing in env" },
      { status: 500 }
    );
  if (!process.env.MEILI_API_KEY && !process.env.MEILI_PUBLIC_KEY)
    return NextResponse.json(
      { error: "MEILI_API_KEY or MEILI_PUBLIC_KEY missing in env" },
      { status: 500 }
    );

  // auth
  // AUTH — allow both query parameter OR header token
const urlToken = new URL(req.url).searchParams.get("token");
const headerToken = req.headers.get("x-ingest-token");

const providedToken = urlToken || headerToken;

if (!providedToken || providedToken !== process.env.INGEST_SECRET) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

  // get an Index handle (creates index automatically on first write)
  const index = client.index<Doc>(INDEX_NAME);

  // fetch all feeds (in parallel)
  const results = await Promise.allSettled(FEEDS.map((u) => fetchFeed(u)));
  const docs = results
    .filter((r): r is PromiseFulfilledResult<Doc[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // de-dupe
  const seen = new Set<string>();
  const unique = docs.filter((d) => {
    if (seen.has(d.id)) return false;
    seen.add(d.id);
    return true;
  });

  // index
  const task = await index.addDocuments(unique);

  return NextResponse.json({
    ok: true,
    sources: FEEDS.length,
    indexed: unique.length,
    taskUid: (task as any).taskUid ?? (task as any).uid,
  });
}
