import { GetTeams } from "../../src/teams/teamsRepo"
describe("it gets items", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules() // most important - it clears the cache
        process.env = { ...OLD_ENV }; // make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // restore old env
    });
    test.only("get items", async () => {
        process.env.TABLE_NAME = "AppTable"
        process.env.INDEX_NAME = "userid-index"
        const res = await GetTeams("405b6757-2184-46e4-a2cb-a0fc19b4f8cf")
        console.log(res)
        expect(res.length).toBe(5)
    })
})