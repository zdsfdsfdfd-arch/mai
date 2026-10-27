import React from "react";
import type { SceneTimeline } from "../types";
import { BuildingCutaway } from "./BuildingCutaway";
import { BuildingNeighbor } from "./BuildingNeighbor";
import { CabinDiagram } from "./CabinDiagram";
import { CharacterScene } from "./CharacterScene";
import { CityNight } from "./CityNight";
import { Dialogue } from "./Dialogue";
import { DoorScene } from "./DoorScene";
import { EndCard } from "./EndCard";
import { EndNeighbor } from "./EndNeighbor";
import { EntranceScene } from "./EntranceScene";
import { Evidence } from "./Evidence";
import { FloorPlan } from "./FloorPlan";
import { Invitation } from "./Invitation";
import { PhoneScreen } from "./PhoneScreen";
import { Roof } from "./Roof";
import { RoomScene } from "./RoomScene";
import { SoundDiagram } from "./SoundDiagram";
import { SoundFloor } from "./SoundFloor";
import { StatCallouts } from "./StatCallouts";
import { TitleCard } from "./TitleCard";
import { TitleNeighbor } from "./TitleNeighbor";

// Библиотека типов сцен. Сценарий (JSON от LLM) ссылается на type и варианты в props,
// здесь это превращается в картинку.
export const SceneView: React.FC<{ scene: SceneTimeline }> = ({ scene }) => {
  const p = scene.props ?? {};
  switch (scene.type) {
    case "title_card":
      return p.hook === "neighbor" ? <TitleNeighbor scene={scene} /> : <TitleCard scene={scene} />;
    case "building_cutaway":
      return p.mode === "neighbor" ? <BuildingNeighbor scene={scene} /> : <BuildingCutaway scene={scene} />;
    case "phone_screen":
      return <PhoneScreen scene={scene} />;
    case "stat_callouts":
      if (p.diagram === "lift") return <Evidence scene={scene} />;
      if (p.diagram === "invite") return <Invitation scene={scene} />;
      return <StatCallouts scene={scene} />;
    case "character_scene":
      if (p.setting === "door") return <DoorScene scene={scene} />;
      if (p.setting === "room") return <RoomScene scene={scene} />;
      if (p.setting === "entrance") return <EntranceScene scene={scene} />;
      return <CharacterScene scene={scene} />;
    case "cabin_diagram":
      return <CabinDiagram scene={scene} />;
    case "sound_diagram":
      return p.source === "floor" ? <SoundFloor scene={scene} /> : <SoundDiagram scene={scene} />;
    case "city_night":
      return <CityNight scene={scene} />;
    case "floor_plan":
      return <FloorPlan scene={scene} />;
    case "dialogue":
      return <Dialogue scene={scene} />;
    case "roof":
      return <Roof scene={scene} />;
    case "end_card":
      return p.blackout ? <EndNeighbor scene={scene} /> : <EndCard scene={scene} />;
    default:
      return <div style={{ color: "red", fontSize: 60, padding: 100 }}>Неизвестный тип сцены: {scene.type}</div>;
  }
};
