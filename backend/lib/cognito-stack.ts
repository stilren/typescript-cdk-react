import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam'
import * as cognito from '@aws-cdk/aws-cognito'
import * as ssm from "@aws-cdk/aws-ssm"
import { VerificationEmailStyle, UserPool, StringAttribute } from '@aws-cdk/aws-cognito';

export class CognitoStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const userPool = new UserPool(this, 'myuserpool', {
            userPoolName: 'myawesomeapp-userpool',
            selfSignUpEnabled: true,
            userVerification: {
                emailSubject: 'Verify your email for our awesome app!',
                emailBody: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
                emailStyle: VerificationEmailStyle.CODE,
            },
            userInvitation: {
                emailSubject: 'Invite to join our awesome app!',
                emailBody: 'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
            },
            signInAliases: { email: true },
            autoVerify: { email: true },
            standardAttributes: {
                fullname: {
                    required: true,
                    mutable: false,
                },
                email: {
                    required: true,
                    mutable: false
                }
            },
            customAttributes: {
                'teams': new StringAttribute({ minLen: 0, maxLen: 1024, mutable: true }),
              },
            passwordPolicy: {
                requireLowercase: false,
                requireDigits: false,
                requireSymbols: false,
                requireUppercase: false,
            }
        });

        const userPoolClient = userPool.addClient("AppClient", {
            authFlows: { userPassword: true, userSrp: true, refreshToken: true, adminUserPassword: true }
        });

        const identityPool = new cognito.CfnIdentityPool(this, 'MyCognitoIdentityPool', {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [{
                clientId: userPoolClient.userPoolClientId,
                providerName: userPool.userPoolProviderName,
            }]
        });
        const unauthenticatedRole = new iam.Role(this, 'CognitoDefaultUnauthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "unauthenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        unauthenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*"
            ],
            resources: ["*"],
        }));
        const authenticatedRole = new iam.Role(this, 'CognitoDefaultAuthenticatedRole', {
            assumedBy: new iam.FederatedPrincipal('cognito-identity.amazonaws.com', {
                "StringEquals": { "cognito-identity.amazonaws.com:aud": identityPool.ref },
                "ForAnyValue:StringLike": { "cognito-identity.amazonaws.com:amr": "authenticated" },
            }, "sts:AssumeRoleWithWebIdentity"),
        });
        authenticatedRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "mobileanalytics:PutEvents",
                "cognito-sync:*",
                "cognito-identity:*"
            ],
            resources: ["*"],
        }));

        new cognito.CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
            identityPoolId: identityPool.ref,
            roles: {
                'unauthenticated': unauthenticatedRole.roleArn,
                'authenticated': authenticatedRole.roleArn
            }
        });

        new ssm.StringParameter(this, 'UserPoolArn', {
            parameterName: 'UserPoolArn',
            stringValue: userPool.userPoolArn,
        });

        new ssm.StringParameter(this, 'UserPoolClientId', {
            parameterName: 'UserPoolClientId',
            stringValue: userPoolClient.userPoolClientId,
        });

        new cdk.CfnOutput(this, "USERPOOL_ID", { value: userPool.userPoolId })
        new cdk.CfnOutput(this, "IDENTITYPOOL_ID", { value: identityPool.ref })
        new cdk.CfnOutput(this, "APPCLIENT_ID", { value: userPoolClient.userPoolClientId })
    }

}