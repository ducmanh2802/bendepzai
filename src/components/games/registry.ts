import React from 'react';
import { lazy } from 'react';

/**
 * T08 — single registry of game id -> lazy component. Catalog
 * (`src/data/gamesCatalog.ts`) stays data-only; this file is the only
 * place that imports the heavy game components, so the Games Hub chunk
 * stays lazy.
 */
export const GAME_REGISTRY: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
  catch_letters: lazy(() => import('./CatchFallingLettersGame').then((m) => ({ default: m.CatchFallingLettersGame }))),
  syllable_builder: lazy(() => import('./SyllableBuilderGame').then((m) => ({ default: m.SyllableBuilderGame }))),
  rhyme_hunter: lazy(() => import('./RhymeHunterGame').then((m) => ({ default: m.RhymeHunterGame }))),
  sentence_scramble: lazy(() => import('./SentenceScrambleGame').then((m) => ({ default: m.SentenceScrambleGame }))),
  listen_pick: lazy(() => import('./ListenPickPhonicsGame').then((m) => ({ default: m.ListenPickPhonicsGame }))),
  spelling_duel: lazy(() => import('./SpellingDuelGame').then((m) => ({ default: m.SpellingDuelGame }))),
  tone_paint: lazy(() => import('./TonePaintGame').then((m) => ({ default: m.TonePaintGame }))),
  rhyme_train: lazy(() => import('./RhymeTrainGame').then((m) => ({ default: m.RhymeTrainGame }))),
  read_and_do: lazy(() => import('./ReadAndDoGame').then((m) => ({ default: m.ReadAndDoGame }))),
  falling_numbers: lazy(() => import('./FallingNumbersMathGame').then((m) => ({ default: m.FallingNumbersMathGame }))),
  speed_racing: lazy(() => import('./MathSpeedRacingGame').then((m) => ({ default: m.MathSpeedRacingGame }))),
  number_tower: lazy(() => import('./NumberTowerGame').then((m) => ({ default: m.NumberTowerGame }))),
  ocean_fishing: lazy(() => import('./OceanFishingGame').then((m) => ({ default: m.OceanFishingGame }))),
  shape_sorting: lazy(() => import('./ShapeSortingGame').then((m) => ({ default: m.ShapeSortingGame }))),
  clock_money: lazy(() => import('./ClockMoneyGame').then((m) => ({ default: m.ClockMoneyGame }))),
  word_story: lazy(() => import('./WordStoryGame').then((m) => ({ default: m.WordStoryGame }))),
  ten_frame_market: lazy(() => import('./TenFrameMarketGame').then((m) => ({ default: m.TenFrameMarketGame }))),
  number_line_hop: lazy(() => import('./NumberHopGame').then((m) => ({ default: m.NumberHopGame }))),
  clock_builder: lazy(() => import('./ClockBuilderGame').then((m) => ({ default: m.ClockBuilderGame }))),
  animal_safari: lazy(() => import('./EnglishAnimalSoundGame').then((m) => ({ default: m.EnglishAnimalSoundGame }))),
  color_balloon: lazy(() => import('./EnglishColorBalloonGame').then((m) => ({ default: m.EnglishColorBalloonGame }))),
  phonics_pop: lazy(() => import('./PhonicsPopGame').then((m) => ({ default: m.PhonicsPopGame }))),
  simon_says: lazy(() => import('./SimonSaysGame').then((m) => ({ default: m.SimonSaysGame }))),
  word_builder_train: lazy(() => import('./WordTrainGame').then((m) => ({ default: m.WordTrainGame }))),
  treasure_coding: lazy(() => import('./TreasureCodingGame').then((m) => ({ default: m.TreasureCodingGame }))),
  little_scientist: lazy(() => import('./LittleScientistGame').then((m) => ({ default: m.LittleScientistGame }))),
  memory_cards: lazy(() => import('./MemoryCardsGame').then((m) => ({ default: m.MemoryCardsGame }))),
  coloring_canvas: lazy(() => import('./ColoringCanvasGame').then((m) => ({ default: m.ColoringCanvasGame }))),
  connect_dots: lazy(() => import('./ConnectDotsGame').then((m) => ({ default: m.ConnectDotsGame }))),
  shadow_match: lazy(() => import('./ShadowMatchGame').then((m) => ({ default: m.ShadowMatchGame }))),
  pixel_mosaic: lazy(() => import('./PixelMosaicGame').then((m) => ({ default: m.PixelMosaicGame }))),
};

export const GAME_COMPONENT_REGISTRY = GAME_REGISTRY;
export const GAMES_REGISTRY = GAME_REGISTRY;

export function getGameComponent(gameId: string) {
  return GAME_REGISTRY[gameId] ?? null;
}

/** Game ids that run on a real-time loop (only these show a pause button). */
export const REALTIME_GAME_IDS = [
  'catch_letters',
  'falling_numbers',
  'color_balloon',
] as const;
