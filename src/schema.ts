import type {
  AdapterUser,
  AdapterAccount,
  AdapterSession,
  VerificationToken,
} from "@auth/core/adapters";

type CollectionFieldAcceptedType = string | boolean | number | Date | URL;
type CollectionFieldType = CollectionFieldAcceptedType | Array<CollectionFieldAcceptedType> | null | undefined;

// function isCollectionFieldType(value: any): value is CollectionFieldType {
//   return (
//     typeof value === 'string' ||
//     typeof value === 'number' ||
//     typeof value === 'boolean' ||
//     value instanceof Date ||
//     value instanceof URL
//   );
// }

function getCollectionFieldTypeName(value: any): string {
  if (value instanceof Array) {
    return "[]" + getCollectionFieldTypeName(value[0])
  } else if (value instanceof Date) {
    return "Date"
  } else if (value instanceof URL) {
    return "string"
  } else if (typeof value === "object") {
    return "object"
  } else if (typeof value === "string") {
    return "string"
  } else if (typeof value === "number") {
    return "number"
  } else if (typeof value === "boolean") {
    return "boolean"
  } else {
    return typeof value
  }
}

export interface CollectionField {
  name: string;
  typeName: string;
  mainKey?: boolean;
  optional?: boolean;
}


// TODO: Use ts-morph to generate the fields from the typescript types

const DEFAULT_STRING = "string";
const DEFAULT_DATE = new Date(0);
const DEFAULT_URL = new URL("http://defaulturl.com/");

function isDefaultValue(value: any): value is CollectionFieldType {
  return value === DEFAULT_STRING || value === DEFAULT_DATE || value === DEFAULT_URL;
}

function fields<T = Record<string, any>>(object: T): Array<CollectionField> {
  const newObject: Array<CollectionField> = []
  let foundId = false;
  for (const key in object) {
    const value = object[key]
    if (key === "id") {
      newObject.push({ name: "id", typeName: "string", mainKey: true })
      foundId = true;
    } else if (key === "userId") {
      if (!foundId) {
        newObject.push({ name: "id", typeName: "string", mainKey: true })
        foundId = true;
      } else {
        newObject.push({ name: key, typeName: "string" })
      }
    } else {
      const optional = value === undefined || value === null || isDefaultValue(value)
      newObject.push({ name: key, typeName: getCollectionFieldTypeName(value), optional })
    }
  }
  return newObject
}

export function AdapterUserFeilds() {
  return fields<AdapterUser>({
    id: "",
    email: "",
    name: DEFAULT_STRING,
    emailVerified: DEFAULT_DATE,
    image: DEFAULT_STRING,
  })
}

export function AdapterAccountFeilds() {
  return fields<AdapterAccount>({
    userId: "",
    provider: "",
    providerAccountId: "",
    type: "oauth",
    id: DEFAULT_STRING,
    access_token: DEFAULT_STRING,
    expires_at: DEFAULT_DATE.getMilliseconds(),
    refresh_token: DEFAULT_STRING,
    scope: DEFAULT_STRING,
    token_type: DEFAULT_STRING,
  })
}

export function AdapterSessionFeilds() {
  return fields<AdapterSession>({
    sessionToken: "",
    userId: "",
    expires: new Date(),
  })
}

export function VerificationTokenFeilds() {
  return fields<VerificationToken>({
    identifier: "",
    token: "",
    expires: new Date(),
  })
}