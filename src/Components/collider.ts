import { Vector } from "../../_SqueletoECS/Vector";
import { Component } from "../../_SqueletoECS/component";
import { Body, Circle, Box, PotentialVector, System as dcSystem } from "detect-collisions";
import { myCollider } from "../Scenes/demoScene";

// you can define the incoming types when the component is created
export interface IColliderComponent {
  data: {
    type: string;
    system: dcSystem;
    shape: "Box" | "Circle";
    size: Vector;
    position: Vector;
    options?: {
      triggered?: boolean;
      static?: boolean;
      centered?: boolean;
    };
  };
}
export type ColliderType = myCollider;

// this is the exported interface that is used in systems modules
export interface ColliderComponent {
  collider: ColliderType;
}

// classes should have:
// if UI element, a template property with the peasy-ui template literal
// if no UI aspect to the system, do not define a template
// a 'value' property that will be attached to the entity
export class ColliderComp extends Component {
  //setting default value
  public value: ColliderType | undefined;
  public constructor() {
    //@ts-ignore
    super("collider", ColliderComp, true);
  }

  public define(data: IColliderComponent): void {
    if (data == null) {
      return;
    }

    if (data.data.shape == "Box") {
      (this.value as ColliderType) = new Box(data.data.position, data.data.size.x, data.data.size.y, {
        isCentered: data.data.options?.centered,
        isStatic: data.data.options?.static,
        isTrigger: data.data.options?.triggered,
      });
      (this.value as ColliderType).cat = data.data.type;
    } else {
      (this.value as ColliderType) = new Circle(data.data.position, data.data.size.x, {
        isCentered: data.data.options?.centered,
        isStatic: data.data.options?.static,
        isTrigger: data.data.options?.triggered,
      });
      (this.value as ColliderType).cat = data.data.type;
    }
    //console.log("collider", this.value);

    data.data.system.insert(this.value as ColliderType);
  }
}
