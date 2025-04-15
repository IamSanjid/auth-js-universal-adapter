import type {
  Adapter,
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "@auth/core/adapters";
import { Client, createUniversalClient } from "./client.js";
import {
  AdapterUserFeilds,
  AdapterAccountFeilds,
  AdapterSessionFeilds,
  VerificationTokenFeilds,
} from "./schema.js";

export const uclient = {
  create: createUniversalClient,
}

/**
 * This adapter uses https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html#using-declarations-and-explicit-resource-management.
 * This feature is very new and requires runtime polyfills for `Symbol.asyncDispose` in order to work properly in all environments.
 * It is also required to set in the `tsconfig.json` file the compilation target to `es2022` or below and configure the `lib` option to include `esnext` or `esnext.disposable`.
 *
 * You can find more information about this feature and the polyfills in the link above.
 * ** NOT SURE IF THIS NEEDED... **
 */
/*// @ts-expect-error read only property is not assignable
Symbol.asyncDispose ??= Symbol("Symbol.asyncDispose") */

/** This is the interface of the UniversalDB adapter options. */
export interface UniversalDBAdapterOptions {
  collections?: {
    Users?: string
    Accounts?: string
    Sessions?: string
    VerificationTokens?: string
  }

  to(args: Record<string, any>): string,
  from(args: string): Record<string, unknown>,
  id(args: string): string,
}

export const defaultCollections: Required<
  Required<UniversalDBAdapterOptions>["collections"]
> = {
  Users: "users",
  Accounts: "accounts",
  Sessions: "sessions",
  VerificationTokens: "verification_tokens",
}

export const defaultOptions: Required<UniversalDBAdapterOptions> = {
  collections: defaultCollections,
  to: (args) => args.toString(),
  from: (args) => JSON.parse(args),
  id: (args) => args.toString(),
}

/*export const format = {
  from<T = Record<string, unknown>>(object: Record<string, any>): T {
    const newObject: Record<string, unknown> = {}
    for (const key in object) {
      const value = object[key]
      if (key === "_id") {
        newObject.id = value.toHexString()
      } else if (key === "userId") {
        newObject[key] = value.toHexString()
      } else {
        newObject[key] = value
      }
    }
    return newObject as T
  },

  to<T = Record<string, unknown>>(object: Record<string, any>) {
    const newObject: Record<string, unknown> = {
      _id: _id(object.id),
    }
    for (const key in object) {
      const value = object[key]
      if (key === "userId") newObject[key] = _id(value)
      else if (key === "id") continue
      else newObject[key] = value
    }
    return newObject as T & { _id: ObjectId }
  },
}*/

export function UniversalDBAdapter(
  client:
    | Client
    | Promise<Client>
    | (() => Client | Promise<Client>),
  options: UniversalDBAdapterOptions = defaultOptions
): Adapter {
  const { collections } = options
  const { from, to } = options
  const _id = options.id

  const getDb = async () => {
    const _client: Client = await (typeof client === "function"
      ? client()
      : client)
    const c = { ...defaultCollections, ...collections }
    return {
      U: await _client.collection<AdapterUser>(c.Users, AdapterUserFeilds()),
      A: await _client.collection<AdapterAccount>(c.Accounts, AdapterAccountFeilds()),
      S: await _client.collection<AdapterSession>(c.Sessions, AdapterSessionFeilds()),
      V: await _client.collection<VerificationToken>(c.VerificationTokens, VerificationTokenFeilds()),
    }
  }

  return {
    async createUser(data) {
      /*const user = to(data)
      await using db = await getDb()
      await db.U.create(user)
      return from(user) as unknown as AdapterUser;*/
      const db = await getDb()
      return await db.U.create(data)
    },
    async getUser(id) {
      /*await using db = await getDb()
      const user = await db.U.getById(_id(id))
      if (!user) return null
      return from(user) as unknown as AdapterUser;*/
      const db = await getDb()
      return await db.U.getById(_id(id))
    },
    async getUserByEmail(email) {
      /*await using db = await getDb()
      const user = await db.getUserByEmail(email)
      if (!user) return null
      return from(user) as unknown as AdapterUser;*/
      const db = await getDb()
      return await db.U.findOne({ email: email});
    },
    async getUserByAccount(provider_providerAccountId) {
      /*await using db = await getDb()
      const account = await db.A.findOne(provider_providerAccountId)
      if (!account) return null
      const user = await db.U.findOne({ _id: new ObjectId(account.userId) })
      if (!user) return null
      return from<AdapterUser>(user)*/
      /*await using db = await getDb()
      const user = await db.getUser(_id(provider_providerAccountId.providerAccountId))
      if (!user) return null
      return from(user) as unknown as AdapterUser;*/
      const db = await getDb()
      const account = await db.A.findOne(provider_providerAccountId)
      if (!account) return null
      return await db.U.getById(_id(account.userId))
    },
    async updateUser(data) {
      /*const { _id, ...user } = to<AdapterUser>(data)
      await using db = await getDb()
      const result = await db.U.findOneAndUpdate(
        { _id },
        { $set: user },
        { returnDocument: "after" }
      )

      return from<AdapterUser>(result!)*/
      const db = await getDb()
      return await db.U.updateById(_id(data.id), data);
    },
    async deleteUser(id) {
      const userId = _id(id)
      const db = await getDb()
      await Promise.all([
        db.A.deleteMany({ userId: userId as any }),
        db.S.deleteMany({ userId: userId as any }),
        db.U.deleteOne({ id: userId }),
      ])
    },
    linkAccount: async (data) => {
      /*const account = to<AdapterAccount>(data)
      await using db = await getDb()
      await db.A.insertOne(account)
      return account*/
      const db = await getDb()
      const account = await db.A.insertOne(data)
      return account;
    },
    async unlinkAccount(provider_providerAccountId) {
      /*await using db = await getDb()
      const account = await db.A.findOneAndDelete(provider_providerAccountId)
      return from<AdapterAccount>(account!)*/
      const db = await getDb()
      const account = await db.A.findOneAndDelete(provider_providerAccountId);
      return account!;
    },
    async getSessionAndUser(sessionToken) {
      const db = await getDb()
      const session = await db.S.findOne({ sessionToken })
      if (!session) return null
      const user = await db.U.findOne({ id: _id(session.userId) })
      if (!user) return null
      return {
        user: user,
        session: session,
      }
    },
    async createSession(data) {
      /*const session = to<AdapterSession>(data)
      await using db = await getDb()
      await db.S.insertOne(session)
      return from<AdapterSession>(session)*/
      const db = await getDb()
      const session = await db.S.insertOne(data)
      return session;
    },
    async updateSession(data) {
      /*const { _id, ...session } = to<AdapterSession>(data)
      await using db = await getDb()
      const updatedSession = await db.S.findOneAndUpdate(
        { sessionToken: session.sessionToken },
        { $set: session },
        { returnDocument: "after" }
      )
      return from<AdapterSession>(updatedSession!)*/
      const db = await getDb()
      const session = await db.S.findOneAndUpdate( { sessionToken: data.sessionToken }, data);
      return session;
    },
    async deleteSession(sessionToken) {
      /*await using db = await getDb()
      const session = await db.S.findOneAndDelete({
        sessionToken,
      })
      return from<AdapterSession>(session!)*/
      const db = await getDb()
      const session = await db.S.findOneAndDelete({
        sessionToken,
      })
      return session!;
    },
    async createVerificationToken(data) {
      /*await using db = await getDb()
      await db.V.insertOne(to(data))
      return data*/
      const db = await getDb()
      await db.V.insertOne(data)
      return data;
    },
    async useVerificationToken(identifier_token) {
      /*await using db = await getDb()
      const verificationToken = await db.V.findOneAndDelete(identifier_token)
      if (!verificationToken) return null
      const { _id, ...rest } = verificationToken
      return rest*/
      const db = await getDb()
      return await db.V.findOneAndDelete(identifier_token)
    },
  }
}
