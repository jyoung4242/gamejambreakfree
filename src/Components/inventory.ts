import { Component } from "../../_SqueletoECS/component";

// you can define the incoming types when the component is created
export interface IInventoryComponent {
  data: InventoryType;
}
export type InventoryType = {
  possesKey: boolean;
  //add weapons later
};

// this is the exported interface that is used in systems modules
export interface InventoryComponent {
  inventory: InventoryType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class InventoryComp extends Component {
  //setting default value
  public value: InventoryType = {
    possesKey: false,
  };
  public constructor() {
    //@ts-ignore
    super("inventory", InventoryComp, true);
  }

  public define(data: IInventoryComponent): void {
    if (data == null) {
      return;
    }
  }
}
