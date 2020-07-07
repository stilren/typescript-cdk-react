#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BackendStack } from '../lib/backend-stack';
import { CognitoStack } from '../lib/cognito-stack';

const app = new cdk.App();
const cognitostack = new CognitoStack(app, 'TsExampleCognitoStack', {env: {region: "eu-west-1"}})
const backendstack = new BackendStack(app, 'TsExampleBackendStack', {env: {region: "eu-west-1"}});
backendstack.addDependency(cognitostack)
