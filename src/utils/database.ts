interface DatabaseInfo {
  provider: string;
  database: string;
  host: string;
  port: string;
}

export function getDatabaseInfo(): DatabaseInfo {
  const dbUrl = process.env.DATABASE_URL || "";

  try {
    const urlPattern = /^(\w+):\/\/[^@]+@([^:/]+):?(\d+)?\/([^?]+)/;
    const match = dbUrl.match(urlPattern);

    if (match) {
      const [, provider, host, port, database] = match;

      const defaultPorts: Record<string, string> = {
        mysql: "3306",
        postgresql: "5432",
        postgres: "5432",
      };

      return {
        provider: provider.toLowerCase(),
        database: database,
        host: host,
        port: port || defaultPorts[provider] || "unknown",
      };
    }
  } catch (error) {
    console.error("Error parsing DATABASE_URL:", error);
  }

  return {
    provider: "Unknown",
    database: "Not configured",
    host: "localhost",
    port: "unknown",
  };
}
