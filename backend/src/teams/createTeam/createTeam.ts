import { CreateTeam, ITeam } from "teamsRepo";
import { GetUserInfo, UpdateUserTeams } from "userRepo"
const { v4: uuidv4 } = require('uuid');
import { APIGatewayProxyHandlerV2 } from "aws-lambda"

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { user } = await GetUserInfo(event);
  const team = JSON.parse(event.body!) as ITeam
  team.teamId = uuidv4();
  try {
    await CreateTeam(team, user.Username)
    await UpdateUserTeams(team.teamId, user)
    return { statusCode: 200, body: JSON.stringify(team) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
