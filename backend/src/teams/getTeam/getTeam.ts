import { GetTeam } from "teamsRepo";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { GetUserInfo } from "../../userRepo/userRepo";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { teams } = await GetUserInfo(event);
  const teamId = event.pathParameters!.teamId;
  if (!teams.includes(teamId)) return { statusCode: 403, body: `User has no access to this team` };
  try {
    const teams = await GetTeam(teamId)
    return { statusCode: 200, body: JSON.stringify(teams) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
