import { GetTeams } from "teamsRepo";
import {APIGatewayProxyHandlerV2} from "aws-lambda"
import { GetUserInfo } from "userRepo";

export const handler:APIGatewayProxyHandlerV2 = async event => {
  const { user } = await GetUserInfo(event);
  try {
    const teams = await GetTeams(user.Username)
    return { statusCode: 200, body: JSON.stringify(teams) };
  } catch (dbError) {
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};