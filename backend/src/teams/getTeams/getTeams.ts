import { CreateTeam, ITeam } from "teamsRepo";
import { GetTeams } from "teamsRepo";

export const handler = async (event: any = {}) : Promise <any> => {
  const userId = event['requestContext']['authorizer']['jwt']['claims']['username']
  if ( !userId) {
    return { statusCode: 400, body: `Error: You are missing parameters/user info` };
  }

  try {
    const teams = await GetTeams(userId)
    return { statusCode: 200, body: JSON.stringify(teams) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
  