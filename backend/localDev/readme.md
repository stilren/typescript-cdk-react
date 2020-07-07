
This is how the launch.json for the debugger should look. Update asset folder folder after new build

Also the variables that are being provisioned from the stack to lambda environment (e.g. process.env.TABLE_NAME) will not be correct

```{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to SAM CLI",
            "type": "node",
            "request": "attach",
            "address": "localhost",
            "port": 5858,
            // From the sam init example, it would be "${workspaceRoot}/hello-world"
            "localRoot": "${workspaceRoot}/backend/cdk.out/asset.98d5755337ba235350d8b5ed6338371159894d7d66db512ac949254cda5c65c2",
            "remoteRoot": "/var/task",
            "protocol": "inspector",
            "stopOnEntry": false
        }
    ]
}```