import * as http from "http";
import {RequestOptions} from "https";
import * as https from "https";

export function handlePostRequest(path: string, postbody: string, processResponse: (response: string) => void, cgSession: string = '') {
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
  if (cgSession) {
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
      processResponse(responseString);
    });
  });

  req.on('error', (error) => {
    console.error(error);
  });

  console.log('POST data: ' + postbody);
  req.write(postbody);
  req.end();
}
