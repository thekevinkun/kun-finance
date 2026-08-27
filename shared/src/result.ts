// A shared type to represent the result of an operation,
// which can either be successful (ok: true) with data of type T,
// or unsuccessful (ok: false) with an error of type Error.
export type Result<T> = { ok: true; data: T } | { ok: false; error: Error };
