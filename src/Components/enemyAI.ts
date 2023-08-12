import { Component } from "../../_SqueletoECS/component";
import { Entity } from "../../_SqueletoECS/entity";

export enum enemyState {
  "idle" = "idle",
  "patrol" = "patrol",
  "searching" = "searching",
  "hunt" = "hunt",
  "attack" = "attack",
}

// you can define the incoming types when the component is created
export interface IAIComponent {
  data: boolean;
}
export type AIType = {
  state: enemyState;
  tik: number;
  tikLimit: number;
  target: Entity | null;
};

// this is the exported interface that is used in systems modules
export interface AIComponent {
  AI: AIType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class enemyAIComp extends Component {
  // UI template string literal with UI binding of value property

  //setting default value
  public value: AIType = {
    state: enemyState.idle,
    tik: 0,
    tikLimit: 0,
    target: null,
  };
  public constructor() {
    //@ts-ignore
    super("AI", enemyAIComp, true);
  }

  public define(data: IAIComponent): void {
    if (data == null) {
      return;
    }
  }
}
