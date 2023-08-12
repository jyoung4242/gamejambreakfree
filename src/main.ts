//Library Modules
import { States } from "@peasy-lib/peasy-states";
import "./style.css";
import { SceneManager } from "../_SqueletoECS/Scene";

//Content Modules
import { LoadComponents } from "./Components/_components";

//Scenes
import { Test } from "./Scenes/demoScene";
import { Lobby } from "./Scenes/lobby";

//Components
LoadComponents();

//Load Scenes
let sceneMgr = new SceneManager();
sceneMgr.register(Test, Lobby);
sceneMgr.set("lobby");
