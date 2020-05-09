# Retrieve cg replay
This tool enables you to retrieve stderr (only if you configure your user id and have a valid cg session) and stdout from cg replays
## Setup
Clone the repository.
Ensure nodejs is installed. 
Then in the root folder of the project run the following
```
npm install // install the npm dependencies
npm run build // build the js
```
## Configuration
To be able to retrieve stderr, you will need to configure the env.properties file.
```
user.id=1114834
cgsession.cookie=b06bb52b-a8aa-486a-bee4-d94ce230a7b4
player.agent.id=2874821
```
Those information can be found by logging in on coding game website. 
Open the browser debugger on Network tab. Open one of your replay. An "findByGameId" XHR request should be fired. Look into its request body. It should consist of an array of 2 numbers. The first one is the **gameId** and the second one is your **user.id**. 
In the cookie section, you should see a cookie **cgSession**. Use its value for cgsession.cookie. (This needs to be updated everytime your session expires)
**player.agent.id** can be found by going on a challenge ranking page. Open the browser debugger on Network tab. 
Click on View your last battles. A findLastBattlesByAgentId XHR request is fired. Its payload is an array of 2 
numbers. The first one is your agent id.
## How to generate the stderr/sdout files
Look for the **gameId** of your replay. The easiest way is to click on the share 
replay button. A new tab should open with the **gameId** at the end of the url: https://www.codingame
.com/replay/**{gameId}**. 
Then in the root folder of the project, run the following
```
npm run generate // to generate all game data for the player agent id defined in env.properties
npm run generate {gameId} // to generate game data for a specific gameId
```
The files should be generated in target folder
## How to read your file as an input instead of the standard input
Include fstream library and at a block at the beginning of main to replace the standard input by your file 
```
#include <fstream>

int main() {
    bool isIde = true;
    if (isIde) {
        ifstream* inputFile = new ifstream("resources/init.txt");
        cin.rdbuf(inputFile->rdbuf());
    }
    /*
        rest of the code
    */
}
```
