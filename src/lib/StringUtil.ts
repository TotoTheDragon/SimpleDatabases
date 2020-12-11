export function toArray(input: string | string[]): string[] {
    return Array.isArray(input) ? input : Array.of(input);
}