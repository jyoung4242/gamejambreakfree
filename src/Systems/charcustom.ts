import { MultiPlayerInterface, User, Regions, UserData } from "../../_SqueletoECS/Multiplayer";

export interface ICharConfig {
  name: string;
  interface: MultiPlayerInterface;
  sceneSwitch: Function;
}

type GameType = "public" | "private" | "local";
type LoginStatus = "unconnected" | "connected";

type PlayerState = {
  id: string;
  color: string;
};

export class CharCustomUI {
  isFirstime = true;
  hudState = {
    players: <any>[],
  };
  newcolor: string = "";
  updateServerColor = (newColor: string) => {
    this.HathoraClient?.sendMessage("playerColor", newColor);
  };
  updateServerNickname = (e: any) => {
    let newname = e.srcElement.value;
    this.HathoraClient?.sendMessage("playerNickName", newname);
  };
  updateServerBorder = (e: any) => {
    let newBorder = e.srcElement.value;
    this.HathoraClient?.sendMessage("playerBorder", newBorder);
  };
  jumpToGame = () => {
    this.start(this);
  };
  playerCap: any;
  loginStatus: LoginStatus = "unconnected";
  disableStatus: string = "disabled";
  get oppoDisableStatus() {
    if (this.disableStatus == "disabled") return "";
    else return "disabled";
  }
  loginColor: string = "white";
  openGames = <any>[];
  gameType: GameType = "public";
  region: Regions = "Chicago";
  user: UserData = { id: "", name: "" };
  privateActiveCSS: string = "";
  publicActiveCSS: string = "";
  isLobbiesEmpty: boolean = true;
  cloudswitchPositionText = "flex-end";

  isLocal: boolean = true;
  roomJoinInput: any;
  start: Function;
  HathoraClient: MultiPlayerInterface | undefined;

  public template = `
  <style>
  .LoginGrid{
    display: grid;
    grid-template-columns: 10px 1fr 1fr 1fr 1fr 1fr 10px;
    grid-template-rows: 10px 1fr 1fr 1fr 1fr 1fr 1fr 1fr 10px;
    row-gap:3px;
    column-gap: 3px;
    width: 100%;
    height: 100%;
    
  }
  .Title{
    border: 1px solid white;
    border-radius: 3px;
    grid-column-start: 2;
    grid-column-end: 7;
    grid-row-start: 2;
    grid-row-end: 3;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  
  .createGame{
    border: 1px solid white;
    border-radius: 3px;
    grid-column-start: 5;
    grid-column-end: 7;
    grid-row-start: 3;
    grid-row-end: 7;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 4px;
  }
  .JoinGame{
    width: 100%;
    border: 1px solid white;
    border-radius: 3px;
    grid-column-start: 5;
    grid-column-end: 7;
    grid-row-start: 7;
    grid-row-end: 9;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
  }

  .joinGameInput{
    width: 100px;
  }

  .createGameButtons{
    width: 100%;
    display: flex;
    justify-content: space-evenly;
    align-items: center;
  }
  .lbyButton{
    min-width: 20%;
    border: 1px solid white;
    border-radius: 5000px;
    text-align: center;
    padding: 2px 3px;
    display: flex;
    flex-direction: column;
    justify-content:center;
    align-items: center;
    margin-bottom: 1px;
  }
  .lbyButton:hover,
  .lbySelect:hover,
  .cs_switchcontainer:hover{
    box-shadow: 0px 0px 3px 3px rgba(255,255,255,0.75);
    cursor: pointer;
  }
  .lbyButton.disabled:hover{
    cursor: not-allowed;
    border: 1px solid #333333;
    color: #333333;
  }

  .lbyFlip{
    background-color: white;
    color: black;

  }

  .opengame{
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 94%;
    margin: 2.5px;
    border: 0.5px solid white;
    font-size: 0.4vw;
    gap: 2px;
    padding-left: 2px;
    padding-right: 2px;
  }
  .lbyServerdata{
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .titleblock{
    width: 94%;
    display:flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.4vw;
    background-color: #333333;
    margin: 2.5px;
    padding-left: 2px;
    padding-right: 4px;
  }

  .smallbutton{
    width: auto; 
    font-size: xx-small;
  }

  .loginStatus{
    color: \${loginColor};
    font-size: 5px;
    grid-column-start: 1;
    grid-column-end: 5;
    grid-row-start: 9;
    grid-row-end: 10;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-left: 5px;
  }

</style>
<div class="scene" style="width: 100%; height: 100%; position: absolute; top: 0; left:0; color: white;">
  
  <div class="LoginGrid">
      <div class="Title">
        <div>Breaking Free - Character Setup</div>
        <div style="display: flex; width: 50%; justify-content:space-evenly;">
                    <div class="lbyButton smallbutton" \${click@=>jumpToGame}>
                        START GAME
                    </div>
        </div>
      </div>
      
      <div class="playerdisplay">
        <player-enity class="player_container" \${plr<=*hudState.players:id}>
        
        <div class="playerid">Player ID: \${plr.id}</div>
        <div class="colorchange">
            <div class='flex'>
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: auto; height: 100%;">Current Color:</div>
                <div class="playercolor" style="background: \${plr.color}; border-radius: \${plr.radius}px;"></div>
            </div>
            
            <div class="inputflex" \${===plr.isMe}> 
                New Color:
                <label  class="color_input" style="background: \${plr.newcolor};">
                    Click me to select color
                    <input type="color" hidden \${change@=>plr.updateColor} />
                </label>
               
            </div>
            <div>
            Change Shape
            <input type="range" class="slider" min="0" max="8" value="0" step="1" \${change@=>updateServerBorder} />  
           
        </div>
        </div>

        <div class="nickname">
            <div class="flex">
                <div style="width: auto; height: 100%;">Player Nickname:</div>
                <div class="playernickname">\${plr.nickname}</div>
            </div>
            
            <div class="inputflex" \${===plr.isMe}>
                Set Nickname:
                <input class="nick_input" \${change@=>updateServerNickname}/>
            </div>
        </div>
       
        
        </player-enity>
       
      </div>
      
      
      <div class="loginStatus">login status: \${loginStatus} id: \${user.id} username:  \${user.name} </div>
  </div>
    
</div>
  `;

  private constructor(public name: string, HathoraClient: MultiPlayerInterface, switchScene: Function) {
    console.log("CharCustom:", this);
    this.HathoraClient = HathoraClient;
    this.start = switchScene;
    this.user = this.HathoraClient.userdata;
    if (this.user.id != "") this.loginStatus = "connected";
  }

  public static create(config: ICharConfig): CharCustomUI {
    return new CharCustomUI(config.name, config.interface, config.sceneSwitch);
  }

  public myStateupdate(stateupdate: any) {
    const localID = this.user.id;

    if (this.isFirstime) {
      this.isFirstime = false;
      this.hudState.players = stateupdate.players.map((plr: any) => {
        return {
          id: plr.id,
          color: plr.color,
          radius: plr.radius,
          nickname: plr.nickname,
          newcolor: "#000000",
          updateColor: (e: any, model: any) => {
            console.log(e.srcElement.value, model.plr);
            model.plr.newcolor = e.srcElement.value;
            this.updateServerColor(model.plr.newcolor);
          },
          get isMe() {
            return localID == plr.id;
          },
        };
      });
    } else {
      stateupdate.players.forEach((plr: any, index: number) => {
        this.hudState.players[index].id = plr.id;
        this.hudState.players[index].color = plr.color;
        this.hudState.players[index].radius = plr.borderradius;
        this.hudState.players[index].nickname = plr.nickname;
      });
    }
  }

  public update() {}
}
