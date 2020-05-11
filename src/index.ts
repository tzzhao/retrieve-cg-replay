import { writeFileSync } from 'fs';
import { createFileSync, pathExistsSync } from 'fs-extra';
import { IncomingHttpHeaders } from 'http';
import {findByGameIdAction, findLastBattlesByAgentIdAction, loginAction} from './cg.api';
import {
  CGAgent,
  CGFindGameByIdResponse,
  CGLastBattlesByAgentIdResponse,
  CGLoginResponse,
  HttpResponseObject,
} from './interfaces';
import PropertiesReader = require('properties-reader');

const properties: PropertiesReader.Reader = PropertiesReader('./env.properties');
const playerAgentId: number = properties.get('player.agent.id') as number;
const login: string = properties.get('user.login') as string;
const pwd: string = properties.get('user.pwd') as string;
const cafiles: string = properties.get('ca.files') as string;

let userId: number | undefined;
let cgSession: string | undefined;
let useSessionCookie: boolean = false;
let generateStderrData: boolean = false;

console.log(process.argv);
const gameId = process.argv[2];

if (login && pwd) {
  // First login to set the cgSession cookie (needed for stderr)
  processLoginAction().then(() => {
    generateDataDependingOnAvailableInformation();
  });
} else {
  generateDataDependingOnAvailableInformation();
}

export function generateDataDependingOnAvailableInformation() {
  // Set global variables to know whether a session cookie can be used
  useSessionCookie = !!userId && !!cgSession;
  generateStderrData = useSessionCookie;

  if (gameId) {
    // If gameId is provided, only generate data for the specific game
    generateGameData(gameId).then(() => {
      process.exit();
    });
  } else if (playerAgentId) {
    // Else if player agent is provided, generate data for all games associated to this playerAgentId
    generateAllGamesDataForPlayerAgentId(playerAgentId).then(() => {
      process.exit();
    });
  } else {
    console.error('Please either provide a gameId in input or set a player agent id in the env.properties');
    process.exit();
  }
}

/********************************************************************************************************************
 * Login and set cgSession (needed to generate stderr)
 ********************************************************************************************************************/
export async function processLoginAction() {
  await loginAction(login, pwd, cafiles).then((response: HttpResponseObject) => {
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

/********************************************************************************************************************
 * Generate stderr/sdout data for all games of a given player agent id
 ********************************************************************************************************************/
export function generateAllGamesDataForPlayerAgentId(playerAgentId: number): Promise<any> {
  return findLastBattlesByAgentIdAction(playerAgentId, cafiles).then(async (response: HttpResponseObject) => {
    await processAllGamesDataForPlayerAgentId(response.response);
  });
}

export async function processAllGamesDataForPlayerAgentId(responseString: string) {
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

/********************************************************************************************************************
 * Generate stderr/sdout data for a specific game
********************************************************************************************************************/
export async function generateGameData(gameId: number | string): Promise<any> {
  return findByGameIdAction(gameId, userId, cgSession,cafiles).then((response: HttpResponseObject) => {
    processGameData(response.response);
  });
}

export function processGameData(responseString: string) {
  const response: CGFindGameByIdResponse = JSON.parse(responseString);
  const gameId: number = response.gameId;
  console.log(response);
  if (response.agents && response.frames) {
    response.agents.forEach((agent: CGAgent) => {
      const agentUserId: number | string = agent.codingamer ? agent.codingamer.userId : agent.arenaboss!.nickname.replace(' ', '');
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
