import { Context, Schema } from 'koishi';
export declare const inject: {
    required: string[];
};
export declare const using: string[];
export declare const name = "jrys-ultra";
export interface Config {
}
export interface Config {
    font: string;
    url: string;
    blurs: number;
}
export declare const Config: Schema<Config>;
export declare const usage = "\n# koishi-plugin-jrys-ultra\n# \u8FD0\u52BF\u6587\u6848\u501F(chao)\u9274(xi)\u4E86[jryspro](https://github.com/Twiyin0/koishi-plugin-jryspro/tree/main),\u611F\u8C22\u5927\u4F6C\n";
export declare function apply(ctx: Context, config: Config): void;
