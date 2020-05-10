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
Copy paste the env.properties.tpl into an env.properties file at the root of the project and fill in the properties.
```
# bot agent id (needed if you want to generate the data for all games of a give bot id. Can be left blank otherwise)
player.agent.id=2874821
# cg user login (needed to retrieve stderr, can be left blank otherwise)
user.login=k4ng0u
# cg user pwd (needed to retrieve stderr, can be left blank otherwise)
user.pwd=passw0rd
``` 
**player.agent.id** can be found by going on a challenge ranking page. Open the browser debugger on Network tab. 
Click on View your last battles. A findLastBattlesByAgentId XHR request is fired. Its payload is an array of 2 
numbers. The first one is your agent id. NOTE: the **player.agent.id** changes after each new submit.
## How to generate the stderr/sdout files
### Generate data for a specific game
Look for the **gameId** of your replay. The easiest way is to click on the share 
replay button. A new tab should open with the **gameId** at the end of the url: https://www.codingame
.com/replay/**{gameId}**. 
Then in the root folder of the project, run the following
```
npm run generate {gameId} // to generate game data for a specific gameId
```
### Generate all game data for a specific bot id
In the env.properties configure the **player.agent.id** (See Configuration section)
```
npm run generate // to generate all game data for the player agent id defined in env.properties
```

The files should be generated in ./target folder:
* stdout per player: {gameid}-{userId}-stdout.txt
* stdout for both players: {gameid}-stdout.txt
* your stderr (if user name/pwd were provided): {gameid}-{userId}-stderr.txt 
## How to replace the standard input with a custom file
### C++
Include fstream library and at a block at the beginning of main to replace the standard input by your file 
```
#include <fstream>

int main() {
    bool isIde = true;
    if (isIde) {
        ifstream* inputFile = new ifstream("resources/local-inputs.txt");
        cin.rdbuf(inputFile->rdbuf());
    }
    /*
        rest of the code
    */
}
```
### Java
```
class Player {
    public static void main(String args[])  {
        boolean isIde = true;
        if (isIde) {
            System.setIn(new FileInputStrean("resources/local-inputs.txt"));
        }
        /*
            rest of the code
        */
    }
}
```
