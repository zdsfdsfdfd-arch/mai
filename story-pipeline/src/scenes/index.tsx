import React from "react";
import type { SceneTimeline } from "../types";
import { BuildingCutaway } from "./BuildingCutaway";
import { CabinDiagram } from "./CabinDiagram";
import { CharacterScene } from "./CharacterScene";
import { CityNight } from "./CityNight";
import { EndCard } from "./EndCard";
import { PhoneScreen } from "./PhoneScreen";
import { SoundDiagram } from "./SoundDiagram";
import { StatCallouts } from "./StatCallouts";
import { TitleCard } from "./TitleCard";

// Библиотека типов сцен. Сценарий (JSON от LLM) ссылается на type, здесь он превращается в картинку.
export const SceneView: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  switch (scene.type) {
    case "title_card":
      return <TitleCard scene={scene} />;
    case "building_cutaway":
      return <BuildingCutaway scene={scene} />;
    case "phone_screen":
      return <PhoneScreen scene={scene} />;
    case "stat_callouts":
      return <StatCallouts scene={scene} />;
    case "character_scene":
      return <CharacterScene scene={scene} />;
    case "cabin_diagram":
      return <CabinDiagram scene={scene} />;
    case "sound_diagram":
      return <SoundDiagram scene={scene} />;
    case "city_night":
      return <CityNight scene={scene} />;
    case "end_card":
      return <EndCard scene={scene} />;
    default:
      return <div style={{ color: "red", fontSize: 60, padding: 100 }}>Неизвестный тип сцены: {scene.type}</div>;
  }
};
