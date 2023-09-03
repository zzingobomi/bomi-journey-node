import { MapSchema, Schema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import { TransformSchema } from "./TransformSchema";
import { Vec3Schema, Vec4Schema } from "./VectorSchema";

export class GameRoomStateSchema extends Schema {
  @type({ map: PlayerSchema })
  players = new MapSchema<PlayerSchema>();

  ///
  /// Player
  ///
  CreatePlayer(
    sessionId: string,
    nickname: string,
    transform: TransformSchema
  ) {
    this.players.set(sessionId, new PlayerSchema(nickname, transform));
  }

  RemovePlayer(sessionId: string) {
    this.players.delete(sessionId);
  }

  UpdatePlayerPosition(sessionId: string, position: Vec3Schema) {
    const player = this.players.get(sessionId);
    if (player) player.SetPosition(position);
  }
  UpdatePlayerQuaternion(sessionId: string, quaternion: Vec4Schema) {
    const player = this.players.get(sessionId);
    if (player) player.SetQuaternion(quaternion);
  }
  UpdatePlayerScale(sessionId: string, scale: Vec3Schema) {
    const player = this.players.get(sessionId);
    if (player) player.SetScale(scale);
  }
}
