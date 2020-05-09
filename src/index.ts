import {writeFileSync} from 'fs';
import * as http from "http";
import {RequestOptions} from "https";
import * as https from 'https';
import {createFileSync} from 'fs-extra';

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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log(process.argv);
const gameId = process.argv[2];
const gameIdentifier: string = `[${gameId},null]`;

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
    "Accept-Encoding": " gzip, deflate, br",
    "Accept-Language": " en-US,en;q=0.9"
  }
};

const req: http.ClientRequest = https.request(options, (res: http.IncomingMessage) => {
  console.log(`statusCode: ${res.statusCode}`);
  res.setEncoding('UTF-8');
  res.on('data', (d: CGResponse) => {
    console.log(d);
    if (d.agents && d.frames) {
      d.agents.forEach((agent: CGAgent) => {
        const userId:string = agent.codingamer.userId.toString();
        const userIndex: number = agent.index;
        let output: string = '';
        for (const frame of d.frames) {
          if (frame.agentId === userIndex && !!frame.stderr) {
            output += frame.stderr;
            output += '\n';
          }
        }
        const file: string = `./target/${gameId}-${userId}`;
        createFileSync(file);
        writeFileSync(file, output);
      });
    }
  })
});

req.on('error', (error) => {
  console.error(error);
});

req.write(gameIdentifier);
req.end();
