import { GetTeam } from "teamsRepo";
import { CognitoIdentity } from 'aws-sdk';
const db = new CognitoIdentity({ apiVersion: '2012-08-10' });

export const handler = async (event: any = {}) : Promise <any> => {
  const userId = event['requestContext']['authorizer']['jwt']['claims']['username']
  const teamId = event.pathParameters.teamId;
  if ( !userId) {
    return { statusCode: 400, body: `Error: You are missing parameters/user info` };
  }

  try {
    const teams = await GetTeam(teamId)
    return { statusCode: 200, body: JSON.stringify(teams) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
  