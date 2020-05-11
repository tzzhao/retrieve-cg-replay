import { handlePostRequest } from './http-request.handler';
import { HttpResponseObject } from './interfaces';

export function loginAction(login: string, pwd: string, cafiles?: string): Promise<HttpResponseObject> {
  return handlePostRequest('/services/Codingamer/loginSiteV2', `["${login}","${pwd}",true]`, '', cafiles);
}

export function findLastBattlesByAgentIdAction(playerAgentId: number, cafiles?: string): Promise<HttpResponseObject> {
  return handlePostRequest('/services/gamesPlayersRanking/findLastBattlesByAgentId', `[${playerAgentId},null]`, '', cafiles);
}

export function findByGameIdAction(gameId: number | string, userId?: number, cgSession?: string, cafiles?: string): Promise<HttpResponseObject> {
  const gameDataPostBody: string = `[${gameId},${cgSession ? userId : null}]`;
  return handlePostRequest('/services/gameResult/findByGameId', gameDataPostBody, cgSession, cafiles);
}
