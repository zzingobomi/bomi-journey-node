import { type } from "@colyseus/schema";
import { TransformSchema } from "./TransformSchema";
import { EntitySchema } from "./EntitySchema";

export class PlayerSchema extends EntitySchema {
  @type("string")
  nickname: string = "";

  @type("number")
  state: number = 0;

  constructor(
    nickname: string,
    transform: TransformSchema = new TransformSchema()
  ) {
    super();
    this.nickname = nickname;
    this.transform = transform;
  }

  SetNickname(nickname: string) {
    this.nickname = nickname;
  }

  SetState(state: number) {
    this.state = state;
  }

  SetTransform(transform: TransformSchema) {
    this.transform = transform;
  }
}
