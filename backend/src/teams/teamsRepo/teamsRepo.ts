import { DynamoDB } from 'aws-sdk';
const db = new DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
import { type } from "os";
const AWS = require('aws-sdk');
const TABLE_NAME = process.env.TABLE_NAME || '';
const INDEX_NAME = process.env.INDEX_NAME || '';
const teamsPk = "TEAM#"
const userSk = "USER#"

export async function GetTeam(teamId: string): Promise<ITeam> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      pk: teamsPk + teamId
    }
  };
  const response = await db.get(params).promise();
  return response.Item as Team
}

export async function UpdateTeam(teamId: string, team: Team) {
  const putparams = {
    TableName: TABLE_NAME,
    Item: team
  };
  await db.put(putparams).promise();
}

export async function CreateTeam(team: ITeam, userId: string) {
  const createTeamParams = {
    TableName: TABLE_NAME,
    Item: MakeTeam(team)
  };
  const createUserParams = {
    TableName: TABLE_NAME,
    Item: MakeTeamUser(team, userId)
  }
  await db.put(createTeamParams).promise();
  await db.put(createUserParams).promise();
}

export async function GetTeams(userId: string): Promise<ITeam[]> {
  const res = await db.query({
    TableName: TABLE_NAME,
    IndexName: INDEX_NAME,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: {
      ":userId": userId
    }
  }).promise()
  return res.Items!.map(i => i as ITeam)
}

function MakeTeam(team: ITeam): Team {
  return {
    teamName: team.teamName,
    teamId: team.teamId,
    type: "Team",
    pk: teamsPk + team.teamId,
    sk: teamsPk + team.teamId
  }
}

function MakeTeamUser(team: ITeam, userId: string): TeamUser {
  return {
    teamId: team.teamId,
    userId: userId,
    pk: teamsPk + team.teamId,
    sk: userSk + userId,
    type: "TeamUser",
    teamName: team.teamName
  }
}

class Team implements ITeam {
  teamId: string
  teamName: string
  type: string = "Team"
  pk: string
  sk: string
}

class TeamUser {
  teamId: string
  userId: string
  type: string = "TeamUser"
  pk: string
  sk: string
  teamName: string
}

export interface ITeam {
  teamId: string
  teamName: string
}