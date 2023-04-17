# UOL Chat API

## About

This is a chat API that allows users to register as participants and send messages to each other. Users can also update their last status, and get a list of all messages and participants. The API is built with Node.js and MongoDB, and is based on a Brazilian chatroom.

## Technologies

<p align='left'>
<img style='margin: 2px;' src='https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white'/>
<img style='margin: 2px;' src='https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB'/>
<img style='margin: 2px;' src='https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white'>
<img style='margin: 2px;' src='https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black'/>
<img style='margin: 2px; width:70px' src='https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white/'>
</p>

## Routes

### POST /participants

A route to create and register a new user. If there's already a participant with the same name, a 409 status code error will be returned. A 201 status code will be returned upon success. The request body should be:

    {
      "name": "João"
    }

### GET/participants
A route that retrieves a list of all the participants in the chat. The response will be in the following format:

    {
        name: 'xxx',
        lastStatus: Date.now()
    }
    
### POST /messages
A request to create new messages. All fields are required and cannot be empty. The username should come as a header. If any fields are missing or empty, the API will respond with a 400 status code and an error message indicating that all fields are required and cannot be empty. A 422 status code will be returned if the sender is not on the participant list.

The header should be like this:

    {
      user: "username"
    }

While the request body should be:

    {
        "to": "Todos",
        "text": "Hello, world!",
        "type": "message"
    }
    
### GET /message
A request that retrieves a list of messages in the chat. If there are no messages, an empty array will be returned. The response will be in the following format:

The time format should be: (HH:mm:ss)

	{
        "from": "João",
        "to": "Todos",
        "text": "Hello, world!",
        "type": "message",
        "time": "21:35:10" 
	}

## How to run

To run this project, you'll have to install MongoDB to acess the database.

- Clone this repository
- Install the dependencies
      
      npm i
      
Create a .env file in the root directory of the project and add the necessary environment variables. This file should not be committed to GitHub for security reasons. It should look like this:

     DATABASE_URL=mongodb://localhost:27017/batePapoUol

- Run the back-end with

      	npm start

Access http://localhost:5000 on your browser to run the API.

