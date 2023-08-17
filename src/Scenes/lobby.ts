//Library
import { Camera, ICameraConfig } from "../../_SqueletoECS/Camera";
import { Scene } from "../../_SqueletoECS/Scene";
import { Engine } from "@peasy-lib/peasy-engine";
import { Vector } from "../../_SqueletoECS/Vector";

//import the Hathora Interface
import { MultiPlayerInterface, AuthenticationType } from "../../_SqueletoECS/Multiplayer";

//Scene Systems
import { LobbyUI } from "../Systems/nonECSLobbyUI";

//Entities

export class Lobby extends Scene {
  messageHandler = (msg: any) => {
    console.log("login:", msg);
    if (msg.type == "debug") {
      this.debugData = msg.data;
      console.log("lobby message: debug", this.debugData);
    }
  };

  debugData: any;
  HathoraClient: MultiPlayerInterface = new MultiPlayerInterface(
    "app-f8b439b5-25fe-4860-9635-c36cafc3d194",
    this.messageHandler,
    9000,
    [AuthenticationType.anonymous],
    true
  );
  start = () => {
    setTimeout(() => {
      this.states?.set("charCustom", performance.now(), this.HathoraClient);
    }, 50);
  };
  name: string = "lobby";
  entitySystems: any = [];
  sceneSystems: any = [];
  entities: any = [];
  lobbyEngine: Engine | undefined;

  public template = `
    <scene-layer>
      < \${ sceneSystem === } \${ sceneSystem <=* sceneSystems }
    </scene-layer>
  `;

  //runs on entry of scene
  public init(): void {
    console.log("creating camera");
    const cameraConfig: ICameraConfig = {
      name: "camera",
      gameEntities: this.entities,
      position: new Vector(0, 0),
      size: new Vector(400, 266.67),
      viewPortSystems: [LobbyUI.create({ name: "lobby", interface: this.HathoraClient, sceneSwitch: this.start })],
    };

    let camera = Camera.create(cameraConfig);
    console.log("camera: ", camera);

    //GameLoop
    console.log("starting engine");
    this.sceneSystems.push(camera);

    this.lobbyEngine = Engine.create({ fps: 60, started: true, callback: this.update });
  }

  update = (deltaTime: number): void | Promise<void> => {
    this.sceneSystems.forEach((system: any) => {
      system.update(deltaTime / 1000, 0, this.entities);
    });
  };

  //runs on exit of scene
  public exit(): void {
    this.lobbyEngine?.destroy();
  }
}
