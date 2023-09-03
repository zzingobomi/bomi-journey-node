import { Schema, type } from "@colyseus/schema";
import { TransformSchema } from "./TransformSchema";
import { Vec3Schema, Vec4Schema } from "./VectorSchema";

export class EntitySchema extends Schema {
  @type(TransformSchema)
  transform: TransformSchema = new TransformSchema();

  SetPosition(position: Vec3Schema) {
    this.transform.SetPosition(position);
  }
  SetQuaternion(quaternion: Vec4Schema) {
    this.transform.SetQuaternion(quaternion);
  }
  SetScale(scale: Vec3Schema) {
    this.transform.SetScale(scale);
  }
}
