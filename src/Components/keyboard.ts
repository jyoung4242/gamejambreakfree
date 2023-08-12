import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IKeyboardComponent {
  data: boolean;
}
export type KeyboardType = boolean;

// this is the exported interface that is used in systems modules
export interface KeyboardComponent {
  keyboard: KeyboardType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class KeyboardComp extends Component {
  //setting default value
  public value: boolean = false;
  public constructor() {
    //@ts-ignore
    super("keyboard", KeyboardComp, true);
  }

  public define(data: IKeyboardComponent): void {
    if (data == null) {
      return;
    }

    this.value = data.data;
  }
}
