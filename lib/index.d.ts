import { Context, Schema } from 'koishi';
export declare const inject: {
    required: string[];
};
export declare const name = "jrys-ultra";
export interface Config {
    font: string;
    url: string;
    blurs: number;
    color: string;
    draw_modle: "canvas" | "puppeteer";
    background_image: "禁用" | "回复获取" | "强获取";
    hash: boolean;
    markdown_setting: {
        table: any;
        qqguild: string;
    };
}
export declare const Config: Schema<Config>;
export declare const usage = "\n# koishi-plugin-jrys-ultra\n## \u8FD0\u52BF\u6587\u6848\u548C\u7B97\u6CD5\u501F(chao)\u9274(xi)\u4E86[jryspro](https://github.com/Twiyin0/koishi-plugin-jryspro/tree/main),\u611F\u8C22\u5927\u4F6C\n---\n### \uD83D\uDFE2\u83B7\u53D6\u80CC\u666F\u56FE\u65B9\u5F0F\u4ECB\u7ECD\n- #### \u56DE\u590D\u83B7\u53D6\n  - \u6307\u4EE4\u8C03\u7528\u8005\u5728160\u79D2\u5185\u53D1\u9001\u201C\u539F\u56FE\u201D\u83B7\u53D6\n  - \uD83D\uDD35\u4F18\u70B9\uFF1A\u4E0D\u5360\u7528\u672C\u5730\u5B58\u50A8\n  - \uD83D\uDFE0\u7F3A\u70B9\uFF1A\u53EF\u80FD\u4F1A\u5360\u7528\u4E00\u90E8\u5206\u5185\u5B58\uFF0C\u5E76\u4E14\u8D85\u65F6\u548C\u975E\u6307\u4EE4\u8C03\u7528\u8005\u90FD\u65E0\u6CD5\u83B7\u53D6\n- #### \u5F3A\u83B7\u53D6\n  - \u901A\u8FC7\u4F7F\u7528\u6307\u4EE4\"\u539F\u56FE\"\uFF0C\u4F20\u5165\u80CC\u666F\u56FE\u539F\u56FE\u6216\u56FE\u7247hash\u503C\u83B7\u53D6\n  - \u7CFB\u7EDF\u4F1A\u81EA\u52A8\u5220\u9664\u672C\u5730\u6587\u4EF6\u5939\u5185\u4E24\u5929\u524D\u7684\u6570\u636E\uFF08beta\uFF09\n  - \uD83D\uDD35\u4F18\u70B9\uFF1A\u4EFB\u4F55\u4EBA\u5747\u53EF\u83B7\u53D6\uFF0C\u4E14\u4E0D\u9650\u5236\u65F6\u95F4\n  - \uD83D\uDFE0\u7F3A\u70B9\uFF1A\u624B\u673A\u7AEF\u53D1\u9001\u56FE\u6587\u56FE\u7247\u8F83\u4E3A\u9EBB\u70E6\uFF0C\u5E76\u4E14\u80CC\u666F\u56FE\u4F1A\u5360\u7528\u672C\u5730\u5B58\u50A8\uFF08data/jrys_img\uFF09\n\n### \uD83D\uDFE2\u5B57\u4F53\u8BBE\u7F6E(\u4F7F\u7528\u7CFB\u7EDF\u81EA\u5E26\u5B57\u4F53\uFF0C\u586B\u5199\u7CFB\u7EDF\u81EA\u5E26\u5B57\u4F53\u7684[\u82F1\u6587\u540D](https://www.cnblogs.com/chendc/p/9298832.html)\uFF0C\u53EA\u7814\u7A76\u4E86win\u7CFB\u7EDF\n\n\u5B98\u65B9bot\u9002\u914D\u53EF\u63D0[issue](https://github.com/Alin-sky/jrys-ultra/issues)\n---\n";
export declare function apply(ctx: Context, config: Config): Promise<void>;
