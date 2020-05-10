import { writeFileSync } from 'fs';
import { createFileSync, pathExistsSync } from 'fs-extra';
import { IncomingHttpHeaders } from 'http';
import { loginAction } from './cg.api';
import {
  CGAgent,
  CGFindGameByIdResponse,
  CGLastBattlesByAgentIdResponse,
  CGLoginResponse,
  HttpResponseObject,
} from './interfaces';
import { handlePostRequest } from './http-request.handler';
import PropertiesReader = require('properties-reader');

const properties: PropertiesReader.Reader = PropertiesReader('./env.properties');
const playerAgentId: number = properties.get('player.agent.id') as number;
const login: string = properties.get('user.login') as string;
const pwd: string = properties.get('user.pwd') as string;

let userId: number | undefined;
let cgSession: string | undefined;
let useSessionCookie: boolean = false;
let generateStderrData: boolean = false;

console.log(process.argv);
const gameId = process.argv[2];

if (login && pwd) {
  // First login to set the cgSession cookie (needed for stderr)
  processLoginAction().then(() => {
    generateData();
  });
} else {
  generateData();
}

function generateData() {
  // Set global variables to know whether a session cookie should be used
  useSessionCookie = !!userId && !!cgSession;
  generateStderrData = useSessionCookie;
  if (gameId) {
    generateGameData(gameId).then();
  } else if (playerAgentId) {
    generateAllGamesDataForPlayerAgentId(playerAgentId);
  } else {
    console.error('Please either provide a gameId in input or set a player agent id in the env.properties');
  }
}

async function processLoginAction() {
  await loginAction(login, pwd).then((response: HttpResponseObject) => {
    const responseString = response.response;
    const res: CGLoginResponse = JSON.parse(responseString);

    const headers: IncomingHttpHeaders = response.headers;
    const setCookies: string[] | undefined = headers['set-cookie'];
    const cookieDict: { [key: string]: string } = {};
    if (setCookies) {
      for (const setCookie of setCookies) {
        const cookieStringArray: string[] = setCookie.split(';');
        const cookieKeyValuePair: string[] = cookieStringArray[0].split('=');
        cookieDict[cookieKeyValuePair[0]] = cookieKeyValuePair[1];
      }
    }

    // Setup session cookie and user id
    if (res.userId) {
      userId = res.userId;
    }
    if (cookieDict.cgSession) {
      cgSession = cookieDict.cgSession;
    }
  },
    (error) => {
      console.error(error);
      process.exit();
    });
}

function generateAllGamesDataForPlayerAgentId(playerAgentId: number) {
  handlePostRequest('/services/gamesPlayersRanking/findLastBattlesByAgentId', `[${playerAgentId},null]`).then(async (response: HttpResponseObject) => {
    await processAllGamesDataForPlayerAgentId(response.response);
  });
}

async function generateGameData(gameId: number | string): Promise<any> {
  const gameDataPostBody: string = `[${gameId},${useSessionCookie ? userId : null}]`;
  return handlePostRequest('/services/gameResult/findByGameId', gameDataPostBody, useSessionCookie ? cgSession : '').then((response: HttpResponseObject) => {
    processGameData(response.response);
  });
}

async function processAllGamesDataForPlayerAgentId(responseString: string) {
  const response: CGLastBattlesByAgentIdResponse = JSON.parse(responseString);
  for (const game of response) {
    if (game.done) {
      if (!pathExistsSync(`./target/${game.gameId}-stdout.txt`)
        && (!useSessionCookie || !pathExistsSync(`./target/${gameId}-${userId}-stderr.txt`))) {
        await generateGameData(game.gameId);
      }
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

      if (useSessionCookie && agentUserId === userId) {
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
