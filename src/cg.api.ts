import { handlePostRequest } from './http-request.handler';
import { HttpResponseObject } from './interfaces';

export function loginAction(login: string, pwd: string): Promise<HttpResponseObject> {
  return handlePostRequest('/services/Codingamer/loginSiteV2', `["${login}","${pwd}",true]`);
}

export function findLastBattlesByAgentIdAction(playerAgentId: number): Promise<HttpResponseObject> {
  return handlePostRequest('/services/gamesPlayersRanking/findLastBattlesByAgentId', `[${playerAgentId},null]`);
}

export function generateGameData(gameId: number | string, userId?: number, cgSession?: string): Promise<HttpResponseObject> {
  const gameDataPostBody: string = `[${gameId},${cgSession ? userId : null}]`;
  return handlePostRequest('/services/gameResult/findByGameId', gameDataPostBody, cgSession);
}
