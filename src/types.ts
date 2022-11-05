export type Credentials = { projectId: string; apiKey: string };

export type Platform = "web" | "ios" | "android";

export type SemVer = {
  major: number;
  minor: number;
  patch: number;
  createdOn: string;
};

export type Version = {
  id: string;
  name?: string;
  semver: SemVer;
  content: string;
  createdOn: string;
  status: "published";
  platforms: Platform[];
};
