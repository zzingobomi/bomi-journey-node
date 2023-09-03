import { Schema, type } from "@colyseus/schema";

export class Vec3Schema extends Schema {
  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  z: number = 0;

  constructor(x: number, y: number, z: number);
  constructor(obj: any);
  constructor(...args: Array<any>) {
    super();
    if (args.length === 1) {
      this.x = args[0].x;
      this.y = args[0].y;
      this.z = args[0].z;
    } else {
      this.x = args[0];
      this.y = args[1];
      this.z = args[2];
    }
  }

  Set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Vec4Schema extends Schema {
  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  z: number = 0;

  @type("number")
  w: number = 0;

  constructor(x: number, y: number, z: number, w: number);
  constructor(obj: any);
  constructor(...args: Array<any>) {
    super();
    if (args.length === 1) {
      this.x = args[0].x;
      this.y = args[0].y;
      this.z = args[0].z;
      this.w = args[0].w;
    } else {
      this.x = args[0];
      this.y = args[1];
      this.z = args[2];
      this.w = args[3];
    }
  }

  Set(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
}
