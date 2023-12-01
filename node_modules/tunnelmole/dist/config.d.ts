declare const config: {
    hostip: {
        endpoint: string;
        port: string;
    };
    runtime: {
        enableLogging: boolean;
    };
} & {
    hostip: {
        endpoint: string;
        httpEndpoint: string;
    };
    runtime: {
        enableLogging: boolean;
    };
};
export default config;
