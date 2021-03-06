import { APIGatewayProxyHandlerV2, APIGatewayProxyEventV2 } from "aws-lambda"
import { GetUserResponse } from "aws-sdk/clients/cognitoidentityserviceprovider";
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const cognito = new AWS.CognitoIdentityServiceProvider()

export async function GetUserInfo(event: APIGatewayProxyEventV2) {
  const authToken = event.headers['authorization'].split('Bearer ')[1]
  const user = await cognito.getUser({ AccessToken: authToken }).promise()
  return {
    user: user,
    teams: getTeamsOrEmpty(user)
  }
}

export async function UpdateUserTeams(teamId: string, user: GetUserResponse) {
  const teams = getTeamsOrEmpty(user)
  await cognito.adminUpdateUserAttributes({
    UserAttributes: [{
      Name: "custom:teams",
      Value: teams ? teams + `,${teamId}`: teamId
    }],
    UserPoolId: USER_POOL_ID,
    Username: user.Username
  }).promise()
}

function getTeamsOrEmpty(user: GetUserResponse): string[] {
  const teamsAttr = user.UserAttributes.find(a => a.Name = "custom:teams")
  return teamsAttr ? teamsAttr.Value!.split(',') : []
}