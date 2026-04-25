import { seed } from "drizzle-seed";
import { cards } from "../drizzle/schema/cards";
import db from "./db";

export default async function main() {
	await seed(db, {
		cards,
	});
}

await main();
