import {readFileSync} from 'fs';
import * as http from "http";
import { RequestOptions } from "https";
import * as https from "https";
import {HttpResponseObject} from './interfaces';

export function handlePostRequest(path: string, postbody: string, cgSession: string = '', cafiles: string = ''): Promise<HttpResponseObject> {
  return new Promise<HttpResponseObject>((resolve, reject) => {
    const options: RequestOptions = {
      hostname: 'www.codingame.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        "Host": "www.codingame.com",
        "Connection": " keep-alive",
        "Accept": " application/json, text/plain, */*",
        "Content-Type": [" application/json;charset=UTF-8"],
        "Accept-Language": " en-US,en;q=0.9",
      }
    };
    if (cgSession) {
      options.headers!.Cookie = `cgSession=${cgSession}`;
    }
    if (cafiles) {
      const caFilesArray: string[] = cafiles.split(',');
      if (caFilesArray.length > 0) {
        options.ca = caFilesArray.map((caFilePath: string) => {return readFileSync(caFilePath)});
      }
    }

    const req: http.ClientRequest = https.request(options, (res: http.IncomingMessage) => {
      console.log(`statusCode: ${res.statusCode}`);
      let response: string = '';
      res.setEncoding('UTF-8');
      res.on('data', (chunk: string) => {
        response += chunk;
      });
      res.on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode > 400) {
          reject('Wrong status code: ' + res.statusCode + '\n' + response);
        } else {
          resolve({response, status: res.statusCode, headers: res.headers});
        }
      });
    });

    req.on('error', (error) => {
      console.error(error);
      reject();
    });

    console.log('POST data: ' + postbody);
    req.write(postbody);
    req.end();
  });
}
