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
const userId: string = properties.get('user.id') as string;
const cgSession: string = properties.get('cgsession.cookie') as string;
// Without a cg session we can't access user specific data (stderr)
const useUserId: boolean = !!userId && !!cgSession;

console.log(process.argv);
const gameId = process.argv[2];
const gameIdentifier: string = `[${gameId},${useUserId ? userId : null}]`;

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
if (useUserId) {
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
    const d: CGResponse = JSON.parse(responseString);
    console.log(d);
    if (d.agents && d.frames) {
      d.agents.forEach((agent: CGAgent) => {
        const userId: string = agent.codingamer.userId.toString();
        const userIndex: number = agent.index;
        let stderr: string = '';
        for (const frame of d.frames) {
          if (frame.agentId === userIndex && !!frame.stderr) {
            stderr += frame.stderr;
            stderr += '\n';
          }
        }
        const stderrFile: string = `./target/${gameId}-${userId}-stderr.txt`;
        createFileSync(stderrFile);
        writeFileSync(stderrFile, stderr);

        let stdout: string = '';
        for (const frame of d.frames) {
          if (frame.agentId === userIndex && !!frame.stdout) {
            stdout += frame.stdout;
          }
        }
        const stdoutFile: string = `./target/${gameId}-${userId}-stdout.txt`;
        createFileSync(stdoutFile);
        writeFileSync(stdoutFile, stdout);
      });
      let stdout: string = '';
      for (const frame of d.frames) {
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
