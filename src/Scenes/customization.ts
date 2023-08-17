//Library
import { Camera, ICameraConfig } from "../../_SqueletoECS/Camera";
import { Scene } from "../../_SqueletoECS/Scene";
import { Engine } from "@peasy-lib/peasy-engine";
import { Vector } from "../../_SqueletoECS/Vector";

//import the Hathora Interface
import { MultiPlayerInterface, AuthenticationType } from "../../_SqueletoECS/Multiplayer";

//Scene Systems
import { CharCustomUI } from "../Systems/charcustom";

//Entities

export class CharCustom extends Scene {
  userId: string = "";
  messageHandler = (msg: any) => {
    if (msg.type == "stateupdate") {
      if (this.hud && msg.state) this.hud.myStateupdate(msg.state);
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
      this.states?.set("test", performance.now(), this.HathoraClient);
    }, 50);
  };
  name: string = "charCustom";
  entitySystems: any = [];
  sceneSystems: any = [];
  entities: any = [];
  lobbyEngine: Engine | undefined;
  hud: any;

  public template = `
    <scene-layer>
      < \${ sceneSystem === } \${ sceneSystem <=* sceneSystems }
    </scene-layer>
  `;

  //runs on entry of scene
  public init(): void {
    this.HathoraClient = this.params[0];
    this.HathoraClient?.setUpdateCallback(this.messageHandler);
    this.userId = this.HathoraClient?.userdata.id as string;

    this.hud = CharCustomUI.create({ name: "CharCustom", interface: this.HathoraClient, sceneSwitch: this.start });

    const cameraConfig: ICameraConfig = {
      name: "camera",
      gameEntities: this.entities,
      position: new Vector(0, 0),
      size: new Vector(400, 266.67),
      viewPortSystems: [this.hud],
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
