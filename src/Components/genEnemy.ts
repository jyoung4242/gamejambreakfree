import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IenemyGenComponent {
  data: boolean;
}
export type enemyGenType = boolean;

// this is the exported interface that is used in systems modules
export interface enemyGenComponent {
  enemyGen: enemyGenType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class enemyGenComp extends Component {
  // UI template string literal with UI binding of value property

  //setting default value
  public value: enemyGenType = false;
  public constructor() {
    //@ts-ignore
    super("enemyGen", enemyGenComp, true);
  }

  public define(data: IenemyGenComponent): void {
    if (data == null) {
      return;
    }
    this.value = data.data;
  }
}
