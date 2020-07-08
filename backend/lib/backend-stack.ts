import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb'
import * as apigateway from '@aws-cdk/aws-apigatewayv2'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import { HttpMethod, HttpApi, CfnAuthorizer, CfnRoute } from '@aws-cdk/aws-apigatewayv2';
import { Construct } from '@aws-cdk/core';
import { UserPool, IUserPool } from '@aws-cdk/aws-cognito';
import { Table, AttributeType, ProjectionType } from '@aws-cdk/aws-dynamodb';
import * as ssm from "@aws-cdk/aws-ssm"

interface ILambda {
  name: string
  verb: HttpMethod
  route: string
  protected: boolean
  resources: string
}

const indexName = "userid-index"
export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const userPool = getUserPool(this);
    addWebsite(this, "MyWebsite")
    const httpApi = addHttpApi(this, 'HttpProxyApi')
    const table = addDynamoTableWithGsi(this, "AppTable")
    const authorizer = addAuthorizer(this, httpApi, userPool)
    const lambdas: ILambda[] = [
      { name: "createTeam", resources: "src/teams", verb: apigateway.HttpMethod.POST, route: "/team", protected: true },
      { name: "getTeams", resources: "src/teams", verb: apigateway.HttpMethod.GET, route: "/team", protected: true },
      { name: "getTeam", resources: "src/teams", verb: apigateway.HttpMethod.GET, route: "/team/{teamId}", protected: true },
    ]
    provisionLambdas(this, lambdas, table, httpApi, authorizer, userPool);
    new cdk.CfnOutput(this, "REGION", { value: cdk.Aws.REGION })
  }
}

function getUserPool(stack: Construct) {
  const userPoolArn = ssm.StringParameter.fromStringParameterAttributes(stack, 'MyValue', {
    parameterName: 'UserPoolArn',
  }).stringValue;
  return UserPool.fromUserPoolArn(stack, "myuserpool", userPoolArn)
}

function addAuthorizer(stack: Construct, httpApi: HttpApi, userPool: IUserPool): CfnAuthorizer {
  const userPoolClientId = ssm.StringParameter.fromStringParameterAttributes(stack, 'UserPoolClientId', {
    parameterName: 'UserPoolClientId',
  }).stringValue;
  return new apigateway.CfnAuthorizer(stack, "MyAuthorizer", {
    name: "MyAuthorizer",
    identitySource: ['$request.header.Authorization'],
    apiId: httpApi.httpApiId,
    authorizerType: "JWT",
    jwtConfiguration: {
      audience: [userPoolClientId],
      issuer: `https://cognito-idp.${cdk.Aws.REGION}.amazonaws.com/${userPool.userPoolId}`
    }
  })
}

function provisionLambdas(stack: Construct, lambdas: ILambda[], table: Table, httpApi: HttpApi, authorizer: CfnAuthorizer, userPool: IUserPool) {
  lambdas.forEach(l => {
    const handler = new lambda.Function(stack, l.name, {
      code: new lambda.AssetCode(`${l.resources}/${l.name}`),
      handler: `${l.name}.handler`,
      runtime: lambda.Runtime.NODEJS_10_X,
      environment: {
        TABLE_NAME: table.tableName,
        INDEX_NAME: indexName,
        USER_POOL_ID: userPool.userPoolId
      },
      tracing: lambda.Tracing.ACTIVE
    });
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [
          `arn:aws:cognito-idp:${userPool.stack.region}:${userPool.stack.account}:userpool/${userPool.userPoolId}`,
        ],
      }))
    table.grantReadWriteData(handler);
    const routes = httpApi.addRoutes({
      integration: new apigateway.LambdaProxyIntegration({ handler: handler }),
      path: l.route,
      methods: [l.verb],
    })
    if (l.protected) {
      routes.forEach(r => {
        const routeCfn = r.node.defaultChild as CfnRoute;
        routeCfn.authorizerId = authorizer.ref
        routeCfn.authorizationType = "JWT"
      })
    }
  })
}

function addDynamoTableWithGsi(stack: Construct, name: string): Table {
  const dynamoTable = new dynamodb.Table(stack, name, {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    partitionKey: {
      name: "pk",
      type: AttributeType.STRING
    },
    sortKey: {
      name: "sk",
      type: AttributeType.STRING
    },
    readCapacity: 1,
    writeCapacity: 1,
    tableName: name,
  });
  dynamoTable.addGlobalSecondaryIndex({
    indexName: indexName,
    partitionKey: {
      name: "userId",
      type: AttributeType.STRING
    },
    nonKeyAttributes: [
      "teamId",
      "teamName"
    ],
    readCapacity: 1,
    writeCapacity: 1,
    projectionType: ProjectionType.INCLUDE
  })
  return dynamoTable
}

function addWebsite(stack: Construct, name: string) {
  const websiteBucket = new s3.Bucket(stack, `${name}Bucket`,
    {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
      blockPublicAccess: new s3.BlockPublicAccess({ restrictPublicBuckets: false })
    });

  websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ['s3:GetObject'],
    resources: [`${websiteBucket.bucketArn}/*`],
    principals: [new iam.Anyone()]
  }))

  const distribution = new cloudfront.CloudFrontWebDistribution(stack, `${name}Distribution`, {
    originConfigs: [
      {
        s3OriginSource: {
          s3BucketSource: websiteBucket
        },
        behaviors: [{ isDefaultBehavior: true }],
      }
    ],
    errorConfigurations: [{
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html"
    }]
  });

  new cdk.CfnOutput(stack, "BUCKET_URL", { value: websiteBucket.bucketWebsiteUrl! })
  new cdk.CfnOutput(stack, "BUCKET_NAME", { value: websiteBucket.bucketName! })
  new cdk.CfnOutput(stack, "CLOUDFRONT", { value: distribution.domainName })
}

function addHttpApi(stack: cdk.Construct, name: string): HttpApi {
  const httpApi = new apigateway.HttpApi(stack, name, {
    corsPreflight: {
      allowHeaders: ['*'],
      allowMethods: [
        apigateway.HttpMethod.POST,
        apigateway.HttpMethod.PUT,
        apigateway.HttpMethod.PATCH,
        apigateway.HttpMethod.DELETE,
        apigateway.HttpMethod.GET,
        apigateway.HttpMethod.OPTIONS,
        apigateway.HttpMethod.HEAD
      ],
      allowOrigins: ['*'],
      maxAge: cdk.Duration.days(10)
    },
  });
  new cdk.CfnOutput(stack, "GATEWAY_URL", { value: httpApi.url! })
  return httpApi
}