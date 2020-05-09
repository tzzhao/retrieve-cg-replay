import { writeFileSync } from 'fs';
import { createFileSync } from 'fs-extra';
import {handlePostRequest} from './request.handler';
import PropertiesReader = require('properties-reader');

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

export interface CGLastBattlesByAgentIdResponse extends Array<BattleItem>{
}

const properties: PropertiesReader.Reader = PropertiesReader('./env.properties');
const userId: number = properties.get('user.id') as number;
const cgSession: string = properties.get('cgsession.cookie') as string;
const playerAgentId: number = properties.get('player.agent.id') as number;
// Without a cg session we can't access user specific data (stderr)
const generateStderr: boolean = !!userId && !!cgSession;

console.log(process.argv);
const gameId = process.argv[2];

if (gameId) {
  generateGameData(gameId);
} else if (playerAgentId) {
  generateAllGamesDataForPlayerAgentId()
} else {
  console.error("Please either provide a gameId in input or set a player agent id in the env.properties");
}


function generateAllGamesDataForPlayerAgentId() {
  handlePostRequest('/services/gamesPlayersRanking/findLastBattlesByAgentId', `[${playerAgentId},null]`, processAllGamesDataForPlayerAgentId);
}

function generateGameData(gameId: number|string) {
  const gameDataPostBody: string = `[${gameId},${generateStderr ? userId : null}]`;
  handlePostRequest('/services/gameResult/findByGameId', gameDataPostBody, processGameData, generateStderr ? cgSession: '');
}

function processAllGamesDataForPlayerAgentId(responseString: string) {
  const response: CGLastBattlesByAgentIdResponse = JSON.parse(responseString);
  for (const game of response) {
    if (game.done) {
      generateGameData(game.gameId);
    }
  }
}

function processGameData(responseString: string) {
  const response: CGFindGameByIdResponse = JSON.parse(responseString);
  const gameId: number = response.gameId;
  console.log(response);
  if (response.agents && response.frames) {
    response.agents.forEach((agent: CGAgent) => {
      const agentUserId: number = agent.codingamer.userId;
      const userIndex: number = agent.index;

      if (generateStderr && agentUserId === userId) {
        let stderr: string = '';
        for (const frame of response.frames) {
          if (frame.agentId === userIndex && !!frame.stderr) {
            stderr += frame.stderr;
            stderr += '\n';
          }
        }
        const stderrFile: string = `./target/${gameId}-${agentUserId}-stderr.txt`;
        createFileSync(stderrFile);
        writeFileSync(stderrFile, stderr);
      }

      let stdout: string = '';
      for (const frame of response.frames) {
        if (frame.agentId === userIndex && !!frame.stdout) {
          stdout += frame.stdout;
        }
      }
      const stdoutFile: string = `./target/${gameId}-${agentUserId}-stdout.txt`;
      createFileSync(stdoutFile);
      writeFileSync(stdoutFile, stdout);
    });
    let stdout: string = '';
    for (const frame of response.frames) {
      if (!!frame.stdout) {
        stdout += frame.stdout;
      }
    }
    const stdoutFile: string = `./target/${gameId}-stdout.txt`;
    createFileSync(stdoutFile);
    writeFileSync(stdoutFile, stdout);
  }
}
