import { gamestates } from "../projecttypes";

export class hudUI {
  state: any = {
    players: [],
    gamestates: gamestates,
  };
  get bannerFlag() {
    if (this.state) return this.state.gamestates == gamestates.startingbanner;
    return null;
  }
  get startFlag() {
    if (this.state) return this.state.gamestates == gamestates.prestart;
    return null;
  }
  get gameHUDFlag() {
    if (this.state) return this.state.gamestates == gamestates.running;
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
        <div class="gameHUD" \${===gameHUDFlag}>
            <div class="heroUI" \${hero<=*state.players:id}>
              <div class="firstline">
                <div class="avatar" style="background: \${hero.color}; border: 1px solid white; border-radius: \${hero.borderradius}px;"></div>
                <div class="id">
                <svg viewBox="0 0 60 60">
                  <text class='caption' x="50%" y="50%" text-anchor="middle">\${hero.nickname}</text>
                </svg>
                </div>
              </div>
              
              <div class="health">
                <div class="innerhealth" style="width: \${hero.health}%"></div>
              </div>
              <div class="points">\${hero.score}</div>
              <div class="inventory">
                  <div class='key' \${===hero.haskey}></div>
                  <div class='rock' \${===hero.hasRock}></div>
                  <div class='whip' \${===hero.hasWhip}></div>
                  <div class='club' \${===hero.hasClub}></div>
                  <div class='knife' \${===hero.hasKnife}></div>
              </div>
            </div>
        </div>
    </div>
</div>
  `;

  startGame: Function;

  private constructor(start: Function) {
    this.startGame = start;
    //console.log(state);
  }

  public static create(state: any, startcallbck: Function): hudUI {
    return new hudUI(startcallbck);
  }

  public update(deltaTime: number, now: number, entities: [], state: any) {}

  stateUpdate(state: any) {
    //console.log("reg update: ", state);

    if (state) {
      this.state.gamestates = state.gamestates;
      // console.log(state.players);
      this.state.players = [...state.players];
      this.state.players.forEach((st: any) => {
        if ("haskey" in st) {
          if (st.inventory.key) st.haskey == true;
        } else {
          if (st.inventory.key) Object.assign(st, { haskey: true });
          else Object.assign(st, { haskey: false });
        }

        if ("hasWhip" in st) {
          if (st.inventory.weapon == "whip") st.hasWhip == true;
        } else {
          if (st.inventory.weapon == "whip") Object.assign(st, { hasWhip: true });
          else Object.assign(st, { hasWhip: false });
        }

        if ("hasRock" in st) {
          if (st.inventory.weapon == "rock") st.hasRock == true;
        } else {
          if (st.inventory.weapon == "rock") Object.assign(st, { hasRock: true });
          else Object.assign(st, { hasRock: false });
        }

        if ("hasKnife" in st) {
          if (st.inventory.weapon == "knife") st.hasKnife == true;
        } else {
          if (st.inventory.weapon == "knife") Object.assign(st, { hasKnife: true });
          else Object.assign(st, { hasKnife: false });
        }

        if ("hasClub" in st) {
          if (st.inventory.weapon == "club") st.hasClub == true;
        } else {
          if (st.inventory.weapon == "club") Object.assign(st, { hasClub: true });
          else Object.assign(st, { hasClub: false });
        }
      });
    }
    //console.log("hudstate", this.state);
  }
}
