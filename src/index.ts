import { writeFileSync } from 'fs';
import * as http from "http";
import { RequestOptions } from "https";
import * as https from 'https';
import { createFileSync } from 'fs-extra';
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

export interface CGResponse {
  agents: CGAgent[];
  frames: CGFrame[];
}

const properties: PropertiesReader.Reader = PropertiesReader('./env.properties');
const userId: number = properties.get('user.id') as number;
const cgSession: string = properties.get('cgsession.cookie') as string;
// Without a cg session we can't access user specific data (stderr)
const generateStderr: boolean = !!userId && !!cgSession;

console.log(process.argv);
const gameId = process.argv[2];
const gameIdentifier: string = `[${gameId},${generateStderr ? userId : null}]`;

const options: RequestOptions = {
  hostname: 'www.codingame.com',
  port: 443,
  path: '/services/gameResult/findByGameId',
  method: 'POST',
  headers: {
    "Host": " www.codingame.com",
    "Connection": " keep-alive",
    "Accept": " application/json, text/plain, */*",
    "Content-Type": [" application/json;charset=UTF-8"],
    "Accept-Language": " en-US,en;q=0.9",
  }
};
if (generateStderr) {
  options.headers!.Cookie = `cgSession=${cgSession}`;
}
const req: http.ClientRequest = https.request(options, (res: http.IncomingMessage) => {
  console.log(`statusCode: ${res.statusCode}`);
  let responseString: string = '';
  res.setEncoding('UTF-8');
  res.on('data', (chunk: string) => {
    responseString += chunk;
  });
  res.on('end', () => {
    const response: CGResponse = JSON.parse(responseString);
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
  });
});

req.on('error', (error) => {
  console.error(error);
});

console.log(gameIdentifier);
req.write(gameIdentifier);
req.end();
