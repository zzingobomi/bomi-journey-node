import { Schema, type } from "@colyseus/schema";
import { Vec3Schema, Vec4Schema } from "./VectorSchema";

export class TransformSchema extends Schema {
  @type(Vec3Schema)
  position: Vec3Schema = new Vec3Schema(0, 0, 0);

  @type(Vec4Schema)
  quaternion: Vec4Schema = new Vec4Schema(0, 0, 0, 1);

  @type(Vec3Schema)
  scale: Vec3Schema = new Vec3Schema(1, 1, 1);

  constructor(
    position: Vec3Schema = new Vec3Schema(0, 0, 0),
    quaternion: Vec4Schema = new Vec4Schema(0, 0, 0, 1),
    scale: Vec3Schema = new Vec3Schema(1, 1, 1)
  ) {
    super();
    this.SetPosition(position);
    this.SetQuaternion(quaternion);
    this.SetScale(scale);
  }

  SetPosition(position: Vec3Schema) {
    this.position.Set(position.x, position.y, position.z);
  }
  SetQuaternion(quaternion: Vec4Schema) {
    this.quaternion.Set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }
  SetScale(scale: Vec3Schema) {
    this.scale.Set(scale.x, scale.y, scale.z);
  }
}
