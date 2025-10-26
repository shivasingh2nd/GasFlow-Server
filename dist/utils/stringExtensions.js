"use strict";
// Extend String prototype with custom methods
Object.defineProperty(exports, "__esModule", { value: true });
// Title Case: "hello world" -> "Hello World"
String.prototype.toTitleCase = function () {
    return this.toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
// Capitalize: "hello world" -> "Hello world"
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};
// Kebab Case: "Hello World" -> "hello-world"
String.prototype.toKebabCase = function () {
    return this.replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
};
// Camel Case: "hello world" -> "helloWorld"
String.prototype.toCamelCase = function () {
    return this.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
};
// Snake Case: "Hello World" -> "hello_world"
String.prototype.toSnakeCase = function () {
    return this.replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();
};
// Truncate: "Hello World" -> "Hello..."
String.prototype.truncate = function (length, suffix = "...") {
    if (this.length <= length)
        return this.toString();
    return this.substring(0, length - suffix.length) + suffix;
};
