import "server-only";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { AppError } from "@/modules/shared/app-error";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new AppError(
      "DATABASE_NOT_CONFIGURED",
      "Database has not been configured.",
    );
  }

  client ??= postgres(connectionString, {
    max: 5,
    connect_timeout: 10,
    idle_timeout: 20,
  });

  return drizzle(client, { schema });
}
