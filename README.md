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
## Configure
To be able to retrieve stderr, you will need to configure the env.properties file.
```
user.id=1114834
cgsession.cookie=b06bb52b-a8aa-486a-bee4-d94ce230a7b4
```
Those information can be found by logging in on coding game website. 
Open the browser debugger on Network tab. Open one of your replay. An "findByGameId" XHR request should be fired. Look into its request body. It should consist of an array of 2 numbers. The first one is the **gameId** and the second one is your **user.id**. 
In the cookie section, you should see a cookie **cgSession**. Use its value for cgsession.cookie. (This needs to be updated everytime your session expires)
## How to use
Once all the setup is done, in the root folder of the project, you can run
```
npm run generate {gameId}
```
The files should be generated in target folder