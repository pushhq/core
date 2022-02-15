export type Credentials = { appId: string; apiKey: string };

export type SemVer = { major: string; patch: string; minor: string };

export type Platform = "web" | "ios" | "android";

export type Version = {
  version: SemVer;
  createdOn: string;
  description: string;
  type: "default" | undefined;
};

export type Response = {
  data: Version;
  status: "none" | "initial" | "available";
};
