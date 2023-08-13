import { gamestates } from "../projecttypes";

export class hudUI {
  get bannerFlag() {
    if (this.state) return this.state.gamestates == gamestates.startingbanner;
    return null;
  }
  get startFlag() {
    if (this.state) return this.state.gamestates == gamestates.prestart;
    return null;
  }

  public template = `
<style>
    .hud{
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left:0;
    color: white;
    border: 1px solid white;
    }

    .innerHUD{
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .startBanner{
        position: absolute;
        top: 5px;
        left: 0;
        width:100%;
        height: 10%;
        display: flex;
        justify-content: center;
        
        align-items: center;
        border-top: 3px solid white;
        border-bottom: 3px solid white;
        opacity: 1;
        transition: opacity 0.5s;
    }

    .startBanner.pui-adding,
    .startBanner.pui-removing{
        opacity: 0
    }

    .gamestart{
        width: 20%;
        height: 75%;
        background: darkgrey;
        border: 1px solid lightgrey;
        border-radius: 5000px;
        font-size: 8px;
        font-weight: bolder;
        color: black;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .gamestart:hover{
        background: white;
        border: 1px solid white;
        cursor: pointer;
    }

    .mainBanner{
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width:100%;
        height: 15%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-top: 4px solid white;
        border-bottom: 4px solid white;
        opacity: 1;
        transition: opacity 1.25s;
    }
    .bannertext{
        color: white;
        font-size: 20px;

    }
    
    .mainBanner.pui-adding,
    .mainBanner.pui-removing{
        opacity: 0
        
    }

</style>
<div class="hud">
    <div class="innerHUD">
        <div class="startBanner"\${===startFlag}>
            <div class="gamestart" \${click@=>startGame}>START GAME</div>
        </div>
        <div class="mainBanner" \${===bannerFlag}>
            <div class="bannertext">STARTING GAME</div>
        </div>
    </div>
</div>
  `;

  startGame: Function;

  private constructor(public state: any, start: Function) {
    this.startGame = start;
  }

  public static create(state: any, startcallbck: Function): hudUI {
    return new hudUI(state, startcallbck);
  }

  public update() {}

  stateUpdate(state: any) {
    //console.log(state);

    this.state = state;
  }
}
