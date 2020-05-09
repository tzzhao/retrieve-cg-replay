import * as http from "http";
import {RequestOptions} from "https";
import * as https from 'https';

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


console.log(process.argv);
const gameIdentifier: string = `[${process.argv[2]},null]`;

const options: RequestOptions = {
  hostname: 'www.codingame.com',
  port: 443,
  path: '/services/gameResult/findByGameId',
  method: 'POST',
  headers: {
    "Host": " www.codingame.com",
    "Connection": " keep-alive",
    "Accept": " application/json, text/plain, */*",
    "Content-Type": [" application/json;charset=UTF-8", "application/json"],
    "Accept-Encoding": " gzip, deflate, br",
    "Accept-Language": " en-US,en;q=0.9"
  }
};

const req: http.ClientRequest = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', (d: CGResponse) => {
    console.log(d);
  })
});

req.on('error', (error) => {
  console.error(error);
});

req.write(JSON.stringify(gameIdentifier));
req.end();
