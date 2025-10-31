import { fuzz } from "fast-fuzz";
import { FuzzUser } from "./FuzzUser";

// This async function runs Fast-Fuzz programmatically
async function main() {
  console.log("Starting Fast-Fuzz on FuzzUser...");

  // Run fuzzing
  await fuzz(
    "./dist/fuzz",  // path to compiled JS files
    0,              // threads (0 = in-process)
    60000,          // maxTime per method in ms (1 min)
    undefined,      // methods regex (undefined = all)
    undefined,      // classes regex (undefined = all)
    undefined,      // files regex (undefined = all)
    "dist",         // source folder
  );

  console.log("Fast-Fuzz finished! Check fuzzInstances.json for results.");
}

main().catch((err) => console.error(err));
