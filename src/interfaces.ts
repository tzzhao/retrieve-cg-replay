import {IncomingHttpHeaders} from "http";

export interface CGFrame {
  agentId: number;
  gameInformation: string;
  keyframe: boolean;
  stderr?: string;
  stdout?: string;
}

export interface CGCodinGamer {
  userId: number;
  pseudo: string;
}

export interface CGAgent {
  agentId: number;
  codingamer: CGCodinGamer;
  index: number;
}

export interface CGFindGameByIdResponse {
  agents: CGAgent[];
  frames: CGFrame[];
  gameId: number;
}

export interface BattleItem {
  done: boolean;
  gameId: number;
}

export interface CGLastBattlesByAgentIdResponse extends Array<BattleItem> {
}

export interface CGLoginResponse {
  userId: number;
}

export interface HttpResponseObject {
  response: string;
  status?: number;
  headers: IncomingHttpHeaders;
}
