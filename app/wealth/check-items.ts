import { loadNetItems } from "./lib/store";

const items = loadNetItems();
console.log("Current net items:", JSON.stringify(items, null, 2));
