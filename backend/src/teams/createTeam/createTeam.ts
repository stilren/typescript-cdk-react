import { CreateTeam, ITeam } from "teamsRepo";
const { v4: uuidv4 } = require('uuid');

export const handler = async (event: any = {}) : Promise <any> => {
  const userId = event['requestContext']['authorizer']['jwt']['claims']['username']
  if ( !userId) {
    return { statusCode: 400, body: `Error: You are missing parameters/user info` };
  }

  const team = JSON.parse(event.body) as ITeam
  team.teamId = uuidv4();
  try {
    await CreateTeam(team,userId)
    return { statusCode: 200, body: JSON.stringify(team) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
