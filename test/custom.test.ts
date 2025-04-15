import { UniversalDBAdapter, uclient } from '../src/index';

const DB_NAME = 'test_db';
async function main() {
    const client = uclient.create('http://127.0.0.1:5000', DB_NAME);
    const adapter = UniversalDBAdapter(client);

    if (adapter.createUser) {
        const user = await adapter.createUser({ id: "TEST_ID", email: "test@email.com", emailVerified: new Date() });
        console.log("Created", user);
    }

    if (adapter.getUser) {
        const user = await adapter.getUser("TEST_ID");
        console.log(user);
    }

    if (adapter.getUserByEmail) {
        const user = await adapter.getUserByEmail("test@email.com");
        console.log(user);
    }

    if (adapter.linkAccount) {
        await adapter.linkAccount({ userId: "TEST_ID", provider: "test", providerAccountId: "TEST_ID", type: "oauth" });
    }

    if (adapter.getUserByAccount) {
        const user = await adapter.getUserByAccount({ provider: "test", providerAccountId: "TEST_ID" });
        console.log(user);
    }

    if (adapter.updateUser) {
        console.log("Updated email....");
        const user = await adapter.updateUser({ id: "TEST_ID", email: "testupdate@email.com" });
        console.log(user);
    }

    if (adapter.getUser) {
        const user = await adapter.getUser("TEST_ID");
        console.log(user);
    }

    if (adapter.getUserByEmail) {
        const user = await adapter.getUserByEmail("testupdate@email.com");
        console.log(user);
    }

    if (adapter.createSession) {
        await adapter.createSession( { "sessionToken": "TEST_SESSION", "userId": "TEST_ID", "expires": new Date() } );
        console.log("Session created");
    }

    if (adapter.getSessionAndUser) {
        const session = await adapter.getSessionAndUser("TEST_SESSION");
        console.log(session);
    }

    if (adapter.updateSession) {
        console.log("Updated session....");
        const session = await adapter.updateSession({ sessionToken: "TEST_SESSION", "expires": new Date() });
        console.log(session);
    }

    if (adapter.getSessionAndUser) {
        const session = await adapter.getSessionAndUser("TEST_SESSION");
        console.log(session);
    }

    if (adapter.createVerificationToken) {
        const vtoken = await adapter.createVerificationToken({ "expires": new Date(), "identifier": "TEST_VER", token: "TEST_TOKEN" });
        console.log("Created token", vtoken);
    }

    if (adapter.useVerificationToken) {
        const vtoken = await adapter.useVerificationToken({ "identifier": "TEST_VER", "token": "TEST_TOKEN" });
        console.log("Used token", vtoken);
    }

    if (adapter.deleteSession) {
        console.log("Deleting session....");
        const session = await adapter.deleteSession("TEST_SESSION");
        console.log(session);
    }

    if (adapter.unlinkAccount) {
        console.log("Unlinking account....");
        const session = await adapter.unlinkAccount({ provider: "test", providerAccountId: "TEST_ID" });
        console.log(session);
    }

    if (adapter.deleteUser) {
        console.log("Deleting user....");
        const session = await adapter.deleteUser("TEST_ID");
        console.log(session);
    }

    if (adapter.getUser) {
        const user = await adapter.getUser("TEST_ID");
        console.log(user);
    }

    if (adapter.getUserByAccount) {
        const user = await adapter.getUserByAccount({ provider: "test", providerAccountId: "TEST_ID" });
        console.log(user);
    }

    if (adapter.getSessionAndUser) {
        const session = await adapter.getSessionAndUser("TEST_SESSION");
        console.log(session);
    }

    if (adapter.useVerificationToken) {
        const vtoken = await adapter.useVerificationToken({ "identifier": "TEST_VER", "token": "TEST_TOKEN" });
        console.log("Used token", vtoken);
    }
}

main().catch((err) => {
  console.error(err);
});
