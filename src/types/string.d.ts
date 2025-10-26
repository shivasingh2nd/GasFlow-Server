// TypeScript type definitions for String prototype extensions

declare global {
  interface String {
    /**
     * Converts string to Title Case
     * @example "hello world" -> "Hello World"
     */
    toTitleCase(): string;

    /**
     * Converts string to kebab-case
     * @example "Hello World" -> "hello-world"
     */
    toKebabCase(): string;

    /**
     * Converts string to camelCase
     * @example "hello world" -> "helloWorld"
     */
    toCamelCase(): string;

    /**
     * Converts string to snake_case
     * @example "Hello World" -> "hello_world"
     */
    toSnakeCase(): string;

    /**
     * Capitalizes first letter only
     * @example "hello world" -> "Hello world"
     */
    capitalize(): string;

    /**
     * Truncates string to specified length
     * @param length Maximum length
     * @param suffix Suffix to add (default: "...")
     * @example "Hello World".truncate(8) -> "Hello..."
     */
    truncate(length: number, suffix?: string): string;
  }
}

export {};
