import { fuzzMethod, fuzzArg, fuzzProp } from "fast-fuzz-shim";
// @ts-ignore
import Users from "../user";

// Wrapper for NodeBB's user creation logic
export class FuzzUser {
  @fuzzMethod
  async createUser(
    @fuzzArg("string") username: string,
    @fuzzArg("string") password: string,
    @fuzzArg("string") email: string
  ) {
    try {
      const result = await Users.create({ username, password, email });
      return result;
    } catch (err: any) {
      // Catch errors so Fast-Fuzz can record the behavior
      return { error: err.message };
    }
  }
}
