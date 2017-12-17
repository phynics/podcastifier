export interface DatabaseError {
    message: string;
    errorType: "database";
}

export interface ApiError {
    message: string;
    errorType: "api";
}

export interface TranspileError {
    message: string;
    errorType: "transpile";
}

export interface AdapterError {
    message: string;
    errorType: "adapter";
}
